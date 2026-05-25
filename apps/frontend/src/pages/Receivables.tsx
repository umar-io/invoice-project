import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { receivableApi, customerApi } from '../api/ap_ar';
import type { Receivable, Customer } from '../types';
import { Plus, Search, Send, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatNaira, formatDate, shortId } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { usePageTitle } from '../hooks/usePageTitle';

export const Receivables = () => {
  usePageTitle('Invoices to Collect');
  const { user } = useAuth();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Receivable Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receivableForm, setReceivableForm] = useState({
    customer_id: '',
    amount: '',
    description: '',
    due_date: '',
  });

  // Action states
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payReference, setPayReference] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const receivablesData = await receivableApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setReceivables(receivablesData);

      const customersData = await customerApi.getAll();
      setCustomers(customersData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setReceivableForm({
      customer_id: '',
      amount: '',
      description: '',
      due_date: '',
    });
    setSubmitError(null);
    setShowCreateModal(true);
  };

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await receivableApi.create({
        customer_id: receivableForm.customer_id,
        amount: Number(receivableForm.amount),
        description: receivableForm.description,
        due_date: receivableForm.due_date || undefined,
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.detail || 'Failed to create receivable invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (receivableId: string) => {
    if (!confirm('Mark invoice as sent and dispatch billing details to the customer?')) return;
    setActionLoading(true);
    try {
      await receivableApi.send(receivableId);
      setSelectedReceivable(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to dispatch invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPay = (rec: Receivable) => {
    setSelectedReceivable(rec);
    setPayReference('');
    setShowPayModal(true);
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable) return;
    setActionLoading(true);
    try {
      await receivableApi.markPaid(selectedReceivable.id, payReference);
      setShowPayModal(false);
      setSelectedReceivable(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to reconcile payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReceivables = receivables.filter(r => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      r.id.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q))
    );
  });

  const getOutstandingTotal = () => {
    return receivables
      .filter(r => r.status === 'sent' || r.status === 'overdue')
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const hasWriteAccess = user?.role === 'ceo' || user?.role === 'hod' || user?.role === 'account_officer';

  return (
    <Layout>
      <style>{`
        .rc-root { font-family: 'Nunito Sans', sans-serif; }
        
        .rc-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px;
          flex-wrap: wrap;
        }
        .rc-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 8px;
        }
        .rc-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 500;
          color: #0A0A0A;
          line-height: 1;
          letter-spacing: -1px;
        }
        .rc-title em {
          font-style: italic;
          font-weight: 400;
          color: #888;
        }
        .rc-header-actions {
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
 
        /* Metric Highlights */
        .rec-metric-card {
          background: #0A0A0A;
          color: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 40px;
          max-width: 320px;
        }
        .rec-metric-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 8px;
        }
        .rec-metric-value {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 500;
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
 
        .rc-table { width: 100%; border-collapse: collapse; }
        .rc-table thead tr { border-bottom: 1px solid #F0EDE8; }
        .rc-table th {
          padding: 12px 16px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #BFBBBB; text-align: left;
        }
        .rc-table th.right { text-align: right; }
        .rc-table tbody tr {
          border-bottom: 1px solid #F7F6F3;
          cursor: pointer;
          transition: background 0.12s;
        }
        .rc-table tbody tr:hover { background: #FAFAF8; }
        .rc-table td {
          padding: 14px 16px;
          font-size: 14px; color: #0A0A0A;
          vertical-align: middle;
        }
        .td-id { font-family: 'Courier New', monospace; font-size: 12px; color: #BFBBBB; font-weight: 600; }
        .td-desc { font-weight: 600; }
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
 
        /* Modal dialog layout */
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
      `}</style>

      <div className="rc-root">
        {/* Header */}
        <header className="rc-header">
          <div>
            <p className="rc-eyebrow">Accounts Receivable · Billing</p>
            <h1 className="rc-title">
              Invoices <em>Due</em>
            </h1>
          </div>
          <div className="rc-header-actions">
            <div className="search-wrap">
              <Search className="search-icon" />
              <input
                className="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices..."
              />
            </div>
            <button
              className="new-btn"
              onClick={handleOpenCreate}
              disabled={!hasWriteAccess}
            >
              <Plus size={15} />
              Issue Invoice
            </button>
          </div>
        </header>

        {/* Metrics Block */}
        <section className="rec-metric-card">
          <p className="rec-metric-label">Outstanding Invoices</p>
          <p className="rec-metric-value">{formatNaira(getOutstandingTotal())}</p>
        </section>

        <div className="split-layout">
          {/* Main Table */}
          <div className="table-panel">
            <div className="table-toolbar">
              <div className="filter-tabs">
                {['all', 'draft', 'sent', 'paid', 'voided', 'overdue'].map((status) => (
                  <button
                    key={status}
                    className={`filter-tab${statusFilter === status ? ' active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'All' : status.toUpperCase()}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#BFBBBB', textTransform: 'uppercase' }}>
                {filteredReceivables.length} Invoices
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#BFBBBB' }}>
                <div className="spinning-search-wrapper">
                  <Search size={22} className="spinning-search-icon" />
                </div>
                Loading accounts receivables...
              </div>
            ) : filteredReceivables.length === 0 ? (
              <div className="empty-state">
                <div className="spinning-search-wrapper">
                  <Search size={22} className="spinning-search-icon" />
                </div>
                <p className="empty-title">No entries found</p>
                <p className="empty-sub">Adjust your filters or issue a new client invoice.</p>
              </div>
            ) : (
              <table className="rc-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Customer Name</th>
                    <th>Invoice Description</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceivables.map((r) => (
                    <tr key={r.id} onClick={() => setSelectedReceivable(r)}>
                      <td className="td-id">{shortId(r.id)}</td>
                      <td style={{ fontWeight: 600 }}>{r.customer_name || 'Generic Client'}</td>
                      <td className="td-desc">{r.description}</td>
                      <td>{r.due_date ? formatDate(r.due_date) : 'Immediate'}</td>
                      <td><StatusBadge status={r.status as any} /></td>
                      <td className="td-amount">{formatNaira(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Details Pane */}
          <aside className="side-pane">
            <h2 className="side-pane-title">Invoice Specifications</h2>
            {selectedReceivable ? (
              <>
                <div className="detail-row">
                  <p className="detail-label">Ref ID</p>
                  <p className="detail-value">{selectedReceivable.id}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Customer Name</p>
                  <p className="detail-value">{selectedReceivable.customer_name || 'Generic Client'}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Invoice Details</p>
                  <p className="detail-value" style={{ fontWeight: 400 }}>{selectedReceivable.description}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Due Date</p>
                  <p className="detail-value">{selectedReceivable.due_date ? formatDate(selectedReceivable.due_date) : 'Immediate'}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Collection Status</p>
                  <StatusBadge status={selectedReceivable.status as any} />
                </div>
                <div className="detail-row">
                  <p className="detail-label">Invoice Amount</p>
                  <p className="detail-value amount">{formatNaira(selectedReceivable.amount)}</p>
                </div>

                {selectedReceivable.payment_reference && (
                  <div className="detail-row" style={{ background: '#ecf7f1', padding: 12, borderRadius: 8, border: '1px solid #c2e7d3' }}>
                    <p className="detail-label" style={{ color: '#10a65a' }}>Payment Bank Reference</p>
                    <p className="detail-value" style={{ color: '#10a65a', fontWeight: 600 }}>{selectedReceivable.payment_reference}</p>
                  </div>
                )}

                {/* Collection Actions */}
                <div className="actions-card">
                  {selectedReceivable.status === 'draft' && hasWriteAccess && (
                    <button className="action-btn-main primary" onClick={() => handleSend(selectedReceivable.id)}>
                      <Send size={14} /> Send & Dispatch Invoice
                    </button>
                  )}

                  {(selectedReceivable.status === 'sent' || selectedReceivable.status === 'overdue') && hasWriteAccess && (
                    <button className="action-btn-main primary" onClick={() => handleOpenPay(selectedReceivable)}>
                      <Check size={14} /> Mark as Settled / Paid
                    </button>
                  )}

                  {selectedReceivable.status === 'paid' && (
                    <p style={{ fontStyle: 'italic', fontSize: 12, color: '#888', textAlign: 'center' }}>
                      Invoice fully paid and reconciled.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#BFBBBB', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                Select an invoice from the list table to inspect details and process collections.
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Create Receivable Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <form onSubmit={handleCreateReceivable} className="modal-card">
            <div className="modal-header">
              <span className="modal-title">Issue Customer Invoice</span>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {submitError && <div className="error-alert">{submitError}</div>}

              <div className="form-group">
                <label className="form-label">Select Customer *</label>
                <select
                  className="form-select"
                  required
                  value={receivableForm.customer_id}
                  onChange={(e) => setReceivableForm({ ...receivableForm, customer_id: e.target.value })}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Amount (NGN) *</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  value={receivableForm.amount}
                  onChange={(e) => setReceivableForm({ ...receivableForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={receivableForm.due_date}
                  onChange={(e) => setReceivableForm({ ...receivableForm, due_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice / Billing Description *</label>
                <textarea
                  className="form-textarea"
                  required
                  rows={3}
                  value={receivableForm.description}
                  onChange={(e) => setReceivableForm({ ...receivableForm, description: e.target.value })}
                  placeholder="e.g. Consulting fees for May 2026, Retainer services..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={14} /> : null}
                Save Invoice (Draft)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reconcile Pay Modal */}
      {showPayModal && (
        <div className="modal-overlay">
          <form onSubmit={handleMarkPaid} className="modal-card">
            <div className="modal-header">
              <span className="modal-title">Reconcile Client Payment</span>
              <button type="button" className="close-btn" onClick={() => setShowPayModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Received Amount</label>
                <input
                  type="text"
                  className="form-input"
                  disabled
                  value={selectedReceivable ? formatNaira(selectedReceivable.amount) : ''}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Received Transaction Reference *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g. DEPOSIT-8274923 or Wire Description"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button type="submit" className="btn-save" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="animate-spin" size={14} /> : null}
                Reconcile & Clear
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};
