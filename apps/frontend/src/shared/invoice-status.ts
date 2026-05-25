// shared/invoice-status.ts

export const INVOICE_STATUS = {
  PENDING_HOD: 'pending_hod',
  PENDING_CEO: 'pending_ceo',
  READY_FOR_PAYMENT: 'ready_for_payment',
  PAID: 'paid',
  REJECTED: 'rejected',
} as const;

export type InvoiceStatus =
  typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const isInvoiceStatus = (value: string): value is InvoiceStatus => {
  return Object.values(INVOICE_STATUS).includes(value as InvoiceStatus);
};