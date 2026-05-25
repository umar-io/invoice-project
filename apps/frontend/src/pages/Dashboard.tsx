import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight, BarChart3, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { invoiceApi } from '../api/invoices';
import { dashboardSummaryApi } from '../api/ap_ar';
import type { Invoice, DashboardSummary } from '../types';
import type { InvoiceStatus } from '@/shared/invoice-status';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { formatNaira, formatNairaSplit, formatDate, shortId } from '../lib/format';
import { usePageTitle } from '../hooks/usePageTitle';

type Filter = 'all' | InvoiceStatus;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending_hod', label: 'HOD Review' },
  { value: 'pending_ceo', label: 'Exec Review' },
  { value: 'ready_for_payment', label: 'Ready' },
  { value: 'paid', label: 'Settled' },
  { value: 'rejected', label: 'Void' },
];

export const Dashboard = () => {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await invoiceApi.getAll();
      setInvoices(data);

      if (user?.role === 'ceo' || user?.role === 'account_officer') {
        const sumData = await dashboardSummaryApi.getSummary();
        setSummary(sumData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const safeInvoices = useMemo(() => Array.isArray(invoices) ? invoices : [], [invoices]);

  const totals = useMemo(() => {
    const outstanding = safeInvoices
      .filter((i) => i.status !== 'rejected' && i.status !== 'paid')
      .reduce((s, i) => s + i.amount, 0);
    const pendingCount = safeInvoices.filter(i => i.status.startsWith('pending')).length;
    const readyCount = safeInvoices.filter(i => i.status === 'ready_for_payment').length;
    const paidTotal = safeInvoices
      .filter(i => i.status === 'paid')
      .reduce((s, i) => s + i.amount, 0);
    return { outstanding, pendingCount, readyCount, paidTotal };
  }, [safeInvoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return safeInvoices.filter((inv) => {
      if (filter !== 'all' && inv.status !== filter) return false;
      if (!q) return true;
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.purpose.toLowerCase().includes(q) ||
        inv.department.toLowerCase().includes(q)
      );
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [safeInvoices, filter, query]);

  // Fallbacks for display
  const mtdSpend = summary ? summary.total_spend_this_month : totals.paidTotal;
  const outstandingAR = summary ? summary.total_receivables_outstanding : 0;
  const totalOutstandingAP = totals.outstanding;

  const outstandingAPSplit = formatNairaSplit(totalOutstandingAP);
  const mtdSpendSplit = formatNairaSplit(mtdSpend);
  const arSplit = formatNairaSplit(outstandingAR);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Nunito+Sans:wght@300;400;600;700&display=swap');

        .db-root { font-family: 'Nunito Sans', sans-serif; }

        /* ── Page header ── */
        .db-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px;
          flex-wrap: wrap;
        }
        .db-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 8px;
        }
        .db-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 500;
          color: #0A0A0A;
          line-height: 1;
          letter-spacing: -1px;
        }
        .db-title em {
          font-style: italic;
          font-weight: 400;
          color: #888;
        }
        .db-header-actions {
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

        /* ── Metrics ── */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        @media (max-width: 900px) {
          .metrics-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 540px) {
          .metrics-grid { grid-template-columns: 1fr; }
        }

        .metric-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .metric-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .metric-card.primary {
          background: #0A0A0A;
          border-color: #0A0A0A;
        }
        .metric-card.primary::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
          pointer-events: none;
        }

        .metric-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #BFBBBB;
          margin-bottom: 16px;
        }
        .metric-card.primary .metric-label { color: rgba(255,255,255,0.35); }

        .metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 12px;
        }
        .metric-currency {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 500;
          color: #888;
          margin-right: 2px;
        }
        .metric-card.primary .metric-currency { color: rgba(255,255,255,0.4); }
        .metric-whole {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 500;
          color: #0A0A0A;
          letter-spacing: -1px;
          line-height: 1;
        }
        .metric-card.primary .metric-whole { color: white; }
        .metric-decimal {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 400;
          color: #BFBBBB;
          letter-spacing: -0.5px;
        }
        .metric-card.primary .metric-decimal { color: rgba(255,255,255,0.3); }
        .metric-count {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 500;
          color: #0A0A0A;
          letter-spacing: -1px;
          line-height: 1;
        }
        .metric-trend {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #BFBBBB;
        }
        .metric-card.primary .metric-trend { color: rgba(255,255,255,0.3); }
        .metric-dot {
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          margin-right: 6px;
          vertical-align: middle;
        }

        /* ── Split Panel for Charts ── */
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 40px;
        }
        @media (max-width: 760px) {
          .charts-grid { grid-template-columns: 1fr; }
        }
        .chart-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 24px;
        }
        .chart-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1.5px solid #0A0A0A;
          padding-bottom: 10px;
        }
        .chart-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 600;
          color: #0A0A0A;
        }
        
        .css-chart-bar-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .css-chart-row {
          display: grid;
          grid-template-columns: 100px 1fr 80px;
          align-items: center;
          gap: 12px;
        }
        .css-chart-label {
          font-size: 12px;
          font-weight: 700;
          color: #555;
          text-transform: capitalize;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .css-chart-bar-bg {
          height: 8px;
          background: #F7F6F3;
          border: 1px solid #E8E6E1;
          border-radius: 4px;
          overflow: hidden;
        }
        .css-chart-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: #0A0A0A;
          transition: width 0.8s ease;
        }
        .css-chart-value {
          font-family: 'Playfair Display', serif;
          font-size: 13px;
          font-weight: 600;
          text-align: right;
          color: #0A0A0A;
        }

        /* ── Recent Activity ── */
        .activity-panel {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 40px;
        }
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .activity-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #FAFAF8;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
        }
        .activity-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .activity-icon-wrap {
          width: 32px; height: 32px;
          background: white;
          border: 1.5px solid #E8E6E1;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: #888;
        }
        .activity-info {
          font-size: 13px;
        }
        .activity-desc {
          font-weight: 700;
          color: #0A0A0A;
          text-transform: capitalize;
        }
        .activity-date {
          font-size: 11px;
          color: #BFBBBB;
          margin-top: 2px;
        }
        .activity-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .activity-amount {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          font-size: 14px;
        }

        /* ── Table panel ── */
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
          display: flex;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .filter-tabs::-webkit-scrollbar { display: none; }
        .filter-tab {
          padding: 6px 14px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background: transparent;
          color: #BFBBBB;
          letter-spacing: 0.03em;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .filter-tab:hover { color: #0A0A0A; background: #F7F6F3; }
        .filter-tab.active { background: #0A0A0A; color: white; }
        .table-count {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #BFBBBB;
          white-space: nowrap;
        }

        /* Table */
        .inv-table { width: 100%; border-collapse: collapse; }
        .inv-table thead tr {
          border-bottom: 1px solid #F0EDE8;
        }
        .inv-table th {
          padding: 12px 16px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #BFBBBB;
          text-align: left;
          white-space: nowrap;
        }
        .inv-table th.right { text-align: right; }
        .inv-table tbody tr {
          border-bottom: 1px solid #F7F6F3;
          cursor: pointer;
          transition: background 0.12s;
        }
        .inv-table tbody tr:last-child { border-bottom: none; }
        .inv-table tbody tr:hover { background: #FAFAF8; }
        .inv-table tbody tr:hover .row-chevron { opacity: 1; transform: translateX(2px); }
        .inv-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #0A0A0A;
          vertical-align: middle;
        }
        .td-id {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #BFBBBB;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .td-purpose {
          font-weight: 600;
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .td-dept {
          font-size: 13px;
          color: #888;
          font-weight: 400;
        }
        .td-amount {
          font-family: 'Playfair Display', serif;
          font-weight: 500;
          font-size: 15px;
          text-align: right;
          letter-spacing: -0.3px;
          white-space: nowrap;
        }
        .td-date {
          font-size: 12px;
          color: #BFBBBB;
          font-weight: 600;
          white-space: nowrap;
        }
        .row-chevron {
          opacity: 0;
          transition: opacity 0.12s, transform 0.12s;
          color: #888;
        }

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
          padding: 80px 24px;
          text-align: center;
        }
        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 500;
          color: #0A0A0A;
          margin-bottom: 6px;
        }
        .empty-sub { font-size: 13px; color: #BFBBBB; font-weight: 400; }

        .skeleton-row {
          display: flex; flex-direction: column; gap: 12px;
          padding: 32px 24px;
        }
        .skel {
          background: #F7F6F3;
          border-radius: 6px;
          animation: skel-pulse 1.4s ease-in-out infinite;
        }
        @keyframes skel-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 640px) {
          .db-title { font-size: 28px; }
          .td-dept, .td-date, .row-chevron { display: none; }
        }
      `}</style>

      <div className="db-root">
        {/* Header */}
        <header className="db-header">
          <div>
            <p className="db-eyebrow">Treasury · Lagos_01</p>
            <h1 className="db-title">
              Invoice <em>Ledger</em>
            </h1>
          </div>
          <div className="db-header-actions">
            <div className="search-wrap">
              <Search className="search-icon" />
              <input
                className="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ledger..."
              />
            </div>
            <button className="new-btn" onClick={() => navigate('/submit-invoice')}>
              <Plus size={15} />
              New Invoice
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="metrics-grid">
          {/* Outstanding AP */}
          <div className="metric-card primary">
            <p className="metric-label">Outstanding AP</p>
            <div className="metric-value-row">
              <span className="metric-currency">₦</span>
              <span className="metric-whole">{outstandingAPSplit.whole}</span>
              <span className="metric-decimal">.{outstandingAPSplit.decimal}</span>
            </div>
            <p className="metric-trend">
              <span className="metric-dot" style={{ background: 'rgba(255,255,255,0.25)' }} />
              Traditional invoices payable
            </p>
          </div>

          {/* Pending Reviews count */}
          <div className="metric-card">
            <p className="metric-label">Pending Reviews</p>
            <div className="metric-value-row">
              <span className="metric-count">
                {(summary?.pending_approvals_count ?? totals.pendingCount).toString().padStart(2, '0')}
              </span>
            </div>
            <p className="metric-trend">
              <span className="metric-dot" style={{ background: '#F59E0B' }} />
              Awaiting review pipeline
            </p>
          </div>

          {/* Outstanding Receivables */}
          <div className="metric-card">
            <p className="metric-label">Outstanding AR</p>
            <div className="metric-value-row">
              <span className="metric-currency">₦</span>
              <span className="metric-whole" style={{ fontSize: 24 }}>{arSplit.whole}</span>
              <span className="metric-decimal" style={{ fontSize: 13 }}>.{arSplit.decimal}</span>
            </div>
            <p className="metric-trend">
              <span className="metric-dot" style={{ background: '#6366F1' }} />
              Outstanding claims billed
            </p>
          </div>

          {/* MTD Spent */}
          <div className="metric-card">
            <p className="metric-label">Spent MTD</p>
            <div className="metric-value-row">
              <span className="metric-currency">₦</span>
              <span className="metric-whole" style={{ fontSize: 24 }}>{mtdSpendSplit.whole}</span>
              <span className="metric-decimal" style={{ fontSize: 13 }}>.{mtdSpendSplit.decimal}</span>
            </div>
            <p className="metric-trend">
              <span className="metric-dot" style={{ background: '#10B981' }} />
              Total settled this month
            </p>
          </div>
        </section>

        {/* Global Analytics Charts (Visible for CEOs & Account Officers) */}
        {summary && (
          <section className="charts-grid">
            {/* Spend by Department */}
            <div className="chart-card">
              <div className="chart-header">
                <BarChart3 size={15} />
                <span className="chart-title">MTD Departmental Outflow</span>
              </div>
              <div className="css-chart-bar-list">
                {Object.keys(summary.spend_by_department).length === 0 ? (
                  <p style={{ fontStyle: 'italic', color: '#BFBBBB', fontSize: 12 }}>No departmental spent registered.</p>
                ) : (
                  Object.entries(summary.spend_by_department).map(([dept, amt]) => {
                    const maxVal = Math.max(...Object.values(summary.spend_by_department), 1);
                    return (
                      <div className="css-chart-row" key={dept}>
                        <span className="css-chart-label">{dept}</span>
                        <div className="css-chart-bar-bg">
                          <div className="css-chart-bar-fill" style={{ width: `${(amt / maxVal) * 100}%` }} />
                        </div>
                        <span className="css-chart-value">{formatNaira(amt)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="chart-card">
              <div className="chart-header">
                <TrendingUp size={15} />
                <span className="chart-title">Staff Claims by Category</span>
              </div>
              <div className="css-chart-bar-list">
                {Object.keys(summary.expenses_by_category).length === 0 ? (
                  <p style={{ fontStyle: 'italic', color: '#BFBBBB', fontSize: 12 }}>No out of pocket claims approved.</p>
                ) : (
                  Object.entries(summary.expenses_by_category).map(([cat, amt]) => {
                    const maxVal = Math.max(...Object.values(summary.expenses_by_category), 1);
                    return (
                      <div className="css-chart-row" key={cat}>
                        <span className="css-chart-label">{cat}</span>
                        <div className="css-chart-bar-bg">
                          <div className="css-chart-bar-fill" style={{ width: `${(amt / maxVal) * 100}%`, background: '#555' }} />
                        </div>
                        <span className="css-chart-value">{formatNaira(amt)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* Global Recent Activity Log (Visible for CEOs & Account Officers) */}
        {summary && summary.recent_activity.length > 0 && (
          <section className="activity-panel">
            <div className="chart-header" style={{ borderBottom: '1px solid #E8E6E1', marginBottom: 16 }}>
              <Clock size={15} />
              <span className="chart-title">Global Activity Ledger</span>
            </div>
            <div className="activity-list">
              {summary.recent_activity.map((act) => (
                <div className="activity-item" key={act.id}>
                  <div className="activity-left">
                    <div className="activity-icon-wrap">
                      <DollarSign size={14} />
                    </div>
                    <div className="activity-info">
                      <p className="activity-desc">
                        Filed a {act.type} claim ({shortId(act.id)})
                      </p>
                      <p className="activity-date">
                        Status is currently <strong>{act.status.toUpperCase()}</strong> · {formatDate(act.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="activity-right">
                    <span className="activity-amount">{formatNaira(act.amount)}</span>
                    <ChevronRight size={14} color="#BFBBBB" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Table Panel for Invoices */}
        <div className="table-panel">
          <div className="table-toolbar">
            <div className="filter-tabs">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`filter-tab${filter === f.value ? ' active' : ''}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="table-count">{filtered.length} invoices</span>
          </div>

          {isLoading ? (
            <div className="skeleton-row">
              {[100, 85, 92, 78].map((w, i) => (
                <div key={i} className="skel" style={{ height: 18, width: `${w}%` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="spinning-search-wrapper">
                <Search size={22} className="spinning-search-icon" />
              </div>
              <p className="empty-title">No entries found</p>
              <p className="empty-sub">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Description</th>
                    <th>Department</th>
                    <th className="right">Amount</th>
                    <th>Status</th>
                    <th>Filed</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} onClick={() => navigate(`/invoice/${inv.id}`)}>
                      <td className="td-id">{shortId(inv.id)}</td>
                      <td className="td-purpose">{inv.purpose}</td>
                      <td className="td-dept">{inv.department}</td>
                      <td className="td-amount">{formatNaira(inv.amount)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="td-date">{formatDate(inv.created_at)}</td>
                      <td>
                        <ChevronRight size={15} className="row-chevron" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
