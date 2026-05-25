import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { billApi, vendorApi } from '../api/ap_ar';
import type { Bill, Vendor } from '../types';
import { Plus, Search, Check, X, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatNaira, formatDate, shortId } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { usePageTitle } from '../hooks/usePageTitle';

export const Bills = () => {
  usePageTitle('Bills to Pay');
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [aging, setAging] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Submit Bill Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [billForm, setBillForm] = useState({
    vendor_id: '',
    amount: '',
    purpose: '',
    department: '',
    due_date: '',
  });

  // Action states (Approve / Reject / Pay)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payReference, setPayReference] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Instant Payout simulated states
  const [payMethod, setPayMethod] = useState<'instant' | 'manual'>('instant');
  const [instantProcessing, setInstantProcessing] = useState(false);
  const [instantStep, setInstantStep] = useState('');

  const DEPARTMENTS = ['Marketing', 'Tech', 'Sales', 'Finance', 'Operations', 'HR'];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const billsData = await billApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setBills(billsData);

      const vendorsData = await vendorApi.getAll();
      setVendors(vendorsData);

      if (user?.role === 'ceo' || user?.role === 'account_officer') {
        const agingData = await billApi.getAging();
        setAging(agingData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenSubmit = () => {
    setBillForm({
      vendor_id: '',
      amount: '',
      purpose: '',
      department: user?.department || '',
      due_date: '',
    });
    setSubmitError(null);
    setShowSubmitModal(true);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await billApi.create({
        vendor_id: billForm.vendor_id,
        amount: Number(billForm.amount),
        purpose: billForm.purpose,
        department: billForm.department,
        due_date: billForm.due_date || undefined,
      });
      setShowSubmitModal(false);
      fetchData();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.detail || 'Failed to submit bill claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (billId: string) => {
    if (!confirm('Approve this bill for the next step?')) return;
    setActionLoading(true);
    try {
      await billApi.approve(billId);
      setSelectedBill(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Approve action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (bill: Bill) => {
    setSelectedBill(bill);
    setActionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    setActionLoading(true);
    try {
      await billApi.reject(selectedBill.id, actionReason);
      setShowRejectModal(false);
      setSelectedBill(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Rejection action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPay = (bill: Bill) => {
    setSelectedBill(bill);
    setPayReference('');
    setPayMethod('instant');
    setInstantProcessing(false);
    setShowPayModal(true);
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    setActionLoading(true);
    try {
      await billApi.markPaid(selectedBill.id, payReference);
      setShowPayModal(false);
      setSelectedBill(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Payment marking failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInstantPayout = async () => {
    if (!selectedBill) return;
    setInstantProcessing(true);
    const steps = [
      'Querying secure payment node...',
      'Verifying account digits at settlement bank...',
      'Securing liquidity allocations...',
      'Initiating instant money routing...',
      'Disbursement confirmed by Central Node.',
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setInstantStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const secureRef = `PAY-SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    try {
      await billApi.markPaid(selectedBill.id, secureRef);
      setShowPayModal(false);
      setSelectedBill(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Instant transfer failed.');
    } finally {
      setInstantProcessing(false);
    }
  };

  const filteredBills = bills.filter(b => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      b.id.toLowerCase().includes(q) ||
      b.purpose.toLowerCase().includes(q) ||
      (b.vendor_name && b.vendor_name.toLowerCase().includes(q)) ||
      b.department.toLowerCase().includes(q)
    );
  });

  const selectedVendorDetails = vendors.find(v => v.id === selectedBill?.vendor_id);

  return (
    <Layout>
      <style>{`
        .bl-root { font-family: 'Nunito Sans', sans-serif; }
        
        .bl-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px;
          flex-wrap: wrap;
        }
        .bl-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 8px;
        }
        .bl-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 500;
          color: #0A0A0A;
          line-height: 1;
          letter-spacing: -1px;
        }
        .bl-title em {
          font-style: italic;
          font-weight: 400;
          color: #888;
        }
        .bl-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .search-wrap {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 15px;
          height: 15px;
          color: #BFBBBB;
          pointer-events: none;
        }
        .search-input {
          height: 42px;
          width: 220px;
          background: white;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          padding: 0 16px 0 40px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #0A0A0A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .search-input::placeholder { color: #C4C0B8; }
        .search-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }
        
        .new-btn {
          height: 42px;
          padding: 0 20px;
          background: #0A0A0A;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .new-btn:hover { background: #222; }
        .new-btn:active { transform: scale(0.98); }
        .new-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Aging Cards Grid */
        .aging-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        @media (max-width: 900px) {
          .aging-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 540px) {
          .aging-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .aging-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 16px 20px;
        }
        .aging-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #BFBBBB; margin-bottom: 8px;
        }
        .aging-value {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 500; color: #0A0A0A;
          letter-spacing: -0.5px;
        }
        .aging-count {
          font-size: 11px; color: #888; margin-top: 4px;
        }

        .table-panel {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          overflow: hidden;
        }
        .table-toolbar {
          padding: 16px 24px;
          border-bottom: 1px solid #F0EDE8;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .filter-tabs {
          display: flex; gap: 4px;
        }
        .filter-tab {
          padding: 6px 14px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: #BFBBBB;
          transition: all 0.15s;
        }
        .filter-tab:hover { color: #0A0A0A; background: #F7F6F3; }
        .filter-tab.active { background: #0A0A0A; color: white; }

        .bl-table { width: 100%; border-collapse: collapse; }
        .bl-table thead tr { border-bottom: 1px solid #F0EDE8; }
        .bl-table th {
          padding: 12px 16px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #BFBBBB; text-align: left;
        }
        .bl-table th.right { text-align: right; }
        .bl-table tbody tr {
          border-bottom: 1px solid #F7F6F3;
          cursor: pointer;
          transition: background 0.12s;
        }
        .bl-table tbody tr:hover { background: #FAFAF8; }
        .bl-table td {
          padding: 14px 16px;
          font-size: 14px; color: #0A0A0A;
          vertical-align: middle;
        }
        .td-id { font-family: 'Courier New', monospace; font-size: 12px; color: #BFBBBB; font-weight: 600; }
        .td-purpose { font-weight: 600; }
        .td-amount { font-family: 'Playfair Display', serif; font-weight: 500; font-size: 15px; text-align: right; }
        
        .split-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .split-layout { grid-template-columns: 1fr; }
        }

        .side-pane {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 24px;
          position: sticky; top: 88px;
        }
        .side-pane-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 500; color: #0A0A0A;
          margin-bottom: 18px; border-bottom: 1.5px solid #0A0A0A;
          padding-bottom: 12px;
        }
        .detail-row {
          margin-bottom: 16px;
        }
        .detail-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #BFBBBB; margin-bottom: 4px;
        }
        .detail-value {
          font-size: 14px; font-weight: 600; color: #0A0A0A;
        }
        .detail-value.amount {
          font-family: 'Playfair Display', serif; font-size: 18px;
        }

        .actions-card {
          margin-top: 24px; padding-top: 18px;
          border-top: 1px solid #F0EDE8;
          display: flex; flex-direction: column; gap: 10px;
        }
        .action-btn-main {
          height: 40px; border-radius: 8px; border: none;
          font-family: inherit; font-size: 13px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s, transform 0.1s;
        }
        .action-btn-main.primary { background: #0A0A0A; color: white; }
        .action-btn-main.primary:hover { background: #222; }
        .action-btn-main.danger { background: #FEF2F2; color: #991B1B; border: 1.5px solid #F8C9C9; }
        .action-btn-main.danger:hover { background: #FEE2E2; }
        
        /* Orbiting search icon */
        .spinning-search-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #FAFAF8;
          border: 1.5px dashed #E8E6E1;
          margin: 0 auto 20px;
          position: relative;
        }
        .spinning-search-icon {
          color: #0A0A0A;
          animation: spin-around-orbit 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes spin-around-orbit {
          0% { transform: rotate(0deg) translateX(12px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(12px) rotate(-360deg); }
        }

        .empty-state {
          padding: 60px 24px;
          text-align: center;
        }
        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #0A0A0A;
          margin-bottom: 6px;
        }
        .empty-sub { font-size: 13px; color: #BFBBBB; }

        /* Modal Dialogs */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.15); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal-card {
          background: white; border: 1px solid #E8E6E1; border-radius: 16px;
          width: 100%; max-width: 480px; box-shadow: 0 24px 64px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .modal-header {
          padding: 20px 24px; border-bottom: 1px solid #F0EDE8;
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 500; }
        .close-btn { background: none; border: none; cursor: pointer; color: #BFBBBB; }
        .modal-body { padding: 24px; }
        .modal-footer {
          padding: 16px 24px; background: #FAFAF8; border-top: 1px solid #F0EDE8;
          display: flex; justify-content: flex-end; gap: 12px;
        }
        
        .form-group { margin-bottom: 16px; }
        .form-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #999; margin-bottom: 6px; display: block; }
        .form-input, .form-select, .form-textarea {
          width: 100%; background: #FAFAF8; border: 1.5px solid #E8E6E1; border-radius: 8px;
          padding: 10px 14px; font-family: inherit; font-size: 14px; color: #0A0A0A; outline: none;
          box-sizing: border-box;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #0A0A0A; background: white; }
        
        .btn-cancel { height: 40px; padding: 0 16px; background: white; border: 1.5px solid #E8E6E1; border-radius: 8px; font-weight: 700; color: #555; cursor: pointer; }
        .btn-save { height: 40px; padding: 0 20px; background: #0A0A0A; border: none; border-radius: 8px; font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .error-alert { background: #FEF2F2; border: 1.5px solid #F8C9C9; border-radius: 8px; padding: 12px; color: #991B1B; font-size: 12px; font-weight: 600; margin-bottom: 16px; }

        /* Mode Selection in Payout Dialog */
        .payout-tabs {
          display: grid; grid-template-columns: 1fr 1fr;
          background: #F7F6F3; padding: 4px; border-radius: 8px;
          margin-bottom: 20px; border: 1px solid #E8E6E1;
        }
        .payout-tab-btn {
          border: none; padding: 8px; font-family: inherit; font-size: 12px; font-weight: 700;
          border-radius: 6px; cursor: pointer; color: #BFBBBB; background: transparent;
          transition: all 0.15s;
        }
        .payout-tab-btn.active {
          background: white; color: #0A0A0A; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .vendor-bank-card {
          background: #FAFAF8; border: 1.5px dashed #E8E6E1; border-radius: 10px;
          padding: 16px; margin-bottom: 20px;
        }
        .vendor-bank-title {
          font-size: 10px; font-weight: 800; text-transform: uppercase; color: #BFBBBB;
          margin-bottom: 12px; letter-spacing: 0.1em;
        }
        .vendor-bank-row {
          display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;
        }
        .vendor-bank-row:last-child { margin-bottom: 0; }
        .vendor-bank-label { color: #888; }
        .vendor-bank-val { font-weight: 700; color: #0A0A0A; }
      `}</style>

      <div className="bl-root">
        {/* Header */}
        <header className="bl-header">
          <div>
            <p className="bl-eyebrow">Accounts Payable · Operations</p>
            <h1 className="bl-title">
              Bills <em>Ledger</em>
            </h1>
          </div>
          <div className="bl-header-actions">
            <div className="search-wrap">
              <Search className="search-icon" />
              <input
                className="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bills..."
              />
            </div>
            <button 
              className="new-btn" 
              onClick={handleOpenSubmit}
              disabled={user?.role !== 'staff' && user?.role !== 'hod'}
            >
              <Plus size={15} />
              Submit Bill Claim
            </button>
          </div>
        </header>

        {/* Aging Panel (for CEOs / Account Officers) */}
        {aging && (
          <section className="aging-grid">
            <div className="aging-card">
              <p className="aging-label">Current</p>
              <p className="aging-value">{formatNaira(aging.current?.total || 0)}</p>
              <p className="aging-count">{aging.current?.count || 0} bills</p>
            </div>
            <div className="aging-card">
              <p className="aging-label">1 - 30 Days</p>
              <p className="aging-value">{formatNaira(aging.overdue_1_30?.total || 0)}</p>
              <p className="aging-count">{aging.overdue_1_30?.count || 0} bills</p>
            </div>
            <div className="aging-card">
              <p className="aging-label">31 - 60 Days</p>
              <p className="aging-value">{formatNaira(aging.overdue_31_60?.total || 0)}</p>
              <p className="aging-count">{aging.overdue_31_60?.count || 0} bills</p>
            </div>
            <div className="aging-card">
              <p className="aging-label">61 - 90 Days</p>
              <p className="aging-value">{formatNaira(aging.overdue_61_90?.total || 0)}</p>
              <p className="aging-count">{aging.overdue_61_90?.count || 0} bills</p>
            </div>
            <div className="aging-card" style={{ borderLeft: '3px solid #D73A49' }}>
              <p className="aging-label" style={{ color: '#D73A49' }}>90+ Overdue</p>
              <p className="aging-value" style={{ color: '#D73A49' }}>{formatNaira(aging.overdue_90_plus?.total || 0)}</p>
              <p className="aging-count">{aging.overdue_90_plus?.count || 0} bills</p>
            </div>
          </section>
        )}

        <div className="split-layout">
          {/* Main Table */}
          <div className="table-panel">
            <div className="table-toolbar">
              <div className="filter-tabs">
                {['all', 'pending_hod', 'pending_ceo', 'ready_for_payment', 'paid', 'rejected'].map((status) => (
                  <button
                    key={status}
                    className={`filter-tab${statusFilter === status ? ' active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'All' : status === 'pending_hod' ? 'HOD' : status === 'pending_ceo' ? 'CEO' : status === 'ready_for_payment' ? 'Ready' : status === 'paid' ? 'Paid' : 'Rejected'}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#BFBBBB', textTransform: 'uppercase' }}>
                {filteredBills.length} Claims
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#BFBBBB' }}>
                <div className="spinning-search-wrapper">
                  <Search size={22} className="spinning-search-icon" />
                </div>
                Loading ledger bills...
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="empty-state">
                <div className="spinning-search-wrapper">
                  <Search size={22} className="spinning-search-icon" />
                </div>
                <p className="empty-title">No entries found</p>
                <p className="empty-sub">Adjust your filters or submit a new bill claim.</p>
              </div>
            ) : (
              <table className="bl-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Vendor</th>
                    <th>Purpose / Description</th>
                    <th>Department</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => (
                    <tr key={b.id} onClick={() => setSelectedBill(b)}>
                      <td className="td-id">{shortId(b.id)}</td>
                      <td style={{ fontWeight: 600 }}>{b.vendor_name || 'Generic Vendor'}</td>
                      <td className="td-purpose">{b.purpose}</td>
                      <td>{b.department}</td>
                      <td>{b.due_date ? formatDate(b.due_date) : 'Immediate'}</td>
                      <td><StatusBadge status={b.status as any} /></td>
                      <td className="td-amount">{formatNaira(b.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Details Pane */}
          <aside className="side-pane">
            <h2 className="side-pane-title">Bill Specifications</h2>
            {selectedBill ? (
              <>
                <div className="detail-row">
                  <p className="detail-label">Ref ID</p>
                  <p className="detail-value">{selectedBill.id}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Vendor</p>
                  <p className="detail-value">{selectedBill.vendor_name || 'Generic Vendor'}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Disbursement Purpose</p>
                  <p className="detail-value" style={{ fontWeight: 400 }}>{selectedBill.purpose}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="detail-row">
                    <p className="detail-label">Department</p>
                    <p className="detail-value">{selectedBill.department}</p>
                  </div>
                  <div className="detail-row">
                    <p className="detail-label">Due Date</p>
                    <p className="detail-value">{selectedBill.due_date ? formatDate(selectedBill.due_date) : 'Immediate'}</p>
                  </div>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Financial Status</p>
                  <StatusBadge status={selectedBill.status as any} />
                </div>
                <div className="detail-row">
                  <p className="detail-label">Payment Amount</p>
                  <p className="detail-value amount">{formatNaira(selectedBill.amount)}</p>
                </div>
                
                {selectedBill.rejection_reason && (
                  <div className="detail-row" style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, border: '1px solid #F8C9C9' }}>
                    <p className="detail-label" style={{ color: '#991B1B' }}>Void Reason</p>
                    <p className="detail-value" style={{ color: '#991B1B', fontWeight: 400 }}>{selectedBill.rejection_reason}</p>
                  </div>
                )}
                {selectedBill.payment_reference && (
                  <div className="detail-row" style={{ background: '#ecf7f1', padding: 12, borderRadius: 8, border: '1px solid #c2e7d3' }}>
                    <p className="detail-label" style={{ color: '#10a65a' }}>Payment Reference</p>
                    <p className="detail-value" style={{ color: '#10a65a', fontWeight: 600 }}>{selectedBill.payment_reference}</p>
                  </div>
                )}

                {/* Workflow Actions */}
                <div className="actions-card">
                  {/* HOD Review Step */}
                  {selectedBill.status === 'pending_hod' && user?.role === 'hod' && user?.department?.toLowerCase() === selectedBill.department?.toLowerCase() && (
                    <>
                      <button className="action-btn-main primary" onClick={() => handleApprove(selectedBill.id)}>
                        <Check size={14} /> Approve as HOD
                      </button>
                      <button className="action-btn-main danger" onClick={() => handleOpenReject(selectedBill)}>
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}

                  {/* CEO Review Step */}
                  {selectedBill.status === 'pending_ceo' && user?.role === 'ceo' && (
                    <>
                      <button className="action-btn-main primary" onClick={() => handleApprove(selectedBill.id)}>
                        <Check size={14} /> Approve as CEO
                      </button>
                      <button className="action-btn-main danger" onClick={() => handleOpenReject(selectedBill)}>
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}

                  {/* Account Officer Pay Step */}
                  {selectedBill.status === 'ready_for_payment' && user?.role === 'account_officer' && (
                    <button className="action-btn-main primary" onClick={() => handleOpenPay(selectedBill)}>
                      <CreditCard size={14} /> Disburse Funds
                    </button>
                  )}

                  {/* Awaiting next review label */}
                  {selectedBill.status === 'pending_hod' && user?.role !== 'hod' && (
                    <p style={{ fontStyle: 'italic', fontSize: 12, color: '#888', textAlign: 'center' }}>
                      Awaiting Department Head (HOD) approval...
                    </p>
                  )}
                  {selectedBill.status === 'pending_ceo' && user?.role !== 'ceo' && (
                    <p style={{ fontStyle: 'italic', fontSize: 12, color: '#888', textAlign: 'center' }}>
                      Awaiting Executive CEO approval...
                    </p>
                  )}
                  {selectedBill.status === 'ready_for_payment' && user?.role !== 'account_officer' && (
                    <p style={{ fontStyle: 'italic', fontSize: 12, color: '#888', textAlign: 'center' }}>
                      Approved. Awaiting Account Officer disbursement...
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#BFBBBB', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                Select a bill from the ledger table to inspect specs and process actions.
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Submit Bill Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <form onSubmit={handleCreateBill} className="modal-card">
            <div className="modal-header">
              <span className="modal-title">Submit Accounts Payable Bill</span>
              <button type="button" className="close-btn" onClick={() => setShowSubmitModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {submitError && <div className="error-alert">{submitError}</div>}
              
              <div className="form-group">
                <label className="form-label">Vendor Company *</label>
                <select
                  className="form-select"
                  required
                  value={billForm.vendor_id}
                  onChange={(e) => setBillForm({ ...billForm, vendor_id: e.target.value })}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Amount (NGN) *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Department *</label>
                  <select
                    className="form-select"
                    required
                    value={billForm.department}
                    onChange={(e) => setBillForm({ ...billForm, department: e.target.value })}
                  >
                    <option value="">Select Dept</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={billForm.due_date}
                  onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purpose of Settlement *</label>
                <textarea
                  className="form-textarea"
                  required
                  rows={3}
                  value={billForm.purpose}
                  onChange={(e) => setBillForm({ ...billForm, purpose: e.target.value })}
                  placeholder="Detailed breakdown of goods or services received..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowSubmitModal(false)}>Cancel</button>
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={14} /> : null}
                Route Bill Claim
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pay Modal with Payout Choice */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title">Disburse Payment</span>
              <button type="button" className="close-btn" onClick={() => setShowPayModal(false)}><X size={18} /></button>
            </div>
            
            <div className="modal-body">
              {instantProcessing ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: '#0A0A0A', margin: '0 auto 16px' }} />
                  <p style={{ fontWeight: 700, color: '#0A0A0A', fontSize: 15 }}>{instantStep}</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Simulation actively routing payout...</p>
                </div>
              ) : (
                <>
                  {/* Tab Selector */}
                  <div className="payout-tabs">
                    <button 
                      className={`payout-tab-btn${payMethod === 'instant' ? ' active' : ''}`}
                      onClick={() => setPayMethod('instant')}
                    >
                      <Sparkles size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Instant Payout
                    </button>
                    <button 
                      className={`payout-tab-btn${payMethod === 'manual' ? ' active' : ''}`}
                      onClick={() => setPayMethod('manual')}
                    >
                      Manual Reconciliation
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Amount</label>
                    <input
                      type="text"
                      className="form-input"
                      disabled
                      value={selectedBill ? formatNaira(selectedBill.amount) : ''}
                    />
                  </div>

                  {payMethod === 'instant' ? (
                    <>
                      <div className="vendor-bank-card">
                        <p className="vendor-bank-title">Settlement Destination</p>
                        <div className="vendor-bank-row">
                          <span className="vendor-bank-label">Beneficiary</span>
                          <span className="vendor-bank-val">{selectedBill?.vendor_name || 'Generic Vendor'}</span>
                        </div>
                        <div className="vendor-bank-row">
                          <span className="vendor-bank-label">Settlement Bank</span>
                          <span className="vendor-bank-val">{selectedVendorDetails?.bank_name || 'Zenith Bank Plc'}</span>
                        </div>
                        <div className="vendor-bank-row">
                          <span className="vendor-bank-label">Account Name</span>
                          <span className="vendor-bank-val">{selectedVendorDetails?.account_name || 'Corporate Settlement Account'}</span>
                        </div>
                        <div className="vendor-bank-row">
                          <span className="vendor-bank-label">Account Number</span>
                          <span className="vendor-bank-val" style={{ fontFamily: 'Courier New', fontWeight: 700 }}>
                            {selectedVendorDetails?.account_number || '1018264919'}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        type="button" 
                        className="btn-save" 
                        style={{ width: '100%', height: 44, justifyContent: 'center' }}
                        onClick={handleInstantPayout}
                      >
                        <Sparkles size={14} />
                        Execute Instant payout
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleMarkPaid}>
                      <div className="form-group">
                        <label className="form-label">Payment Bank Reference *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={payReference}
                          onChange={(e) => setPayReference(e.target.value)}
                          placeholder="e.g. TXN-10826482 or Bank transfer description"
                        />
                      </div>
                      <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
                        <button type="button" className="btn-cancel" onClick={() => setShowPayModal(false)}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={actionLoading}>
                          {actionLoading ? <Loader2 className="animate-spin" size={14} /> : null}
                          Mark as Settled
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <form onSubmit={handleReject} className="modal-card">
            <div className="modal-header">
              <span className="modal-title">Reject Bill Claim</span>
              <button type="button" className="close-btn" onClick={() => setShowRejectModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason for Rejection *</label>
                <textarea
                  className="form-textarea"
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Explain why this disbursement claim is rejected..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button type="submit" className="btn-save" style={{ background: '#D73A49' }} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="animate-spin" size={14} /> : null}
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};
