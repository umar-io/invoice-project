import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export const Login = () => {
  usePageTitle('Sign In');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setPassword(''); // Clear sensitive field on failure for security and UX
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Nunito+Sans:wght@300;400;600;700&display=swap');

        .login-root {
          font-family: 'Nunito Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #0A0A0A;
        }

        /* ── Left Panel ── */
        .left-panel {
          width: 42%;
          background: #0A0A0A;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }
        .left-panel::before {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 320px; height: 320px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .left-panel::after {
          content: '';
          position: absolute;
          bottom: 60px; left: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.04);
          pointer-events: none;
        }

        /* Brand */
        .brand { display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; }
        .brand-mark {
          width: 32px; height: 32px;
          background: white; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 500;
          color: white; letter-spacing: -0.3px;
        }

        /* Tagline */
        .left-body { position: relative; z-index: 1; }
        .left-tagline {
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 400; font-style: italic;
          color: rgba(255,255,255,0.85);
          line-height: 1.3; margin-bottom: 20px; letter-spacing: -0.5px;
        }
        .left-tagline em { font-style: normal; color: white; }
        .left-sub {
          font-size: 14px; color: rgba(255,255,255,0.35);
          font-weight: 400; line-height: 1.7; max-width: 260px;
        }

        /* Trust badges */
        .left-footer { position: relative; z-index: 1; }
        .trust-badges { display: flex; gap: 20px; }
        .badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: rgba(255,255,255,0.3);
          font-weight: 600; letter-spacing: 0.02em;
        }
        .badge-dot {
          width: 6px; height: 6px;
          background: rgba(255,255,255,0.2); border-radius: 50%;
        }

        /* ── Right Panel ── */
        .right-panel {
          flex: 1;
          background: #F7F6F3;
          display: flex; align-items: center; justify-content: center;
          padding: 48px;
        }
        .form-container { width: 100%; max-width: 380px; }

        /* Header */
        .form-header { margin-bottom: 36px; }
        .form-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; color: #999;
          text-transform: uppercase; margin-bottom: 10px;
        }
        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 30px; font-weight: 500;
          color: #0A0A0A; line-height: 1.2; letter-spacing: -0.5px;
        }
        .form-title span { font-style: italic; font-weight: 400; }

        /* Error */
        .error-box {
          margin-bottom: 20px; padding: 12px 16px;
          background: #FEF2F2; border: 1.5px solid #FECACA;
          border-radius: 8px;
        }
        .error-box p { font-size: 13px; font-weight: 600; color: #DC2626; }

        /* SSO */
        .sso-btn {
          width: 100%; height: 46px;
          background: white; border: 1.5px solid #E8E6E1; border-radius: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px; font-weight: 600; color: #333;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sso-btn:hover { border-color: #C4C0B8; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }

        /* Divider */
        .divider-row {
          display: flex; align-items: center; gap: 12px;
          margin: 28px 0;
        }
        .divider-line { flex: 1; height: 1px; background: #E8E6E1; }
        .divider-text {
          font-size: 11px; color: #BFBBBB;
          font-weight: 600; letter-spacing: 0.06em;
        }

        /* Fields */
        .field { margin-bottom: 20px; }
        .field-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px;
        }
        .field-label {
          font-size: 12px; font-weight: 700; color: #0A0A0A;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .field-link {
          font-size: 12px; color: #999; font-weight: 600;
          cursor: pointer; background: none; border: none; padding: 0;
          font-family: inherit; transition: color 0.15s;
        }
        .field-link:hover { color: #0A0A0A; }
        .field-input {
          width: 100%; height: 48px;
          background: white; border: 1.5px solid #E8E6E1; border-radius: 8px;
          padding: 0 16px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 15px; font-weight: 400; color: #0A0A0A;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input::placeholder { color: #C4C0B8; }
        .field-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.07);
        }

        /* Submit */
        .submit-btn {
          width: 100%; height: 50px; margin-top: 28px;
          background: #0A0A0A; color: white; border: none; border-radius: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s, transform 0.1s; letter-spacing: 0.01em;
        }
        .submit-btn:hover:not(:disabled) { background: #222; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .submit-btn .arrow { transition: transform 0.2s; }
        .submit-btn:hover:not(:disabled) .arrow { transform: translateX(3px); }

        /* Footer */
        .form-footer {
          margin-top: 28px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .form-footer p { font-size: 13px; color: #999; font-weight: 400; }
        .form-footer-link {
          font-size: 13px; font-weight: 700; color: #0A0A0A;
          background: none; border: none; cursor: pointer;
          font-family: inherit; padding: 0;
          text-decoration: underline; text-underline-offset: 3px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .left-panel { display: none; }
          .right-panel { padding: 32px 24px; }
        }
      `}</style>

      <div className="login-root">
        {/* ── Left Panel ── */}
        <div className="left-panel">
          <div className="brand">
            <div className="brand-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" fill="#0A0A0A" />
              </svg>
            </div>
            <span className="brand-name">Approveet</span>
          </div>

          <div className="left-body">
            <p className="left-tagline">
              Every invoice<br />
              <em>tells a story.</em><br />
              Make yours count.
            </p>
            <p className="left-sub">
              The billing platform built for teams who move fast and get paid faster.
            </p>
          </div>

          <div className="left-footer">
            <div className="trust-badges">
              <div className="badge"><span className="badge-dot" />SOC 2 Type II</div>
              <div className="badge"><span className="badge-dot" />256-bit SSL</div>
              <div className="badge"><span className="badge-dot" />GDPR Ready</div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="right-panel">
          <div className="form-container">
            <div className="form-header">
              <p className="form-eyebrow">Welcome back</p>
              <h1 className="form-title">
                Sign in to your<br />
                <span>account</span>
              </h1>
            </div>

            {error && (
              <div className="error-box">
                <p>{error}</p>
              </div>
            )}

            {/* Google SSO */}
            {/* <button type="button" className="sso-btn">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button> */}

            {/* <div className="divider-row">
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div> */}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <div className="field-header">
                  <label className="field-label">Email</label>
                </div>
                <input
                  className="field-input"
                  type="email"
                  placeholder="jane.doe@company.com"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <div className="field-header">
                  <label className="field-label">Password</label>
                  <button type="button" className="field-link">Forgot password?</button>
                </div>
                <input
                  className="field-input"
                  type="password"
                  placeholder="••••••••••"
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} className="arrow" />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>No account yet?</p>
              <button
                type="button"
                className="form-footer-link"
                onClick={() => navigate('/register')}
              >
                Create one free
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
