import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OnboardingModal } from '../components/OnboardingModal';
import { usePageTitle } from '../hooks/usePageTitle';
import './Signup.css';


const SignUp = () => {
  usePageTitle('Create Workspace');
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { signup, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signup({
        company_name: formData.company_name.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      });
      setShowOnboarding(true);
    } catch {
      setFormData((current) => ({ ...current, password: '' }));
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate('/dashboard');
  };

  return (
    <>
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      <div className="signup-root">
        {/* ── Left Panel ── */}
        <aside className="signup-left">
          <div className="signup-brand">
            <div className="signup-mark">
              <Building2 size={17} />
            </div>
            <span className="signup-brand-name">Approveet</span>
          </div>

          <div className="signup-story">
            <p className="signup-story-title">
              Start with a company.
              <br />
              <em>Route every request.</em>
            </p>
            <p className="signup-story-copy">
              Your first account becomes the CEO workspace owner. From there, add HODs,
              account officers, and staff into the same approval chain.
            </p>
          </div>

          <div className="signup-steps">
            <div className="signup-step">
              <span className="signup-step-dot" />
              Create company
            </div>
            <div className="signup-step">
              <span className="signup-step-dot" />
              Invite department leads
            </div>
            <div className="signup-step">
              <span className="signup-step-dot" />
              Submit first invoice
            </div>
          </div>
        </aside>

        {/* ── Right Panel ── */}
        <main className="signup-right">
          <div className="signup-form-shell">
            <p className="signup-eyebrow">New workspace</p>
            <h1 className="signup-title">
              Create your <span>approval desk</span>
            </h1>

            {error && <div className="signup-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="signup-grid">
                <div className="signup-field signup-field-full">
                  <label className="signup-label" htmlFor="company-name">
                    Company Name
                  </label>
                  <input
                    id="company-name"
                    className="signup-input"
                    type="text"
                    required
                    minLength={2}
                    placeholder="Acme Operations Ltd"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                  />
                </div>

                <div className="signup-field">
                  <label className="signup-label" htmlFor="owner-name">
                    Owner Name
                  </label>
                  <input
                    id="owner-name"
                    className="signup-input"
                    type="text"
                    required
                    minLength={2}
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="signup-field">
                  <label className="signup-label" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    id="phone"
                    className="signup-input"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="signup-field">
                  <label className="signup-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    className="signup-input"
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="signup-field">
                  <label className="signup-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    className="signup-input"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <button type="submit" className="signup-submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={18} className="signup-spinner" />
                ) : (
                  <>
                    Create workspace
                    <ArrowRight size={16} className="arrow" />
                  </>
                )}
              </button>
            </form>

            <div className="signup-footer">
              <span>Already onboarded?</span>
              <Link to="/login">Sign in</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SignUp;
