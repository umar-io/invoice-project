type Integration = {
  name: string;
};

const integrations: Integration[] = [
  { name: "Slack" },
  { name: "Email" },
  { name: "Sheets" },
  { name: "Paystack" }
];

export function Integrations() {
  return (
    <section className="section" id="integrations">
      <div className="section-inner integrations-strip">
        <div>
          <p className="eyebrow">Connected approvals</p>
          <h2 className="features-heading">
            Notifications where teams already work.
          </h2>
        </div>
        <div className="integration-list" aria-label="Approveet integrations">
          {integrations.map((integration) => (
            <div className="integration-item" key={integration.name}>
              {integration.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
