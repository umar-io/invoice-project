import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Plan = {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "Free",
    period: "During beta · No card needed",
    features: [
      "Up to 5 members",
      "AP & AR",
      "Expense claims",
      "Slack notifications",
      "AI parsing"
    ],
    cta: "Get started →"
  },
  {
    name: "Growth",
    price: "₦29k",
    period: "per month",
    features: [
      "Up to 50 members",
      "Everything in Starter",
      "Vendor & customer directory",
      "Aging reports",
      "Priority support"
    ],
    cta: "Start free trial →",
    featured: true
  },
  {
    name: "Scale",
    price: "₦89k",
    period: "per month · up to 1,000 users",
    features: [
      "Unlimited members",
      "Everything in Growth",
      "Custom roles",
      "API access",
      "Dedicated onboarding"
    ],
    cta: "Talk to us →"
  }
];

export function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="section-inner">
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              className={`pricing-card ${plan.featured ? "pricing-card-featured" : ""}`.trim()}
              key={plan.name}
            >
              <div className="plan-top">
                <h2 className="plan-name">{plan.name}</h2>
                {plan.featured ? <Badge>Most popular</Badge> : null}
              </div>
              <p className="price">{plan.price}</p>
              <p className="period">{plan.period}</p>
              <ul className="feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="pricing-cta">
                <Button
                  href="https://ai-invoicer-demo.vercel.app"
                  variant={plan.featured ? "inverse" : "ghost"}
                >
                  {plan.cta}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
