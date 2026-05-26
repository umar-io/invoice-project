"use client";

import { Button } from "@/components/ui/Button";

type OrbitItem = {
  label: string;
  icon: string;
};

type OrbitRing = {
  radius: number;
  animationDuration: number;
  angleOffset: number;
  items: OrbitItem[];
};

const orbitRings: OrbitRing[] = [
  {
    radius: 80,
    animationDuration: 18,
    angleOffset: 0,
    items: [
      { label: "Slack",  icon: "/icons/slack.png"  },
      { label: "Email",  icon: "/icons/email.png"  },
      { label: "Sheets", icon: "/icons/sheets.png" },
    ],
  },
  {
    radius: 130,
    animationDuration: 30,
    angleOffset: Math.PI / 3,
    items: [
      { label: "Xero",       icon: "/icons/xero.png"     },
      { label: "Paystack",   icon: "/icons/paystack.png" },
      { label: "Quickbooks", icon: "/icons/qb.png"       },
    ],
  },
];

const CENTER = 160;
const ITEM_SIZE = 44;

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function getPosition(radius: number, angle: number) {
  return {
    x: round(CENTER + radius * Math.cos(angle) - ITEM_SIZE / 2),
    y: round(CENTER + radius * Math.sin(angle) - ITEM_SIZE / 2),
  };
}

type OrbitNodeProps = {
  item: OrbitItem;
  i: number;
  total: number;
  radius: number;
  angleOffset: number;
  ringDuration: number;
  isOuter: boolean;
};

function OrbitNode({
  item,
  i,
  total,
  radius,
  angleOffset,
  ringDuration,
  isOuter,
}: OrbitNodeProps) {
  const angle = angleOffset + (i / total) * Math.PI * 2;
  const { x, y } = getPosition(radius, angle);
  const cx = round(x + ITEM_SIZE / 2);
  const cy = round(y + ITEM_SIZE / 2);

  const counterStyle: React.CSSProperties = {
    transformOrigin: `${cx}px ${cy}px`,
    animation: `spin ${ringDuration}s linear infinite ${isOuter ? "" : "reverse"}`,
  };

  return (
    <g style={counterStyle}>
      {/* Outer border box */}
      <rect
        x={x}
        y={y}
        width={ITEM_SIZE}
        height={ITEM_SIZE}
        rx={10}
        fill="var(--color-hub-box)"
        stroke="var(--color-hub-border)"
        strokeWidth={0.75}
      />
      {/* Inner white inset */}
      <rect
        x={x + 4}
        y={y + 4}
        width={ITEM_SIZE - 8}
        height={ITEM_SIZE - 8}
        rx={7}
        fill="var(--color-white)"
      />
      {/* PNG icon */}
      <image
        href={item.icon}
        x={x + 8}
        y={y + 8}
        width={28}
        height={28}
      />
      {/* Label */}
      <text
        x={cx}
        y={round(y + ITEM_SIZE + 14)}
        textAnchor="middle"
        fontSize={7}
        fontWeight={700}
        letterSpacing="0.1em"
        fill="var(--color-soft)"
      >
        {item.label.toUpperCase()}
      </text>
    </g>
  );
}

function HubIllustration() {
  const innerRing = orbitRings[0];
  const outerRing = orbitRings[1];

  return (
    <svg
      viewBox="0 0 320 320"
      width="100%"
      role="img"
      aria-label="Approveet integration hub with orbiting services"
      className="hub-svg"
    >
      <title>Approveet integration hub</title>

      <defs>
        <style>{`
          .orbit-ring-solid { fill: none; stroke: var(--color-hub-border); stroke-width: 0.75; }
          .orbit-ring-dash  { fill: none; stroke: var(--color-hub-border); stroke-width: 0.75; stroke-dasharray: 3 5; }
          .orbit-tick       { stroke: var(--color-hub-border); stroke-width: 0.5; }
          .spoke            { stroke: var(--color-hub-border); stroke-width: 0.5; stroke-dasharray: 2 3; fill: none; }

          .ring-inner {
            transform-origin: 160px 160px;
            animation: spin 18s linear infinite;
          }
          .ring-outer {
            transform-origin: 160px 160px;
            animation: spin 30s linear infinite reverse;
          }

          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </defs>

      {/* Graduation ticks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            className="orbit-tick"
            x1={round(CENTER + 148 * Math.cos(rad))}
            y1={round(CENTER + 148 * Math.sin(rad))}
            x2={round(CENTER + 156 * Math.cos(rad))}
            y2={round(CENTER + 156 * Math.sin(rad))}
          />
        );
      })}

      {/* Rings */}
      <circle cx={CENTER} cy={CENTER} r={130} className="orbit-ring-dash" />
      <circle cx={CENTER} cy={CENTER} r={80}  className="orbit-ring-solid" />
      <circle cx={CENTER} cy={CENTER} r={44}  className="orbit-ring-dash" />

      {/* Hub center */}
      <rect x={128} y={128} width={64} height={64} rx={14} fill="var(--color-hub-box)" stroke="var(--color-hub-border)" strokeWidth={1.5} />
      <text
        x={CENTER}
        y={155}
        textAnchor="middle"
        fontSize={18}
        fontWeight={500}
        fontFamily="var(--font-serif)"
        fill="var(--color-cream)"
      >
        A.
      </text>
      <text
        x={CENTER}
        y={170}
        textAnchor="middle"
        fontSize={7}
        fontWeight={700}
        letterSpacing="0.1em"
        fill="var(--color-hub-label)"
      >
        APPROVEET
      </text>

      {/* Static dashed spokes — hub edge to inner ring */}
      {innerRing.items.map((_, i) => {
        const angle = innerRing.angleOffset + (i / innerRing.items.length) * Math.PI * 2;
        return (
          <line
            key={i}
            className="spoke"
            x1={round(CENTER + 32 * Math.cos(angle))}
            y1={round(CENTER + 32 * Math.sin(angle))}
            x2={round(CENTER + 58 * Math.cos(angle))}
            y2={round(CENTER + 58 * Math.sin(angle))}
          />
        );
      })}

      {/* Inner orbit */}
      <g className="ring-inner">
        {innerRing.items.map((item, i) => (
          <OrbitNode
            key={item.label}
            item={item}
            i={i}
            total={innerRing.items.length}
            radius={innerRing.radius}
            angleOffset={innerRing.angleOffset}
            ringDuration={innerRing.animationDuration}
            isOuter={false}
          />
        ))}
      </g>

      {/* Outer orbit */}
      <g className="ring-outer">
        {outerRing.items.map((item, i) => (
          <OrbitNode
            key={item.label}
            item={item}
            i={i}
            total={outerRing.items.length}
            radius={outerRing.radius}
            angleOffset={outerRing.angleOffset}
            ringDuration={outerRing.animationDuration}
            isOuter={true}
          />
        ))}
      </g>
    </svg>
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
          Approveet turns plain-English finance requests into structured bills,
          invoices, approvals, and payment records — automatically routed to
          the right people.
        </p>

        <div className="hero-actions">
          <Button href="https://approveet-app.vercel.app">
            Start for free →
          </Button>
          <Button href="https://approveet-app.vercel.app" variant="ghost">
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