import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceApi } from '../api/invoices';
import type { Invoice } from '../types';
import type { InvoiceStatus } from '@/shared/invoice-status';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { formatNairaSplit, formatDateTime, formatDate, shortId } from '../lib/format';
import { ArrowLeft, Building, Calendar, CheckCircle2, Hash, Loader2, Lock, ShieldCheck, User } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

type Stage = {
  id: string;
  actor: string;
  role: 'Staff' | 'HOD' | 'CEO' | 'Account';
  action: string;
  status: 'done' | 'active' | 'pending' | 'rejected';
  timestamp?: string;
};

const buildTimeline = (inv: Invoice): Stage[] => {
  const filed = inv.created_at;
  const isRejected = inv.status === 'rejected';
  const stages: Stage[] = [
    { id: 'staff', actor: inv.creator_name || 'Staff Member', role: 'Staff', action: 'Initial Filing', status: 'done', timestamp: filed },
    {
      id: 'hod',
      actor: inv.hod_name || 'Department Head',
      role: 'HOD',
      action: 'Departmental Review',
      status:
        inv.status === 'pending_hod'
          ? isRejected ? 'rejected' : 'active'
          : 'done',
    },
    {
      id: 'ceo',
      actor: inv.ceo_name || 'Executive Office',
      role: 'CEO',
      action: 'Executive Approval',
      status:
        inv.status === 'pending_ceo'
          ? 'active'
          : inv.status === 'pending_hod' || isRejected
            ? 'pending'
            : 'done',
    },
    {
      id: 'account',
      actor: 'Treasury Office',
      role: 'Account',
      action: 'Final Disbursement',
      status:
        inv.status === 'paid'
          ? 'done'
          : inv.status === 'ready_for_payment'
            ? 'active'
            : 'pending',
    },
  ];

  if (isRejected) {
    return stages.map((s) =>
      s.status === 'active' ? { ...s, status: 'rejected' } : s
    );
  }
  return stages;
};

