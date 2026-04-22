import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, LayoutDashboard, BookOpen, FileText,
  BarChart3, TrendingUp, Scale, Bot, Settings, X,
  ArrowRight
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  path: string;
  icon: React.ElementType;
  group: string;
}

const commands: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Financial overview', path: '/', icon: LayoutDashboard, group: 'Navigation' },
  { id: 'journal', label: 'Journal Entries', description: 'Record transactions', path: '/journal', icon: BookOpen, group: 'Navigation' },
  { id: 'journal-new', label: 'New Journal Entry', description: 'Create a new entry', path: '/journal/new', icon: BookOpen, group: 'Actions' },
  { id: 'accounts', label: 'Chart of Accounts', description: 'View all accounts', path: '/accounts', icon: FileText, group: 'Navigation' },
  { id: 'trial-balance', label: 'Trial Balance', description: 'View trial balance report', path: '/reports/trial-balance', icon: BarChart3, group: 'Reports' },
  { id: 'income-statement', label: 'Income Statement', description: 'P&L report', path: '/reports/income-statement', icon: TrendingUp, group: 'Reports' },
  { id: 'balance-sheet', label: 'Balance Sheet', description: 'Assets & liabilities', path: '/reports/balance-sheet', icon: Scale, group: 'Reports' },
  { id: 'ai-assistant', label: 'AI Assistant', description: 'Ask about your finances', path: '/ai-assistant', icon: Bot, group: 'Intelligence' },
  { id: 'settings', label: 'Settings', description: 'Language & appearance', path: '/settings', icon: Settings, group: 'System' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Group filtered results
  const groups: Record<string, CommandItem[]> = {};
  filtered.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const item = filtered[activeIndex];
      if (item) handleSelect(item.path);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-strong overflow-hidden animate-scale-in"
        style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Search className="w-5 h-5 shrink-0 text-textMain/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, reports, actions..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--color-text-main)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-textMain/30 hover:text-textMain/60">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded border font-mono text-textMain/30"
            style={{ borderColor: 'var(--color-border)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-textMain/40">
              No results for "{query}"
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-textMain/35">
                  {group}
                </div>
                {items.map(item => {
                  const idx = globalIndex++;
                  const Icon = item.icon;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-primary/8' : 'hover:bg-primary/4'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-primary text-white' : ''
                      }`}
                        style={!isActive ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)' } : {}}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-textMain/40 truncate">{item.description}</p>
                        )}
                      </div>
                      {isActive && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t flex items-center gap-4 text-[11px] text-textMain/30"
          style={{ borderColor: 'var(--color-border)' }}>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded text-[10px] border" style={{ borderColor: 'var(--color-border)' }}>↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded text-[10px] border" style={{ borderColor: 'var(--color-border)' }}>↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded text-[10px] border" style={{ borderColor: 'var(--color-border)' }}>ESC</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
};
