import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../api/invoices';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { formatNaira } from '../lib/format';
import { ArrowLeft, ArrowRight, Loader2, FileText } from 'lucide-react';

const DEPARTMENTS = ['Marketing', 'Tech', 'Sales', 'Finance', 'Operations', 'HR'];

// Mock data for the outflow chart
const MOCK_OUTFLOW_DATA = [
  { dept: 'Tech', amount: 4200000, color: '#0A0A0A' },
  { dept: 'Mkt', amount: 2800000, color: '#444' },
  { dept: 'Ops', amount: 1500000, color: '#888' },
  { dept: 'Sales', amount: 900000, color: '#BBB' },
];

export const SubmitInvoice = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    department: '',
    purpose: '',
    accountNumber: '',
    bankName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const taRef = useRef<HTMLTextAreaElement>(null);

  const companyInitials = useMemo(() => {
    return (user?.company_name || 'AP')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.company_name]);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const allFilled =
    formData.amount !== '' &&
    formData.department !== '' &&
    formData.purpose !== '' &&
    formData.accountNumber !== '';


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await invoiceApi.create(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <style>{`
        .si-root { font-family: 'Nunito Sans', sans-serif; max-width: 1080px; margin: 0 auto; }

        .si-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          color: #888; background: none; border: none; cursor: pointer;
          padding: 0; margin-bottom: 18px; font-family: inherit;
          transition: color 0.15s;
        }
        .si-back:hover { color: #0A0A0A; }

        .si-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 48px; padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px; flex-wrap: wrap;
        }
        .si-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #999; margin-bottom: 8px;
        }
        .si-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px; font-weight: 500; color: #0A0A0A;
          line-height: 1; letter-spacing: -1px;
        }
        .si-title em { font-style: italic; font-weight: 400; color: #888; }

        .si-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 14px; background: #0A0A0A; color: white;
          border-radius: 999px;
        }
        .si-pill-text {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .si-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .si-grid { grid-template-columns: 1fr; }
        }

        .si-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 28px;
        }

        .si-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #999;
          margin-bottom: 12px; display: block;
        }

        .si-input, .si-select, .si-textarea {
          width: 100%;
          background: #FAFAF8;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          padding: 12px 16px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px; font-weight: 400;
          color: #0A0A0A; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .si-textarea {
          padding: 16px 18px;
          font-size: 15px; line-height: 1.6;
          color: #0A0A0A; outline: none; resize: none;
        }
        .si-input:focus, .si-select:focus, .si-textarea:focus {
          border-color: #0A0A0A; background: white;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }

        .si-divider {
          height: 1px; background: #F0EDE8;
          margin: 22px 0 18px;
        }

        .si-actions-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .si-examples {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .si-example-btn {
          padding: 6px 12px;
          background: #F7F6F3;
          border: 1px solid #E8E6E1;
          border-radius: 6px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 11px; font-weight: 600;
          color: #555; cursor: pointer;
          transition: all 0.15s;
        }
        .si-example-btn:hover {
          background: #0A0A0A; color: white; border-color: #0A0A0A;
        }

        .si-submit {
          height: 44px; padding: 0 22px;
          background: #0A0A0A; color: white;
          border: none; border-radius: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: background 0.15s, transform 0.1s;
        }
        .si-submit:hover:not(:disabled) { background: #222; }
        .si-submit:active:not(:disabled) { transform: scale(0.98); }
        .si-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .si-submit .arr { transition: transform 0.2s; }
        .si-submit:hover:not(:disabled) .arr { transform: translateX(3px); }

        .si-error {
          margin-top: 16px; padding: 12px 14px;
          background: #FEF2F2; border: 1px solid #F8C9C9;
          border-radius: 8px;
          font-size: 12px; font-weight: 600; color: #991B1B;
        }

        .si-note {
          margin-top: 16px;
          padding: 14px 18px;
          background: #FAFAF8;
          border: 1px dashed #E8E6E1;
          border-radius: 10px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.04em; line-height: 1.7;
          color: #888;
        }

        /* Preview panel */
        .si-preview {
          background: white;
          border: 1px solid #E8E6E1;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          padding: 48px;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          position: sticky; top: 88px;
        }
        .si-paper-header {
          border-bottom: 2px solid #0A0A0A;
          padding-bottom: 24px;
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .si-paper-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .si-preview-item { margin-bottom: 24px; }
        .si-preview-item:last-of-type { margin-bottom: 0; }
        .si-preview-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #BFBBBB;
          margin-bottom: 8px;
        }
        .si-preview-value {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 500;
          color: #0A0A0A; letter-spacing: -0.3px;
          line-height: 1.3;
        }
        .si-preview-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #F7F6F3;
          border: 1px solid #E8E6E1;
          border-radius: 6px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          color: #0A0A0A;
          letter-spacing: 0.02em;
        }
        .si-preview-skel {
          height: 14px; width: 60%;
          background: #F0EDE8;
          border-radius: 4px;
          animation: si-skel 1.4s ease-in-out infinite;
        }
        @keyframes si-skel {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .si-preview-foot {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #F0EDE8;
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #BFBBBB;
        }
        .si-preview-foot.ready { color: #0E6A45; }
        .si-preview-foot-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #BFBBBB;
        }
        .si-preview-foot.ready .si-preview-foot-dot {
          background: #10B981;
          box-shadow: 0 0 0 4px rgba(16,185,129,0.15);
          animation: si-pulse 2s ease-in-out infinite;
        }
        @keyframes si-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(16,185,129,0.15); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.05); }
        }

        /* Mini Chart Styles */
        .si-chart-container {
          margin-top: 32px;
          padding: 20px;
          background: #FAFAF8;
          border-radius: 12px;
          border: 1px solid #E8E6E1;
        }
        .si-chart-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .si-chart-title {
          font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; color: #0A0A0A;
        }
        .si-chart-bars {
          display: flex; flex-direction: column; gap: 12px;
        }
        .si-chart-row {
          display: grid; grid-template-columns: 40px 1fr 60px;
          align-items: center; gap: 12px;
        }
        .si-chart-label {
          font-size: 10px; font-weight: 700; color: #888;
        }
        .si-chart-bar-bg {
          height: 6px; background: #E8E6E1; border-radius: 3px;
          overflow: hidden;
        }
        .si-chart-bar-fill {
          height: 100%; border-radius: 3px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .si-chart-value {
          font-size: 10px; font-weight: 700; color: #0A0A0A; text-align: right;
        }
        .si-chart-total {
          margin-top: 12px; font-size: 9px; color: #999; text-align: center;
        }

        .si-paper-logo {
  width: 48px; height: 48px;
  background: #0A0A0A; color: white;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 18px; font-weight: 700;
  letter-spacing: -0.5px;
  flex-shrink: 0;
}
.si-paper-logo-img {
  width: 48px; height: 48px;
  border-radius: 10px;
  object-fit: contain;
  border: 1px solid #E8E6E1;
  background: white;
  flex-shrink: 0;
}
.si-paper-brand {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 24px;
}
.si-paper-name {
  font-family: 'Playfair Display', serif;
  font-size: 15px; font-weight: 600;
  color: #0A0A0A; letter-spacing: -0.3px;
}
.si-paper-address {
  font-size: 11px; font-weight: 600;
  color: #BFBBBB; letter-spacing: 0.04em;
  margin-top: 3px;
}

        @media (max-width: 640px) {
          .si-title { font-size: 28px; }
          .si-pill { display: none; }
        }

      `}</style>

      <div className="si-root">
        <button onClick={() => navigate('/dashboard')} className="si-back">
          <ArrowLeft size={14} />
          Back to Ledger
        </button>

        <header className="si-header">
          <div>
            <p className="si-eyebrow">Treasury · Disbursement</p>
            <h1 className="si-title">
              New <em>Request</em>
            </h1>
          </div>
          <div className="si-pill">
            <FileText size={13} />
            <span className="si-pill-text">Direct Entry</span>
          </div>
        </header>

        <div className="si-grid">
          <div>
            <form onSubmit={handleSubmit} className="si-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label className="si-label">Amount (NGN)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="si-input"
                  />
                </div>
                <div>
                  <label className="si-label">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="si-select"
                  >
                    <option value="">Select Dept</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <label className="si-label">Recipient Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="10-digit account number"
                required
                className="si-input"
                style={{ marginBottom: '20px' }}
              />


              <label className="si-label"> Benefiaciary Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="Enter Your Bank Name"
                required
                className="si-input"
                style={{ marginBottom: '20px' }}
              />


              <label className="si-label">Payment Purpose</label>
              <textarea
                ref={taRef}
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                placeholder="Detailed description of the disbursement request..."
                rows={4}
                className="si-textarea"
              />

              <div className="si-divider" />

              <div className="si-actions-row">
                <button
                  type="submit"
                  disabled={isLoading || !allFilled}
                  className="si-submit"
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      Submit & Route
                      <ArrowRight size={15} className="arr" />
                    </>
                  )}
                </button>
              </div>

              {error && <div className="si-error">{error}</div>}
            </form>

            <div className="si-note">
              Note: This form has replaced the legacy AI extraction tool. Please ensure
              all fields are filled accurately to avoid payment delays.
            </div>
          </div>

          <aside>
            <div className="si-preview">
              <div className="si-paper-brand">
                {user?.company_logo ? (
                  <img
                    src={user.company_logo}
                    alt={user.company_name}
                    className="si-paper-logo-img"
                  />
                ) : (
                  <div className="si-paper-logo">{companyInitials}</div>
                )}
                <div className="si-paper-company">
                  <div className="si-paper-name">{user?.company_name || 'Workspace'}</div>
                  <div className="si-paper-address">
                    {user?.company_address || 'HQ • Lagos, Nigeria'}
                  </div>
                </div>
              </div>

              <div className="si-paper-header">
                <span className="si-paper-title">Payment Voucher</span>
                <div className="si-preview-label" style={{ marginBottom: 0 }}>
                  REF: {Math.random().toString(36).substring(2, 7).toUpperCase()}
                </div>
              </div>

              <PreviewItem
                label="Originating Department"
                value={formData.department}
                isBadge
              />

              <PreviewItem
                label="Payment Amount"
                value={formData.amount ? formatNaira(Number(formData.amount)) : null}
              />

              <PreviewItem
                label="Account Number"
                value={formData.accountNumber}
              />

              <PreviewItem
                label="Beneficiary Bank Name"
                value={formData.bankName}
              />

              <PreviewItem
                label="Purpose of Disbursement"
                value={formData.purpose}
              />

              <div style={{ marginTop: 'auto' }}>
                <div className={`si-preview-foot${allFilled ? ' ready' : ''}`}>
                  <span className="si-preview-foot-dot" />
                  {allFilled ? 'Validated' : 'Awaiting Input'}
                </div>
              </div>
            </div>

            <div className="si-chart-container">
              <div className="si-chart-header">
                <span className="si-chart-title">MTD Cash Outflow</span>
              </div>
              <div className="si-chart-bars">
                {MOCK_OUTFLOW_DATA.map((item) => (
                  <div key={item.dept} className="si-chart-row">
                    <span className="si-chart-label">{item.dept}</span>
                    <div className="si-chart-bar-bg">
                      <div
                        className="si-chart-bar-fill"
                        style={{ width: `${(item.amount / 5000000) * 100}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <span className="si-chart-value">{(item.amount / 1000000).toFixed(1)}M</span>
                  </div>
                ))}
              </div>
              <div className="si-chart-total">Total Month-to-Date: ₦9.4M</div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

const PreviewItem = ({
  label,
  value,
  isBadge,
}: {
  label: string;
  value: string | null;
  isBadge?: boolean;
}) => (
  <div className="si-preview-item">
    <div className="si-preview-label">{label}</div>
    {value ? (
      isBadge ? (
        <span className="si-preview-badge">{value}</span>
      ) : (
        <div className="si-preview-value">{value}</div>
      )
    ) : (
      <div className="si-preview-skel" />
    )}
  </div>
);
