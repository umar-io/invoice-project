export const formatNaira = (amount: number): string =>
  '₦' + amount.toLocaleString('en-NG', { maximumFractionDigits: 0 });

export const formatNairaSplit = (amount: number): { whole: string; decimal: string } => {
  const [whole, decimal = '00'] = amount.toFixed(2).split('.');
  return { whole: Number(whole).toLocaleString('en-NG'), decimal };
};

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
};

export const shortId = (id: string): string => id.slice(0, 8).toUpperCase();
