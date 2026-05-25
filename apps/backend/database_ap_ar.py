import sqlite3
from typing import Any
from database import get_connection, row_to_dict

def init_ap_ar_db() -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        # Vendors
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            bank_name TEXT,
            account_number TEXT,
            account_name TEXT,
            created_by TEXT NOT NULL,
            deleted_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
        """)
        # Bills (Accounts Payable)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bills (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'NGN',
            purpose TEXT NOT NULL,
            department TEXT NOT NULL,
            due_date TEXT,
            status TEXT NOT NULL DEFAULT 'pending_hod',
            created_by TEXT NOT NULL,
            creator_name TEXT,
            assigned_to TEXT,
            approved_by_hod TEXT,
            approved_by_ceo TEXT,
            paid_by TEXT,
            payment_reference TEXT,
            paid_at TEXT,
            rejection_reason TEXT,
            deleted_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (vendor_id) REFERENCES vendors(id)
        )
        """)
        # Customers
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            created_by TEXT NOT NULL,
            deleted_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
        """)
        # Receivable Invoices (Accounts Receivable)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS receivable_invoices (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'NGN',
            description TEXT NOT NULL,
            due_date TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            payment_reference TEXT,
            paid_at TEXT,
            created_by TEXT NOT NULL,
            deleted_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
        """)
        # Expense Claims
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS expense_claims (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            submitted_by TEXT NOT NULL,
            submitter_name TEXT,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'NGN',
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            receipt_url TEXT,
            department TEXT NOT NULL,
            due_date TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            assigned_to TEXT,
            reviewed_by TEXT,
            reimbursed_by TEXT,
            reimbursed_at TEXT,
            rejection_reason TEXT,
            deleted_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
        """)
        # Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bills_company_status ON bills(company_id, status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bills_vendor ON bills(vendor_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bills_assigned ON bills(assigned_to)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_receivables_company ON receivable_invoices(company_id, status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_receivables_customer ON receivable_invoices(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_company ON expense_claims(company_id, status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expense_claims(submitted_by)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vendors_company ON vendors(company_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id)")

def create_vendor(vendor: dict) -> dict:
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO vendors (id, company_id, name, email, phone, bank_name, account_number, account_name, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (vendor['id'], vendor['company_id'], vendor['name'], vendor.get('email'), vendor.get('phone'), 
              vendor.get('bank_name'), vendor.get('account_number'), vendor.get('account_name'), vendor['created_by']))
    return get_vendor(vendor['id'], vendor['company_id'])

def get_vendor(vendor_id: str, company_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM vendors WHERE id = ? AND company_id = ? AND deleted_at IS NULL", (vendor_id, company_id)).fetchone()
        return row_to_dict(row)

def list_vendors(company_id: str, search: str = None) -> list[dict]:
    query = "SELECT * FROM vendors WHERE company_id = ? AND deleted_at IS NULL"
    params = [company_id]
    if search:
        query += " AND name LIKE ?"
        params.append(f"%{search}%")
    with get_connection() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def update_vendor(vendor_id: str, company_id: str, fields: dict) -> dict | None:
    with get_connection() as conn:
        for key, value in fields.items():
            conn.execute(f"UPDATE vendors SET {key} = ? WHERE id = ? AND company_id = ?", (value, vendor_id, company_id))
    return get_vendor(vendor_id, company_id)

def delete_vendor(vendor_id: str, company_id: str) -> bool:
    with get_connection() as conn:
        res = conn.execute("UPDATE vendors SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?", (vendor_id, company_id))
        return res.rowcount > 0

def create_bill(bill: dict) -> dict:
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO bills (id, company_id, vendor_id, amount, currency, purpose, department, due_date, status, created_by, creator_name, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (bill['id'], bill['company_id'], bill['vendor_id'], bill['amount'], bill.get('currency', 'NGN'), bill['purpose'], 
              bill['department'], bill.get('due_date'), bill.get('status', 'pending_hod'), bill['created_by'], bill.get('creator_name'), bill.get('assigned_to')))
    return get_bill(bill['id'], bill['company_id'])

def get_bill(bill_id: str, company_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("""
            SELECT b.*, v.name as vendor_name 
            FROM bills b 
            JOIN vendors v ON b.vendor_id = v.id 
            WHERE b.id = ? AND b.company_id = ? AND b.deleted_at IS NULL
        """, (bill_id, company_id)).fetchone()
        return row_to_dict(row)

def list_bills(company_id: str, status=None, department=None, vendor_id=None, created_by=None, assigned_to=None) -> list[dict]:
    query = "SELECT * FROM bills WHERE company_id = ? AND deleted_at IS NULL"
    params = [company_id]
    if status:
        query += " AND status = ?"; params.append(status)
    if department:
        query += " AND lower(department) = lower(?)"; params.append(department)
    if vendor_id:
        query += " AND vendor_id = ?"; params.append(vendor_id)
    if created_by:
        query += " AND created_by = ?"; params.append(created_by)
    if assigned_to:
        query += " AND assigned_to = ?"; params.append(assigned_to)
    query += " ORDER BY created_at DESC"
    with get_connection() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def approve_bill_by_hod(bill_id: str, approver_id: str, ceo_id: str) -> dict | None:
    with get_connection() as conn:
        cursor = conn.execute("""
            UPDATE bills SET status = 'pending_ceo', assigned_to = ?, approved_by_hod = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending_hod'
        """, (ceo_id, approver_id, bill_id))
        if cursor.rowcount == 0: return None
    return row_to_dict(conn.execute("SELECT * FROM bills WHERE id = ?", (bill_id,)).fetchone())

def approve_bill_by_ceo(bill_id: str, approver_id: str, account_officer_id: str) -> dict | None:
    with get_connection() as conn:
        cursor = conn.execute("""
            UPDATE bills SET status = 'ready_for_payment', assigned_to = ?, approved_by_ceo = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending_ceo'
        """, (account_officer_id, approver_id, bill_id))
        if cursor.rowcount == 0: return None
    return row_to_dict(conn.execute("SELECT * FROM bills WHERE id = ?", (bill_id,)).fetchone())

def mark_bill_paid(bill_id: str, paid_by: str, payment_reference: str = None) -> dict | None:
    with get_connection() as conn:
        cursor = conn.execute("""
            UPDATE bills SET status = 'paid', paid_by = ?, payment_reference = ?, paid_at = CURRENT_TIMESTAMP, assigned_to = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'ready_for_payment'
        """, (paid_by, payment_reference, bill_id))
        if cursor.rowcount == 0: return None
    return row_to_dict(conn.execute("SELECT * FROM bills WHERE id = ?", (bill_id,)).fetchone())

def reject_bill(bill_id: str, reason: str = None) -> dict | None:
    with get_connection() as conn:
        cursor = conn.execute("""
            UPDATE bills SET status = 'rejected', rejection_reason = ?, assigned_to = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status IN ('pending_hod', 'pending_ceo')
        """, (reason, bill_id))
        if cursor.rowcount == 0: return None
    return row_to_dict(conn.execute("SELECT * FROM bills WHERE id = ?", (bill_id,)).fetchone())

def get_bills_aging(company_id: str) -> dict:
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT 
                CASE 
                    WHEN CAST(julianday('now') - julianday(due_date) AS INTEGER) <= 0 THEN 'current'
                    WHEN CAST(julianday('now') - julianday(due_date) AS INTEGER) BETWEEN 1 AND 30 THEN 'overdue_1_30'
                    WHEN CAST(julianday('now') - julianday(due_date) AS INTEGER) BETWEEN 31 AND 60 THEN 'overdue_31_60'
                    WHEN CAST(julianday('now') - julianday(due_date) AS INTEGER) BETWEEN 61 AND 90 THEN 'overdue_61_90'
                    ELSE 'overdue_90_plus'
                END as age_bucket,
                COUNT(*) as count,
                SUM(amount) as total
            FROM bills
            WHERE company_id = ? AND status NOT IN ('paid', 'rejected') AND deleted_at IS NULL
            GROUP BY age_bucket
        """, (company_id,)).fetchall()
        res = {k: {"count": 0, "total": 0.0} for k in ['current', 'overdue_1_30', 'overdue_31_60', 'overdue_61_90', 'overdue_90_plus']}
        for row in rows: res[row['age_bucket']] = {"count": row['count'], "total": row['total']}
        return res

