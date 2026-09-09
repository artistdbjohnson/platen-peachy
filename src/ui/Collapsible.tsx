import type { ReactNode } from "react";

interface CollapsibleProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Collapsible({ title, subtitle, defaultOpen = false, children }: CollapsibleProps) {
  return (
    <details className="fold card" open={defaultOpen || undefined}>
      <summary>
        <span className="fold-title">{title}</span>
        {subtitle ? <span className="fold-sub">{subtitle}</span> : null}
        <span className="fold-mark" aria-hidden="true" />
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
