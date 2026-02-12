"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser, UserButton } from "@clerk/nextjs"; // 👈 Import Clerk
import { ArrowLeft, BarChart3, FileText, Calendar, Play, Briefcase, Trophy, AlertCircle, Zap, Star } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user, isLoaded } = useUser(); // 👈 Get User
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is loaded and has an email
    if (isLoaded && user?.primaryEmailAddress?.emailAddress) {
        const fetchDashboard = async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/dashboard/${user.primaryEmailAddress?.emailAddress}`);
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
        };
        fetchDashboard();
    }
  }, [isLoaded, user]);

  if (!isLoaded) return <div className="min-h-screen bg-black text-white p-10">Loading...</div>;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
      padding: '3rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
       {/* 🔹 USER BUTTON */}
       <div style={{position: 'absolute', top: '2rem', right: '2rem', zIndex: 50}}>
        <UserButton afterSignOutUrl="/"/>
      </div>
      
      {/* Animated Mesh Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15), transparent 50%)',
        animation: 'mesh 20s ease-in-out infinite',
        zIndex: 0
      }}></div>

      <div style={{maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10}}>
        
        {/* Header Section */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '4rem'}}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(30, 41, 59, 0.6)', padding: '0.5rem 1rem', borderRadius: '50px',
              marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Zap style={{width: '16px', height: '16px', color: '#fbbf24'}} />
              <span style={{fontSize: '12px', fontWeight: 700, color: '#f1f5f9'}}>YOUR PROGRESS</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              textShadow: '0 0 40px rgba(139, 92, 246, 0.3)'
            }}>
              Career <span style={{color: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #818cf8, #c084fc)'}}>Dashboard</span>
            </h1>
          </div>
          
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s'
          }}>
             <Briefcase size={18} /> New Interview
          </Link>
        </div>

        {/* Content Area */}
        {loading ? (
             <div style={{textAlign: 'center', padding: '4rem', color: '#94a3b8'}}>Loading your stats...</div>
        ) : sessions.length === 0 ? (
             <div style={{
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '24px',
                padding: '4rem',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)'
             }}>
                <h3 style={{fontSize: '1.5rem', color: 'white', marginBottom: '1rem'}}>No interviews yet</h3>
                <p style={{color: '#94a3b8', marginBottom: '2rem'}}>Start your first AI coaching session to see analytics here.</p>
                <Link href="/" style={{
                    background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: 700,
                    textDecoration: 'none'
                }}>Start Interview 🚀</Link>
             </div>
        ) : (
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '2rem'}}>
                {sessions.map((session) => {
                    // Parse Resume Feedback JSON
                    let resumeData = { keywords_missing: [] };
                    try { resumeData = JSON.parse(session.resumeFeedback || "{}"); } catch(e) {}

                    const isCompleted = session.status === "COMPLETED";

                    return (
                        <div key={session.id} style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            borderRadius: '24px',
                            padding: '2rem',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(10px)',
                            transition: 'transform 0.2s',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}>
                            
                            {/* Card Header */}
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem'}}>
                                <div>
                                    <h3 style={{fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem'}}>
                                        {session.jobTitle}
                                    </h3>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem'}}>
                                        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                            <Calendar size={14} /> {new Date(session.createdAt).toLocaleDateString()}
                                        </span>
                                        <span style={{background: 'rgba(255,255,255,0.1)', height: '4px', width: '4px', borderRadius: '50%'}}></span>
                                        <span>Session ID: {session.id.slice(0,8)}</span>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '50px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                    color: isCompleted ? '#34d399' : '#facc15',
                                    border: isCompleted ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)'
                                }}>
                                    {session.status}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
                                
                                {/* 1. RESUME SCORE */}
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(56, 189, 248, 0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Accent Line */}
                                    <div style={{position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#38bdf8'}}></div>

                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                        <span style={{color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <FileText size={16} color="#38bdf8" /> RESUME MATCH
                                        </span>
                                        <span style={{fontSize: '1.5rem', fontWeight: 800, color: '#e0f2fe'}}>
                                            {session.resumeScore || 0}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{width: '100%', background: 'rgba(56, 189, 248, 0.1)', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem'}}>
                                        <div style={{height: '100%', width: `${session.resumeScore || 0}%`, background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', borderRadius: '10px'}}></div>
                                    </div>

                                    {resumeData.keywords_missing?.length > 0 ? (
                                        <div style={{background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', padding: '0.75rem'}}>
                                            <p style={{fontSize: '0.75rem', color: '#f87171', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                <AlertCircle size={12} /> MISSING KEYWORDS
                                            </p>
                                            <p style={{fontSize: '0.85rem', color: '#fca5a5'}}>
                                                {resumeData.keywords_missing.slice(0,3).join(", ")}
                                            </p>
                                        </div>
                                    ) : (
                                        <p style={{fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                            <Star size={14} fill="#34d399" /> Great resume match!
                                        </p>
                                    )}
                                </div>

                                {/* 2. INTERVIEW SCORE */}
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(168, 85, 247, 0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Accent Line */}
                                    <div style={{position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#a855f7'}}></div>

                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                        <span style={{color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <BarChart3 size={16} color="#a855f7" /> INTERVIEW SCORE
                                        </span>
                                        <span style={{fontSize: '1.5rem', fontWeight: 800, color: '#f3e8ff'}}>
                                            {session.rating ? `${session.rating}/10` : "N/A"}
                                        </span>
                                    </div>

                                    {isCompleted ? (
                                        <>
                                            <div style={{width: '100%', background: 'rgba(168, 85, 247, 0.1)', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem'}}>
                                                <div style={{height: '100%', width: `${(session.rating || 0) * 10}%`, background: 'linear-gradient(90deg, #c084fc, #a855f7)', borderRadius: '10px'}}></div>
                                            </div>
                                            <p style={{fontSize: '0.85rem', color: '#d8b4fe'}}>
                                                Check detailed feedback for tips.
                                            </p>
                                        </>
                                    ) : (
                                        <div style={{textAlign: 'center', padding: '0.5rem 0'}}>
                                            <Link href={`/interview/${session.id}`} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                                color: '#c084fc', fontSize: '0.9rem', fontWeight: 600,
                                                textDecoration: 'none'
                                            }}>
                                                <Play size={16} fill="#c084fc" /> Resume Session
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes mesh {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}