def create_customer(customer: dict) -> dict:
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO customers (id, company_id, name, email, phone, address, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (customer['id'], customer['company_id'], customer['name'], customer.get('email'), customer.get('phone'), customer.get('address'), customer['created_by']))
    return get_customer(customer['id'], customer['company_id'])

def get_customer(customer_id: str, company_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM customers WHERE id = ? AND company_id = ? AND deleted_at IS NULL", (customer_id, company_id)).fetchone()
        return row_to_dict(row)

def list_customers(company_id: str, search: str = None) -> list[dict]:
    query = "SELECT * FROM customers WHERE company_id = ? AND deleted_at IS NULL"
    params = [company_id]
    if search:
        query += " AND name LIKE ?"; params.append(f"%{search}%")
    with get_connection() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def update_customer(customer_id: str, company_id: str, fields: dict) -> dict | None:
    with get_connection() as conn:
        for key, value in fields.items():
            conn.execute(f"UPDATE customers SET {key} = ? WHERE id = ? AND company_id = ?", (value, customer_id, company_id))
    return get_customer(customer_id, company_id)

def delete_customer(customer_id: str, company_id: str) -> bool:
    with get_connection() as conn:
        res = conn.execute("UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?", (customer_id, company_id))
        return res.rowcount > 0

def create_receivable(receivable: dict) -> dict:
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO receivable_invoices (id, company_id, customer_id, amount, currency, description, due_date, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (receivable['id'], receivable['company_id'], receivable['customer_id'], receivable['amount'], receivable.get('currency', 'NGN'), 
              receivable['description'], receivable.get('due_date'), receivable.get('status', 'draft'), receivable['created_by']))
    return get_receivable(receivable['id'], receivable['company_id'])

def get_receivable(receivable_id: str, company_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("""
            SELECT r.*, c.name as customer_name 
            FROM receivable_invoices r 
            JOIN customers c ON r.customer_id = c.id 
            WHERE r.id = ? AND r.company_id = ? AND r.deleted_at IS NULL
        """, (receivable_id, company_id)).fetchone()
        return row_to_dict(row)

def list_receivables(company_id: str, status=None, customer_id=None, created_by=None) -> list[dict]:
    query = "SELECT * FROM receivable_invoices WHERE company_id = ? AND deleted_at IS NULL"
    params = [company_id]
    if status:
        query += " AND status = ?"; params.append(status)
    if customer_id:
        query += " AND customer_id = ?"; params.append(customer_id)
    if created_by:
        query += " AND created_by = ?"; params.append(created_by)
    query += " ORDER BY created_at DESC"
    with get_connection() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def send_receivable(receivable_id: str, company_id: str) -> dict | None:
    with get_connection() as conn:
        conn.execute("UPDATE receivable_invoices SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ? AND status = 'draft'", (receivable_id, company_id))
    return get_receivable(receivable_id, company_id)

def mark_receivable_paid(receivable_id: str, company_id: str, payment_reference: str = None) -> dict | None:
    with get_connection() as conn:
        conn.execute("UPDATE receivable_invoices SET status = 'paid', paid_at = CURRENT_TIMESTAMP, payment_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ? AND status IN ('sent', 'overdue')", (payment_reference, receivable_id, company_id))
    return get_receivable(receivable_id, company_id)

def void_receivable(receivable_id: str, company_id: str) -> dict | None:
    with get_connection() as conn:
        conn.execute("UPDATE receivable_invoices SET status = 'voided', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ? AND status IN ('draft', 'sent')", (receivable_id, company_id))
    return get_receivable(receivable_id, company_id)

def get_overdue_receivables(company_id: str) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT *, CAST(julianday('now') - julianday(due_date) AS INTEGER) AS days_overdue
            FROM receivable_invoices
            WHERE company_id = ? AND due_date < date('now') AND status NOT IN ('paid', 'voided') AND deleted_at IS NULL
        """, (company_id,)).fetchall()
        return [dict(row) for row in rows]

def create_expense(expense: dict) -> dict:
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO expense_claims (id, company_id, submitted_by, submitter_name, amount, currency, category, description, receipt_url, department, status, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (expense['id'], expense['company_id'], expense['submitted_by'], expense.get('submitter_name'), expense['amount'], 
              expense.get('currency', 'NGN'), expense['category'], expense['description'], expense.get('receipt_url'), 
              expense['department'], expense.get('status', 'pending'), expense.get('assigned_to')))
    return get_expense(expense['id'], expense['company_id'])

def get_expense(expense_id: str, company_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM expense_claims WHERE id = ? AND company_id = ? AND deleted_at IS NULL", (expense_id, company_id)).fetchone()
        return row_to_dict(row)

def list_expenses(company_id: str, status=None, department=None, submitted_by=None, assigned_to=None) -> list[dict]:
    query = "SELECT * FROM expense_claims WHERE company_id = ? AND deleted_at IS NULL"
    params = [company_id]
    if status:
        query += " AND status = ?"; params.append(status)
    if department:
        query += " AND lower(department) = lower(?)"; params.append(department)
    if submitted_by:
        query += " AND submitted_by = ?"; params.append(submitted_by)
    if assigned_to:
        query += " AND assigned_to = ?"; params.append(assigned_to)
    query += " ORDER BY created_at DESC"
    with get_connection() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def approve_expense(expense_id: str, reviewed_by_id: str, account_officer_id: str) -> dict | None:
    with get_connection() as conn:
        conn.execute("UPDATE expense_claims SET status = 'approved', reviewed_by = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'", (reviewed_by_id, account_officer_id, expense_id))
    return row_to_dict(conn.execute("SELECT * FROM expense_claims WHERE id = ?", (expense_id,)).fetchone())

def reject_expense(expense_id: str, reviewed_by_id: str, reason: str = None) -> dict | None:
    with get_connection() as conn:
        conn.execute("UPDATE expense_claims SET status = 'rejected', reviewed_by = ?, rejection_reason = ?, assigned_to = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'", (reviewed_by_id, reason, expense_id))
    return row_to_dict(conn.execute("SELECT * FROM expense_claims WHERE id = ?", (expense_id,)).fetchone())

def reimburse_expense(expense_id: str, reimbursed_by_id: str) -> dict | None:
    with get_connection() as conn:
        conn.execute("UPDATE expense_claims SET status = 'reimbursed', reimbursed_by = ?, reimbursed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'approved'", (reimbursed_by_id, expense_id))
    return row_to_dict(conn.execute("SELECT * FROM expense_claims WHERE id = ?", (expense_id,)).fetchone())

def get_dashboard_summary(company_id: str, user_id: str, role: str, department: str = None) -> dict:
    with get_connection() as conn:
        spend = conn.execute("SELECT SUM(amount) FROM bills WHERE company_id = ? AND status = 'paid' AND strftime('%Y-%m', paid_at) = strftime('%Y-%m','now')", (company_id,)).fetchone()[0] or 0.0
        ar = conn.execute("SELECT SUM(amount) FROM receivable_invoices WHERE company_id = ? AND status IN ('sent', 'overdue')", (company_id,)).fetchone()[0] or 0.0
        pending = (conn.execute("SELECT COUNT(*) FROM bills WHERE assigned_to = ? AND status IN ('pending_hod', 'pending_ceo', 'ready_for_payment')", (user_id,)).fetchone()[0] or 0) + \
                  (conn.execute("SELECT COUNT(*) FROM expense_claims WHERE assigned_to = ? AND status = 'pending'", (user_id,)).fetchone()[0] or 0)
        
        exp_cat_rows = conn.execute("SELECT category, SUM(amount) FROM expense_claims WHERE company_id = ? AND status IN ('approved', 'reimbursed') GROUP BY category", (company_id,)).fetchall()
        dept_spend_rows = conn.execute("SELECT department, SUM(amount) FROM bills WHERE company_id = ? AND status = 'paid' GROUP BY department", (company_id,)).fetchall()
        
        recent = conn.execute("""
            SELECT id, 'bill' as type, amount, status, created_at FROM bills WHERE company_id = ? AND deleted_at IS NULL
            UNION ALL
            SELECT id, 'expense' as type, amount, status, created_at FROM expense_claims WHERE company_id = ? AND deleted_at IS NULL
            UNION ALL
            SELECT id, 'receivable' as type, amount, status, created_at FROM receivable_invoices WHERE company_id = ? AND deleted_at IS NULL
            ORDER BY created_at DESC LIMIT 10
        """, (company_id, company_id, company_id)).fetchall()

        return {
            "total_spend_this_month": float(spend),
            "total_receivables_outstanding": float(ar),
            "pending_approvals_count": int(pending),
            "expenses_by_category": {r[0]: r[1] for r in exp_cat_rows},
            "spend_by_department": {r[0]: r[1] for r in dept_spend_rows},
            "recent_activity": [dict(r) for r in recent]
        }