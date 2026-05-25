import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { invoiceApi } from '../api/invoices';
import type { Invoice } from '../types/index';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CreditCard, 
  FileText, 
  Building2, 
  ShieldCheck 
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const getErrorDetail = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail || fallback;
  }
  return fallback;
};

export const ReviewInvoice = () => {
  usePageTitle('Review Invoice');
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      const loadInvoice = token
        ? invoiceApi.getReviewByToken(id, token)
        : invoiceApi.getInvoice(id);

      loadInvoice
        .then(setInvoice)
        .catch(() => setError("Failed to load invoice details."))
        .finally(() => setLoading(false));
    }
  }, [id, token]);

  const handleApprove = async () => {
    if (!id || !token) return;
    setProcessing(true);
    try {
      const res = await invoiceApi.approveInvoiceSigned(id, token);
      setInvoice(res.invoice);
      alert(res.message);
    } catch (err: unknown) {
      alert(getErrorDetail(err, "Approval failed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Reason for rejection?");
    if (!id || !token || reason === null) return;
    setProcessing(true);
    try {
      const res = await invoiceApi.rejectInvoiceSigned(id, token, reason);
      setInvoice(res.invoice);
      alert(res.message);
    } catch (err: unknown) {
      alert(getErrorDetail(err, "Rejection failed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    const ref = window.prompt("Payment reference?");
    if (!id || !token || ref === null) return;
    setProcessing(true);
    try {
      const res = await invoiceApi.markPaidSigned(id, token, ref);
      setInvoice(res.invoice);
      alert(res.message);
    } catch (err: unknown) {
      alert(getErrorDetail(err, "Payment update failed"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading secure review...</div>;
  if (error || !invoice) return <div className="p-8 text-red-600">{error || "Invoice not found"}</div>;

  const canApprove = ["pending_hod", "pending_ceo", "ready_for_payment"].includes(invoice.status);
  const canReject = ["pending_hod", "pending_ceo"].includes(invoice.status);
  
  const getActionLabel = () => {
    if (invoice.status === "pending_hod") return "Approve as HOD";
    if (invoice.status === "pending_ceo") return "Approve as CEO";
    if (invoice.status === "ready_for_payment") return "Mark as Paid";
    return "Completed";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 border-b border-slate-100 pb-8">
          <div className="flex items-center gap-2 text-slate-400 mb-4">
            <ShieldCheck size={16} />
            <span className="text-xs font-medium uppercase tracking-widest">Secure Review Terminal</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Invoice Review</h1>
          <p className="text-slate-500 mt-2">ID: {invoice.id}</p>
        </header>

        <main className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</p>
              <p className="text-2xl font-mono">NGN {invoice.amount.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <span className="font-medium capitalize">{invoice.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </section>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-6">
            <div className="flex gap-4">
              <FileText className="text-slate-400 shrink-0" size={20} />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Purpose</p>
                <p className="text-slate-700 leading-relaxed">{invoice.purpose}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Building2 className="text-slate-400 shrink-0" size={20} />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                <p className="text-slate-700 capitalize">{invoice.department}</p>
              </div>
            </div>
          </div>

          {invoice.rejection_reason && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs font-bold text-red-600 uppercase mb-1">Rejection Reason</p>
              <p className="text-red-700">{invoice.rejection_reason}</p>
            </div>
          )}

          <footer className="pt-8 flex flex-col sm:flex-row gap-4">
            <button
              disabled={!canApprove || processing}
              onClick={invoice.status === 'ready_for_payment' ? handleMarkPaid : handleApprove}
              className="flex-1 bg-black text-white h-12 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {invoice.status === 'ready_for_payment' ? <CreditCard size={18} /> : <CheckCircle2 size={18} />}
              {processing ? "Processing..." : getActionLabel()}
            </button>

            {canReject && (
              <button
                disabled={processing}
                onClick={handleReject}
                className="flex-1 bg-white text-red-600 border border-red-200 h-12 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                <XCircle size={18} />
                Reject Invoice
              </button>
            )}
          </footer>

          {!token && (
            <p className="text-center text-xs text-slate-400 mt-8">
              View-only mode. An action token is required to approve or reject.
            </p>
          )}
        </main>
      </div>
    </div>
  );
};
