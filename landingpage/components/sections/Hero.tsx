"use client";

import { Button } from "@/components/ui/Button";

type OrbitItem = {
  icon: string;
  label: string;
  radius: number;
};

const orbitItems: OrbitItem[] = [
  { icon: "/icons/slack.png", label: "Slack", radius: 76 },
  { icon: "/icons/email.png", label: "Email", radius: 76 },
  { icon: "/icons/sheets.png", label: "Sheets", radius: 76 },
  { icon: "/icons/xero.png", label: "Xero", radius: 124 },
  { icon: "/icons/paystack.png", label: "Paystack", radius: 124 },
  { icon: "/icons/qb.png", label: "Quickbook", radius: 124 },
];

function HubIllustration() {
  const center = 160;
  const itemSize = 44;

  const round = (n: number) => Math.round(n * 100) / 100;

  return (
    <svg
      viewBox="0 0 320 320"
      width="100%"
      className="orbit-svg"
      role="img"
    >
      {/* Rings */}
      <circle cx="160" cy="160" r="76" className="orbit-ring inner" />
      <circle cx="160" cy="160" r="124" className="orbit-ring outer" />

      {/* Center */}
      <g className="hub-center-rotate">
        <rect
          x="123"
          y="123"
          width="74"
          height="74"
          rx="18"
          className="hub-box"
        />

        <text x="160" y="168" className="hub-letter" textAnchor="middle">
          A.
        </text>

        <text x="160" y="184" className="hub-label" textAnchor="middle">
          APPROVEET
        </text>
      </g>

      {/* Inner Orbit (Revolution) */}
      <g className="orbit-inner">
        {orbitItems.filter(item => item.radius === 76).map((item, i, arr) => (
          <OrbitGroup key={item.label} item={item} i={i} total={arr.length} center={center} itemSize={itemSize} round={round} />
        ))}
      </g>

      {/* Outer Orbit (Revolution) */}
      <g className="orbit-outer">
        {orbitItems.filter(item => item.radius === 124).map((item, i, arr) => (
          <OrbitGroup key={item.label} item={item} i={i} total={arr.length} center={center} itemSize={itemSize} round={round} />
        ))}
      </g>
    </svg>
  );
}

function OrbitGroup({ item, i, total, center, itemSize, round }: any) {
  const angle = (i / total) * Math.PI * 2;
  const x = round(center + item.radius * Math.cos(angle) - itemSize / 2);
  const y = round(center + item.radius * Math.sin(angle) - itemSize / 2);

  return (
    <g className="orbit-item" style={{ transformOrigin: `${center}px ${center}px` }}>
      {/* Box */}
      <rect
        x={x}
        y={y}
        width={itemSize}
        height={itemSize}
        rx="10"
        className="orbit-box"
      />

      <rect
        x={x + 4}
        y={y + 4}
        width={itemSize - 8}
        height={itemSize - 8}
        rx="7"
        fill="white"
      />

      {/* Image (No longer rotates on its own axis) */}
      <image
        href={item.icon}
        x={x + 8}
        y={y + 8}
        width="28"
        height="28"
      />

      {/* Label */}
      <text
        x={x + itemSize / 2}
        y={y + itemSize + 14}
        className="orbit-label"
        textAnchor="middle"
      >
        {item.label.toUpperCase()}
      </text>
    </g>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Accounts Payable &amp; Receivable</p>

        <h1 className="hero-title">
          Finance workflows,
          <br />
          <span className="italic-soft">without the</span>
          <br />
          chaos.
        </h1>

        <p className="hero-text">
          Approveet turns plain-English finance requests into structured
          bills, invoices, approvals, and payment records.
        </p>

        <div className="hero-actions">
          <Button href="https://ai-invoicer-demo.vercel.app">
            Start for free →
          </Button>

          <Button href="https://ai-invoicer-demo.vercel.app" variant="ghost">
            See a demo
          </Button>
        </div>
      </div>

      <div className="hero-panel">
        <HubIllustration />
      </div>
    </section>
  );
}