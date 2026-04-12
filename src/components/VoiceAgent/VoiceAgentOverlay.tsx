
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Volume2, Loader2, Languages, User, ShieldCheck } from "lucide-react";
import { sarvamService, SarvamLanguageCode } from "@/services/sarvamService";
import { orchestrator } from "@/services/orchestrator";
import { useAgentTools } from "@/hooks/useAgentTools";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const VoiceAgentOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [language, setLanguage] = useState<SarvamLanguageCode>("en-IN");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const location = useLocation();
  const { tools, isAdmin, items } = useAgentTools();

  // Initial Welcome
  useEffect(() => {
    if (isOpen && !transcript && !response) {
      handleInitialGreeting();
    }
  }, [isOpen]);

  const handleInitialGreeting = async () => {
    const greeting = "Welcome to Indhur Farms. How can I help you today? Please tell me your preferred language.";
    setResponse(greeting);
    await speak(greeting);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = processAudio;
      
      recorder.start();
      setIsListening(true);
      setTranscript("Listening...");
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudio = async () => {
    setIsProcessing(true);
    setTranscript("Processing voice...");
    
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    
    try {
      // 1. STT via Sarvam
      const text = await sarvamService.transcribe(audioBlob, language);
      setTranscript(text);

      // 2. Orchestrate via Gemini
      const action = await orchestrator.process(text, {
        isAdmin,
        currentPath: location.pathname,
        cartLength: items.length
      });

      setResponse(action.response);

      // 3. Execute Tool if needed
      if (action.intent && (tools as any)[action.intent]) {
        await (tools as any)[action.intent](action.params);
      }

      // 4. TTS via Sarvam
      await speak(action.response);

    } catch (error) {
      setResponse("Sorry, I had trouble understanding that. Could you repeat?");
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = async (text: string) => {
    setIsSpeaking(true);
    try {
      const audioData = await sarvamService.synthesize(text, language);
      await sarvamService.speak(audioData);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 md:bottom-10"
      >
        {isOpen ? <X /> : <Mic className="animate-pulse" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed inset-x-4 bottom-40 z-50 mx-auto max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl dark:bg-black/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-green-500"}`} />
                <h3 className="font-display font-bold text-foreground">Indhur Assistant</h3>
                {isAdmin && <ShieldCheck className="h-4 w-4 text-primary" title="Admin Mode" />}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="space-y-4 min-h-[150px]">
              {/* Transcription Box */}
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-bold">You said:</p>
                <p className="text-sm italic text-foreground/80">{transcript || "Waiting for your voice..."}</p>
              </div>

              {/* Response Box */}
              <div className="rounded-2xl bg-primary/10 p-4 border border-primary/20">
                <p className="text-xs uppercase tracking-widest text-primary mb-1 font-bold">Assistant:</p>
                <p className="text-base font-medium text-foreground">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : response}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                    isListening ? "bg-red-500 scale-110 shadow-lg shadow-red-500/40" : "bg-primary shadow-lg shadow-primary/40 hover:scale-105"
                  }`}
                >
                  {isListening ? (
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [10, 30, 10] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1.5 bg-white rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <Mic className="h-8 w-8 text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                {isListening ? "Release to Send" : "Hold to Speak"}
              </p>
            </div>

            {/* Language Selection */}
            <div className="mt-6 flex justify-center gap-2 border-t border-white/10 pt-4">
              {(["en-IN", "hi-IN", "te-IN"] as SarvamLanguageCode[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                    language === l ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {l.split('-')[0]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceAgentOverlay;
