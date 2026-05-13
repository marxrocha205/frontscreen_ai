import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioRecorder, AudioPlayer } from '@/lib/audio-utils';
import { useScreenShare } from './use-screen-share';
import { useChatStore } from './use-chat-store';
import { useVoiceConfig } from './use-voice-config';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

const createLiveMessageId = (role: 'user' | 'assistant') =>
  `live-${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

type LiveState = {
  isActive: boolean;
  isConnected: boolean;
  isStarting: boolean;
  phase: 'idle' | 'connecting' | 'listening' | 'speaking';
  audioLevel: number;
};

const liveStateListeners = new Set<(state: LiveState) => void>();
let liveState: LiveState = {
  isActive: false,
  isConnected: false,
  isStarting: false,
  phase: 'idle',
  audioLevel: 0
};
let activeLiveOwner: symbol | null = null;
let stopActiveGeminiLiveSession: (() => void) | null = null;

const emitLiveState = (partial: Partial<LiveState>) => {
  liveState = { ...liveState, ...partial };
  liveStateListeners.forEach((listener) => listener(liveState));
};

const isLiveSessionOpen = () => (
  liveState.isActive ||
  liveState.isConnected ||
  liveState.isStarting
);

export const stopGeminiLiveSession = () => {
  stopActiveGeminiLiveSession?.();
};

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
  const [isActive, setIsActive] = useState(liveState.isActive);
  const [isConnected, setIsConnected] = useState(liveState.isConnected);
  const [phase, setPhase] = useState(liveState.phase);
  const [audioLevel, setAudioLevel] = useState(liveState.audioLevel);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const assistantActivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const isStartingRef = useRef(false);
  const activeSessionIdRef = useRef(0);
  const hasStartedRecorderRef = useRef(false);
  const liveOwnerRef = useRef(Symbol('gemini-live-owner'));
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { addMessage } = useChatStore();
  const currentAssistantMessageIdRef = useRef<string | null>(null);
  const currentAssistantTranscriptRef = useRef<string>("");
  const currentUserMessageIdRef = useRef<string | null>(null);
  const currentUserTranscriptRef = useRef<string>("");

  const { isSharing, stream } = useScreenShare();

  const markAssistantActivity = useCallback((sessionId: number) => {
    if (activeSessionIdRef.current !== sessionId) return;
    emitLiveState({ phase: 'speaking', audioLevel: 0.78 });
    if (assistantActivityTimeoutRef.current) clearTimeout(assistantActivityTimeoutRef.current);
    assistantActivityTimeoutRef.current = setTimeout(() => {
      if (activeSessionIdRef.current === sessionId) {
        emitLiveState({ phase: 'listening', audioLevel: 0.14 });
      }
      assistantActivityTimeoutRef.current = null;
    }, 520);
  }, []);

  useEffect(() => {
    const listener = (state: LiveState) => {
      setIsActive(state.isActive);
      setIsConnected(state.isConnected);
      setPhase(state.phase);
      setAudioLevel(state.audioLevel);
    };

    liveStateListeners.add(listener);
    listener(liveState);
    return () => {
      liveStateListeners.delete(listener);
    };
  }, []);

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
    activeSessionIdRef.current += 1;
    isStartingRef.current = false;
    hasStartedRecorderRef.current = false;
    emitLiveState({ isActive: false, isConnected: false, isStarting: false, phase: 'idle', audioLevel: 0 });
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (assistantActivityTimeoutRef.current) {
      clearTimeout(assistantActivityTimeoutRef.current);
      assistantActivityTimeoutRef.current = null;
    }
    audioRecorderRef.current?.stop();
    audioRecorderRef.current = null;
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
    audioPlayerRef.current?.stop();
    audioPlayerRef.current = null;
    if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
    }
    currentAssistantMessageIdRef.current = null;
    currentAssistantTranscriptRef.current = "";
    currentUserMessageIdRef.current = null;
    currentUserTranscriptRef.current = "";
    if (activeLiveOwner === liveOwnerRef.current) {
      activeLiveOwner = null;
      stopActiveGeminiLiveSession = null;
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

  const processIncomingMessage = useCallback(async (data: string | Blob, sessionId: number) => {
    if (activeSessionIdRef.current !== sessionId) return;

    try {
      const response = typeof data === 'string' ? JSON.parse(data) : JSON.parse(await data.text());
      if (activeSessionIdRef.current !== sessionId) return;

      const setupComplete = response.setup_complete || response.setupComplete;
      const serverContent = response.server_content || response.serverContent;

      if (setupComplete) {
        if (hasStartedRecorderRef.current) return;
        hasStartedRecorderRef.current = true;
        console.log("✅ [SESSÃO ATIVA]");
        audioRecorderRef.current?.stop();
        audioRecorderRef.current = new AudioRecorder(
          (base64) => {
            if (activeSessionIdRef.current === sessionId && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                realtimeInput: { audio: { mimeType: "audio/l16;rate=16000", data: base64 } }
              }));
            }
          },
          () => { captureAndSendFrame(); },
          (level) => {
            if (activeSessionIdRef.current === sessionId && liveState.phase !== 'speaking') {
              emitLiveState({ phase: 'listening', audioLevel: level });
            }
          }
        );
        try {
          await audioRecorderRef.current.start();
          if (activeSessionIdRef.current !== sessionId) {
            audioRecorderRef.current?.stop();
          }
        } catch (error) {
          console.error("Erro ao iniciar microfone no Gemini Live:", error);
          if (activeSessionIdRef.current === sessionId) stopSession();
        }
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
            // Processa o áudio apenas se vier como parte do JSON (inlineData)
            if (part.inlineData?.data) {
              markAssistantActivity(sessionId);
              audioPlayerRef.current?.playChunk(part.inlineData.data);
            } else if (part.inline_data?.data) {
              markAssistantActivity(sessionId);
              audioPlayerRef.current?.playChunk(part.inline_data.data);
            }
            
            if (part.text && !outputTranscription?.text) {
              markAssistantActivity(sessionId);
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
          markAssistantActivity(sessionId);
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
      // Se data for um Blob (binário), tocamos como áudio direto
      if (data instanceof Blob && activeSessionIdRef.current === sessionId) {
        const arrayBuffer = await data.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        audioPlayerRef.current?.playChunk(base64);
      }
    }
  }, [addMessage, captureAndSendFrame, markAssistantActivity, stopSession]);

  const startSession = useCallback(async () => {
    if (!GEMINI_API_KEY) return alert("Configure a API Key");
    if (
      isLiveSessionOpen() ||
      isStartingRef.current ||
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    isStartingRef.current = true;
    hasStartedRecorderRef.current = false;
    activeLiveOwner = liveOwnerRef.current;
    stopActiveGeminiLiveSession = stopSession;
    const sessionId = activeSessionIdRef.current + 1;
    activeSessionIdRef.current = sessionId;

    emitLiveState({ isActive: true, isConnected: false, isStarting: true, phase: 'connecting', audioLevel: 0 });
    audioPlayerRef.current = new AudioPlayer((isPlaying) => {
      if (activeSessionIdRef.current !== sessionId) return;
      emitLiveState({
        phase: isPlaying ? 'speaking' : 'listening',
        audioLevel: isPlaying ? 0.72 : 0.18
      });
    });
    await audioPlayerRef.current.beep();
    if (activeSessionIdRef.current !== sessionId) return;

    const ws = new WebSocket(URL);
    wsRef.current = ws;

    const { voiceType } = useVoiceConfig.getState();

    ws.onopen = () => {
      if (activeSessionIdRef.current !== sessionId || wsRef.current !== ws) {
        ws.close();
        return;
      }
      isStartingRef.current = false;
      emitLiveState({ isActive: true, isConnected: true, isStarting: false, phase: 'listening', audioLevel: 0.12 });

      ws.send(JSON.stringify({
        setup: {
          model: "models/gemini-3.1-flash-live-preview",
          generationConfig: { 
            responseModalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: voiceType // Ex: "Aoede", "Puck", etc.
                }
              }
            }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: { 
            parts: [{ text: `Você é o ScreenAI.
