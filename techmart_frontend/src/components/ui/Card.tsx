import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-card rounded-xl shadow-soft border border-borderBase ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, title }: { children?: React.ReactNode, title?: string }) => (
  <div className="px-6 py-5 border-b border-borderBase flex items-center justify-between">
    {title && <h3 className="font-semibold text-lg">{title}</h3>}
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
