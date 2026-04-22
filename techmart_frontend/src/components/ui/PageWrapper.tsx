import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps page content with a smooth fade-in + slide-up entrance animation.
 * Use this around each page's root element.
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`animate-page-enter ${className}`}>
      {children}
    </div>
  );
};
