import { Button } from "@/components/ui/Button";

type NavLink = {
  label: string;
  href: string;
};

const navLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" }
];

export function Navbar() {
  return (
    <header className="navbar">
      <a className="logo" href="#" aria-label="Approveet home">
        Approveet<span className="logo-dot">.</span>
      </a>
      <div className="nav-right">
        <nav className="nav-links" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a className="nav-link" href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <Button href="https://ai-invoicer-demo.vercel.app">Get started free</Button>
      </div>
    </header>
  );
}
