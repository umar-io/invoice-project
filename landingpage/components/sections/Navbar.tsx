"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type NavLink = {
  label: string;
  href: string;
};

const navLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

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

        <Button href="https://approveet-app.vercel.app">Get started free</Button>

        {/* Mobile toggle — hidden on desktop via CSS */}
        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          id="mobile-menu"
          className="mobile-menu"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <a
              className="mobile-nav-link"
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)} // close on navigate
            >
              {link.label}
            </a>
          ))}
          <Button href="https://approveet-app.vercel.app" className="mobile-cta">
            Get started free
          </Button>
        </nav>
      )}
    </header>
  );
}