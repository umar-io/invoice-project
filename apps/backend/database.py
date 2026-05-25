import os
import sqlite3
from contextlib import contextmanager
from typing import Any


DB_PATH = os.getenv("DATABASE_URL", "app.db")


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


def init_db() -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo_url TEXT,
            payment_account_name TEXT,
            payment_bank_name TEXT,
            payment_account_number TEXT,
            payment_instructions TEXT,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS slack_channels (
            company_id TEXT NOT NULL,
            department TEXT NOT NULL,
            webhook_url TEXT NOT NULL,
            created_by TEXT,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (company_id, department),
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL,
            department TEXT NOT NULL,
            password_hash TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            amount REAL NOT NULL,
            purpose TEXT NOT NULL,
            department TEXT NOT NULL,
            status TEXT NOT NULL,
            created_by TEXT NOT NULL,
            creator_name TEXT,
            assigned_to TEXT,
            approved_by_hod TEXT,
            approved_by_ceo TEXT,
            paid_by TEXT,
            payment_reference TEXT,
            paid_at TEXT,
            rejection_reason TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (assigned_to) REFERENCES users(id)
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS invoice_comments (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            company_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            comment TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_department_role ON users(company_id, department, role)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_invoice_comments_invoice ON invoice_comments(invoice_id)")

        existing_columns = {
            row["name"] for row in cursor.execute("PRAGMA table_info(invoices)").fetchall()
        }
        for name, definition in {
            "creator_name": "TEXT",
            "approved_by_hod": "TEXT",
            "approved_by_ceo": "TEXT",
            "paid_by": "TEXT",
            "payment_reference": "TEXT",
            "paid_at": "TEXT",
            "rejection_reason": "TEXT",
            "created_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
        }.items():
            if name not in existing_columns:
                cursor.execute(f"ALTER TABLE invoices ADD COLUMN {name} {definition}")

        existing_user_columns = {
            row["name"] for row in cursor.execute("PRAGMA table_info(users)").fetchall()
        }
        for name, definition in {
            "password_hash": "TEXT",
            "created_by": "TEXT",
            "created_at": "TEXT",
        }.items():
            if name not in existing_user_columns:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {name} {definition}")

        existing_company_columns = {
            row["name"] for row in cursor.execute("PRAGMA table_info(companies)").fetchall()
        }
        for name, definition in {
            "logo_url": "TEXT",
            "payment_account_name": "TEXT",
            "payment_bank_name": "TEXT",
            "payment_account_number": "TEXT",
            "payment_instructions": "TEXT",
            "updated_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "created_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
        }.items():
            if name in existing_company_columns:
                continue

            if name in {"created_at", "updated_at"}:
                cursor.execute(f"ALTER TABLE companies ADD COLUMN {name} TEXT")
                cursor.execute(f"UPDATE companies SET {name} = CURRENT_TIMESTAMP WHERE {name} IS NULL")
            else:
                cursor.execute(f"ALTER TABLE companies ADD COLUMN {name} {definition}")

    from database_ap_ar import init_ap_ar_db
    init_ap_ar_db()


def create_company(company: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO companies (
                id, name, logo_url, payment_account_name, payment_bank_name,
                payment_account_number, payment_instructions
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                company["id"],
                company["name"],
                company.get("logo_url"),
                company.get("payment_account_name"),
                company.get("payment_bank_name"),
                company.get("payment_account_number"),
                company.get("payment_instructions"),
            ),
        )
    saved = get_company(company["id"])
    if saved is None:
        raise RuntimeError("Company was not saved")
    return saved


def get_company(company_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
        return row_to_dict(row)

def get_company_name(company_id: str) -> str | None:
    with get_connection() as conn:
        row = conn.execute("SELECT name FROM companies WHERE id = ?", (company_id,)).fetchone()
        if row:
            return row["name"]
        return None

def update_company_settings(company_id: str, settings: dict[str, Any]) -> dict[str, Any] | None:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE companies
            SET name = ?,
                logo_url = ?,
                payment_account_name = ?,
                payment_bank_name = ?,
                payment_account_number = ?,
                payment_instructions = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                settings["name"],
                settings.get("logo_url"),
                settings.get("payment_account_name"),
                settings.get("payment_bank_name"),
                settings.get("payment_account_number"),
                settings.get("payment_instructions"),
                company_id,
            ),
        )
        if cursor.rowcount == 0:
            return None
    return get_company(company_id)


def get_user(user_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("""
            SELECT u.*, c.name AS company_name, c.logo_url AS company_logo
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.id = ?
        """, (user_id,)).fetchone()
        return row_to_dict(row)


def get_user_by_email(email: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("""
            SELECT u.*, c.name AS company_name, c.logo_url AS company_logo
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE lower(u.email) = lower(?)
        """, (email,)).fetchone()
        return row_to_dict(row)


def create_user(user: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO users (
                id, company_id, name, email, phone, role, department, password_hash, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                user["company_id"],
                user["name"],
                user["email"],
                user.get("phone"),
                user["role"],
                user["department"],
                user["password_hash"],
                user.get("created_by"),
            ),
        )
    saved = get_user(user["id"])
    if saved is None:
        raise RuntimeError("User was not saved")
    return saved

def get_users_filtered(
    company_id: str | None = None,
    dept: str | None = None,
    exclude_id: str | None = None,
) -> list[dict[str, Any]]:
    with get_connection() as conn:
        query = "SELECT * FROM users WHERE 1=1"
        params = []

        if company_id:
            query += " AND company_id = ?"
            params.append(company_id)

        if dept:
            query += " AND department = ?"
            params.append(dept)
        
        if exclude_id:
            query += " AND id != ?"
            params.append(exclude_id)

        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        
        column_names = [column[0] for column in cursor.description]
        return [dict(zip(column_names, row)) for row in rows]
       
def get_hod(department: str, company_id: str | None = None) -> dict[str, Any] | None:
    query = "SELECT * FROM users WHERE role = ? AND lower(department) = lower(?)"
    params: list[Any] = ["hod", department]
    if company_id:
        query += " AND company_id = ?"
        params.append(company_id)
    query += " LIMIT 1"
    with get_connection() as conn:
        return row_to_dict(conn.execute(query, params).fetchone())


def get_ceo(company_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE company_id = ? AND role = ? LIMIT 1",
            (company_id, "ceo"),
        ).fetchone()
        return row_to_dict(row)


def get_account_officer(company_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE company_id = ? AND role = ? LIMIT 1",
            (company_id, "account_officer"),
        ).fetchone()
        return row_to_dict(row)


def create_invoice(invoice: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO invoices (
                id, company_id, amount, purpose, department, status, created_by, creator_name, assigned_to
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                invoice["id"],
                invoice["company_id"],
                invoice["amount"],
                invoice["purpose"],
                invoice["department"],
                invoice["status"],
                invoice["created_by"],
                invoice.get("creator_name"),
                invoice.get("assigned_to"),
            ),
        )
    saved = get_invoice(invoice["id"])
    if saved is None:
        raise RuntimeError("Invoice was not saved")
    return saved


def get_invoice(invoice_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
        return row_to_dict(row)


def list_invoices(
    company_id: str | None = None,
    status: str | None = None,
    department: str | None = None,
    created_by: str | None = None,
    assigned_to: str | None = None,
) -> list[dict[str, Any]]:
    with get_connection() as conn:
        query = "SELECT * FROM invoices WHERE 1=1"
        params = []

        if company_id:
            query += " AND company_id = ?"
            params.append(company_id)
        if status:
            query += " AND status = ?"
            params.append(status)
        if department:
            query += " AND lower(department) = lower(?)"
            params.append(department)
        if created_by:
            query += " AND created_by = ?"
            params.append(created_by)
        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)

        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def upsert_slack_channel(
    company_id: str,
    department: str,
    webhook_url: str,
    created_by: str,
) -> dict[str, Any]:
    normalized_department = department.strip().lower()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO slack_channels (company_id, department, webhook_url, created_by)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(company_id, department) DO UPDATE SET
                webhook_url = excluded.webhook_url,
                created_by = excluded.created_by,
                updated_at = CURRENT_TIMESTAMP
            """,
            (company_id, normalized_department, webhook_url, created_by),
        )
    saved = get_slack_channel(company_id, normalized_department)
    if saved is None:
        raise RuntimeError("Slack channel was not saved")
    return saved


def get_slack_channel(company_id: str, department: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT * FROM slack_channels
            WHERE company_id = ? AND lower(department) = lower(?)
            """,
            (company_id, department),
        ).fetchone()
        return row_to_dict(row)


def list_slack_channels(company_id: str, department: str | None = None) -> list[dict[str, Any]]:
    with get_connection() as conn:
        query = "SELECT * FROM slack_channels WHERE company_id = ?"
        params: list[Any] = [company_id]
        if department:
            query += " AND lower(department) = lower(?)"
            params.append(department)
        query += " ORDER BY department"
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def create_invoice_comment(comment: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO invoice_comments (id, invoice_id, company_id, user_id, comment)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                comment["id"],
                comment["invoice_id"],
                comment["company_id"],
                comment["user_id"],
                comment["comment"],
            ),
        )
    saved = get_invoice_comment(comment["id"])
    if saved is None:
        raise RuntimeError("Invoice comment was not saved")
    return saved


def get_invoice_comment(comment_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT invoice_comments.*, users.name AS user_name, users.role AS user_role
            FROM invoice_comments
            JOIN users ON users.id = invoice_comments.user_id
            WHERE invoice_comments.id = ?
            """,
            (comment_id,),
        ).fetchone()
        return row_to_dict(row)


def list_invoice_comments(invoice_id: str, company_id: str) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT invoice_comments.*, users.name AS user_name, users.role AS user_role
            FROM invoice_comments
            JOIN users ON users.id = invoice_comments.user_id
            WHERE invoice_comments.invoice_id = ? AND invoice_comments.company_id = ?
            ORDER BY invoice_comments.created_at ASC
            """,
            (invoice_id, company_id),
        ).fetchall()
        return [dict(row) for row in rows]


def approve_by_hod(invoice_id: str, approver_id: str, ceo_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE invoices
            SET status = ?, assigned_to = ?, approved_by_hod = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = ?
            """,
            ("pending_ceo", ceo_id, approver_id, invoice_id, "pending_hod"),
        )
        if cursor.rowcount == 0:
            return None
    return get_invoice(invoice_id)


def approve_by_ceo(invoice_id: str, approver_id: str, account_officer_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE invoices
            SET status = ?, assigned_to = ?, approved_by_ceo = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = ?
            """,
            ("ready_for_payment", account_officer_id, approver_id, invoice_id, "pending_ceo"),
        )
        if cursor.rowcount == 0:
            return None
    return get_invoice(invoice_id)


def mark_invoice_paid(invoice_id: str, paid_by: str, payment_reference: str | None = None) -> dict[str, Any] | None:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE invoices
            SET status = ?,
                assigned_to = NULL,
                paid_by = ?,
                payment_reference = ?,
                paid_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = ?
            """,
            ("paid", paid_by, payment_reference, invoice_id, "ready_for_payment"),
        )
        if cursor.rowcount == 0:
            return None
    return get_invoice(invoice_id)


def reject_invoice(invoice_id: str, reason: str | None = None) -> dict[str, Any] | None:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE invoices
            SET status = ?, assigned_to = NULL, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status IN (?, ?)
            """,
            ("rejected", reason, invoice_id, "pending_hod", "pending_ceo"),
        )
        if cursor.rowcount == 0:
            return None
    return get_invoice(invoice_id)
