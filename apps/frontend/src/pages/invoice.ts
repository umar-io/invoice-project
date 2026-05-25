export type InvoiceStatus =
    | "pending_hod"
    | "pending_ceo"
    | "ready_for_payment"
    | "paid"
    | "rejected";

export interface Invoice {
    id: string;
    company_id: string;
    amount: number;
    purpose: string;
    department: string;
    status: InvoiceStatus;
    created_by: string;
    creator_name?: string;
    hod_name?: string;
    ceo_name?: string;
    assigned_to?: string;
    approved_by_hod?: string;
    approved_by_ceo?: string;
    paid_by?: string;
    payment_reference?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
}