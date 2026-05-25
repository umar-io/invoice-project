import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Building2, Hash, Bell, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext"
import { usePageTitle } from '../hooks/usePageTitle';

export const Settings = () => {
    usePageTitle('Settings');
    const navigate = useNavigate();
    // const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

    // Local state for settings
    const [settings, setSettings] = useState({
        companyName: user?.company_name || '',
        logoUrl: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        slackWebhook: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
    };

    return (
        <Layout>
            <style>{`
        .st-root { font-family: 'Nunito Sans', sans-serif; max-width: 1080px; margin: 0 auto; }

        .st-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          color: #888; background: none; border: none; cursor: pointer;
          padding: 0; margin-bottom: 18px; font-family: inherit;
          transition: color 0.15s;
        }
        .st-back:hover { color: #0A0A0A; }

        .st-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 48px; padding-bottom: 32px;
          border-bottom: 1px solid #E8E6E1;
          gap: 24px; flex-wrap: wrap;
        }
        .st-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #999; margin-bottom: 8px;
        }
        .st-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px; font-weight: 500; color: #0A0A0A;
          line-height: 1; letter-spacing: -1px;
        }
        .st-title em { font-style: italic; font-weight: 400; color: #888; }

        .st-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }

        .st-card {
          background: white;
          border: 1px solid #E8E6E1;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 24px;
        }
        .st-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 600; color: #0A0A0A;
          margin-bottom: 24px; display: flex; align-items: center; gap: 10px;
        }

        .st-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #999;
          margin-bottom: 10px; display: block;
        }

        .st-input {
          width: 100%;
          background: #FAFAF8;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px;
          color: #0A0A0A; outline: none;
          transition: all 0.15s;
          box-sizing: border-box;
        }
        .st-input:focus {
          border-color: #0A0A0A; background: white;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
        }

        .st-form-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
          margin-bottom: 20px;
        }

        .st-save-bar {
          position: sticky; bottom: 32px;
          background: #0A0A0A; color: white;
          padding: 16px 24px; border-radius: 12px;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          z-index: 10; margin-top: 40px;
        }
        .st-save-btn {
          background: white; color: #0A0A0A;
          border: none; border-radius: 6px;
          padding: 8px 18px; font-size: 13px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: all 0.15s;
        }
        .st-save-btn:hover { background: #F0EDE8; }

        .st-aside-info {
          font-size: 13px; color: #888; line-height: 1.6;
        }
        .st-aside-info strong { color: #0A0A0A; display: block; margin-bottom: 4px; }

        @media (max-width: 900px) {
          .st-grid { grid-template-columns: 1fr; }
          .st-form-row { grid-template-columns: 1fr; }
        }
      `}</style>

            <div className="st-root">
                <button onClick={() => navigate('/dashboard')} className="st-back">
                    <ArrowLeft size={14} />
                    Return to Ledger
                </button>

                <header className="st-header">
                    <div>
                        <p className="st-eyebrow">Administration</p>
                        <h1 className="st-title">
                            System <em>Settings</em>
                        </h1>
                    </div>
                </header>

                <form onSubmit={handleSave}>
                    <div className="st-grid">
                        <div className="st-main">
                            {/* Company Section */}
                            <section className="st-card">
                                <h2 className="st-card-title">
                                    <Building2 size={20} strokeWidth={1.5} />
                                    Company Profile
                                </h2>
                                <div className="st-form-row">
                                    <div>
                                        <label className="st-label">Entity Name</label>
                                        <input
                                            className="st-input"
                                            value={settings.companyName}
                                            onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="st-label">Logo URL</label>
                                        <input
                                            className="st-input"
                                            placeholder="https://assets.company.com/logo.png"
                                            value={settings.logoUrl}
                                            onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Treasury Section */}
                            <section className="st-card">
                                <h2 className="st-card-title">
                                    <Hash size={20} strokeWidth={1.5} />
                                    Settlement Account
                                </h2>
                                <div className="st-form-row">
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="st-label">Bank Name</label>
                                        <input
                                            className="st-input"
                                            placeholder="e.g. Zenith Bank PLC"
                                            value={settings.bankName}
                                            onChange={e => setSettings({ ...settings, bankName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="st-form-row">
                                    <div>
                                        <label className="st-label">Account Number</label>
                                        <input
                                            className="st-input"
                                            placeholder="10 digits"
                                            value={settings.accountNumber}
                                            onChange={e => setSettings({ ...settings, accountNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="st-label">Account Name</label>
                                        <input
                                            className="st-input"
                                            placeholder="As registered with NIBSS"
                                            value={settings.accountName}
                                            onChange={e => setSettings({ ...settings, accountName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Notifications Section */}
                            <section className="st-card">
                                <h2 className="st-card-title">
                                    <Bell size={20} strokeWidth={1.5} />
                                    Integrations
                                </h2>
                                <div>
                                    <label className="st-label">Global Slack Webhook</label>
                                    <input
                                        className="st-input"
                                        placeholder="https://hooks.slack.com/services/..."
                                        value={settings.slackWebhook}
                                        onChange={e => setSettings({ ...settings, slackWebhook: e.target.value })}
                                    />
                                    <p style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                                        Notifications for new disbursement requests will be routed to this channel.
                                    </p>
                                </div>
                            </section>
                        </div>

                        <aside>
                            <div className="st-card" style={{ background: '#FAFAF8' }}>
                                <div className="st-aside-info">
                                    <strong>Workspace Authority</strong>
                                    Only users with the <code>CEO</code> or <code>Account Officer</code> role can modify these global parameters. Changes are logged for audit purposes.
                                </div>
                                <div style={{ height: '1px', background: '#E8E6E1', margin: '20px 0' }} />
                                <div className="st-aside-info">
                                    <strong>Settlement Logic</strong>
                                    The bank details provided here will appear as the default source for all generated vouchers in the ledger.
                                </div>
                            </div>

                            <div className="st-card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '24px' }}>
                                <p className="st-label" style={{ marginBottom: '0' }}>Current Version</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0' }}>v2.4.0-Pro</p>
                                <p className="st-aside-info">System is healthy</p>
                            </div>
                        </aside>
                    </div>

                    <div className="st-save-bar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#10B981', boxShadow: '0 0 0 4px rgba(16,185,129,0.2)'
                            }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
                                CONFIGURATION ACTIVE
                            </span>
                        </div>

                        <button type="submit" className="st-save-btn" disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={16} />
                                    Commit Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default Settings;