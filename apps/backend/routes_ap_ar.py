import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from dependencies import current_user, public_user
from events import event_bus
from database import get_hod, get_ceo, get_account_officer, get_user
import database_ap_ar as db

router = APIRouter()

# Vendors
@router.post("/vendors")
def create_vendor(req: dict, user: dict = Depends(current_user)):
    if user['role'] not in ['ceo', 'hod']: raise HTTPException(403, "CEO or HOD only")
    vendor_id = str(uuid.uuid4())
    vendor = db.create_vendor({**req, "id": vendor_id, "company_id": user['company_id'], "created_by": user['id']})
    return {"message": "Vendor created", "data": vendor}

@router.get("/vendors")
def list_vendors(search: str = None, user: dict = Depends(current_user)):
    vendors = db.list_vendors(user['company_id'], search)
    return {"items": vendors, "total": len(vendors)}

@router.get("/vendors/{id}")
def get_vendor(id: str, user: dict = Depends(current_user)):
    vendor = db.get_vendor(id, user['company_id'])
    if not vendor: raise HTTPException(404, "Vendor not found")
    return vendor

@router.put("/vendors/{id}")
def update_vendor(id: str, req: dict, user: dict = Depends(current_user)):
    if user['role'] not in ['ceo', 'hod']: raise HTTPException(403, "CEO or HOD only")
    vendor = db.update_vendor(id, user['company_id'], req)
    if not vendor: raise HTTPException(404, "Vendor not found")
    return {"message": "Vendor updated", "data": vendor}

@router.delete("/vendors/{id}")
def delete_vendor(id: str, user: dict = Depends(current_user)):
    if user['role'] != 'ceo': raise HTTPException(403, "CEO only")
    if not db.delete_vendor(id, user['company_id']): raise HTTPException(404, "Vendor not found")
    return {"message": "Vendor deleted"}

# Bills (Accounts Payable)
@router.post("/bills")
def create_bill(req: dict, user: dict = Depends(current_user)):
    if user['role'] not in ['staff', 'hod']: raise HTTPException(403, "Staff or HOD only")
    vendor = db.get_vendor(req['vendor_id'], user['company_id'])
    if not vendor: raise HTTPException(400, "Invalid vendor")
    
    hod = get_hod(req['department'], user['company_id'])
    if not hod: raise HTTPException(404, f"No HOD found for {req['department']}")

    bill_id = str(uuid.uuid4())
    bill = db.create_bill({
        **req, "id": bill_id, "company_id": user['company_id'], "created_by": user['id'], 
        "creator_name": user['name'], "assigned_to": hod['id'], "status": "pending_hod"
    })
    event_bus.emit("bill.created", {"bill_id": bill_id, "hod_email": hod['email'], "vendor_name": vendor['name'], "amount": bill['amount'], "department": bill['department']})
    return {"message": "Bill submitted", "data": bill}

@router.get("/bills")
def list_bills(status: str = None, department: str = None, vendor_id: str = None, user: dict = Depends(current_user)):
    role = user['role']
    filters = {"status": status, "department": department, "vendor_id": vendor_id}
    if role == 'ceo': res = db.list_bills(user['company_id'], **filters)
    elif role == 'hod': res = db.list_bills(user['company_id'], department=user['department'], **filters)
    elif role == 'staff': res = db.list_bills(user['company_id'], created_by=user['id'], **filters)
    elif role == 'account_officer': res = db.list_bills(user['company_id'], assigned_to=user['id'], **filters)
    else: res = []
    return {"items": res, "total": len(res)}

@router.get("/bills/{id}")
def get_bill(id: str, user: dict = Depends(current_user)):
    bill = db.get_bill(id, user['company_id'])
    if not bill: raise HTTPException(404, "Bill not found")
    return bill

