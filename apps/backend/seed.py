import sqlite3

from auth import hash_password
from database import DB_PATH, init_db


COMPANY_ID = "company_acme"
HOD_ID = "user_hod_marketing"
TECH_HOD_ID = "user_hod_tech"
SALES_HOD_ID = "user_hod_sales"
STAFF_ID = "user_staff_marketing"
TECH_STAFF_ID = "user_staff_tech"
SALES_STAFF_ID = "user_staff_sales"
CEO_ID = "user_ceo"
ACCOUNT_OFFICER_ID = "user_account_officer"


def seed() -> None:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM invoice_comments WHERE company_id = ?", (COMPANY_ID,))
    cursor.execute("DELETE FROM invoices WHERE company_id = ?", (COMPANY_ID,))
    cursor.execute("DELETE FROM slack_channels WHERE company_id = ?", (COMPANY_ID,))
    cursor.execute("DELETE FROM users WHERE company_id = ?", (COMPANY_ID,))
    cursor.execute("DELETE FROM companies WHERE id = ?", (COMPANY_ID,))

    cursor.execute(
        """
        INSERT OR REPLACE INTO companies (id, name)
        VALUES (?, ?)
        """,
        (COMPANY_ID, "Acme Ltd"),
    )

    demo_password_hash = hash_password("Password123!")
    users = [
        (HOD_ID, COMPANY_ID, "Ayo (HOD Marketing)", "ayo@acme.com", "+2349041167450", "hod", "marketing", demo_password_hash),
        (TECH_HOD_ID, COMPANY_ID, "Ada (HOD Tech)", "ada@acme.com", "+2348000000001", "hod", "tech", demo_password_hash),
        (SALES_HOD_ID, COMPANY_ID, "Bola (HOD Sales)", "bola@acme.com", "+2348000000002", "hod", "sales", demo_password_hash),
        (STAFF_ID, COMPANY_ID, "John (Staff Marketing)", "john@acme.com", "+2349051395788", "staff", "marketing", demo_password_hash),
        (TECH_STAFF_ID, COMPANY_ID, "Ife (Staff Tech)", "ife@acme.com", "+2348000000003", "staff", "tech", demo_password_hash),
        (SALES_STAFF_ID, COMPANY_ID, "Zainab (Staff Sales)", "zainab@acme.com", "+2348000000004", "staff", "sales", demo_password_hash),
        (CEO_ID, COMPANY_ID, "Mary (CEO)", "mary@acme.com", "+2348136560624", "ceo", "company", demo_password_hash),
        (ACCOUNT_OFFICER_ID, COMPANY_ID, "Tola (Account Officer)", "tola@acme.com", "+2348000000000", "account_officer", "finance", demo_password_hash),
    ]

    cursor.executemany(
        """
        INSERT OR REPLACE INTO users (id, company_id, name, email, phone, role, department, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        users,
    )

    conn.commit()
    conn.close()

    print("Seed data inserted successfully")
    print("Company ID:", COMPANY_ID)
    print("Marketing Staff ID:", STAFF_ID)
    print("Marketing HOD ID:", HOD_ID)
    print("Tech Staff ID:", TECH_STAFF_ID)
    print("Tech HOD ID:", TECH_HOD_ID)
    print("Sales Staff ID:", SALES_STAFF_ID)
    print("Sales HOD ID:", SALES_HOD_ID)
    print("CEO ID:", CEO_ID)
    print("Account Officer ID:", ACCOUNT_OFFICER_ID)
    print("Demo password for all users: Password123!")


if __name__ == "__main__":
    seed()
