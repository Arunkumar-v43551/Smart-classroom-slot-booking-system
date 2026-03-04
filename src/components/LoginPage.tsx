import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_CREDENTIALS } from '../lib/mockData';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (!ok) toast.error('Invalid credentials. Try demo accounts below.');
    else toast.success('Welcome back!');
  };

  const quickLogin = async (emailToLogin: string) => {
    const cred = DEMO_CREDENTIALS.find((c) => c.email === emailToLogin);
    if (!cred) return;
    setSubmitting(true);
    const ok = await login(cred.email, cred.password);
    setSubmitting(false);
    if (ok) toast.success(`Logged in as ${cred.name}`);
  };

  const busy = isLoading || submitting;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e1b4b 100%)', display: 'flex', alignItems: 'stretch' }}>
      {/* Left Panel */}
      <div style={{ display: 'none', flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: '48px' }} className="left-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏫</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>SmartBook</span>
        </div>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%' }}></div>
            <span style={{ color: '#93c5fd', fontSize: 13, fontWeight: 500 }}>Live System</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>
            Smart Classroom<br />
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Booking System</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7 }}>
            Reserve classrooms, labs & conference rooms instantly. Real-time conflict detection ensures zero double-bookings.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 32 }}>
            {[{ icon: '🏫', label: 'Classrooms', value: '8 Rooms' }, { icon: '⚡', label: 'Instant', value: 'Booking' }, { icon: '🛡️', label: 'Admin', value: 'Approval' }].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{s.value}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: '#334155', fontSize: 13 }}>© 2025 SmartBook — College Classroom Management</p>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Logo for mobile */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>🏫</div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 28, margin: 0 }}>SmartBook</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Smart Classroom Booking System</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>Sign In</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Access your booking dashboard</p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 48px 12px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                style={{ width: '100%', background: busy ? '#475569' : 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 600, fontSize: 15, cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              >
                {busy ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Demo Accounts */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>DEMO ACCOUNTS</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                    disabled={busy}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none',
                      cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>Quick Select Demo User...</span>
                    <span style={{ transition: 'transform 0.2s', transform: demoDropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>

                  {demoDropdownOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', maxHeight: 240, overflowY: 'auto' }}>
                      {DEMO_CREDENTIALS.map((cred) => (
                        <button
                          key={cred.email}
                          type="button"
                          onClick={() => {
                            setDemoDropdownOpen(false);
                            quickLogin(cred.email);
                          }}
                          style={{
                            width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px 12px', borderRadius: 8,
                            color: '#f8fafc', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, minWidth: 60, textAlign: 'center',
                            background: cred.role === 'student' ? '#eff6ff' : cred.role === 'faculty' ? '#f5f3ff' : '#fff1f2',
                            color: cred.role === 'student' ? '#2563eb' : cred.role === 'faculty' ? '#7c3aed' : '#f43f5e'
                          }}>
                            {cred.role.toUpperCase()}
                          </span>
                          <span>{cred.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>Passwords: </span>
                  student123 · faculty123 · admin123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
