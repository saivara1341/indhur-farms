
/**
 * Sarvam AI Service
 * 
 * Provides an interface to interact with Sarvam AI's Speech-to-Text (Saaras)
 * and Text-to-Speech (Bulbul) models for high-fidelity Indic voice processing.
 */

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY || "";
const SARVAM_BASE_URL = "https://api.sarvam.ai";

export type SarvamLanguageCode = "hi-IN" | "en-IN" | "te-IN" | "ta-IN" | "kn-IN" | "ml-IN" | "mr-IN" | "gu-IN" | "bn-IN" | "or-IN" | "pa-IN";

export const sarvamService = {
  /**
   * Translates voice to text using the Saaras model.
   * Supports automatic language detection if language_code is not provided.
   */
  async transcribe(audioBlob: Blob, languageCode?: SarvamLanguageCode): Promise<string> {
    if (!SARVAM_API_KEY) {
      console.warn("[Sarvam] API Key missing. Please set VITE_SARVAM_API_KEY.");
      return "Microphone output (Simulated): " + (languageCode || "en-IN");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "voice.wav");
    if (languageCode) formData.append("language_code", languageCode);
    
    // Domain prompt for Indhur Farms
    formData.append("prompt", "Agriculture, organic farming, turmeric, honey, chilli, ordering system");

    try {
      const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
        method: "POST",
        headers: { "api-subscription-key": SARVAM_API_KEY },
        body: formData
      });

      if (!response.ok) throw new Error(`Transcription failed: ${response.statusText}`);
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("[Sarvam] Transcription error:", error);
      throw error;
    }
  },

  /**
   * Converts text to speech using the Bulbul model.
   * Returns a base64 encoded audio string or a URL.
   */
  async synthesize(text: string, languageCode: SarvamLanguageCode, speaker: string = "meera"): Promise<string> {
    if (!SARVAM_API_KEY) {
      console.warn("[Sarvam] Using browser TTS as fallback (no API key).");
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      return "";
    }

    try {
      const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: { 
          "api-subscription-key": SARVAM_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          language_code: languageCode,
          speaker,
          speech_sample_rate: 16000,
          enable_preprocessing: true
        })
      });

      if (!response.ok) throw new Error(`Synthesis failed: ${response.statusText}`);
      const data = await response.json();
      return `data:audio/wav;base64,${data.audio_content}`;
    } catch (error) {
      console.error("[Sarvam] Synthesis error:", error);
      throw error;
    }
  },

  /**
   * Plays the synthetic audio.
   */
  async speak(audioData: string) {
    if (!audioData) return;
    const audio = new Audio(audioData);
    return new Promise((resolve) => {
      audio.onended = resolve;
      audio.play();
    });
  }
};
