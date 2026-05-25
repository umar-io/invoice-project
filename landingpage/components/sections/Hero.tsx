import { Button } from "@/components/ui/Button";

type OrbitItem = {
  emoji: string;
  label: string;
  x: number;
  y: number;
};

const orbitItems: OrbitItem[] = [
  { emoji: "S", label: "Slack", x: 139, y: 8 },
  { emoji: "@", label: "Email", x: 245, y: 72 },
  { emoji: "#", label: "Sheets", x: 242, y: 211 },
  { emoji: "P", label: "Paystack", x: 137, y: 272 },
  { emoji: "H", label: "HR", x: 34, y: 212 },
  { emoji: "I", label: "Invoices", x: 29, y: 73 }
];

function HubIllustration() {
  return (
    <svg className="hub-svg" viewBox="0 0 320 320" role="img" aria-label="Approveet workflow hub">
      <circle
        cx="160"
        cy="160"
        fill="none"
        r="76"
        stroke="var(--color-hub-border)"
        strokeDasharray="4 6"
      />
      <circle
        cx="160"
        cy="160"
        fill="none"
        r="124"
        stroke="var(--color-hub-border)"
        strokeDasharray="4 8"
      />
      <rect
        fill="var(--color-hub-box)"
        height="74"
        rx="18"
        stroke="var(--color-hub-border)"
        width="74"
        x="123"
        y="123"
      />
      <text
        fill="var(--color-cream)"
        fontFamily="var(--font-serif), serif"
        fontSize="34"
        fontWeight="700"
        textAnchor="middle"
        x="160"
        y="170"
      >
        A.
      </text>
      {orbitItems.map((item) => (
        <g key={item.label}>
          <rect
            fill="var(--color-hub-box)"
            height="42"
            rx="10"
            stroke="var(--color-hub-border)"
            width="42"
            x={item.x}
            y={item.y}
          />
          <text
            fill="var(--color-muted)"
            fontFamily="var(--font-sans), sans-serif"
            fontSize="16"
            fontWeight="700"
            textAnchor="middle"
            x={item.x + 21}
            y={item.y + 27}
          >
            {item.emoji}
          </text>
          <text
            fill="var(--color-hub-label)"
            fontFamily="var(--font-sans), sans-serif"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.14em"
            textAnchor="middle"
            x={item.x + 21}
            y={item.y + 62}
          >
            {item.label.toUpperCase()}
          </text>
        </g>
      ))}
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
          Approveet turns plain-English finance requests into structured bills, invoices,
          approvals, and payment records. Built for Nigerian SMBs that need control without
          another spreadsheet maze.
        </p>
        <div className="hero-actions">
          <Button href="https://app.approveet.vercel.app">Start for free →</Button>
          <Button href="https://app.approveet.vercel.app" variant="ghost">
            See a demo
          </Button>
        </div>
      </div>
      <div className="hero-panel" aria-hidden="true">
        <HubIllustration />
      </div>
    </section>
  );
}
