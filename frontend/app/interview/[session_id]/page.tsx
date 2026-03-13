"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, Volume2, ArrowLeft, Loader2, StopCircle, CheckCircle, Flag } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import type { InterviewUIState } from "@/app/types/interview";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const sessionId = params?.session_id as string;

  const [uiState, setUiState] = useState<InterviewUIState>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messageHistory, setMessageHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasFetchedFirstQuestion = useRef(false);
  const silenceTimer = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;   
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setUiState("listening");
          setError(null);
          if (recognitionRef.current) recognitionRef.current.hasError = false;
        };

        recognition.onend = () => {
          setUiState("idle");
          // Clear any pending silence timer
          if (silenceTimer.current) clearTimeout(silenceTimer.current);
          // Send whatever transcript we have accumulated
          if (
            recognitionRef.current &&
            !recognitionRef.current.hasError &&
            recognitionRef.current.finalTranscript
          ) {
            handleSend(recognitionRef.current.finalTranscript);
            recognitionRef.current.finalTranscript = "";
          }
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);

          // Always keep the latest full transcript saved
          if (recognitionRef.current) {
            recognitionRef.current.finalTranscript = currentTranscript;
          }

          // Reset silence timer on every new speech result
          if (silenceTimer.current) clearTimeout(silenceTimer.current);
          silenceTimer.current = setTimeout(() => {
            const wordCount = currentTranscript.trim().split(/\s+/).filter(w => w.length > 0).length;
            if (wordCount >= 3) {
              // Stop recognition — triggers onend → handleSend
              recognition.stop();
            }
          }, 3000); // 3 seconds of silence before submitting
        };

        recognition.onerror = (event: any) => {
          console.error("Speech Error:", event.error);
          if (silenceTimer.current) clearTimeout(silenceTimer.current);

          if (event.error === "no-speech") {
            // Not a real error — just ignore and keep state clean
            if (recognitionRef.current) recognitionRef.current.hasError = false;
            return;
          }

          if (recognitionRef.current) recognitionRef.current.hasError = true;

          if (event.error === "network") {
            setError("Network Error: Something is blocking Google Speech API (VPN? Antivirus?)");
          } else if (event.error === "not-allowed") {
            setError("Microphone blocked. Check browser permissions.");
          }
          setUiState("idle");
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

  const toggleMic = () => {
    if (!recognitionRef.current) return;

    if (uiState === "listening") {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      recognitionRef.current.stop(); // triggers onend → handleSend with whatever was said
    } else if (uiState === "idle") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setTranscript("");
      setError(null);
      // Reset stored transcript before starting
      if (recognitionRef.current) recognitionRef.current.finalTranscript = "";
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Mic start error:", e);
      }
    }
  };

  const handleSend = async (text: string, isHiddenStart = false) => {
    setUiState("processing");
    setError(null);

    if (!isHiddenStart) {
      setAiResponse("Thinking...");
    } else {
      setAiResponse("AI is preparing your interview...");
    }

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("user_message", text);

      const response = await fetch(`http://127.0.0.1:8000/chat/${sessionId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Chat failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      const isJsonResponse = contentType?.includes("application/json");

      if (isJsonResponse) {
        const jsonData = await response.json();
        if (jsonData.isSessionComplete) {
          setAiResponse("Interview Complete! Generating your feedback...");
          setUiState("complete");
          setTimeout(() => {
            router.push('/dashboard?refreshed=' + Date.now());
          }, 2000);
          return;
        }
      }

      const encodedText = response.headers.get("x-ai-response-text");
      const isSessionComplete = response.headers.get("x-session-complete") === "true";

      if (encodedText) {
        try {
          setAiResponse(decodeURIComponent(encodedText));
        } catch (e) {
          setAiResponse(encodedText);
        }
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        try {
          setUiState("playing");
          await audioRef.current.play();
          setMessageHistory(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: aiResponse }]);
        } catch (playError) {
          console.warn("Auto-play blocked");
          setUiState("idle");
        }

        if (isSessionComplete) {
          audioRef.current.onended = () => {
            setUiState("complete");
            setTimeout(() => {
              router.push('/dashboard?refreshed=' + Date.now());
            }, 1500);
          };
        } else {
          audioRef.current.onended = () => setUiState("idle");
        }
      }

    } catch (err) {
      console.error("Chat Error:", err);
      setError(err instanceof Error ? err.message : "Connection Error. Is the backend running?");
      setAiResponse("Connection Error.");
      setUiState("error");
    }
  };

  const handleEndSession = async () => {
    setUiState("ending");
    setError(null);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const token = await getToken();

      const response = await fetch(`http://127.0.0.1:8000/end_session/${sessionId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to end session with status ${response.status}`);
      }

      setUiState("complete");

      setTimeout(() => {
        router.push('/dashboard?refreshed=' + Date.now());
      }, 2000);

    } catch (err) {
      console.error("End Session Error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate report. Try again.");
      setUiState("error");
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

      <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 20 }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600
        }}>
          <ArrowLeft size={18} /> Exit
        </Link>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center', position: 'relative', zIndex: 10 }}>

        <div style={{ marginBottom: '3rem', position: 'relative', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {uiState === "playing" && (
            <div style={{
              position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
              border: '2px solid rgba(129, 140, 248, 0.2)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}></div>
          )}
          <div style={{
            width: uiState === "playing" ? '120px' : '100px',
            height: uiState === "playing" ? '120px' : '100px',
            borderRadius: '50%',
            background: uiState === "processing"
              ? 'linear-gradient(135deg, #fbbf24, #d97706)'
              : uiState === "playing"
                ? 'linear-gradient(135deg, #818cf8, #c084fc)'
                : uiState === "listening"
                  ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                  : 'linear-gradient(135deg, #334155, #1e293b)',
            boxShadow: uiState === "playing" ? '0 0 60px rgba(129, 140, 248, 0.6)' : '0 0 30px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.4s',
          }}>
            {uiState === "processing" ? <Loader2 size={40} className="animate-spin text-white" /> :
              uiState === "playing" ? <Volume2 size={40} className="text-white" /> :
                <Mic size={40} className="text-slate-400" />}
          </div>
        </div>

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
          {transcript && <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' }}>" {transcript} "</p>}
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.5 }}>
            {aiResponse || "Initializing Interview..."}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

          <button
            onClick={toggleMic}
            disabled={uiState === "processing" || uiState === "ending" || uiState === "complete"}
            style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: uiState === "listening" ? '#ef4444' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              border: 'none', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: (uiState === "processing" || uiState === "ending" || uiState === "complete") ? 'not-allowed' : 'pointer',
              opacity: (uiState === "processing" || uiState === "ending" || uiState === "complete") ? 0.5 : 1,
              boxShadow: uiState === "listening" ? '0 0 30px rgba(239, 68, 68, 0.5)' : '0 10px 30px rgba(79, 70, 229, 0.4)',
              transform: uiState === "listening" ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s'
            }}
          >
            {uiState === "listening" ? <StopCircle size={32} /> : <Mic size={32} />}
          </button>

          {(uiState === "idle" || uiState === "listening" || uiState === "processing" || uiState === "playing") && (
            <button
              onClick={handleEndSession}
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '0.8rem 2rem',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                transition: 'all 0.2s',
                marginTop: '10px'
              }}
            >
              <Flag size={18} /> Finish & Get Feedback
            </button>
          )}

          {uiState === "ending" && (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Generating your report...</p>
            </div>
          )}

          {uiState === "complete" && (
            <div style={{ textAlign: 'center', color: '#34d399' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Interview Complete!</p>
              <p style={{ fontSize: '0.9rem', color: '#6ee7b7', marginTop: '0.5rem' }}>Redirecting to dashboard...</p>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            marginTop: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            color: '#f87171',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
      </div>
      <style jsx global>{`@keyframes ping { 75%, 100% { transform: scale(1.5); opacity: 0; } }`}</style>
    </div>
  );
}