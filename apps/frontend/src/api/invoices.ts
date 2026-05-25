import client from './client';
import type { Invoice, CreateInvoiceRequest } from '../types';

type InvoiceMutationResponse = {
  message: string;
  invoice: Invoice;
  comment?: unknown;
};

export const invoiceApi = {
  getAll: async () => {
    const response = await client.get<{ invoices: Invoice[] }>('/invoices');
    return response.data.invoices;
  },

  getById: async (id: string) => {
    const response = await client.get<{ invoice: Invoice }>(`/invoice/${id}`);
    return response.data.invoice;
  },

  getInvoice: async (id: string) => {
    const response = await client.get<{ invoice: Invoice }>(`/invoice/${id}`);
    return response.data.invoice;
  },

  getReviewByToken: async (id: string, token: string) => {
    const response = await client.get<{ invoice: Invoice }>(`/invoice/${id}/review/data`, {
      params: { token },
    });
    return response.data.invoice;
  },

  create: async (request: CreateInvoiceRequest) => {
    const response = await client.post<InvoiceMutationResponse>('/invoice', request);
    return response.data.invoice;
  },

  approve: async (invoiceId: string, approver_id: string) => {
    const response = await client.post<InvoiceMutationResponse>(
      `/invoice/${invoiceId}/approve`,
      { approver_id }
    );
    return response.data;
  },

  reject: async (invoiceId: string, rejected_by: string, reason: string) => {
    const response = await client.post<InvoiceMutationResponse>(
      `/invoice/${invoiceId}/reject`,
      { rejected_by, reason }
    );
    return response.data;
  },

  markPaid: async (invoiceId: string, account_officer_id: string, payment_reference?: string) => {
    const response = await client.post<InvoiceMutationResponse>(
      `/invoice/${invoiceId}/mark-paid`,
      { account_officer_id, payment_reference }
    );
    return response.data;
  },

  approveInvoiceSigned: async (invoiceId: string, token: string) => {
    const response = await client.post<{ message: string; invoice: Invoice }>(
      `/invoice/${invoiceId}/approve/signed`,
      { token }
    );
    return response.data;
  },

  rejectInvoiceSigned: async (invoiceId: string, token: string, reason: string) => {
    const response = await client.post<{ message: string; invoice: Invoice }>(
      `/invoice/${invoiceId}/reject/signed`,
      { token, reason }
    );
    return response.data;
  },

  markPaidSigned: async (invoiceId: string, token: string, paymentReference: string) => {
    const response = await client.post<{ message: string; invoice: Invoice }>(
      `/invoice/${invoiceId}/mark-paid/signed`,
      { token, payment_reference: paymentReference }
    );
    return response.data;
  },
};
