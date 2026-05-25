import type { InvoiceStatus } from '@/shared/invoice-status';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending_hod: 'PENDING · HOD',
  pending_ceo: 'PENDING · CEO',
  ready_for_payment: 'READY · PAY',
  paid: 'PAID',
  rejected: 'REJECTED',
};

const STATUS_GLYPH: Record<InvoiceStatus, string> = {
  pending_hod: '◐',
  pending_ceo: '◑',
  ready_for_payment: '◒',
  paid: '●',
  rejected: '✕',
};

export const StatusTag = ({ status }: { status: InvoiceStatus }) => (
  <span className="inline-flex items-center gap-2 h-6 px-2 border border-current font-mono text-[10px] uppercase tracking-[0.18em]">
    <span aria-hidden className="font-display text-base leading-none">
      {STATUS_GLYPH[status]}
    </span>
    {STATUS_LABELS[status]}
  </span>
);
