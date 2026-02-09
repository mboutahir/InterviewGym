"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Upload, Briefcase, User, Mail, Sparkles, ArrowRight, Loader2, CheckCircle2, Rocket, Star, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobDescription: "",
    firstName: "",
    lastName: "",
    email: ""
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume || !formData.jobTitle) {
        alert("Please upload a resume and enter a job title!");
        return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("file", resume);
    data.append("jobTitle", formData.jobTitle);
    data.append("jobDescription", formData.jobDescription);
    data.append("first_name", formData.firstName);
    data.append("last_name", formData.lastName);
    data.append("email", formData.email);

    try {
      const response = await axios.post("http://127.0.0.1:8000/create_session", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push(`/interview/${response.data.sessionId}`);
    } catch (error) {
      console.error(error);
      alert("Failed to start session. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for the progress bar
  const filledFields = Object.values(formData).filter(v => v).length;
  const totalSteps = 6;
  const currentProgress = filledFields + (resume ? 1 : 0);

  return (
    <div style={{
      minHeight: '100vh',
      // DARKER GRADIENT: Deep Slate to Midnight Blue to Black
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
      padding: '3rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      color: '#e2e8f0'
    }}>
      
      {/* Animated mesh gradient background (Subtler for dark mode) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15), transparent 50%)',
        animation: 'mesh 20s ease-in-out infinite',
        zIndex: 0
      }}></div>

      <div style={{maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10}}>
        
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: '4rem'}}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(30, 41, 59, 0.6)', // Dark glass
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            marginBottom: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Zap style={{width: '20px', height: '20px', color: '#fbbf24'}} />
            <span style={{fontSize: '14px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.5px'}}>AI-POWERED COACHING</span>
            <div style={{display: 'flex', gap: '3px'}}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} style={{width: '14px', height: '14px', fill: '#fbbf24', color: '#fbbf24'}} />
              ))}
            </div>
          </div>
          
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: '1.5rem',
            lineHeight: 1.1,
            textShadow: '0 0 40px rgba(139, 92, 246, 0.3)' // Glowing text
          }}>
            Ace Your Dream<br />
            <span style={{color: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #818cf8, #c084fc)'}}>Interview 🚀</span>
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto 2rem',
            fontWeight: 500
          }}>
            Get hired faster with personalized AI coaching
          </p>

          {/* Progress Pills */}
          <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '2rem'}}>
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} style={{
                width: '60px',
                height: '6px',
                borderRadius: '10px',
                background: i < currentProgress 
                  ? 'linear-gradient(90deg, #818cf8, #c084fc)' 
                  : 'rgba(255, 255, 255, 0.1)',
                boxShadow: i < currentProgress ? '0 0 15px rgba(129, 140, 248, 0.5)' : 'none',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}></div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          
          {/* CARD 1: Personal Info */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)', // Darker translucent bg
            borderRadius: '24px',
            padding: '3rem',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Gradient accent bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #818cf8, #c084fc)',
            }}></div>

            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(129, 140, 248, 0.1)', // Subtle accent bg
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(129, 140, 248, 0.2)'
              }}>
                <User style={{width: '28px', height: '28px', color: '#a5b4fc'}} />
              </div>
              <div>
                <h2 style={{fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem'}}>
                  Personal Information
                </h2>
                <p style={{color: '#94a3b8', fontSize: '1rem'}}>Tell us about yourself</p>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem'}}>
              
              {/* First Name */}
              <div>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem'}}>
                  FIRST NAME
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      fontSize: '1rem',
                      color: '#f1f5f9',
                      background: 'rgba(15, 23, 42, 0.6)', // Very dark input bg
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    placeholder="John"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem'}}>
                  LAST NAME
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      fontSize: '1rem',
                      color: '#f1f5f9',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem'}}>
                <Mail style={{width: '14px', height: '14px'}} /> EMAIL ADDRESS
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '1rem',
                  color: '#f1f5f9',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* CARD 2: Job Details */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '24px',
            padding: '3rem',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             {/* Gradient accent bar */}
             <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #c084fc, #f472b6)',
            }}></div>

            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(192, 132, 252, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(192, 132, 252, 0.2)'
              }}>
                <Briefcase style={{width: '28px', height: '28px', color: '#d8b4fe'}} />
              </div>
              <div>
                <h2 style={{fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem'}}>
                  Target Position
                </h2>
                <p style={{color: '#94a3b8', fontSize: '1rem'}}>What role are you aiming for?</p>
              </div>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem'}}>
                JOB TITLE
              </label>
              <input
                name="jobTitle"
                required
                value={formData.jobTitle}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '1rem',
                  color: '#f1f5f9',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  outline: 'none',
                }}
                placeholder="e.g. Senior Product Manager"
              />
            </div>

            <div>
              <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem'}}>
                <Sparkles style={{width: '14px', height: '14px', color: '#fbbf24'}} /> JOB DESCRIPTION
              </label>
              <textarea
                name="jobDescription"
                rows={5}
                value={formData.jobDescription}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '1rem',
                  color: '#f1f5f9',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
                placeholder="Paste the job description here..."
              />
            </div>
          </div>

          {/* CARD 3: Resume Upload */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '24px',
            padding: '3rem',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            }}></div>

            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem'}}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                <Upload style={{width: '28px', height: '28px', color: '#7dd3fc'}} />
              </div>
              <div>
                <h2 style={{fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem'}}>
                  Upload Resume
                </h2>
                <p style={{color: '#94a3b8', fontSize: '1rem'}}>PDF format required</p>
              </div>
            </div>

            <div style={{position: 'relative'}}>
              <input
                type="file"
                accept=".pdf"
                required
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10
                }}
              />
              
              {!resume ? (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.3)',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    margin: '0 auto 1.5rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Upload style={{width: '32px', height: '32px', color: '#38bdf8'}} />
                  </div>
                  <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem'}}>
                    Drop your PDF here
                  </h3>
                  <p style={{fontSize: '1rem', color: '#64748b'}}>
                    Max 10MB
                  </p>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '20px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    margin: '0 auto 1.5rem',
                    background: '#10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CheckCircle2 style={{width: '32px', height: '32px', color: '#ffffff'}} />
                  </div>
                  <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem'}}>
                    {resume.name}
                  </h3>
                  <p style={{fontSize: '1rem', color: '#6ee7b7'}}>
                    Click to replace
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || currentProgress < totalSteps}
            style={{
              width: '100%',
              padding: '1.5rem 3rem',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#ffffff',
              background: currentProgress >= totalSteps 
                ? 'linear-gradient(135deg, #4f46e5, #9333ea)' 
                : 'rgba(30, 41, 59, 0.5)',
              border: 'none',
              borderRadius: '16px',
              cursor: currentProgress >= totalSteps ? 'pointer' : 'not-allowed',
              opacity: currentProgress >= totalSteps ? 1 : 0.5,
              boxShadow: currentProgress >= totalSteps ? '0 0 30px rgba(79, 70, 229, 0.4)' : 'none',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <>START INTERVIEW <ArrowRight /></>}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes mesh {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}