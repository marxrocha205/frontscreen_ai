import { useState, useCallback, useEffect, useRef } from 'react';
import { MicVAD, utils } from '@ricky0123/vad-web';
import * as ort from 'onnxruntime-web';

// Configura o ONNX Runtime Web para buscar os .wasm na raiz (public/)
ort.env.wasm.wasmPaths = "/";

export function useContinuousVoice(
  onSpeechStartCallback: () => void,
  onSpeechEndCallback: (audioBase64: string) => void
) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const vadRef = useRef<MicVAD | null>(null);

  const onSpeechStartRef = useRef(onSpeechStartCallback);
  const onSpeechEndRef = useRef(onSpeechEndCallback);

  useEffect(() => {
    onSpeechStartRef.current = onSpeechStartCallback;
    onSpeechEndRef.current = onSpeechEndCallback;
  }, [onSpeechStartCallback, onSpeechEndCallback]);

  useEffect(() => {
    let myvad: MicVAD | null = null;
    let canceled = false;
    
    MicVAD.new({
      startOnLoad: false,
      baseAssetPath: "/", 
      onnxWASMBasePath: "/", 
      
      // Filtros de ruído para ignorar sons distantes e de baixa intensidade
      positiveSpeechThreshold: 0.92, // Exige 92% de certeza de voz humana próxima
      negativeSpeechThreshold: 0.6,  // Descarta qualquer coisa abaixo de 60%
      minSpeechMs: 400, // Deve falar por 400ms contínuos pra engatilhar
      redemptionMs: 1500, // Segura o envio 1.5s após a pausa para fechar a frase

      // Cancelação de Eco Agressiva (Opção 2 - AEC nativo do navegador)
      getStream: async () => {
        return navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            // Instrui o browser a excluir o áudio local que está sendo reproduzido
            // Funciona no Chrome/Edge para evitar que a IA ouça a si mesma
            suppressLocalAudioPlayback: true,
          } as MediaTrackConstraints,
        })
      },
      onSpeechStart: () => {
        onSpeechStartRef.current();
      },
      onSpeechEnd: (audio: Float32Array) => {
        try {
          const wavBuffer = utils.encodeWAV(audio);
          const base64 = utils.arrayBufferToBase64(wavBuffer);
          onSpeechEndRef.current(base64);
        } catch (error) {
          console.error("Erro ao converter áudio do VAD:", error);
        }
      },
      onFrameProcessed: (probs) => {
        setIsUserSpeaking(probs.isSpeech > 0.6);
      }
    }).then((vadInstance) => {
      if (canceled) {
        vadInstance.destroy().catch(() => { /* ignora erro de stream nulo */ });
        return;
      }
      myvad = vadInstance;
      vadRef.current = vadInstance;
      console.log("MicVAD inicializado com sucesso usando caminhos absolutos /");
    }).catch(e => {
        console.error("Erro severo ao inicializar VAD:", e);
    });

    return () => {
      canceled = true;
      if (myvad) {
        myvad.destroy().catch(() => { /* ignora erro de stream nulo */ });
      }
    };
  }, []); 

  const toggleContinuousMic = useCallback(() => {
    if (!vadRef.current) {
        console.warn("VAD ainda não está inicializado");
        return;
    }
    
    if (isActive) {
      vadRef.current.pause();
      setIsActive(false);
      setIsListening(false);
    } else {
      vadRef.current.start().then(() => {
        setIsActive(true);
        setIsListening(true);
      });
    }
  }, [isActive]);

  return {
    isActive,
    isListening, 
    isUserSpeaking, 
    toggleContinuousMic
  };
}
