import { Header } from './Header';
import type { ReactNode } from 'react';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Nunito+Sans:wght@300;400;600;700&display=swap');

        .app-shell {
          font-family: 'Nunito Sans', sans-serif;
          min-height: 100vh;
          background: #F7F6F3;
          color: #0A0A0A;
          display: flex;
          flex-direction: column;
        }
        .app-shell *::selection { background: #0A0A0A; color: white; }

        .app-main {
          flex: 1;
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 56px 32px 80px;
        }
        @media (max-width: 720px) {
          .app-main { padding: 32px 20px 48px; }
        }

        .app-footer {
          border-top: 1px solid #E8E6E1;
          background: white;
          padding: 32px 0;
        }
        .app-footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #BFBBBB;
        }
        .app-footer-group {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .app-footer-divider {
          width: 1px; height: 14px;
          background: #E8E6E1;
        }
        .app-footer a {
          color: #BFBBBB;
          text-decoration: none;
          transition: color 0.15s;
        }
        .app-footer a:hover { color: #0A0A0A; }
        .app-footer-mark {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 400;
          font-size: 12px;
          letter-spacing: 0;
          text-transform: none;
          color: #888;
        }
      `}</style>

      <div className="app-shell">
        <Header />
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <div className="app-footer-inner">
            <div className="app-footer-group">
              <span>InvoiceFlow · Pro Treasury</span>
              <span className="app-footer-divider" />
              <span>Enterprise node · Lagos_01</span>
            </div>
            <div className="app-footer-group">
              <a href="#">Documentation</a>
              <a href="#">Status</a>
              <span className="app-footer-mark">© 2026</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
