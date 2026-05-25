import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/shared/invoice-status';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending_hod: 'Pnd HOD',
  pending_ceo: 'Pnd CEO',
  ready_for_payment: 'Ready',
  paid: 'Settled',
  rejected: 'Void',
};

export const StatusPill = ({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'status-pill font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full',
        status === 'paid' ? 'status-pill--approved' :
        status === 'rejected' ? 'status-pill--rejected' :
        status.startsWith('pending') ? 'status-pill--pending' :
        'status-pill--review',
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};
