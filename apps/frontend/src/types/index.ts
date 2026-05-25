
import type { InvoiceStatus } from '@/shared/invoice-status';

export type UserRole = 'staff' | 'hod' | 'ceo' | 'account_officer';

export interface User {
  id: string;
  company_name?: string;
  company_id?: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  department?: string;
  created_by?: string | null;
  created_at?: string;
  company_logo: string;
  company_address: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Invoice {
  id: string;
  company_id?: string;
  amount: number;
  purpose: string;
  department: string;
  status: InvoiceStatus;
  created_at: string;
  updated_at?: string;
  created_by: string;
  creator_name?: string;
  assigned_to?: string;
  approved_by_hod?: string;
  approved_by_ceo?: string;
  paid_by?: string;
  payment_reference?: string;
  paid_at?: string;
  rejection_reason?: string;
  hod_name?: string;
  ceo_name?: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  payment_account_name?: string | null;
  payment_bank_name?: string | null;
  payment_account_number?: string | null;
  payment_instructions?: string | null;
  updated_at?: string;
}

export interface CreateInvoiceRequest {
  
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface SignupRequest {
  company_name: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupResponse extends AuthResponse {
  company: Company;
}

export interface Vendor {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  created_by: string;
  created_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_by: string;
  created_at: string;
}

export interface Bill {
  id: string;
  company_id: string;
  vendor_id: string;
  vendor_name?: string;
  amount: number;
  currency: string;
  purpose: string;
  department: string;
  due_date?: string;
  status: 'pending_hod' | 'pending_ceo' | 'ready_for_payment' | 'paid' | 'rejected';
  created_by: string;
  creator_name?: string;
  assigned_to?: string;
  approved_by_hod?: string;
  approved_by_ceo?: string;
  paid_by?: string;
  payment_reference?: string;
  paid_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Receivable {
  id: string;
  company_id: string;
  customer_id: string;
  customer_name?: string;
  amount: number;
  currency: string;
  description: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'voided' | 'overdue';
  payment_reference?: string;
  paid_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  submitted_by: string;
  submitter_name?: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  receipt_url?: string;
  department: string;
  due_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  assigned_to?: string;
  reviewed_by?: string;
  reimbursed_by?: string;
  reimbursed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_spend_this_month: number;
  total_receivables_outstanding: number;
  pending_approvals_count: number;
  expenses_by_category: Record<string, number>;
  spend_by_department: Record<string, number>;
  recent_activity: Array<{
    id: string;
    type: 'bill' | 'expense' | 'receivable';
    amount: number;
    status: string;
    created_at: string;
  }>;
}