Sua visão da tela depende do botão de compartilhamento (ícone de monitor).
REGRAS CRÍTICAS:
1. Se o usuário perguntar sobre a tela e você NÃO recebeu frames recentemente, você DEVE dizer o equivalente a: 'Por favor, clique no botão de compartilhamento de tela (ícone do monitor) para que eu possa ver.' no idioma dele.
2. NUNCA diga que está vendo a 'área de trabalho' ou qualquer outra coisa se não houver vídeo chegando.
3. Se o vídeo parar de chegar, assuma que o usuário desligou o compartilhamento.
4. Responda SEMPRE no mesmo idioma em que o usuário falar com você. Se ele falar em português, responda em português. Se ele falar em inglês, responda em inglês. Seja breve e natural.` }] 
          }
        }
      }));
    };

    ws.onmessage = (event) => processIncomingMessage(event.data, sessionId);
    ws.onclose = () => {
      if (activeSessionIdRef.current === sessionId && wsRef.current === ws) stopSession();
    };
    ws.onerror = () => {
      if (activeSessionIdRef.current === sessionId && wsRef.current === ws) stopSession();
    };
  }, [stopSession, processIncomingMessage]);

  const stopLiveSession = useCallback(() => {
    if (stopActiveGeminiLiveSession) {
      stopActiveGeminiLiveSession();
      return;
    }

    stopSession();
  }, [stopSession]);

  return { isActive, isConnected, phase, audioLevel, startSession, stopSession: stopLiveSession };
}
