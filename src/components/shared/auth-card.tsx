import type { ReactNode } from "react";
import { Logo } from "./logo";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`bg-card rounded-2xl border shadow-lg overflow-hidden ${className}`}
    >
      <div className="h-0.5 w-full bg-linear-to-r from-primary/60 via-primary to-primary/60" />
      <div className="px-8 py-8 space-y-6">{children}</div>
    </div>
  );
}

export function AuthCardLogo() {
  return <Logo />;
}

interface AuthCardHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthCardHeader({ title, subtitle }: AuthCardHeaderProps) {
  return (
    <div className="space-y-0.5">
      <AuthCardLogo />
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
