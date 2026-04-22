import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 text-textMain/50">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export const FullScreenLoading = () => (
  <div
    className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center"
    style={{ background: 'var(--color-bg-page)', opacity: 0.85 }}
  >
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
  </div>
);
