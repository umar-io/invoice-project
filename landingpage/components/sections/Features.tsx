import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
  icon: "payable" | "receivable" | "expense" | "ai" | "roles" | "dashboard";
};

const features: Feature[] = [
  {
    title: "Accounts Payable",
    description: "Vendor bills, approval workflows, aging reports, and payment tracking.",
    icon: "payable"
  },
  {
    title: "Accounts Receivable",
    description: "Customer invoices, overdue tracking, and cleaner collections visibility.",
    icon: "receivable"
  },
  {
    title: "Expense Claims",
    description: "Submit, approve, reimburse, and categorize staff claims without side chats.",
    icon: "expense"
  },
  {
    title: "AI Parsing",
    description: "Plain text becomes structured invoice data through LLaMA-powered extraction.",
    icon: "ai"
  },
  {
    title: "Role-Based Access",
    description: "CEO, HOD, Staff, and Account Officer permissions stay clearly separated.",
    icon: "roles"
  },
  {
    title: "Spend Dashboard",
    description: "Monthly burn, department spend, approval activity, and open work in one view.",
    icon: "dashboard"
  }
];

function FeatureIcon({ icon }: Pick<Feature, "icon">) {
  const sharedProps = {
    fill: "none",
    height: "18",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: "1.8",
    viewBox: "0 0 24 24",
    width: "18",
    "aria-hidden": true
  };

  const paths: Record<Feature["icon"], ReactNode> = {
    payable: (
      <>
        <path d="M7 4h10v16H7z" />
        <path d="M9.5 8h5" />
        <path d="M9.5 12h5" />
        <path d="M9.5 16h3" />
      </>
    ),
    receivable: (
      <>
        <path d="M4 7h16v11H4z" />
        <path d="M7 10h5" />
        <path d="M16 14h1" />
        <path d="M16 10h1" />
      </>
    ),
    expense: (
      <>
        <path d="M6 5h12l-1.5 14h-9z" />
        <path d="M9 5a3 3 0 0 1 6 0" />
        <path d="M9.5 11h5" />
      </>
    ),
    ai: (
      <>
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="M8 8h8v8H8z" />
      </>
    ),
    roles: (
      <>
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
        <path d="M13.5 18a3.5 3.5 0 0 1 7 0" />
      </>
    ),
    dashboard: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M8 15v-3" />
        <path d="M12 15V9" />
        <path d="M16 15v-5" />
      </>
    )
  };

  return <svg {...sharedProps}>{paths[icon]}</svg>;
}

export function Features() {
  return (
    <section className="section" id="features">
      <div className="section-inner features-layout">
        <div>
          <p className="eyebrow">Core platform</p>
          <h2 className="features-heading">
            Everything <span className="italic-soft">finance teams</span> actually need.
          </h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon">
                <FeatureIcon icon={feature.icon} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
