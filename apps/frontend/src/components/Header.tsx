import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown, LogOut, Settings, User as UserIcon, Bell,
  LayoutDashboard, Receipt, FileText, Wallet, Users, Menu, X,
} from 'lucide-react';

const initials = (name?: string) =>
  (name || '?')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
    { to: '/bills',       label: 'Bills to Pay',         icon: Receipt },
    { to: '/receivables', label: 'Invoices to Collect',  icon: FileText },
    { to: '/expenses',    label: 'Refunds & Claims',      icon: Wallet },
    { to: '/contacts',    label: 'Partners & Clients',    icon: Users },
    { to: '/users',       label: 'Team',                  icon: UserIcon },
  ];

  return (
    <>
      <style>{`
        /* ── Base header ─────────────────────────────────── */
        .ihdr {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(247, 246, 243, 0.92);
          backdrop-filter: saturate(160%) blur(12px);
          -webkit-backdrop-filter: saturate(160%) blur(12px);
          border-bottom: 1px solid #E8E6E1;
        }
        .ihdr-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        @media (max-width: 720px) {
          .ihdr-inner { padding: 0 18px; }
        }

        /* ── Brand ───────────────────────────────────────── */
        .ihdr-left { display: flex; align-items: center; gap: 28px; }
        .ihdr-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .ihdr-mark {
          width: 28px; height: 28px;
          background: #0A0A0A; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s;
        }
        .ihdr-brand:hover .ihdr-mark { transform: scale(1.05); }
        .ihdr-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 500;
          color: #0A0A0A; letter-spacing: -0.3px;
        }
        .ihdr-brand-name em { font-style: italic; font-weight: 400; color: #888; }

        /* ── Desktop nav ─────────────────────────────────── */
        .ihdr-nav { display: flex; align-items: center; gap: 4px; }
        @media (max-width: 860px) { .ihdr-nav { display: none; } }

        .ihdr-link {
          padding: 6px 12px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
          color: #BFBBBB; text-decoration: none; border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .ihdr-link:hover { color: #0A0A0A; background: #F0EDE8; }
        .ihdr-link.active { background: #0A0A0A; color: white; }

        /* ── Right side ──────────────────────────────────── */
        .ihdr-right { display: flex; align-items: center; gap: 8px; }

        .ihdr-icon-btn {
          width: 36px; height: 36px; border-radius: 8px;
          background: transparent; border: none;
          display: flex; align-items: center; justify-content: center;
          color: #BFBBBB; cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }
        .ihdr-icon-btn:hover { color: #0A0A0A; background: #F0EDE8; }

        /* ── Hamburger (mobile only) ─────────────────────── */
        .ihdr-hamburger { display: none; }
        @media (max-width: 860px) { .ihdr-hamburger { display: flex; } }

        /* ── Profile trigger (hide name on very small) ───── */
        .ihdr-user-trigger {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px 4px 12px;
          background: white; border: 1px solid #E8E6E1;
          border-radius: 999px; cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: 'Nunito Sans', sans-serif;
        }
        .ihdr-user-trigger:hover {
          border-color: #0A0A0A;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .ihdr-user-name {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #0A0A0A;
        }
        @media (max-width: 420px) { .ihdr-user-name { display: none; } }

        .ihdr-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: #F0EDE8; border: 1px solid #E8E6E1;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #555; letter-spacing: 0.04em;
        }
        .ihdr-chev { width: 12px; height: 12px; color: #BFBBBB; }
        @media (max-width: 420px) { .ihdr-chev { display: none; } }

        /* ── Profile dropdown menu ───────────────────────── */
        .ihdr-menu {
          position: absolute; right: 0; top: calc(100% + 10px);
          width: 240px; background: white;
          border: 1px solid #E8E6E1; border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
          padding: 6px; font-family: 'Nunito Sans', sans-serif; z-index: 200;
        }
        .ihdr-menu-head {
          padding: 12px 12px 14px;
          border-bottom: 1px solid #F0EDE8; margin-bottom: 6px;
        }
        .ihdr-menu-name {
          font-size: 13px; font-weight: 700; color: #0A0A0A;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ihdr-menu-email {
          font-size: 12px; color: #888; font-weight: 400;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin-top: 2px;
        }
        .ihdr-menu-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 8px 10px; border: none;
          background: transparent; border-radius: 8px; cursor: pointer;
          font-family: 'Nunito Sans', sans-serif; font-size: 13px;
          font-weight: 600; color: #555; text-align: left;
          transition: background 0.12s, color 0.12s;
        }
        .ihdr-menu-item:hover { background: #F7F6F3; color: #0A0A0A; }
        .ihdr-menu-divider { height: 1px; background: #F0EDE8; margin: 6px 0; }
        .ihdr-menu-item.danger { color: #B91C1C; }
        .ihdr-menu-item.danger:hover { background: #FEF2F2; color: #991B1B; }

        /* ── Mobile drawer backdrop ──────────────────────── */
        .ihdr-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(10,10,10,0.35);
          backdrop-filter: blur(2px);
          z-index: 110;
          animation: ihdr-fade-in 0.2s ease;
        }
        .ihdr-backdrop.open { display: block; }

        @keyframes ihdr-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Mobile drawer panel ─────────────────────────── */
        .ihdr-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: min(300px, 82vw);
          background: #FAFAF8;
          border-right: 1px solid #E8E6E1;
          z-index: 120;
          display: flex; flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 24px rgba(0,0,0,0.10);
        }
        .ihdr-drawer.open { transform: translateX(0); }

        .ihdr-drawer-header {
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid #E8E6E1;
          flex-shrink: 0;
        }

        .ihdr-drawer-nav {
          flex: 1; overflow-y: auto;
          padding: 12px 10px;
          display: flex; flex-direction: column; gap: 2px;
        }

        .ihdr-drawer-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 10px;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          color: #666; text-decoration: none;
          transition: background 0.14s, color 0.14s;
          letter-spacing: 0.02em;
        }
        .ihdr-drawer-link:hover { background: #F0EDE8; color: #0A0A0A; }
        .ihdr-drawer-link.active {
          background: #0A0A0A; color: white;
        }
        .ihdr-drawer-link.active svg { color: white; }
        .ihdr-drawer-link svg { color: #BFBBBB; flex-shrink: 0; transition: color 0.14s; }
        .ihdr-drawer-link:hover svg { color: #555; }

        .ihdr-drawer-footer {
          padding: 16px 10px;
          border-top: 1px solid #E8E6E1;
          flex-shrink: 0;
        }
        .ihdr-drawer-user {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; margin-bottom: 4px;
        }
        .ihdr-drawer-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #F0EDE8; border: 1px solid #E8E6E1;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #555;
          flex-shrink: 0;
        }
        .ihdr-drawer-user-info { min-width: 0; }
        .ihdr-drawer-user-name {
          font-family: 'Nunito Sans', sans-serif;
          font-size: 13px; font-weight: 700; color: #0A0A0A;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ihdr-drawer-user-email {
          font-family: 'Nunito Sans', sans-serif;
          font-size: 11px; color: #999;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin-top: 1px;
        }
        .ihdr-drawer-action {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 14px; border: none;
          background: transparent; border-radius: 10px; cursor: pointer;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 13px; font-weight: 600; color: #666;
          transition: background 0.12s, color 0.12s;
        }
        .ihdr-drawer-action:hover { background: #F0EDE8; color: #0A0A0A; }
        .ihdr-drawer-action.danger { color: #B91C1C; }
        .ihdr-drawer-action.danger:hover { background: #FEF2F2; }
      `}</style>

      {/* ── Mobile backdrop ── */}
      <div
        className={`ihdr-backdrop${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile drawer ── */}
      <aside className={`ihdr-drawer${drawerOpen ? ' open' : ''}`} aria-label="Mobile navigation">
        <div className="ihdr-drawer-header">
          <Link to="/dashboard" className="ihdr-brand" onClick={() => setDrawerOpen(false)}>
            <div className="ihdr-mark">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" fill="white" />
              </svg>
            </div>
            <span className="ihdr-brand-name">Approve<em>et</em></span>
          </Link>
          <button
            className="ihdr-icon-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="ihdr-drawer-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `ihdr-drawer-link${isActive ? ' active' : ''}`
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="ihdr-drawer-footer">
          {user && (
            <div className="ihdr-drawer-user">
              <div className="ihdr-drawer-avatar">{initials(user.name)}</div>
              <div className="ihdr-drawer-user-info">
                <div className="ihdr-drawer-user-name">{user.name}</div>
                <div className="ihdr-drawer-user-email">{user.email}</div>
              </div>
            </div>
          )}
          <button
            className="ihdr-drawer-action"
            onClick={() => { setDrawerOpen(false); navigate('/settings'); }}
          >
            <Settings size={15} />
            Settings
          </button>
          <button
            className="ihdr-drawer-action danger"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main header bar ── */}
      <header className="ihdr">
        <div className="ihdr-inner">
          <div className="ihdr-left">
            {/* Hamburger — mobile only */}
            <button
              className="ihdr-icon-btn ihdr-hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <Link to="/dashboard" className="ihdr-brand">
              <div className="ihdr-mark">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" fill="white" />
                </svg>
              </div>
              <span className="ihdr-brand-name">Approve<em>et</em></span>
            </Link>

            {/* Desktop nav */}
            <nav className="ihdr-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `ihdr-link${isActive ? ' active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="ihdr-right">
            <button className="ihdr-icon-btn" aria-label="Notifications">
              <Bell size={16} />
            </button>

            {user && (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="ihdr-user-trigger"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="ihdr-user-name">{user.name?.split(' ')[0]}</span>
                  <div className="ihdr-avatar">{initials(user.name)}</div>
                  <ChevronDown
                    className="ihdr-chev"
                    style={{ transition: 'transform 0.15s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {menuOpen && (
                  <div className="ihdr-menu" role="menu">
                    <div className="ihdr-menu-head">
                      <div className="ihdr-menu-name">{user.name}</div>
                      <div className="ihdr-menu-email">{user.email}</div>
                    </div>
                    <button
                      className="ihdr-menu-item"
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); navigate('/users'); }}
                    >
                      <UserIcon size={14} />
                      Team Management
                    </button>
                    <button
                      className="ihdr-menu-item"
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                    >
                      <Settings size={14} />
                      Settings
                    </button>
                    <div className="ihdr-menu-divider" />
                    <button
                      onClick={handleLogout}
                      className="ihdr-menu-item danger"
                      role="menuitem"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
