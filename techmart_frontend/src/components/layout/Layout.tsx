import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { PageWrapper } from '../ui/PageWrapper';
import { CommandPalette } from '../ui/CommandPalette';
import { Search, Bell, Menu, X as XIcon, CheckCircle2, RefreshCw } from 'lucide-react';
import { notificationService, Notification } from '../../api/notificationService';

export const Layout = () => {
  const { t } = useTranslation();
  const { accessToken, user } = useAuthStore();
  const location = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications only when authenticated
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    refetchInterval: 30000, // Poll every 30s
    enabled: !!accessToken, // Only fetch if user is authenticated
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Display name: full_name > username (if != email) > email prefix
  const displayName = user?.full_name
    || (user?.username && user.username !== user?.email ? user.username : null)
    || user?.email?.split('@')[0]
    || 'User';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-textMain bg-page">
      {/* Decorative gradient background similar to Filo mockup */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full bg-pink-500/10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 flex items-center justify-between px-3 sm:px-5 lg:px-8 border-b"
          style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl border transition-all hover:text-primary"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {mobileSidebarOpen ? <XIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Search trigger */}
            <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 rounded-xl border text-sm transition-all hover:border-primary/40 group"
            style={{ background: 'var(--color-bg-page)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
          >
            <Search className="w-4 h-4 text-textMain/40 group-hover:text-primary transition-colors" />
            <span className="text-textMain/40 group-hover:text-textMain/60 transition-colors hidden sm:inline">
              {t('common.search', 'Search anything...')}
            </span>
            <div className="hidden sm:flex items-center gap-1 ml-8">
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border font-mono text-textMain/30"
                style={{ borderColor: 'var(--color-border)' }}>
                Ctrl
              </kbd>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border font-mono text-textMain/30"
                style={{ borderColor: 'var(--color-border)' }}>
                K
              </kbd>
            </div>
          </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 relative">
            {/* Refresh / Update */}
            <button
              onClick={handleReload}
              className="relative p-2.5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-95"
              style={{
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                background: 'var(--color-card-bg)'
              }}
              title={t('common.refresh', 'Refresh')}
              aria-label={t('common.refresh', 'Refresh')}
            >
              <RefreshCw className="w-4 h-4 text-textMain/80" />
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-2xl border transition-all shadow-sm hover:shadow-md active:scale-95"
                style={{ 
                  borderColor: 'var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  background: 'var(--color-card-bg)'
                }}
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-textMain/80" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full border-2"
                    style={{ background: '#FF4A4A', borderColor: 'var(--color-card-bg)' }}
                  />
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div
                    className="absolute right-0 mt-3 w-[calc(100vw-1rem)] sm:w-80 max-w-[22rem] rounded-2xl shadow-xl border z-50 overflow-hidden animate-scale-in"
                    style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
                  >
                    <div
                      className="p-4 border-b flex justify-between items-center"
                      style={{ background: 'var(--color-bg-page)', borderColor: 'var(--color-border)' }}
                    >
                      <h3 className="font-semibold text-sm">{t('notifications.title', 'Notifications')}</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          {unreadCount} {t('notifications.new_count', 'New').replace(/\d+ /, '')}
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-textMain/50 flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">You're all caught up!</p>
                        </div>
                      ) : (
                        notifications.map((notif: Notification) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${notif.is_read ? 'opacity-60' : ''}`}
                            style={{
                              borderColor: 'var(--color-border)',
                              background: notif.is_read ? 'transparent' : 'var(--color-primary-light)'
                            }}
                          >
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <span className={`text-sm ${notif.is_read ? 'font-medium' : 'font-semibold'}`}>{notif.title}</span>
                              <span className="text-[10px] text-textMain/40 shrink-0 mt-0.5">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-textMain/60 leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <div
                        className="p-3 border-t text-center"
                        style={{ background: 'var(--color-bg-page)', borderColor: 'var(--color-border)' }}
                      >
                        <button 
                          onClick={() => markAllReadMutation.mutate()}
                          disabled={markAllReadMutation.isPending}
                          className="text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-50"
                        >
                          {t('notifications.mark_read', 'Mark all as read')}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User avatar → profile */}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all hover:border-primary/40 group"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), #FF8C69)' }}
              >
                {initials}
              </div>
              <span className="text-sm font-medium hidden sm:inline text-textMain/70 group-hover:text-textMain transition-colors">
                {displayName.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <PageWrapper key={location.pathname}>
              <Outlet />
            </PageWrapper>
          </div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
};
