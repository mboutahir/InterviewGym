"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser, UserButton } from "@clerk/nextjs";
import { 
  BarChart3, FileText, Calendar, Play, Briefcase, Zap, 
  X, CheckCircle2, AlertTriangle, Search, Loader2 
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    if (isLoaded && user?.primaryEmailAddress?.emailAddress) {
        const fetchDashboard = async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/dashboard/${user.primaryEmailAddress?.emailAddress}`);
            console.log("Dashboard Data:", res.data); // Debugging
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

  if (!isLoaded) return <div className="min-h-screen bg-black text-white p-10 flex items-center justify-center">Loading...</div>;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
      padding: '3rem 1.5rem',
      position: 'relative',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
       {/* User Button */}
       <div style={{position: 'absolute', top: '2rem', right: '2rem', zIndex: 50}}>
        <UserButton afterSignOutUrl="/"/>
      </div>
      
      <div style={{maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10}}>
        
        {/* Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '4rem'}}>
          <div>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(30, 41, 59, 0.6)', padding: '0.5rem 1rem', borderRadius: '50px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)'}}>
              <Zap style={{width: '16px', height: '16px', color: '#fbbf24'}} />
              <span style={{fontSize: '12px', fontWeight: 700, color: '#f1f5f9'}}>YOUR PROGRESS</span>
            </div>
            <h1 style={{fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.1}}>
              Career <span style={{color: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #818cf8, #c084fc)'}}>Dashboard</span>
            </h1>
          </div>
          
          <Link href="/" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '12px', color: 'white', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s'}}>
             <Briefcase size={18} /> New Interview
          </Link>
        </div>

        {/* Sessions Grid */}
        {loading ? (
             <div style={{textAlign: 'center', padding: '4rem', color: '#94a3b8'}}>Loading your stats...</div>
        ) : sessions.length === 0 ? (
             <div style={{background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '4rem', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)'}}>
                <h3 style={{fontSize: '1.5rem', color: 'white', marginBottom: '1rem'}}>No interviews yet</h3>
                <Link href="/" style={{background: 'linear-gradient(135deg, #4f46e5, #9333ea)', padding: '1rem 2rem', borderRadius: '12px', color: 'white', fontWeight: 700, textDecoration: 'none'}}>Start Interview 🚀</Link>
             </div>
        ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                {sessions.map((session) => {
                    // 🛑 FIX: Check for both "COMPLETE" and "COMPLETED"
                    const isCompleted = session.status === "COMPLETED" || session.status === "COMPLETE";
                    
                    let resumeScore = session.resumeScore || 0;
                    let interviewScore = session.rating || 0;

                    return (
                        <div 
                            key={session.id} 
                            // 👇 MAKE CARD CLICKABLE IF COMPLETED
                            onClick={() => isCompleted && setSelectedSession(session)}
                            style={{
                                background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', padding: '2rem',
                                border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)',
                                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 150px', gap: '2rem', alignItems: 'center',
                                cursor: isCompleted ? 'pointer' : 'default',
                                transition: 'transform 0.2s, background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                if(isCompleted) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                if(isCompleted) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
                            }}
                        >
                            {/* 1. Info */}
                            <div>
                                <h3 style={{fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem'}}>{session.jobTitle}</h3>
                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem'}}>
                                    <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Calendar size={14} /> {new Date(session.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* 2. Resume Score */}
                            <div style={{textAlign: 'center'}}>
                                <div style={{fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '5px'}}>RESUME</div>
                                {resumeScore > 0 ? (
                                    <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8'}}>{resumeScore}%</div>
                                ) : (
                                    <div style={{fontSize: '0.9rem', color: '#64748b'}}>Pending...</div>
                                )}
                            </div>

                            {/* 3. Interview Score */}
                            <div style={{textAlign: 'center'}}>
                                <div style={{fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '5px'}}>INTERVIEW</div>
                                {interviewScore > 0 ? (
                                    <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#c084fc'}}>{interviewScore}/10</div>
                                ) : (
                                    <div style={{fontSize: '0.9rem', color: '#64748b'}}>Pending...</div>
                                )}
                            </div>

                            {/* 4. Action Button */}
                            <div style={{textAlign: 'right'}}>
                                {isCompleted ? (
                                    <button 
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none',
                                            padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                                            fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                        }}
                                    >
                                        <Search size={16} /> View Report
                                    </button>
                                ) : (
                                    <Link href={`/interview/${session.id}`} style={{
                                        color: '#34d399', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none'
                                    }}>
                                        <Play size={16} /> Resume
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* 🔹 REPORT MODAL (POPUP) */}
      {selectedSession && (
        <ReportModal 
            session={selectedSession} 
            onClose={() => setSelectedSession(null)} 
        />
      )}

    </div>
  );
}

// 👇 SEPARATE COMPONENT FOR THE DETAILED REPORT
function ReportModal({ session, onClose }: { session: any, onClose: () => void }) {
    // Parse JSON safely
    let resumeData = { keywords_missing: [], score: 0, feedback: "" };
    let interviewData = { score: 0, feedback: "", strengths: [], improvements: [] };
    
    // 🛑 DEBUGGING: Log raw data to see if it's there
    console.log("Raw Resume Feedback:", session.resumeFeedback);
    console.log("Raw Interview Feedback:", session.feedback);

    try { 
        if (typeof session.resumeFeedback === 'string') {
            resumeData = JSON.parse(session.resumeFeedback);
        } else if (typeof session.resumeFeedback === 'object') {
            resumeData = session.resumeFeedback;
        }
    } catch(e) { console.error("Resume JSON Parse Error", e); }

    try { 
         if (typeof session.feedback === 'string') {
            interviewData = JSON.parse(session.feedback);
        } else if (typeof session.feedback === 'object') {
            interviewData = session.feedback;
        }
    } catch(e) { console.error("Interview JSON Parse Error", e); }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }} onClick={onClose}>
            
            <div 
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                style={{
                background: '#0f172a', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
                borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0', position: 'relative',
                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)'
            }}>
                {/* Close Button */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', 
                    border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20
                }}>
                    <X size={20} />
                </button>

                {/* Modal Header */}
                <div style={{padding: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to right, rgba(15, 23, 42, 1), rgba(30, 41, 59, 1))'}}>
                    <h2 style={{fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem'}}>{session.jobTitle} Report</h2>
                    <p style={{color: '#94a3b8'}}>Analysis generated on {new Date(session.createdAt).toLocaleDateString()}</p>
                </div>

                <div style={{padding: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
                    
                    {/* LEFT COL: RESUME ANALYSIS */}
                    <div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem'}}>
                            <FileText size={24} color="#38bdf8" />
                            <h3 style={{fontSize: '1.5rem', fontWeight: 700, color: '#e0f2fe'}}>Resume Analysis</h3>
                        </div>
                        
                        <div style={{background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'}}>
                            <div style={{fontSize: '3rem', fontWeight: 900, color: '#38bdf8', marginBottom: '0.5rem'}}>{resumeData.score || 0}%</div>
                            <p style={{color: '#cbd5e1', lineHeight: 1.6}}>{resumeData.feedback || "No feedback available."}</p>
                        </div>

                        {/* Missing Keywords */}
                        <h4 style={{fontSize: '1rem', fontWeight: 700, color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <AlertTriangle size={18} /> MISSING KEYWORDS
                        </h4>
                        {resumeData.keywords_missing?.length > 0 ? (
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.75rem'}}>
                                {resumeData.keywords_missing.map((k: string, i: number) => (
                                    <span key={i} style={{
                                        background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', 
                                        padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500
                                    }}>
                                        {k}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p style={{color: '#64748b', fontStyle: 'italic'}}>No critical keywords missing.</p>
                        )}
                    </div>

                    {/* RIGHT COL: INTERVIEW ANALYSIS */}
                    <div>
                         <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem'}}>
                            <BarChart3 size={24} color="#c084fc" />
                            <h3 style={{fontSize: '1.5rem', fontWeight: 700, color: '#f3e8ff'}}>Interview Performance</h3>
                        </div>

                        <div style={{background: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'}}>
                            <div style={{fontSize: '3rem', fontWeight: 900, color: '#c084fc', marginBottom: '0.5rem'}}>{interviewData.score || 0}/10</div>
                            <p style={{color: '#cbd5e1', lineHeight: 1.6}}>{interviewData.feedback || "No feedback available."}</p>
                        </div>

                        {/* Strengths */}
                        <div style={{marginBottom: '2rem'}}>
                            <h4 style={{fontSize: '1rem', fontWeight: 700, color: '#34d399', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <CheckCircle2 size={18} /> STRENGTHS
                            </h4>
                            <ul style={{listStyle: 'none', padding: 0}}>
                                {interviewData.strengths?.map((s: string, i: number) => (
                                    <li key={i} style={{marginBottom: '0.75rem', display: 'flex', alignItems: 'start', gap: '10px', color: '#cbd5e1'}}>
                                        <span style={{minWidth: '6px', height: '6px', borderRadius: '50%', background: '#34d399', marginTop: '8px'}}></span>
                                        {s}
                                    </li>
                                ))}
                                {(!interviewData.strengths || interviewData.strengths.length === 0) && <li style={{color: '#64748b'}}>None recorded.</li>}
                            </ul>
                        </div>

                        {/* Improvements */}
                        <div>
                            <h4 style={{fontSize: '1rem', fontWeight: 700, color: '#fbbf24', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <Zap size={18} /> AREAS TO IMPROVE
                            </h4>
                            <ul style={{listStyle: 'none', padding: 0}}>
                                {interviewData.improvements?.map((s: string, i: number) => (
                                    <li key={i} style={{marginBottom: '0.75rem', display: 'flex', alignItems: 'start', gap: '10px', color: '#cbd5e1'}}>
                                        <span style={{minWidth: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', marginTop: '8px'}}></span>
                                        {s}
                                    </li>
                                ))}
                                {(!interviewData.improvements || interviewData.improvements.length === 0) && <li style={{color: '#64748b'}}>None recorded.</li>}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}