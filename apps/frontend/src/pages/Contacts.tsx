import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { vendorApi, customerApi } from '../api/ap_ar';
import type { Vendor, Customer } from '../types';
import { Plus, Search, Trash2, Edit2, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export const Contacts = () => {
  usePageTitle('Partners & Clients');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'vendors' | 'customers'>('vendors');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    email: '',
    phone: '',
    bank_name: '',
    account_number: '',
    account_name: '',
  });
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'vendors') {
        const data = await vendorApi.getAll(searchQuery);
        setVendors(data);
      } else {
        const data = await customerApi.getAll(searchQuery);
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch contact directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [activeTab, searchQuery]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedId(null);
    setVendorForm({ name: '', email: '', phone: '', bank_name: '', account_number: '', account_name: '' });
    setCustomerForm({ name: '', email: '', phone: '', address: '' });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (contact: any) => {
    setModalMode('edit');
    setSelectedId(contact.id);
    setError(null);
    if (activeTab === 'vendors') {
      setVendorForm({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        bank_name: contact.bank_name || '',
        account_number: contact.account_number || '',
        account_name: contact.account_name || '',
      });
    } else {
      setCustomerForm({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (activeTab === 'vendors') {
        if (modalMode === 'create') {
          await vendorApi.create(vendorForm);
        } else if (selectedId) {
          await vendorApi.update(selectedId, vendorForm);
        }
      } else {
        if (modalMode === 'create') {
          await customerApi.create(customerForm);
        } else if (selectedId) {
          await customerApi.update(selectedId, customerForm);
        }
      }
      setShowModal(false);
      fetchContacts();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    try {
      if (activeTab === 'vendors') {
        await vendorApi.delete(id);
      } else {
        await customerApi.delete(id);
      }
      fetchContacts();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to delete contact.');
    }
  };

  const hasWriteAccess = user?.role === 'ceo' || user?.role === 'hod';

  return (
    <Layout>
      <style>{`
        .ct-root { font-family: 'Nunito Sans', sans-serif; }
        
        .ct-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px;
          flex-wrap: wrap;
        }
        .ct-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 8px;
        }
        .ct-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 500;
          color: #0A0A0A;
          line-height: 1;
          letter-spacing: -1px;
        }
        .ct-title em {
          font-style: italic;
          font-weight: 400;
          color: #888;
        }
        .ct-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .search-wrap {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 15px;
          height: 15px;
          color: #BFBBBB;
          pointer-events: none;
        }
        .search-input {
          height: 42px;
          width: 220px;
          background: white;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          padding: 0 16px 0 40px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #0A0A0A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .search-input::placeholder { color: #C4C0B8; }
        .search-input:focus {
          border-color: #0A0A0A;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }
        
        .new-btn {
          height: 42px;
          padding: 0 20px;
          background: #0A0A0A;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .new-btn:hover { background: #222; }
        .new-btn:active { transform: scale(0.98); }
        .new-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .tabs-container {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          border-bottom: 1px solid #E8E6E1;
          padding-bottom: 12px;
        }
        .tab-btn {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 500;
          background: none;
          border: none;
          color: #BFBBBB;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.15s;
          position: relative;
        }
        .tab-btn:hover { color: #0A0A0A; }
        .tab-btn.active { color: #0A0A0A; font-weight: 600; }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -13px;
          left: 0;
          right: 0;
          height: 2px;
          background: #0A0A0A;
        }

        .table-panel {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .ct-table { width: 100%; border-collapse: collapse; }
        .ct-table thead tr { border-bottom: 1px solid #F0EDE8; }
        .ct-table th {
          padding: 12px 16px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #BFBBBB;
          text-align: left;
        }
        .ct-table tbody tr {
          border-bottom: 1px solid #F7F6F3;
          transition: background 0.12s;
        }
        .ct-table tbody tr:last-child { border-bottom: none; }
        .ct-table tbody tr:hover { background: #FAFAF8; }
        .ct-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #0A0A0A;
          vertical-align: middle;
        }
        
        .td-name { font-weight: 600; }
        .td-details { color: #888; font-size: 13px; }
        .td-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .action-btn {
          width: 32px; height: 32px;
          border-radius: 6px;
          background: transparent;
          border: 1.5px solid #E8E6E1;
          display: flex; align-items: center; justify-content: center;
          color: #BFBBBB; cursor: pointer;
          transition: all 0.15s;
        }
        .action-btn:hover { color: #0A0A0A; border-color: #0A0A0A; }
        .action-btn.danger:hover { color: #D73A49; border-color: #D73A49; background: #FEF0F0; }
        
        /* Modal dialog layout */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.15);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
        }
        .modal-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 16px;
          width: 100%; max-width: 520px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.12);
          overflow: hidden;
          animation: modal-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modal-enter {
          from { transform: scale(0.95) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .modal-header {
          padding: 24px; border-bottom: 1px solid #F0EDE8;
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 500; color: #0A0A0A;
        }
        .close-btn {
          background: none; border: none; cursor: pointer; color: #BFBBBB;
          transition: color 0.15s;
        }
        .close-btn:hover { color: #0A0A0A; }
        
        .modal-body { padding: 24px; }
        
        .form-group { margin-bottom: 16px; }
        .form-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #999; margin-bottom: 8px; display: block;
        }
        .form-input {
          width: 100%;
          background: #FAFAF8;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          padding: 10px 14px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          color: #0A0A0A; outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .form-input:focus { border-color: #0A0A0A; background: white; }
        
        .modal-footer {
          padding: 16px 24px; background: #FAFAF8;
          border-top: 1px solid #F0EDE8;
          display: flex; justify-content: flex-end; gap: 12px;
        }
        .btn-cancel {
          height: 40px; padding: 0 16px;
          background: white; border: 1.5px solid #E8E6E1;
          border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 700;
          color: #555; cursor: pointer; transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #0A0A0A; color: #0A0A0A; }
        .btn-save {
          height: 40px; padding: 0 20px;
          background: #0A0A0A; border: none;
          border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 700;
          color: white; cursor: pointer; transition: background 0.15s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-save:hover { background: #222; }
        
        .empty-state { padding: 60px 24px; text-align: center; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 18px; color: #0A0A0A; margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: #BFBBBB; }

        .error-alert {
          background: #FEF2F2; border: 1.5px solid #F8C9C9;
          border-radius: 8px; padding: 12px; color: #991B1B;
          font-size: 12px; font-weight: 600; margin-bottom: 16px;
        }
      `}</style>

      <div className="ct-root">
        {/* Header */}
        <header className="ct-header">
          <div>
            <p className="ct-eyebrow">Directory · Workspace</p>
            <h1 className="ct-title">
              Contact <em>Directory</em>
            </h1>
          </div>
          <div className="ct-header-actions">
            <div className="search-wrap">
              <Search className="search-icon" />
              <input
                className="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
              />
            </div>
            <button 
              className="new-btn" 
              onClick={handleOpenCreate}
              disabled={!hasWriteAccess}
            >
              <Plus size={15} />
              Add {activeTab === 'vendors' ? 'Vendor' : 'Customer'}
            </button>
          </div>
        </header>

        {/* Tab Controls */}
        <div className="tabs-container">
          <button
            className={`tab-btn${activeTab === 'vendors' ? ' active' : ''}`}
            onClick={() => { setActiveTab('vendors'); setSearchQuery(''); }}
          >
            Vendors
          </button>
          <button
            className={`tab-btn${activeTab === 'customers' ? ' active' : ''}`}
            onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}
          >
            Customers
          </button>
        </div>

        {/* Directory Listing Table */}
        <div className="table-panel">
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#BFBBBB' }}>
              <Loader2 className="animate-spin" style={{ margin: '0 auto 12px' }} />
              Loading directory items...
            </div>
          ) : activeTab === 'vendors' ? (
            vendors.length === 0 ? (
              <div className="empty-state">
                <p className="empty-title">No vendors found</p>
                <p className="empty-sub">Add a vendor to start filing accounts payable bills.</p>
              </div>
            ) : (
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Settlement Bank</th>
                    <th>Account Details</th>
                    <th style={{ width: 100 }} />
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id}>
                      <td className="td-name">{v.name}</td>
                      <td>{v.email || '—'}</td>
                      <td>{v.phone || '—'}</td>
                      <td className="td-details">{v.bank_name || '—'}</td>
                      <td className="td-details">
                        {v.account_number ? `${v.account_number} (${v.account_name || 'No Name'})` : '—'}
                      </td>
                      <td>
                        <div className="td-actions">
                          <button
                            className="action-btn"
                            title="Edit Vendor"
                            onClick={() => handleOpenEdit(v)}
                            disabled={!hasWriteAccess}
                          >
                            <Edit2 size={13} />
                          </button>
                          {user?.role === 'ceo' && (
                            <button
                              className="action-btn danger"
                              title="Delete Vendor"
                              onClick={() => handleDelete(v.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            customers.length === 0 ? (
              <div className="empty-state">
                <p className="empty-title">No customers found</p>
                <p className="empty-sub">Add a customer to start issuing receivable invoices.</p>
              </div>
            ) : (
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Billing Address</th>
                    <th style={{ width: 100 }} />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="td-name">{c.name}</td>
                      <td>{c.email || '—'}</td>
                      <td>{c.phone || '—'}</td>
                      <td className="td-details">{c.address || '—'}</td>
                      <td>
                        <div className="td-actions">
                          <button
                            className="action-btn"
                            title="Edit Customer"
                            onClick={() => handleOpenEdit(c)}
                            disabled={!hasWriteAccess}
                          >
                            <Edit2 size={13} />
                          </button>
                          {user?.role === 'ceo' && (
                            <button
                              className="action-btn danger"
                              title="Delete Customer"
                              onClick={() => handleDelete(c.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="modal-card">
            <div className="modal-header">
              <span className="modal-title">
                {modalMode === 'create' ? 'Create' : 'Update'} {activeTab === 'vendors' ? 'Vendor' : 'Customer'}
              </span>
              <button type="button" className="close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {error && <div className="error-alert">{error}</div>}
              
              {activeTab === 'vendors' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Vendor Company Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      placeholder="e.g. Acme Corp Inc."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                        placeholder="billing@vendor.com"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={vendorForm.phone}
                        onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                        placeholder="+234..."
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Settlement Bank Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={vendorForm.bank_name}
                      onChange={(e) => setVendorForm({ ...vendorForm, bank_name: e.target.value })}
                      placeholder="e.g. Zenith Bank Plc"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Account Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={vendorForm.account_number}
                        onChange={(e) => setVendorForm({ ...vendorForm, account_number: e.target.value })}
                        placeholder="10-digit number"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={vendorForm.account_name}
                        onChange={(e) => setVendorForm({ ...vendorForm, account_name: e.target.value })}
                        placeholder="Corporate settlement account"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Customer / Client Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      placeholder="e.g. John Doe or Chevron Nigeria"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        placeholder="accounts@client.com"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        placeholder="+234..."
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Billing Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      placeholder="e.g. 15 Ikoyi Link Road, Lagos"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={14} /> : null}
                Save Contact
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};