@router.post("/bills/{id}/approve")
def approve_bill(id: str, req: dict = {}, user: dict = Depends(current_user)):
    bill = db.get_bill(id, user['company_id'])
    if not bill: raise HTTPException(404, "Bill not found")
    
    if bill['status'] == 'pending_hod':
        if user['role'] != 'hod' or user['department'].lower() != bill['department'].lower(): raise HTTPException(403, "Only department HOD can approve")
        ceo = get_ceo(user['company_id'])
        updated = db.approve_bill_by_hod(id, user['id'], ceo['id'])
        event_bus.emit("bill.approved.hod", {"bill_id": id, "ceo_email": ceo['email'], "department": bill['department'], "amount": bill['amount']})
    elif bill['status'] == 'pending_ceo':
        if user['role'] != 'ceo': raise HTTPException(403, "Only CEO can approve")
        ao = get_account_officer(user['company_id'])
        updated = db.approve_bill_by_ceo(id, user['id'], ao['id'])
        event_bus.emit("bill.approved.ceo", {"bill_id": id, "account_officer_email": ao['email'], "amount": bill['amount']})
    else: raise HTTPException(400, "Invalid state for approval")
    return {"message": "Bill approved", "data": updated}

@router.post("/bills/{id}/reject")
def reject_bill(id: str, req: dict, user: dict = Depends(current_user)):
    bill = get_bill(id, user['company_id'])
    if not bill: raise HTTPException(404, "Bill not found")
    if bill['status'] == 'pending_hod' and user['role'] != 'hod': raise HTTPException(403, "HOD only")
    if bill['status'] == 'pending_ceo' and user['role'] != 'ceo': raise HTTPException(403, "CEO only")
    
    updated = reject_bill(id, req.get('reason'))
    creator = get_user(bill['created_by'])
    event_bus.emit("bill.rejected", {"bill_id": id, "staff_email": creator['email'] if creator else None, "reason": req.get('reason')})
    return {"message": "Bill rejected", "data": updated}

@router.post("/bills/{id}/mark-paid")
def mark_bill_paid(id: str, req: dict = {}, user: dict = Depends(current_user)):
    if user['role'] != 'account_officer': raise HTTPException(403, "Account officer only")
    updated = db.mark_bill_paid(id, user['id'], req.get('payment_reference'))
    creator = get_user(updated['created_by'])
    event_bus.emit("bill.paid", {"bill_id": id, "staff_email": creator['email'] if creator else None, "payment_reference": req.get('payment_reference'), "amount": updated['amount']})
    return {"message": "Bill marked as paid", "data": updated}

@router.get("/bills/aging")
def get_aging(user: dict = Depends(current_user)):
    if user['role'] not in ['ceo', 'account_officer']: raise HTTPException(403)
    return db.get_bills_aging(user['company_id'])

# Customers
@router.post("/customers")
def create_customer(req: dict, user: dict = Depends(current_user)):
    customer_id = str(uuid.uuid4())
    customer = db.create_customer({**req, "id": customer_id, "company_id": user['company_id'], "created_by": user['id']})
    return {"message": "Customer created", "data": customer}

@router.get("/customers")
def list_customers(search: str = None, user: dict = Depends(current_user)):
    customers = db.list_customers(user['company_id'], search)
    return {"items": customers, "total": len(customers)}

@router.put("/customers/{id}")
def update_customer(id: str, req: dict, user: dict = Depends(current_user)):
    if user['role'] not in ['ceo', 'hod']: raise HTTPException(403)
    customer = db.update_customer(id, user['company_id'], req)
    return {"message": "Customer updated", "data": customer}

@router.delete("/customers/{id}")
def delete_customer(id: str, user: dict = Depends(current_user)):
    if user['role'] != 'ceo': raise HTTPException(403)
    db.delete_customer(id, user['company_id'])
    return {"message": "Customer deleted"}

# Receivables
@router.post("/receivables")
def create_receivable(req: dict, user: dict = Depends(current_user)):
    cust = db.get_customer(req['customer_id'], user['company_id'])
    if not cust: raise HTTPException(400, "Invalid customer")
    rec_id = str(uuid.uuid4())
    rec = db.create_receivable({**req, "id": rec_id, "company_id": user['company_id'], "created_by": user['id'], "status": "draft"})
    return {"message": "Receivable created", "data": rec}

