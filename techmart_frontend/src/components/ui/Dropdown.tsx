import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  code: string;
  label: string;
  flag?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (code: string) => void;
  icon: React.ElementType;
}

export function Dropdown({ options, value, onChange, icon: Icon }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.code === value) || options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all hover:border-primary/50 focus:outline-none"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-card-bg)',
          color: 'var(--color-text-main)',
        }}
      >
        <Icon className="w-4 h-4 opacity-50 shrink-0" />
        <span>{'flag' in selected && selected.flag ? `${selected.flag} ` : ''}{selected.label}</span>
        <ChevronDown className={`w-3 h-3 opacity-40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 right-0 min-w-[120px] max-w-xs rounded-xl border shadow-medium py-1 z-50 overflow-hidden"
          style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
        >
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => { onChange(opt.code); setOpen(false); }}
              className="flex items-center justify-between gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-primary/5"
              style={{ color: 'var(--color-text-main)' }}
            >
              <span className="truncate">{'flag' in opt && opt.flag ? `${opt.flag} ` : ''}{opt.label}</span>
              {opt.code === value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
