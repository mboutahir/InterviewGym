"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation"; // 👈 Import useRouter
import axios from "axios";
import { Mic, Volume2, ArrowLeft, Loader2, StopCircle, CheckCircle, Flag } from "lucide-react";
import Link from "next/link";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter(); // 👈 Init Router
  const sessionId = params?.session_id as string;

  // States
  const [hasStarted, setHasStarted] = useState(false); 
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnding, setIsEnding] = useState(false); // 👈 State for loading report
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState(""); 
  const [error, setError] = useState("");

  // Refs
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasFetchedFirstQuestion = useRef(false);
  const silenceTimer = useRef<any>(null);

  // 1. Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; 
        recognition.interimResults = true; 
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
            setError("");
            if (recognitionRef.current) recognitionRef.current.hasError = false; 
        };
        
        recognition.onend = () => {
            setIsListening(false);
            if (recognitionRef.current && !recognitionRef.current.hasError && recognitionRef.current.finalTranscript) {
                 handleSend(recognitionRef.current.finalTranscript);
                 recognitionRef.current.finalTranscript = ""; 
            }
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);

          if (silenceTimer.current) clearTimeout(silenceTimer.current);
          silenceTimer.current = setTimeout(() => {
              if (currentTranscript.trim().length > 1) {
                  recognition.stop(); 
              }
          }, 2500); 

          if (event.results[0].isFinal) {
             if (recognitionRef.current) recognitionRef.current.finalTranscript = currentTranscript;
          }
        };
        
        recognition.onerror = (event: any) => {
            console.error("Speech Error:", event.error);
            if (recognitionRef.current) recognitionRef.current.hasError = true; 
            if (silenceTimer.current) clearTimeout(silenceTimer.current);

            if (event.error === 'network') {
                setError("Network Error: Something is blocking Google Speech API (VPN? Antivirus?)");
            } else if (event.error === 'not-allowed') {
                setError("Microphone blocked. Check browser permissions.");
            } else if (event.error === 'no-speech') {
                if (recognitionRef.current) recognitionRef.current.hasError = false;
                return;
            }
            setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    if (sessionId && !hasFetchedFirstQuestion.current) {
        hasFetchedFirstQuestion.current = true;
        handleSend("Hello, I am ready.", true);
    }
    
    return () => {
        if (recognitionRef.current) recognitionRef.current.abort();
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, [sessionId]);

  // 2. Manual Mic Toggle
  const toggleMic = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
      setTranscript("");
      setError("");
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Mic start error:", e);
      }
    }
  };

  // 3. Send Message
  const handleSend = async (text: string, isHiddenStart = false) => {
    setIsProcessing(true);
    
    if (!isHiddenStart) {
        setAiResponse("Thinking...");
    } else {
        setAiResponse("AI is preparing your interview...");
    }

    try {
      const formData = new FormData();
      formData.append("user_message", text);

      const response = await axios.post(
        `http://127.0.0.1:8000/chat/${sessionId}`, 
        formData, 
        { responseType: "blob" } 
      );

      const encodedText = response.headers["x-ai-response-text"]; 
      if (encodedText) {
          try {
             setAiResponse(decodeURIComponent(encodedText));
          } catch(e) {
             setAiResponse(encodedText);
          }
      }

      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        try {
            await audioRef.current.play();
            setIsPlaying(true);
            setHasStarted(true); 
        } catch (playError) {
            console.warn("Auto-play blocked");
        }
        audioRef.current.onended = () => setIsPlaying(false);
      }

    } catch (err) {
      console.error("Chat Error:", err);
      setError("Connection Error. Is the backend running?");
      setAiResponse("Connection Error.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. 👇 THIS IS THE MISSING LINK
  const handleEndSession = async () => {
    setIsEnding(true);
    // Stop audio
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    
    try {
        // Trigger the AI Analysis
        await axios.post(`http://127.0.0.1:8000/end_session/${sessionId}`);
        
        // Go to Dashboard
        router.push('/dashboard');
    } catch (err) {
        console.error("End Session Error:", err);
        setError("Failed to generate report. Try again.");
        setIsEnding(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
      position: 'relative',
      overflow: 'hidden',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 50%)',
        animation: 'pulse 10s ease-in-out infinite',
        zIndex: 0
      }}></div>

      <audio ref={audioRef} className="hidden" />

      {/* Header / Exit */}
      <div style={{position: 'absolute', top: '2rem', left: '2rem', zIndex: 20}}>
        <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600
        }}>
            <ArrowLeft size={18} /> Exit
        </Link>
      </div>

      <div style={{width: '100%', maxWidth: '600px', textAlign: 'center', position: 'relative', zIndex: 10}}>
        
        {/* Visualizer */}
        <div style={{marginBottom: '3rem', position: 'relative', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {isPlaying && (
                <div style={{
                    position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
                    border: '2px solid rgba(129, 140, 248, 0.2)',
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}></div>
            )}
            <div style={{
                width: isPlaying ? '120px' : '100px',
                height: isPlaying ? '120px' : '100px',
                borderRadius: '50%',
                background: isProcessing 
                    ? 'linear-gradient(135deg, #fbbf24, #d97706)' 
                    : isPlaying 
                        ? 'linear-gradient(135deg, #818cf8, #c084fc)' 
                        : isListening
                            ? 'linear-gradient(135deg, #f43f5e, #e11d48)' 
                            : 'linear-gradient(135deg, #334155, #1e293b)', 
                boxShadow: isPlaying ? '0 0 60px rgba(129, 140, 248, 0.6)' : '0 0 30px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s',
            }}>
                {isProcessing ? <Loader2 size={40} className="animate-spin text-white" /> : 
                 isPlaying ? <Volume2 size={40} className="text-white" /> : 
                 <Mic size={40} className="text-slate-400" />}
            </div>
        </div>

        {/* Transcript */}
        <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '3rem',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            {transcript && <p style={{color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic'}}>" {transcript} "</p>}
            <h2 style={{fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.5}}>
                {aiResponse || "Initializing Interview..."}
            </h2>
        </div>

        {/* Controls */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'}}>
            
            {/* 1. Mic Button */}
            <button
                onClick={toggleMic}
                disabled={isProcessing || !hasStarted || isEnding}
                style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: isListening ? '#ef4444' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    border: 'none', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: (isProcessing || !hasStarted) ? 'not-allowed' : 'pointer',
                    opacity: (isProcessing || !hasStarted) ? 0.5 : 1,
                    boxShadow: isListening ? '0 0 30px rgba(239, 68, 68, 0.5)' : '0 10px 30px rgba(79, 70, 229, 0.4)',
                    transform: isListening ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.3s'
                }}
            >
                {isListening ? <StopCircle size={32} /> : <Mic size={32} />}
            </button>

            {/* 2. 👇 FINISH BUTTON (Only shows after started) */}
            {hasStarted && (
                <button 
                    onClick={handleEndSession}
                    disabled={isEnding || isProcessing}
                    style={{
                        background: 'rgba(16, 185, 129, 0.1)', // Green tint
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        padding: '0.8rem 2rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: isEnding ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        transition: 'all 0.2s',
                        marginTop: '10px'
                    }}
                >
                    {isEnding ? (
                        <> <Loader2 size={18} className="animate-spin" /> Generating Report... </>
                    ) : (
                        <> <Flag size={18} /> Finish & Get Feedback </>
                    )}
                </button>
            )}
        </div>

        {error && <div style={{marginTop: '1rem', color: '#f87171', fontSize: '0.8rem'}}>{error}</div>}
      </div>
      <style jsx global>{`@keyframes ping { 75%, 100% { transform: scale(1.5); opacity: 0; } }`}</style>
    </div>
  );
}