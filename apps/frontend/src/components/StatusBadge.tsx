import type { InvoiceStatus } from '@/shared/invoice-status';

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  size?: 'sm' | 'md';
}

type Config = {
  label: string;
  dot: string;
  bg: string;
  fg: string;
  border: string;
};

const STATUS_CONFIG: Record<InvoiceStatus, Config> = {
  pending_hod: {
    label: 'HOD Review',
    dot: '#F59E0B',
    bg: '#FEF7E6',
    fg: '#92520C',
    border: '#F8E3B0',
  },
  pending_ceo: {
    label: 'Exec Review',
    dot: '#6366F1',
    bg: '#EEF0FF',
    fg: '#4338CA',
    border: '#D9DCFB',
  },
  ready_for_payment: {
    label: 'Ready',
    dot: '#0EA5E9',
    bg: '#ECF6FE',
    fg: '#0369A1',
    border: '#C8E5FA',
  },
  paid: {
    label: 'Settled',
    dot: '#10B981',
    bg: '#ECF8F2',
    fg: '#0E6A45',
    border: '#C2E7D2',
  },
  rejected: {
    label: 'Void',
    dot: '#DC2626',
    bg: '#FEF2F2',
    fg: '#991B1B',
    border: '#F8C9C9',
  },
};

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const safeStatus =
    status in STATUS_CONFIG
      ? (status as InvoiceStatus)
      : 'rejected';

  const config = STATUS_CONFIG[safeStatus];
  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: isSm ? '2px 8px' : '4px 10px',
        fontSize: isSm ? 10 : 11,
        fontWeight: 700,
        borderRadius: 999,
        background: config.bg,
        color: config.fg,
        border: `1px solid ${config.border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: config.dot,
        }}
      />
      {config.label}
    </span>
  );
};