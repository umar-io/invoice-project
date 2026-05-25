import type { ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "inverse";

type ButtonProps = {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  className?: string;
};

export function Button({
  children,
  href,
  variant = "primary",
  className = ""
}: ButtonProps) {
  return (
    <a className={`button button-${variant} ${className}`.trim()} href={href}>
      {children}
    </a>
  );
}
