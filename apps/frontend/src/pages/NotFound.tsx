import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';

export const NotFound = () => {
  usePageTitle('Page Not Found');
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Subtle animated grid dots ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const gap = 36;
      const cols = Math.ceil(w / gap) + 1;
      const rows = Math.ceil(h / gap) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const y = r * gap;
          const dist = Math.sqrt((x - w / 2) ** 2 + (y - h / 2) ** 2);
          const wave = Math.sin(dist / 60 - t) * 0.5 + 0.5;
          const alpha = wave * 0.18;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10,10,10,${alpha})`;
          ctx.fill();
        }
      }
      t += 0.025;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const suggestions = [
    { label: 'Dashboard',           to: '/dashboard' },
    { label: 'Bills to Pay',        to: '/bills' },
    { label: 'Invoices to Collect', to: '/receivables' },
    { label: 'Refunds & Claims',    to: '/expenses' },
  ];

  return (
    <>
      <style>{`
        .nf-root {
          position: relative;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: var(--bg-primary);
          font-family: var(--sans);
          padding: 40px 24px;
        }

        /* animated canvas background */
        .nf-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.6;
          pointer-events: none;
        }

        /* centre card */
        .nf-card {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 520px;
          width: 100%;
          animation: nf-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes nf-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* big 404 number */
        .nf-number {
          font-family: 'Playfair Display', serif;
          font-size: clamp(96px, 18vw, 160px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -6px;
          color: transparent;
          background: linear-gradient(135deg, #0A0A0A 30%, #C4C0B8 100%);
          -webkit-background-clip: text;
          background-clip: text;
          margin-bottom: 8px;
          user-select: none;
        }

        /* thin divider line under 404 */
        .nf-divider {
          width: 48px;
          height: 2px;
          background: #0A0A0A;
          margin: 0 auto 24px;
          border-radius: 2px;
          opacity: 0.15;
        }

        .nf-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 16px;
        }

        .nf-heading {
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px;
          letter-spacing: -0.4px;
          line-height: 1.3;
        }

        .nf-sub {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0 auto 36px;
          max-width: 380px;
        }

        /* CTA buttons */
        .nf-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }

        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          text-decoration: none;
          letter-spacing: 0.01em;
        }
        .nf-btn:active { transform: scale(0.97); }

        .nf-btn-primary {
          background: #0A0A0A;
          color: white;
          box-shadow: 0 2px 8px rgba(10,10,10,0.18);
        }
        .nf-btn-primary:hover {
          background: #1a1a1a;
          box-shadow: 0 4px 16px rgba(10,10,10,0.22);
          transform: translateY(-1px);
        }

        .nf-btn-ghost {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        .nf-btn-ghost:hover {
          border-color: var(--border-strong);
          background: var(--bg-primary);
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }

        /* quick-links */
        .nf-links-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 14px;
        }

        .nf-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .nf-chip {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--bg-primary);
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 0.14s, color 0.14s, transform 0.14s, box-shadow 0.14s;
          text-decoration: none;
        }
        .nf-chip:hover {
          border-color: #0A0A0A;
          color: #0A0A0A;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(10,10,10,0.08);
        }

        /* floating brand watermark */
        .nf-watermark {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.25;
          pointer-events: none;
          user-select: none;
        }
        .nf-watermark-mark {
          width: 18px; height: 18px;
          background: #0A0A0A;
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
        }
        .nf-watermark-name {
          font-family: 'Playfair Display', serif;
          font-size: 13px; font-weight: 500; color: #0A0A0A;
          letter-spacing: -0.2px;
        }
        .nf-watermark-name em { font-style: italic; font-weight: 400; }

        /* Search icon animation */
        .nf-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px; height: 72px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          margin-bottom: 28px;
          animation: nf-float 3s ease-in-out infinite;
        }
        @keyframes nf-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      <div className="nf-root">
        {/* Animated dot grid */}
        <canvas className="nf-canvas" ref={canvasRef} />

        <div className="nf-card">
          {/* Floating search icon */}
          <div className="nf-icon-wrap">
            <Search size={28} color="var(--text-tertiary)" strokeWidth={1.5} />
          </div>

          {/* Big 404 */}
          <div className="nf-number">404</div>
          <div className="nf-divider" />

          <p className="nf-eyebrow">Page not found</p>
          <h1 className="nf-heading">
            We couldn't find that page
          </h1>
          <p className="nf-sub">
            The link might be broken, the page may have moved, or you may
            not have access to this section.
          </p>

          {/* Primary actions */}
          <div className="nf-actions">
            <button
              className="nf-btn nf-btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              <Home size={14} />
              Go to Dashboard
            </button>
            <button
              className="nf-btn nf-btn-ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={14} />
              Go Back
            </button>
          </div>

          {/* Quick-nav chips */}
          <p className="nf-links-label">Quick links</p>
          <div className="nf-links">
            {suggestions.map((s) => (
              <button
                key={s.to}
                className="nf-chip"
                onClick={() => navigate(s.to)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Watermark */}
        <div className="nf-watermark">
          <div className="nf-watermark-mark">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" fill="white" />
            </svg>
          </div>
          <span className="nf-watermark-name">Approve<em>et</em></span>
        </div>
      </div>
    </>
  );
};
