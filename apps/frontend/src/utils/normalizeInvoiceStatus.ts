import { INVOICE_STATUS, isInvoiceStatus } from '../shared/invoice-status';
import type { InvoiceStatus } from '../shared/invoice-status';

export function normalizeInvoiceStatus(status: string): InvoiceStatus {
  switch (status) {
    case 'approved':
      return INVOICE_STATUS.PENDING_CEO;

    case 'pendingHod':
    case 'pendingHOD':
      return INVOICE_STATUS.PENDING_HOD;

    case 'pending_ceo':
      return INVOICE_STATUS.PENDING_CEO;

    case 'ready':
      return INVOICE_STATUS.READY_FOR_PAYMENT;

    case 'paid':
      return INVOICE_STATUS.PAID;

    case 'rejected':
    case 'void':
      return INVOICE_STATUS.REJECTED;

    default:
      if (isInvoiceStatus(status)) return status;

      // fallback safety
      return INVOICE_STATUS.PENDING_HOD;
  }
}