import type { ReactNode } from "react";

interface CollapsibleProps {
  id: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export function Collapsible({ id, title, subtitle, open, onToggle, children }: CollapsibleProps) {
  return (
    <div className={`fold${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="fold-summary"
        aria-expanded={open}
        aria-controls={`fold-${id}`}
        onClick={() => onToggle(id)}
      >
        <span className="fold-title">{title}</span>
        {subtitle ? <span className="fold-sub">{subtitle}</span> : null}
        <span className="fold-mark" aria-hidden="true" />
      </button>
      {open ? (
        <div className="fold-body" id={`fold-${id}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
