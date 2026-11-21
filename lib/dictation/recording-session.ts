/**
 * One microphone recording, wrapped around browser APIs (no React).
 * MediaRecorder captures the audio; an AnalyserNode exposes live levels for the waveform.
 */
export type RecordingSession = {
  analyser: AnalyserNode;
  /** Stops recording and resolves with the captured audio. */
  stop: () => Promise<Blob>;
  /** Stops recording and throws the audio away. */
  cancel: () => void;
};

// Safari/iOS WebViews record mp4; Chrome, Firefox and Android record webm/ogg.
const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];

function pickMimeType() {
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export async function startRecordingSession(): Promise<RecordingSession> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });

  const audioContext = new AudioContext();
  const releaseDevices = () => {
    stream.getTracks().forEach((track) => track.stop());
    void audioContext.close();
  };

  try {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    audioContext.createMediaStreamSource(stream).connect(analyser);

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.start();

    return {
      analyser,
      stop: () =>
        new Promise((resolve) => {
          recorder.onstop = () => {
            releaseDevices();
            resolve(new Blob(chunks, { type: recorder.mimeType }));
          };
          recorder.stop();
        }),
      cancel: () => {
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
        releaseDevices();
      },
    };
  } catch (error) {
    releaseDevices();
    throw error;
  }
}

/** Turns getUserMedia/MediaRecorder failures into something a person can act on. */
export function describeMicrophoneError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "Microphone access is blocked. Allow it in your browser settings to dictate.";
  if (name === "NotFoundError") return "No microphone found. Connect one to dictate.";
  return "Couldn't start the microphone. Try again.";
}
