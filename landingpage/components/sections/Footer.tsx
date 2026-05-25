type FooterLink = {
  label: string;
  href: string;
};

const footerLinks: FooterLink[] = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Docs", href: "https://ai-invoicer-demo.vercel.app" },
  { label: "Privacy", href: "#" }
];

export function Footer() {
  return (
    <footer className="footer">
      <a className="logo" href="#" aria-label="Approveet home">
        Approveet<span className="logo-dot">.</span>
      </a>
      <nav className="footer-links" aria-label="Footer navigation">
        {footerLinks.map((link) => (
          <a className="footer-link" href={link.href} key={link.label}>
            {link.label}
          </a>
        ))}
      </nav>
      <p className="copyright">© 2026 Approveet. Built in Lagos.</p>
    </footer>
  );
}