export const InvoiceDetail = () => {
  usePageTitle('Invoice Detail');
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'auth' | 'processing' | 'success'>('idle');
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await invoiceApi.getById(id);
        if (!cancelled) setInvoice(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleApprove = async () => {
    if (!invoice || !user) return;
    setIsSubmitting(true);
    try {
      await invoiceApi.approve(invoice.id, user.id);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!invoice || !user) return;
    setIsSubmitting(true);
    try {
      await invoiceApi.reject(invoice.id, user.id, rejectionReason);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice || !user) return;
    setPaymentStep('auth');
    setPin('');
  };

  const confirmPayment = async () => {
    if (!invoice || !user) return;
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Security verification lag
    setPaymentStep('processing');

    try {
      await new Promise(resolve => setTimeout(resolve, 2200));

      const fakeRef = `PX_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await invoiceApi.markPaid(invoice.id, user.id, fakeRef);

      setPaymentStep('success');
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed');
      setPaymentStep('idle');
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{
          padding: '120px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          color: '#BFBBBB',
          fontFamily: "'Nunito Sans', sans-serif",
        }}>
          <Loader2 size={28} className="animate-spin" />
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Loading folio…
          </span>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <style>{`
          .id-empty {
            text-align: center; padding: 120px 24px;
            font-family: 'Nunito Sans', sans-serif;
          }
          .id-empty-code {
            font-family: 'Playfair Display', serif;
            font-size: 96px; font-weight: 500;
            color: #E8E6E1; letter-spacing: -4px;
            line-height: 1; margin-bottom: 16px;
          }
          .id-empty-title {
            font-family: 'Playfair Display', serif;
            font-size: 24px; font-weight: 500;
            color: #0A0A0A; margin-bottom: 8px;
          }
          .id-empty-sub {
            font-size: 13px; color: #888;
            margin-bottom: 28px;
          }
          .id-empty-btn {
            height: 44px; padding: 0 22px;
            background: #0A0A0A; color: white;
            border: none; border-radius: 8px;
            font-family: 'Nunito Sans', sans-serif;
            font-size: 13px; font-weight: 700;
            cursor: pointer; transition: background 0.15s;
          }
          .id-empty-btn:hover { background: #222; }
        `}</style>
        <div className="id-empty">
          <div className="id-empty-code">404</div>
          <div className="id-empty-title">Folio not found</div>
          <div className="id-empty-sub">No active record matched this reference.</div>
          <button className="id-empty-btn" onClick={() => navigate('/dashboard')}>
            Return to Ledger
          </button>
        </div>
      </Layout>
    );
  }

  const canApprove =
    (invoice.status === 'pending_hod' && user?.role === 'hod') ||
    (invoice.status === 'pending_ceo' && user?.role === 'ceo');
  const canReject =
    (invoice.status === 'pending_hod' || invoice.status === 'pending_ceo') &&
    (user?.role === 'hod' || user?.role === 'ceo');
  const canMarkPaid =
    invoice.status === 'ready_for_payment' && user?.role === 'account_officer';
  const showActions = canApprove || canReject || canMarkPaid;

  const split = formatNairaSplit(invoice?.amount ?? 0);
  const timeline = buildTimeline(invoice);

  return (
    <Layout>
      <style>{`
        .id-root { font-family: 'Nunito Sans', sans-serif; max-width: 1200px; margin: 0 auto; }

        .id-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          color: #888; background: none; border: none; cursor: pointer;
          padding: 0; margin-bottom: 18px; font-family: inherit;
          transition: color 0.15s;
        }
        .id-back:hover { color: #0A0A0A; }

        .id-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 40px; padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px; flex-wrap: wrap;
        }
        .id-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #999; margin-bottom: 8px;
        }
        .id-title-row {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 8px; flex-wrap: wrap;
        }
        .id-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 500;
          color: #0A0A0A; line-height: 1; letter-spacing: -1px;
        }
        .id-title em { font-style: italic; font-weight: 400; color: #888; }
        .id-purpose-line {
          font-size: 14px; font-weight: 500; color: #555;
          max-width: 540px;
        }
        .id-header-meta { text-align: right; }
        .id-meta-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #BFBBBB; margin-bottom: 4px;
        }
        .id-meta-value {
          font-size: 13px; font-weight: 700;
          color: #0A0A0A;
        }

        .id-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .id-grid { grid-template-columns: 1fr; }
        }

        .id-stack { display: flex; flex-direction: column; gap: 24px; }

        .id-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          overflow: hidden;
        }
        .id-card-pad { padding: 28px; }

        /* Amount card (primary surface) */
        .id-amount-card {
          background: #0A0A0A;
          color: white;
          border: 1px solid #0A0A0A;
          border-radius: 12px;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }
        .id-amount-card::after {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 220px; height: 220px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: none;
        }
        .id-amount-card::before {
          content: '';
          position: absolute;
          top: -20px; right: -20px;
          width: 140px; height: 140px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .id-amount-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 18px;
        }
        .id-amount-row {
          display: flex; align-items: baseline; gap: 4px;
        }
        .id-amount-currency {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 500;
          color: rgba(255,255,255,0.5);
        }
        .id-amount-whole {
          font-family: 'Playfair Display', serif;
          font-size: 64px; font-weight: 500;
          color: white; letter-spacing: -2.5px; line-height: 1;
        }
        .id-amount-decimal {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 400;
          color: rgba(255,255,255,0.4);
          letter-spacing: -0.5px;
        }

        /* Detail grid */
        .id-detail-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 720px) {
          .id-detail-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .id-detail-cell {
          padding: 22px 24px;
          border-right: 1px solid #F0EDE8;
        }
        .id-detail-cell:last-child { border-right: none; }
        @media (max-width: 720px) {
          .id-detail-cell:nth-child(2n) { border-right: none; }
          .id-detail-cell:nth-child(-n+2) { border-bottom: 1px solid #F0EDE8; }
        }
        .id-detail-head {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 8px;
        }
        .id-detail-icon {
          width: 14px; height: 14px;
          color: #BFBBBB;
        }
        .id-detail-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #BFBBBB;
        }
        .id-detail-value {
          font-size: 14px; font-weight: 700;
          color: #0A0A0A;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .id-detail-value.mono {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.04em;
        }

        /* Narrative */
        .id-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #BFBBBB;
          margin-bottom: 18px;
        }
        .id-narrative {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 400;
          line-height: 1.5; color: #0A0A0A;
          letter-spacing: -0.3px;
        }
        .id-narrative em { font-style: italic; color: #555; }

        .id-rejection {
          margin-top: 24px;
          padding: 16px 18px;
          background: #FEF2F2;
          border: 1px solid #F8C9C9;
          border-radius: 10px;
        }
        .id-rejection-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #991B1B;
          margin-bottom: 6px;
        }
        .id-rejection-text {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 14px; color: #B91C1C;
          line-height: 1.5;
        }

        /* Action panel */
        .id-action-card {
          background: #0A0A0A;
          border-radius: 12px;
          padding: 32px;
          color: white;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .id-action-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }
        .id-status-wait {
          padding: 20px 24px;
          background: #F7F6F3;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .id-dot-active {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #0A0A0A;
          animation: id-ping-effect 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes id-ping-effect {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }

        .id-action-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; flex-wrap: wrap;
        }
        .id-action-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 500;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .id-action-sub {
          font-size: 13px; color: rgba(255,255,255,0.5);
          font-weight: 400;
        }
        .id-action-buttons { display: flex; gap: 10px; }

        .id-btn {
          height: 44px; padding: 0 22px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.02em;
          border-radius: 8px;
          cursor: pointer; border: none;
          display: flex; align-items: center; gap: 8px;
          transition: background 0.15s, transform 0.1s;
        }
        .id-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .id-btn-primary { background: white; color: #0A0A0A; }
        .id-btn-primary:hover:not(:disabled) { background: #F0EDE8; }
        .id-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .id-btn-ghost {
          background: transparent; color: white;
          border: 1.5px solid rgba(255,255,255,0.2);
        }
        .id-btn-ghost:hover:not(:disabled) {
          border-color: white; background: rgba(255,255,255,0.05);
        }

        .id-reject-form {
          width: 100%;
          display: flex; flex-direction: column; gap: 12px;
        }
        .id-reject-input {
          width: 100%; height: 44px;
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 0 16px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px; color: white;
          outline: none; box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .id-reject-input::placeholder { color: rgba(255,255,255,0.35); }
        .id-reject-input:focus { border-color: white; }
        .id-reject-actions { display: flex; gap: 10px; }

        /* Error */
        .id-error {
          padding: 14px 18px;
          background: #FEF2F2; border: 1px solid #F8C9C9;
          border-radius: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #991B1B;
          text-align: center;
        }

        /* Timeline */
        .id-timeline {
          position: relative;
          margin-bottom: 20px;
        }
        .id-timeline-line {
          position: absolute;
          left: 6px; top: 6px; bottom: 6px;
          width: 1px;
          background: #E8E6E1;
        }
        .id-stage {
          position: relative;
          padding-left: 28px;
          padding-bottom: 26px;
        }
        .id-stage:last-child { padding-bottom: 0; }
        .id-stage-dot {
          position: absolute;
          left: 0; top: 4px;
          width: 13px; height: 13px;
          border-radius: 50%;
          border: 2px solid white;
          background: #E8E6E1;
          z-index: 1;
          transition: all 0.2s;
        }
        .id-stage-dot.done { background: #10B981; }
        .id-stage-dot.active {
          background: #0A0A0A;
          box-shadow: 0 0 0 4px rgba(10,10,10,0.08);
        }
        .id-stage-dot.rejected { background: #DC2626; }
        .id-stage-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }
        .id-stage-role {
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #BFBBBB;
        }
        .id-stage-role.active { color: #0A0A0A; }
        .id-stage-time {
          font-size: 10px; font-weight: 600;
          color: #BFBBBB;
          font-variant-numeric: tabular-nums;
        }
        .id-stage-actor {
          font-size: 14px; font-weight: 700;
          color: #0A0A0A;
          margin-bottom: 2px;
        }
        .id-stage-action {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 12px; color: #888;
          font-weight: 400;
        }

        .id-audit-foot {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #F0EDE8;
          font-family: 'Courier New', monospace;
          font-size: 10px; color: #BFBBBB;
          line-height: 1.7;
          letter-spacing: 0.02em;
        }

        @media (max-width: 640px) {
          .id-title { font-size: 28px; }
          .id-amount-whole { font-size: 48px; }
          .id-narrative { font-size: 18px; }
          .id-action-row { flex-direction: column; align-items: stretch; }
          .id-action-buttons { width: 100%; }
          .id-action-buttons .id-btn { flex: 1; justify-content: center; }
          .id-header-meta { display: none; }
        }
      `}</style>

      <div className="id-root">
        {paymentStep !== 'idle' && (
          <div className="id-payment-overlay">
            <div className="id-payment-modal">
              {paymentStep === 'auth' && (
                <>
                  <div className="id-payment-loader">
                    <div style={{ background: '#F7F6F3', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={24} />
                    </div>
                  </div>
                  <h2 className="id-payment-title">Authorization Required</h2>
                  <p className="id-payment-sub">Enter your secure treasury PIN to release funds for folio {shortId(invoice.id)}.</p>

                  <div className="id-pin-grid">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type="password"
                        maxLength={1}
                        className="id-pin-box"
                        value={pin[i] || ''}
                        autoFocus={i === 0}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const newPin = pin.split('');
                          newPin[i] = val;
                          setPin(newPin.join('').slice(0, 4));
                          if (val && i < 3) {
                            (e.target.nextSibling as HTMLInputElement)?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !pin[i] && i > 0) {
                            (e.currentTarget.previousSibling as HTMLInputElement)?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>

                  <button
                    disabled={pin.length < 4 || verifying}
                    onClick={confirmPayment}
                    className="id-btn id-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Sign & Execute'}
                  </button>
                  <button
                    onClick={() => setPaymentStep('idle')}
                    className="id-btn id-btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 12, color: '#888', border: 'none' }}
                  >
                    Cancel
                  </button>
                </>
              )}

              {paymentStep === 'processing' ? (
                <>
                  <div className="id-payment-loader">
                    <Loader2 size={40} className="animate-spin" />
                  </div>
                  <h2 className="id-payment-title">Negotiating Disbursement</h2>
                  <p className="id-payment-sub">Executing smart contract via Sandbox Node...</p>
                </>
              ) : paymentStep === 'success' ? (
                <>
                  <div className="id-payment-success">
                    <CheckCircle2 size={48} color="#10B981" />
                  </div>
                  <h2 className="id-payment-title">Disbursement Complete</h2>
                  <p className="id-payment-sub">Transaction verified and logged.</p>
                </>
              ) : null}

              {paymentStep !== 'auth' && (
                <div className="id-modal-footer">
                  <ShieldCheck size={12} />
                  End-to-End Encrypted Node-281
                </div>
              )}
            </div>
          </div>
        )}

        <button onClick={() => navigate('/dashboard')} className="id-back">
          <ArrowLeft size={14} />
          Back to Ledger
        </button>

        <header className="id-header">
          <div>
            <p className="id-eyebrow">Folio · {shortId(invoice.id)}</p>
            <div className="id-title-row">
              <h1 className="id-title">
                Disbursement <em>Record</em>
              </h1>
              <StatusBadge status={invoice.status as InvoiceStatus} />
            </div>
            <p className="id-purpose-line">{invoice.purpose}</p>
          </div>
          <div className="id-header-meta">
            <div className="id-meta-label">Filed</div>
            <div className="id-meta-value">{formatDate(invoice.created_at)}</div>
          </div>
        </header>

        <div className="id-grid">
          <div className="id-stack">
            <div className="id-amount-card">
              <p className="id-amount-label">Amount Payable</p>
              <div className="id-amount-row">
                <span className="id-amount-currency">₦</span>
                <span className="id-amount-whole">{split.whole}</span>
                <span className="id-amount-decimal">.{split.decimal}</span>
              </div>
            </div>

            <div className="id-card">
              <div className="id-detail-grid">
                <DetailCell icon={<Building className="id-detail-icon" />} label="Sector" value={invoice.department} />
                <DetailCell icon={<User className="id-detail-icon" />} label="Originator" value={invoice.creator_name || (invoice.created_by || 'Unknown').split('@')[0]} />
                <DetailCell icon={<Hash className="id-detail-icon" />} label="Folio ID" value={shortId(invoice.id)} mono />
                <DetailCell icon={<Calendar className="id-detail-icon" />} label="Time" value={formatDateTime(invoice.created_at).split('  ')[1] || '—'} mono />
              </div>
            </div>

            <div className="id-card id-card-pad">
              <p className="id-section-label">Request Narrative</p>
              <p className="id-narrative">{invoice.purpose}</p>
              {invoice.rejection_reason && (
                <div className="id-rejection">
                  <div className="id-rejection-label">Prior Rejection Note</div>
                  <p className="id-rejection-text">"{invoice.rejection_reason}"</p>
                </div>
              )}
            </div>

            {!showActions && invoice.status !== 'paid' && invoice.status !== 'rejected' && (
              <div className="id-status-wait">
                <div className="id-dot-active" />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>
                  Awaiting {invoice.status === 'pending_hod' ? 'Department Head' : invoice.status === 'pending_ceo' ? 'Executive' : 'Treasury'} review.
                </div>
              </div>
            )}

            {showActions && (
              <div className="id-action-card">
                <div className="id-action-row">
                  {showRejectForm ? (
                    <div className="id-reject-form">
                      <input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Specify reason for return…"
                        className="id-reject-input"
                      />
                      <div className="id-reject-actions">
                        <button
                          onClick={handleReject}
                          disabled={isSubmitting || !rejectionReason.trim()}
                          className="id-btn id-btn-primary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Return'}
                        </button>
                        <button
                          onClick={() => setShowRejectForm(false)}
                          className="id-btn id-btn-ghost"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="id-action-title">Action Required</div>
                        <div className="id-action-sub">Verify all details before executing.</div>
                      </div>
                      <div className="id-action-buttons">
                        <button
                          onClick={canMarkPaid ? handleMarkPaid : handleApprove}
                          disabled={isSubmitting}
                          className="id-btn id-btn-primary"
                        >
                          {isSubmitting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            canMarkPaid ? 'Execute Payout' : 'Approve & Route'
                          )}
                        </button>
                        {canReject && (
                          <button
                            onClick={() => setShowRejectForm(true)}
                            className="id-btn id-btn-ghost"
                            disabled={isSubmitting}
                          >
                            Return / Reject
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {error && <div className="id-error">{error}</div>}
          </div>

          <aside className="id-card id-card-pad">
            <p className="id-section-label">Approval Chain</p>

            <div className="id-timeline">
              <div className="id-timeline-line" />
              {timeline.map((stage) => (
                <div key={stage.id} className="id-stage">
                  <div className={`id-stage-dot ${stage.status}`} />
                  <div className="id-stage-row">
                    <span className={`id-stage-role${stage.status === 'active' ? ' active' : ''}`}>
                      {stage.role}
                    </span>
                    {stage.timestamp && (
                      <span className="id-stage-time">
                        {formatDateTime(stage.timestamp).split('  ')[1] || ''}
                      </span>
                    )}
                  </div>
                  <div className="id-stage-actor">{stage.actor}</div>
                  <div className="id-stage-action">{stage.action}</div>
                </div>
              ))}
            </div>

            <div className="id-audit-foot">
              AUDIT_LOG · Verified via Secure Token Node-281.<br />
              All actions are immutable and cryptographically signed.
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

const DetailCell = ({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="id-detail-cell">
    <div className="id-detail-head">
      {icon}
      <span className="id-detail-label">{label}</span>
    </div>
    <div className={`id-detail-value${mono ? ' mono' : ''}`}>{value}</div>
  </div>
);
