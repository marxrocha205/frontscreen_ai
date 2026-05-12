
/**
 * Utilitários para áudio LPCM - Versão com Detecção de Atividade
 */

const createAudioContext = (options: AudioContextOptions) => {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error('AudioContext não suportado neste navegador');
  }

  return new AudioContextConstructor(options);
};

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private onAudioData: (base64: string) => void;
  private onActivity?: () => void;

  constructor(onAudioData: (base64: string) => void, onActivity?: () => void) {
    this.onAudioData = onAudioData;
    this.onActivity = onActivity;
  }

  async start() {
    this.audioContext = createAudioContext({ sampleRate: 16000 });
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Monitor de Energia do Áudio para disparar visão
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const energy = Math.sqrt(sum / inputData.length);
      
      if (energy > 0.015) { // Threshold de fala detectada
        this.onActivity?.();
      }

      const buffer = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      let binary = '';
      const bytes = new Uint8Array(buffer.buffer);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      this.onAudioData(window.btoa(binary));
    };
  }

  stop() {
    if (this.processor) {
      this.processor.onaudioprocess = null;
      this.processor.disconnect();
      this.processor = null;
    }
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
  }
}

export class AudioPlayer {
  private audioContext: AudioContext;
  private nextStartTime: number = 0;

  constructor() {
    this.audioContext = createAudioContext({ sampleRate: 24000 });
  }

  async playChunk(base64Audio: string) {
    if (this.audioContext.state === 'closed') {
      this.audioContext = createAudioContext({ sampleRate: 24000 });
    }
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    try {
      const binary = window.atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      const currentTime = this.audioContext.currentTime;
      if (this.nextStartTime < currentTime) this.nextStartTime = currentTime;
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    } catch {}
  }

  async beep() {
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    gain.gain.value = 0.05;
    osc.frequency.value = 880;
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  stop() {
    this.nextStartTime = 0;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
  }
}
