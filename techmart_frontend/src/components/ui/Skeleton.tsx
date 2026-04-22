import React from 'react';

/**
 * Skeleton pulse animation — use instead of spinners while data loads.
 */
export const Skeleton = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`animate-pulse rounded-lg bg-textMain/8 dark:bg-white/6 ${className}`} style={style} />
);

export const SkeletonCard = () => (
  <div className="card-base p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>
    <Skeleton className="h-8 w-36" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-4 flex-1" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="card-base overflow-hidden">
    {/* header */}
    <div className="flex items-center gap-4 px-6 py-4 border-b border-borderBase">
      {[40, 120, 80, 60].map((w, i) => (
        <Skeleton key={i} className="h-3" style={{ width: w }} />
      ))}
    </div>
    <div className="divide-y divide-borderBase px-6">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card-base p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <div className="card-base p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
