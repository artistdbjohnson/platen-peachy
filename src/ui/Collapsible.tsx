import { useState, type ReactNode } from "react";

interface CollapsibleProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Collapsible({ title, subtitle, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className="fold"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="fold-title">{title}</span>
        {subtitle ? <span className="fold-sub">{subtitle}</span> : null}
        <span className="fold-mark" aria-hidden="true" />
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
