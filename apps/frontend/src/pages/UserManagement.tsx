import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/users';
import { Layout } from '../components/Layout';
import type { User, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Loader2, Search, Shield, UserPlus } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const roleLabel: Record<UserRole, string> = {
  staff: 'Staff',
  hod: 'HOD',
  ceo: 'CEO',
  account_officer: 'Treasury',
};

const roleAccent: Record<UserRole, { dot: string; bg: string; fg: string; border: string }> = {
  ceo: { dot: '#6366F1', bg: '#EEF0FF', fg: '#4338CA', border: '#D9DCFB' },
  hod: { dot: '#F59E0B', bg: '#FEF7E6', fg: '#92520C', border: '#F8E3B0' },
  account_officer: { dot: '#10B981', bg: '#ECF8F2', fg: '#0E6A45', border: '#C2E7D2' },
  staff: { dot: '#888', bg: '#F7F6F3', fg: '#555', border: '#E8E6E1' },
};

export const UserManagement = () => {
  usePageTitle('Team Management');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
    department: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentRole = user?.role;
  const defaultNewUserRole: UserRole = currentRole === 'ceo' ? 'hod' : 'staff';
  const selectedRole: UserRole =
    currentRole === 'ceo' && formData.role === 'staff'
      ? 'hod'
      : currentRole === 'hod'
        ? 'staff'
        : formData.role;
  
  useEffect(() => {
    (async () => {
      try {
        const data = await userApi.getAll();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newUser = await userApi.create({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        department: formData.department || undefined,
      });
      setUsers((current) => [...current, newUser]);
      setFormData({ name: '', email: '', password: '', role: defaultNewUserRole, department: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreateUsers = currentRole === 'ceo' || currentRole === 'hod';

  if (!canCreateUsers) {
    return (
      <Layout>
        <style>{`
          .um-deny {
            text-align: center; padding: 120px 24px;
            font-family: 'Nunito Sans', sans-serif;
          }
          .um-deny-icon {
            width: 64px; height: 64px;
            margin: 0 auto 20px;
            border-radius: 50%;
            background: #F0EDE8;
            display: flex; align-items: center; justify-content: center;
            color: #BFBBBB;
          }
          .um-deny-title {
            font-family: 'Playfair Display', serif;
            font-size: 26px; font-weight: 500;
            color: #0A0A0A;
            margin-bottom: 8px;
          }
          .um-deny-sub {
            font-size: 13px; color: #888;
            max-width: 320px; margin: 0 auto 28px;
            line-height: 1.6;
          }
          .um-deny-btn {
            height: 44px; padding: 0 22px;
            background: #0A0A0A; color: white;
            border: none; border-radius: 8px;
            font-family: 'Nunito Sans', sans-serif;
            font-size: 13px; font-weight: 700;
            cursor: pointer;
          }
          .um-deny-btn:hover { background: #222; }
        `}</style>
        <div className="um-deny">
          <div className="um-deny-icon">
            <Shield size={28} />
          </div>
          <div className="um-deny-title">Access Restricted</div>
          <div className="um-deny-sub">
            You do not have the necessary privileges to oversee the personnel directory.
          </div>
          <button className="um-deny-btn" onClick={() => navigate('/dashboard')}>
            Return to Ledger
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`
        .um-root { font-family: 'Nunito Sans', sans-serif; max-width: 1200px; margin: 0 auto; }

        .um-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          color: #888; background: none; border: none; cursor: pointer;
          padding: 0; margin-bottom: 18px; font-family: inherit;
          transition: color 0.15s;
        }
        .um-back:hover { color: #0A0A0A; }

        .um-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 40px; padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px; flex-wrap: wrap;
        }
        .um-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #999; margin-bottom: 8px;
        }
        .um-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px; font-weight: 500;
          color: #0A0A0A; line-height: 1; letter-spacing: -1px;
        }
        .um-title em { font-style: italic; font-weight: 400; color: #888; }
        .um-sub {
          font-size: 13px; color: #888;
          margin-top: 10px;
          font-weight: 400;
        }

        .um-actions {
          display: flex; align-items: center; gap: 12px;
        }
        .um-search-wrap { position: relative; }
        .um-search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 15px; height: 15px;
          color: #BFBBBB; pointer-events: none;
        }
        .um-search-input {
          height: 42px; width: 240px;
          background: white;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          padding: 0 16px 0 40px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px; color: #0A0A0A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .um-search-input::placeholder { color: #C4C0B8; }
        .um-search-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }
        .um-add-btn {
          height: 42px; padding: 0 18px;
          background: #0A0A0A; color: white;
          border: none; border-radius: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .um-add-btn:hover { background: #222; }
        .um-add-btn:active { transform: scale(0.98); }

        /* Form card */
        .um-form-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 32px;
        }
        .um-form-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid #F0EDE8;
        }
        .um-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 500;
          color: #0A0A0A;
        }
        .um-form-title em { font-style: italic; color: #888; }
        .um-form-cancel {
          background: none; border: none;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          color: #888; cursor: pointer; padding: 0;
          transition: color 0.15s;
        }
        .um-form-cancel:hover { color: #0A0A0A; }

        .um-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 720px) { .um-form-grid { grid-template-columns: 1fr; } }
        .um-form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 720px) { .um-form-grid-3 { grid-template-columns: 1fr; } }

        .um-field-label {
          display: block;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #999;
          margin-bottom: 8px;
        }
        .um-input {
          width: 100%; height: 44px;
          background: #FAFAF8;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          padding: 0 14px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px; color: #0A0A0A;
          outline: none; box-sizing: border-box;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .um-input::placeholder { color: #C4C0B8; }
        .um-input:focus {
          border-color: #0A0A0A; background: white;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }
        .um-input:disabled {
          opacity: 0.6; cursor: not-allowed;
          background: #F0EDE8;
        }
        select.um-input {
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M3 4.5l3 3 3-3'/></svg>");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
          font-weight: 600;
        }

        .um-form-foot {
          padding-top: 20px;
          border-top: 1px solid #F0EDE8;
          display: flex; justify-content: flex-end; gap: 12px;
        }
        .um-submit-btn {
          height: 44px; padding: 0 26px;
          background: #0A0A0A; color: white;
          border: none; border-radius: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: background 0.15s;
          display: flex; align-items: center; gap: 8px;
        }
        .um-submit-btn:hover:not(:disabled) { background: #222; }
        .um-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Table */
        .um-panel {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          overflow: hidden;
        }
        .um-panel-toolbar {
          padding: 16px 24px;
          border-bottom: 1px solid #F0EDE8;
          display: flex; align-items: center; justify-content: space-between;
        }
        .um-panel-count {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #BFBBBB;
        }

        .um-table { width: 100%; border-collapse: collapse; }
        .um-table thead tr { border-bottom: 1px solid #F0EDE8; }
        .um-table th {
          padding: 12px 24px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #BFBBBB; text-align: left;
          white-space: nowrap;
        }
        .um-table th.right { text-align: right; }
        .um-table tbody tr {
          border-bottom: 1px solid #F7F6F3;
          transition: background 0.12s;
        }
        .um-table tbody tr:last-child { border-bottom: none; }
        .um-table tbody tr:hover { background: #FAFAF8; }
        .um-table td {
          padding: 16px 24px;
          font-size: 14px; color: #0A0A0A;
          vertical-align: middle;
        }

        .um-member-row { display: flex; align-items: center; gap: 12px; }
        .um-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #F0EDE8;
          border: 1px solid #E8E6E1;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #555;
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }
        .um-member-name {
          font-size: 14px; font-weight: 700;
          color: #0A0A0A;
        }
        .um-member-email {
          font-size: 12px; color: #888;
          font-weight: 400;
        }

        .um-role-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid;
        }
        .um-role-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
        }

        .um-dept {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 500; color: #555;
        }
        .um-dept-icon { color: #BFBBBB; }

        .um-empty {
          padding: 80px 24px;
          text-align: center;
        }
        .um-empty-text {
          font-size: 13px; color: #BFBBBB;
          font-weight: 500; font-style: italic;
        }

        .um-skel-row td { padding: 18px 24px; }
        .um-skel {
          height: 16px; width: 70%;
          background: #F0EDE8;
          border-radius: 4px;
          animation: um-skel 1.4s ease-in-out infinite;
        }
        @keyframes um-skel {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .um-error {
          margin-bottom: 24px; padding: 14px 18px;
          background: #FEF2F2;
          border: 1px solid #F8C9C9;
          border-radius: 8px;
          font-size: 12px; font-weight: 600; color: #991B1B;
        }

        @media (max-width: 640px) {
          .um-title { font-size: 28px; }
          .um-actions { width: 100%; }
          .um-search-input { width: 100%; }
        }
      `}</style>

      <div className="um-root">
        <button onClick={() => navigate('/dashboard')} className="um-back">
          <ArrowLeft size={14} />
          Back to Ledger
        </button>

        <header className="um-header">
          <div>
            <p className="um-eyebrow">Organization · Personnel</p>
            <h1 className="um-title">
              Team <em>Directory</em>
            </h1>
            <p className="um-sub">Manage organization access and departmental roles.</p>
          </div>

          <div className="um-actions">
            <div className="um-search-wrap">
              <Search className="um-search-icon" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="um-search-input"
              />
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="um-add-btn">
                <UserPlus size={14} />
                Enroll Member
              </button>
            )}
          </div>
        </header>

        {error && <div className="um-error">{error}</div>}

        {showForm && (
          <section className="um-form-card">
            <div className="um-form-head">
              <h2 className="um-form-title">
                New <em>Enrollment</em>
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="um-form-cancel"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="um-form-grid">
                <div>
                  <label className="um-field-label">Full Legal Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Adewale Chen"
                    required
                    className="um-input"
                  />
                </div>
                <div>
                  <label className="um-field-label">Email Endpoint</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@organization.com"
                    required
                    className="um-input"
                  />
                </div>
              </div>

              <div className="um-form-grid-3">
                <div>
                  <label className="um-field-label">Initial Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="um-input"
                  />
                </div>
                <div>
                  <label className="um-field-label">Access Privilege</label>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="um-input"
                  >
                    {currentRole === 'hod' && (
                      <option value="staff">Staff / Standard</option>
                    )}
                    {currentRole === 'ceo' && (
                      <>
                        <option value="hod">HOD / Departmental</option>
                        <option value="account_officer">Account / Treasury</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="um-field-label">Sector Assignment</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="e.g. Marketing"
                    disabled={selectedRole === 'account_officer'}
                    className="um-input"
                  />
                </div>
              </div>

              <div className="um-form-foot">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="um-submit-btn"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Enroll Member'
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="um-panel">
          <div className="um-panel-toolbar">
            <span className="um-panel-count">
              {isLoading ? 'Loading…' : `${filteredUsers.length} members`}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="um-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th className="right" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="um-skel-row">
                      <td colSpan={4}>
                        <div className="um-skel" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="um-empty">
                      <div className="um-empty-text">
                        No matching personnel records found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const accent = roleAccent[u.role];
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="um-member-row">
                            <div className="um-avatar">
                              {u.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="um-member-name">{u.name}</div>
                              <div className="um-member-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="um-role-badge"
                            style={{
                              background: accent.bg,
                              color: accent.fg,
                              borderColor: accent.border,
                            }}
                          >
                            <span
                              className="um-role-dot"
                              style={{ background: accent.dot }}
                            />
                            {roleLabel[u.role]}
                          </span>
                        </td>
                        <td>
                          <span className="um-dept">
                            <Building size={14} className="um-dept-icon" />
                            {u.department || 'Central Operations'}
                          </span>
                        </td>
                        <td />
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
