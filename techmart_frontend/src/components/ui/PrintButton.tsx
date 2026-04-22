import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  title?: string;
}

/**
 * Triggers the browser print dialog for the current page.
 * The @media print CSS in index.css hides sidebar/header automatically.
 */
export const PrintButton: React.FC<PrintButtonProps> = ({ title = 'Print Report' }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:border-primary/40 hover:text-primary"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
      title={title}
    >
      <Printer className="w-4 h-4" />
      <span className="hidden sm:inline">{title}</span>
    </button>
  );
};