@router.get("/receivables")
def list_receivables(status: str = None, customer_id: str = None, user: dict = Depends(current_user)):
    role = user['role']
    if role == 'ceo': res = db.list_receivables(user['company_id'], status, customer_id)
    elif role == 'hod': res = db.list_receivables(user['company_id'], status, customer_id)
    else: res = db.list_receivables(user['company_id'], status, customer_id, created_by=user['id'])
    return {"items": res, "total": len(res)}

@router.post("/receivables/{id}/send")
def send_receivable(id: str, user: dict = Depends(current_user)):
    rec = db.send_receivable(id, user['company_id'])
    cust = db.get_customer(rec['customer_id'], user['company_id'])
    event_bus.emit("receivable.sent", {"invoice_id": id, "customer_email": cust['email'], "amount": rec['amount'], "due_date": rec['due_date']})
    return {"message": "Receivable sent", "data": rec}

@router.post("/receivables/{id}/mark-paid")
def mark_rec_paid(id: str, req: dict, user: dict = Depends(current_user)):
    rec = db.mark_receivable_paid(id, user['company_id'], req.get('payment_reference'))
    event_bus.emit("receivable.paid", {"invoice_id": id, "amount": rec['amount'], "payment_reference": req.get('payment_reference')})
    return {"message": "Receivable paid", "data": rec}

# Expenses
@router.post("/expenses")
def create_expense(req: dict, user: dict = Depends(current_user)):
    hod = get_hod(user['department'], user['company_id'])
    status = "pending"
    assigned_to = hod['id'] if hod and user['id'] != hod['id'] else get_account_officer(user['company_id'])['id']
    
    exp_id = str(uuid.uuid4())
    exp = db.create_expense({**req, "id": exp_id, "company_id": user['company_id'], "submitted_by": user['id'], "submitter_name": user['name'], "status": status, "assigned_to": assigned_to, "department": user['department']})
    event_bus.emit("expense.submitted", {"expense_id": exp_id, "hod_email": hod['email'] if hod else None, "amount": exp['amount'], "category": exp['category']})
    return {"message": "Expense submitted", "data": exp}

@router.get("/expenses")
def list_expenses(status: str = None, category: str = None, user: dict = Depends(current_user)):
    role = user['role']
    if role == 'ceo': res = db.list_expenses(user['company_id'], status)
    elif role == 'hod': res = db.list_expenses(user['company_id'], status, department=user['department'])
    elif role == 'staff': res = db.list_expenses(user['company_id'], status, submitted_by=user['id'])
    elif role == 'account_officer': res = db.list_expenses(user['company_id'], status, assigned_to=user['id'])
    else: res = []
    return {"items": res, "total": len(res)}

@router.post("/expenses/{id}/approve")
def approve_expense(id: str, user: dict = Depends(current_user)):
    if user['role'] != 'hod': raise HTTPException(403)
    ao = get_account_officer(user['company_id'])
    exp = db.approve_expense(id, user['id'], ao['id'])
    event_bus.emit("expense.approved", {"expense_id": id, "account_officer_email": ao['email'], "amount": exp['amount']})
    return {"message": "Expense approved", "data": exp}

@router.post("/expenses/{id}/reimburse")
def reimburse_expense(id: str, user: dict = Depends(current_user)):
    if user['role'] != 'account_officer': raise HTTPException(403)
    exp = db.reimburse_expense(id, user['id'])
    creator = get_user(exp['submitted_by'])
    event_bus.emit("expense.reimbursed", {"expense_id": id, "staff_email": creator['email'], "amount": exp['amount']})
    return {"message": "Expense reimbursed", "data": exp}

@router.get("/dashboard/summary")
def dashboard_summary(user: dict = Depends(current_user)):
    summary = db.get_dashboard_summary(user['company_id'], user['id'], user['role'], user.get('department'))
    return summary