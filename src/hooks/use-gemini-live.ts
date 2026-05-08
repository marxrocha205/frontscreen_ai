import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioRecorder, AudioPlayer } from '@/lib/audio-utils';
import { useScreenShare } from './use-screen-share';
import { useChatStore } from './use-chat-store';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

const createLiveMessageId = (role: 'user' | 'assistant') =>
  `live-${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const appendTranscriptChunk = (current: string, chunk: string) => {
  const next = chunk.trim();
  if (!next) return current;
  if (!current) return next;
  const trimmedCurrent = current.trim();
  if (next.startsWith(trimmedCurrent)) return next;
  if (trimmedCurrent.endsWith(next)) return current;
  if (/^[.,!?;:%)]/.test(next) || /\s$/.test(current)) return `${current}${next}`;
  return `${current} ${next}`;
};

const updateMessageContent = (messageId: string, content: string) => {
  const currentMessages = useChatStore.getState().messages;
  useChatStore.setState({
    messages: currentMessages.map((message) =>
      message.id === messageId ? { ...message, content } : message
    )
  });
};

export function useGeminiLive() {
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { addMessage } = useChatStore();
  const currentAssistantMessageIdRef = useRef<string | null>(null);
  const currentAssistantTranscriptRef = useRef<string>("");
  const currentUserMessageIdRef = useRef<string | null>(null);
  const currentUserTranscriptRef = useRef<string>("");

  const { isSharing, stream } = useScreenShare();

  const captureAndSendFrame = useCallback(() => {
    const now = Date.now();
    if (now - lastFrameTimeRef.current < 800) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Se não estiver compartilhando, não enviamos frames, mas a IA já foi instruída sobre isso no setup
    if (!isSharing || !stream) return;
    
    if (!videoRef.current) {
        const v = document.createElement('video');
        v.autoplay = true; v.muted = true; v.playsInline = true;
        v.style.position = 'fixed'; v.style.top = '-10000px';
        document.body.appendChild(v);
        videoRef.current = v;
    }
    
    if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
    }

    const video = videoRef.current;
    if (video.readyState < 2) return; 

    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    const canvas = canvasRef.current;

    const width = 1920;
    const height = (video.videoHeight / video.videoWidth) * width;
    if (isNaN(height) || height === 0) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    
    wsRef.current?.send(JSON.stringify({
      realtimeInput: { video: { mimeType: "image/jpeg", data: base64Image } }
    }));
    lastFrameTimeRef.current = now;
  }, [stream, isSharing]);

  const stopSession = useCallback(() => {
    console.log("🛑 Encerrando sessão Gemini Live...");
    setIsActive(false);
    setIsConnected(false);
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    audioRecorderRef.current?.stop();
    wsRef.current?.close();
    wsRef.current = null;
    audioPlayerRef.current?.stop();
    if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        // Mantemos o loop ativo sempre, mas ele só envia se isSharing for true (checado dentro da função)
        videoIntervalRef.current = setInterval(captureAndSendFrame, 1000);
    }
    return () => { if (videoIntervalRef.current) clearInterval(videoIntervalRef.current); };
  }, [isConnected, captureAndSendFrame]);

  const processIncomingMessage = useCallback(async (data: string | Blob) => {
    try {
      const response = typeof data === 'string' ? JSON.parse(data) : JSON.parse(await data.text());
      const setupComplete = response.setup_complete || response.setupComplete;
      const serverContent = response.server_content || response.serverContent;

      if (setupComplete) {
        console.log("✅ [SESSÃO ATIVA]");
        audioRecorderRef.current = new AudioRecorder(
          (base64) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                realtimeInput: { audio: { mimeType: "audio/l16;rate=16000", data: base64 } }
              }));
            }
          },
          () => { captureAndSendFrame(); }
        );
        await audioRecorderRef.current.start();
        return;
      }

      if (serverContent) {
        const modelTurn = serverContent.model_turn || serverContent.modelTurn;
        const outputTranscription = serverContent.output_transcription || serverContent.outputTranscription;
        const inputTranscription = serverContent.input_transcription || serverContent.inputTranscription;

        if (inputTranscription?.text) {
          console.log("🎙️ Usuário Transcrição:", inputTranscription.text);
          if (!currentUserMessageIdRef.current) {
            currentUserMessageIdRef.current = createLiveMessageId('user');
            currentUserTranscriptRef.current = "";
            addMessage({
              id: currentUserMessageIdRef.current,
              role: 'user',
              content: ""
            });
          }

          currentUserTranscriptRef.current = appendTranscriptChunk(
            currentUserTranscriptRef.current,
            inputTranscription.text
          );
          updateMessageContent(currentUserMessageIdRef.current, currentUserTranscriptRef.current);
        }

        if (serverContent.interrupted) {
          audioPlayerRef.current?.stop();
          currentAssistantMessageIdRef.current = null;
          currentAssistantTranscriptRef.current = "";
        }

        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            if (part.inlineData) audioPlayerRef.current?.playChunk(part.inlineData.data);
            if (part.inline_data) audioPlayerRef.current?.playChunk(part.inline_data.data);
            
            if (part.text && !outputTranscription?.text) {
              console.log("🤖 IA Texto:", part.text);

              if (!currentAssistantMessageIdRef.current) {
                currentUserMessageIdRef.current = null;
                currentUserTranscriptRef.current = "";
                currentAssistantMessageIdRef.current = createLiveMessageId('assistant');
                currentAssistantTranscriptRef.current = "";
                addMessage({
                  id: currentAssistantMessageIdRef.current,
                  role: 'assistant',
                  content: ""
                });
              }

              currentAssistantTranscriptRef.current = appendTranscriptChunk(
                currentAssistantTranscriptRef.current,
                part.text
              );
              updateMessageContent(currentAssistantMessageIdRef.current, currentAssistantTranscriptRef.current);
            }
          }
        }

        if (outputTranscription?.text) {
          console.log("🤖 IA Transcrição:", outputTranscription.text);

          if (!currentAssistantMessageIdRef.current) {
            currentUserMessageIdRef.current = null;
            currentUserTranscriptRef.current = "";
            currentAssistantMessageIdRef.current = createLiveMessageId('assistant');
            currentAssistantTranscriptRef.current = "";
            addMessage({
              id: currentAssistantMessageIdRef.current,
              role: 'assistant',
              content: ""
            });
          }

          currentAssistantTranscriptRef.current = appendTranscriptChunk(
            currentAssistantTranscriptRef.current,
            outputTranscription.text
          );
          updateMessageContent(currentAssistantMessageIdRef.current, currentAssistantTranscriptRef.current);
        }

        if (serverContent.turn_complete || serverContent.turnComplete) {
          currentAssistantMessageIdRef.current = null;
          currentAssistantTranscriptRef.current = "";
          currentUserMessageIdRef.current = null;
          currentUserTranscriptRef.current = "";
        }
      }
    } catch {
      if (data instanceof Blob) {
        const arrayBuffer = await data.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        audioPlayerRef.current?.playChunk(base64);
      }
    }
  }, [addMessage, captureAndSendFrame]);

  const startSession = useCallback(async () => {
    if (!GEMINI_API_KEY) return alert("Configure a API Key");
    setIsActive(true);
    audioPlayerRef.current = new AudioPlayer();
    await audioPlayerRef.current.beep();

    const ws = new WebSocket(URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        setup: {
          model: "models/gemini-3.1-flash-live-preview",
          generationConfig: { responseModalities: ["AUDIO"] },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: { 
            parts: [{ text: `Você é o ScreenAI.
Sua visão da tela depende do botão de compartilhamento (ícone de monitor).
REGRAS CRÍTICAS:
1. Se o usuário perguntar sobre a tela e você NÃO recebeu frames recentemente, você DEVE dizer: 'Por favor, clique no botão de compartilhamento de tela (ícone do monitor) para que eu possa ver.'
2. NUNCA diga que está vendo a 'área de trabalho' ou qualquer outra coisa se não houver vídeo chegando.
3. Se o vídeo parar de chegar, assuma que o usuário desligou o compartilhamento.
4. Responda sempre em português brasileiro de forma breve e natural.` }] 
          }
        }
      }));
    };

    ws.onmessage = (event) => processIncomingMessage(event.data);
    ws.onclose = () => stopSession();
    ws.onerror = () => stopSession();
  }, [stopSession, processIncomingMessage]);

  return { isActive, isConnected, startSession, stopSession };
}
