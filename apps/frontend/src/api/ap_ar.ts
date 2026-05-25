import client from './client';
import type { Vendor, Customer, Bill, Receivable, Expense, DashboardSummary } from '../types';

export const vendorApi = {
  getAll: async (search?: string) => {
    const response = await client.get<{ items: Vendor[]; total: number }>('/vendors', {
      params: search ? { search } : undefined,
    });
    return response.data.items;
  },
  create: async (data: Omit<Vendor, 'id' | 'company_id' | 'created_by' | 'created_at'>) => {
    const response = await client.post<{ message: string; data: Vendor }>('/vendors', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<Vendor>) => {
    const response = await client.put<{ message: string; data: Vendor }>(`/vendors/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    await client.delete(`/vendors/${id}`);
  },
};

export const customerApi = {
  getAll: async (search?: string) => {
    const response = await client.get<{ items: Customer[]; total: number }>('/customers', {
      params: search ? { search } : undefined,
    });
    return response.data.items;
  },
  create: async (data: Omit<Customer, 'id' | 'company_id' | 'created_by' | 'created_at'>) => {
    const response = await client.post<{ message: string; data: Customer }>('/customers', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<Customer>) => {
    const response = await client.put<{ message: string; data: Customer }>(`/customers/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    await client.delete(`/customers/${id}`);
  },
};

export const billApi = {
  getAll: async (params?: { status?: string; department?: string; vendor_id?: string }) => {
    const response = await client.get<{ items: Bill[]; total: number }>('/bills', { params });
    return response.data.items;
  },
  create: async (data: { vendor_id: string; amount: number; purpose: string; department: string; due_date?: string }) => {
    const response = await client.post<{ message: string; data: Bill }>('/bills', data);
    return response.data.data;
  },
  approve: async (id: string) => {
    const response = await client.post<{ message: string; data: Bill }>(`/bills/${id}/approve`);
    return response.data.data;
  },
  reject: async (id: string, reason: string) => {
    const response = await client.post<{ message: string; data: Bill }>(`/bills/${id}/reject`, { reason });
    return response.data.data;
  },
  markPaid: async (id: string, paymentReference: string) => {
    const response = await client.post<{ message: string; data: Bill }>(`/bills/${id}/mark-paid`, { payment_reference: paymentReference });
    return response.data.data;
  },
  getAging: async () => {
    const response = await client.get<Record<string, { count: number; total: number }>>('/bills/aging');
    return response.data;
  },
};

export const receivableApi = {
  getAll: async (params?: { status?: string; customer_id?: string }) => {
    const response = await client.get<{ items: Receivable[]; total: number }>('/receivables', { params });
    return response.data.items;
  },
  create: async (data: { customer_id: string; amount: number; description: string; due_date?: string }) => {
    const response = await client.post<{ message: string; data: Receivable }>('/receivables', data);
    return response.data.data;
  },
  send: async (id: string) => {
    const response = await client.post<{ message: string; data: Receivable }>(`/receivables/${id}/send`);
    return response.data.data;
  },
  markPaid: async (id: string, paymentReference: string) => {
    const response = await client.post<{ message: string; data: Receivable }>(`/receivables/${id}/mark-paid`, { payment_reference: paymentReference });
    return response.data.data;
  },
};

export const expenseApi = {
  getAll: async (params?: { status?: string; category?: string }) => {
    const response = await client.get<{ items: Expense[]; total: number }>('/expenses', { params });
    return response.data.items;
  },
  create: async (data: { amount: number; category: string; description: string }) => {
    const response = await client.post<{ message: string; data: Expense }>('/expenses', data);
    return response.data.data;
  },
  approve: async (id: string) => {
    const response = await client.post<{ message: string; data: Expense }>(`/expenses/${id}/approve`);
    return response.data.data;
  },
  reimburse: async (id: string) => {
    const response = await client.post<{ message: string; data: Expense }>(`/expenses/${id}/reimburse`);
    return response.data.data;
  },
};

export const dashboardSummaryApi = {
  getSummary: async () => {
    const response = await client.get<DashboardSummary>('/dashboard/summary');
    return response.data;
  },
};
