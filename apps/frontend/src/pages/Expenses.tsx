import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { expenseApi } from '../api/ap_ar';
import type { Expense } from '../types';
import { Plus, Search, Check, X, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatNaira, shortId } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { usePageTitle } from '../hooks/usePageTitle';

export const Expenses = () => {
  usePageTitle('Refunds & Claims');
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Submit Expense Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
  });

  // Action states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const CATEGORIES = ['Travel', 'Meals', 'Utilities', 'Software', 'Office Supplies', 'Training', 'Other'];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const expensesData = await expenseApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setExpenses(expensesData);
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
    setExpenseForm({
      amount: '',
      category: '',
      description: '',
    });
    setSubmitError(null);
    setShowSubmitModal(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await expenseApi.create({
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
      });
      setShowSubmitModal(false);
      fetchData();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.detail || 'Failed to submit expense claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this expense claim?')) return;
    setActionLoading(true);
    try {
      await expenseApi.approve(id);
      setSelectedExpense(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReimburse = async (id: string) => {
    if (!confirm('Mark this approved claim as reimbursed/paid?')) return;
    setActionLoading(true);
    try {
      await expenseApi.reimburse(id);
      setSelectedExpense(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Reimbursement failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      e.id.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.submitter_name && e.submitter_name.toLowerCase().includes(q))
    );
  });

  const getMtdClaimTotal = () => {
    return expenses
      .filter(e => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <Layout>
      <style>{`
        .ex-root { font-family: 'Nunito Sans', sans-serif; }
        
        .ex-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px;
          flex-wrap: wrap;
        }
        .ex-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 8px;
        }
        .ex-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 500;
          color: #0A0A0A;
          line-height: 1;
          letter-spacing: -1px;
        }
        .ex-title em {
          font-style: italic;
          font-weight: 400;
          color: #888;
        }
        .ex-header-actions {
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
        
        /* Metric highlights */
        .ex-metric-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 40px;
          max-width: 320px;
        }
        .ex-metric-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #BFBBBB; margin-bottom: 8px;
        }
        .ex-metric-value {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 500; color: #0A0A0A;
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

        .ex-table { width: 100%; border-collapse: collapse; }
        .ex-table thead tr { border-bottom: 1px solid #F0EDE8; }
        .ex-table th {
          padding: 12px 16px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #BFBBBB; text-align: left;
        }
        .ex-table th.right { text-align: right; }
        .ex-table tbody tr {
          border-bottom: 1px solid #F7F6F3;
          cursor: pointer;
          transition: background 0.12s;
        }
        .ex-table tbody tr:hover { background: #FAFAF8; }
        .ex-table td {
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

      <div className="ex-root">
        {/* Header */}
        <header className="ex-header">
          <div>
            <p className="ex-eyebrow">Staff Out-of-Pocket · Claims</p>
            <h1 className="ex-title">
              Expense <em>Claims</em>
            </h1>
          </div>
          <div className="ex-header-actions">
            <div className="search-wrap">
              <Search className="search-icon" />
              <input
                className="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims..."
              />
            </div>
            <button className="new-btn" onClick={handleOpenSubmit}>
              <Plus size={15} />
              File Expense Claim
            </button>
          </div>
        </header>

        {/* Metrics Card */}
        <section className="ex-metric-card">
          <p className="ex-metric-label">Approved & Reimbursed MTD</p>
          <p className="ex-metric-value">{formatNaira(getMtdClaimTotal())}</p>
        </section>

        <div className="split-layout">
          {/* Main Table */}
          <div className="table-panel">
            <div className="table-toolbar">
              <div className="filter-tabs">
                {['all', 'pending', 'approved', 'reimbursed', 'rejected'].map((status) => (
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
                {filteredExpenses.length} Claims
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#BFBBBB' }}>
                <Loader2 className="animate-spin" style={{ margin: '0 auto 12px' }} />
                Loading expense claims...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="empty-state">
                <div className="spinning-search-wrapper">
                  <Search size={22} className="spinning-search-icon" />
                </div>
                <p className="empty-title">No entries found</p>
                <p className="empty-sub">Adjust your filters or issue a new client invoice.</p>
              </div>
            ) : (
              <table className="ex-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Submitted By</th>
                    <th>Category</th>
                    <th>Purpose Details</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} onClick={() => setSelectedExpense(e)}>
                      <td className="td-id">{shortId(e.id)}</td>
                      <td style={{ fontWeight: 600 }}>{e.submitter_name || 'Staff Member'}</td>
                      <td>{e.category}</td>
                      <td className="td-desc">{e.description}</td>
                      <td>{e.department}</td>
                      <td><StatusBadge status={e.status as any} /></td>
                      <td className="td-amount">{formatNaira(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Details Pane */}
          <aside className="side-pane">
            <h2 className="side-pane-title">Expense Specifications</h2>
            {selectedExpense ? (
              <>
                <div className="detail-row">
                  <p className="detail-label">Ref ID</p>
                  <p className="detail-value">{selectedExpense.id}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Claimant Name</p>
                  <p className="detail-value">{selectedExpense.submitter_name || 'Staff Member'}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Category</p>
                  <p className="detail-value" style={{ textTransform: 'capitalize' }}>{selectedExpense.category}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Description / Purpose</p>
                  <p className="detail-value" style={{ fontWeight: 400 }}>{selectedExpense.description}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Department / Cost Center</p>
                  <p className="detail-value">{selectedExpense.department}</p>
                </div>
                <div className="detail-row">
                  <p className="detail-label">Workflow Status</p>
                  <StatusBadge status={selectedExpense.status as any} />
                </div>
                <div className="detail-row">
                  <p className="detail-label">Claim Amount</p>
                  <p className="detail-value amount">{formatNaira(selectedExpense.amount)}</p>
                </div>

                {/* Claim Action Workflow */}
                <div className="actions-card">
                  {selectedExpense.status === 'pending' && user?.role === 'hod' && user?.department?.toLowerCase() === selectedExpense.department?.toLowerCase() && (
                    <button className="action-btn-main primary" onClick={() => handleApprove(selectedExpense.id)}>
                      <Check size={14} /> Approve Claim (Route to Finance)
                    </button>
                  )}

                  {selectedExpense.status === 'approved' && user?.role === 'account_officer' && (
                    <button className="action-btn-main primary" onClick={() => handleReimburse(selectedExpense.id)}>
                      {actionLoading ?
                        (
                          <>
                            <Loader2 className="animate-spin" size={14} /> Disburse Reimbursement
                          </>

                        ) : (
                          <>
                            <CreditCard size={14} /> Disburse Reimbursement
                          </>
                        )}
                    </button>
                  )}

                  {selectedExpense.status === 'pending' && user?.role !== 'hod' && (
                    <p style={{ fontStyle: 'italic', fontSize: 12, color: '#888', textAlign: 'center' }}>
                      Awaiting Department Head (HOD) approval...
                    </p>
                  )}
                  {selectedExpense.status === 'approved' && user?.role !== 'account_officer' && (
                    <p style={{ fontStyle: 'italic', fontSize: 12, color: '#888', textAlign: 'center' }}>
                      Approved by HOD. Awaiting disbursement by Account Officer...
                    </p>
                  )}
                  {selectedExpense.status === 'reimbursed' && (
                    <p style={{ fontStyle: 'italic', fontSize: 12, color: '#888', textAlign: 'center', background: '#ecf7f1', padding: 8, borderRadius: 6 }}>
                      Fully reconciled and paid back.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#BFBBBB', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                Select an expense claim from the table to inspect details and perform review.
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* File Claim Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <form onSubmit={handleCreateExpense} className="modal-card">
            <div className="modal-header">
              <span className="modal-title">File Expense Claim</span>
              <button type="button" className="close-btn" onClick={() => setShowSubmitModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {submitError && <div className="error-alert">{submitError}</div>}

              <div className="form-group">
                <label className="form-label">Expense Category *</label>
                <select
                  className="form-select"
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount Spent (NGN) *</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Expense Reason *</label>
                <textarea
                  className="form-textarea"
                  required
                  rows={3}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Flight ticket to Abuja for sales pitch, Client dinner..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowSubmitModal(false)}>Cancel</button>
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={14} /> : null}
                File Claim
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};
