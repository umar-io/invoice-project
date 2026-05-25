type Step = {
  number: string;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Submit in plain English",
    description:
      "Staff describe bills or expenses naturally. AI extracts amount, vendor, department automatically."
  },
  {
    number: "02",
    title: "Route & approve",
    description:
      "Requests flow to HOD then CEO via signed email links. No login needed for approvers."
  },
  {
    number: "03",
    title: "Pay & track",
    description:
      "Account officers record payments and close the loop. Full audit trail, zero spreadsheets."
  }
];

export function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="section-inner">
        <div className="how-grid">
          {steps.map((step) => (
            <article className="how-card" key={step.number}>
              <span className="step-number" aria-hidden="true">
                {step.number}
              </span>
              <div className="step-content">
                <h2 className="step-title">{step.title}</h2>
                <p className="step-description">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
