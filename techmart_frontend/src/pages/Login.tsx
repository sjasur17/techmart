import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, Loader2, Eye, EyeOff, Globe, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Dropdown } from '../components/ui/Dropdown';
import i18n from '../i18n';
import { buildApiUrl } from '../api/config';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];



export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, accessToken } = useAuthStore();
  const { language, theme, setLanguage, setTheme } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect to dashboard immediately
  useEffect(() => {
    if (accessToken) navigate('/', { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  // Sync i18n on mount in case language was set before
  useEffect(() => {
    i18n.changeLanguage(language);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const THEMES = [
    { code: 'light', label: 'Light', icon: Sun },
    { code: 'dark', label: 'Dark', icon: Moon },
  ];

  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const response = await axios.post(buildApiUrl('/auth/login/'), data);
      setAuth({
        access: response.data.access,
        refresh: response.data.refresh,
        user: response.data.user,
      });
      toast.success(t('auth.login_success', 'Successfully logged in!'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('auth.login_failed', 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans animate-page-enter" style={{ background: 'var(--color-bg-page)' }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-primary)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: '#4F46E5' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-primary)' }}>
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">TechMart Savdo</span>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            {t('auth.hero_title1', 'Financial Accounting')}
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #F4522D, #FF8C69)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('auth.hero_title2', 'System')}
            </span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-8">
            {t('auth.hero_subtitle', 'Manage your finances with double-entry bookkeeping, real-time reports, and AI-powered insights.')}
          </p>
          <div className="flex flex-col gap-3">
            {[
              t('auth.feat1', 'Double-entry Bookkeeping'),
              t('auth.feat2', 'Real-time Financial Reports'),
              t('auth.feat3', 'AI Financial Assistant'),
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(244,82,45,0.25)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                </div>
                {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/30 text-xs relative z-10">
          © 2026 TechMart Savdo. {t('auth.rights', 'All rights reserved.')}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col px-8 py-10 relative">
        {/* Top-right: Language & Theme dropdowns */}
        <div className="absolute top-6 right-8 flex items-center gap-2 z-10">
          <Dropdown
            options={LANGUAGES}
            value={language}
            onChange={handleLanguageChange}
            icon={Globe}
          />
          <Dropdown
            options={THEMES.map(th => ({ code: th.code, label: th.label }))}
            value={theme}
            onChange={(code) => setTheme(code as 'light' | 'dark')}
            icon={ThemeIcon}
          />
        </div>
        {/* Top: mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-primary)' }}>
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl" style={{ color: 'var(--color-text-main)' }}>TechMart Savdo</span>
        </div>

        {/* Center: form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>
                {t('auth.welcome', 'Welcome back')}
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-main)', opacity: 0.5 }}>
                {t('auth.sign_in_desc', 'Sign in to your accounting dashboard')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                  {t('auth.email', 'Email address')}
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="example@gmail.com"
                  className="input-base w-full"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                  {t('auth.password', 'Password')}
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="input-base w-full pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center transition-colors"
                    style={{ color: 'var(--color-text-main)', opacity: 0.4 }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold hover:underline transition-all"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {t('auth.forgot_password', 'Forgot password?')}
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-sm mt-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.signing_in', 'Signing in...')}</>
                  : t('auth.login', 'Sign in')
                }
              </button>

              {/* Create account link */}
              <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-main)', opacity: 0.5 }}>
                {t('auth.no_account', "Don't have an account?")}{' '}
                <a
                  href="/register"
                  className="font-semibold hover:underline transition-all"
                  style={{ color: 'var(--color-primary)', opacity: 1 }}
                >
                  {t('auth.create_one', 'Create one')}
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
