import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, Loader2, Eye, EyeOff, UserPlus, ArrowLeft, ShieldCheck, Globe, Sun, Moon, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useSettingsStore } from '../store/useSettingsStore';
import { Dropdown } from '../components/ui/Dropdown';
import i18n from '../i18n';
import { buildApiUrl } from '../api/config';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];



const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  full_name: z.string().min(2, 'Full name is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/\d/, 'Password must include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must include at least one symbol'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, theme, setLanguage, setTheme } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirm_password') || '';
  const usernameValue = watch('username') || '';
  const emailValue = watch('email') || '';
  const fullNameValue = watch('full_name') || '';

  const passwordChecks = [
    { label: t('auth.pass_rule_length', 'At least 8 characters'), valid: passwordValue.length >= 8 },
    { label: t('auth.pass_rule_upper', 'One uppercase letter'), valid: /[A-Z]/.test(passwordValue) },
    { label: t('auth.pass_rule_lower', 'One lowercase letter'), valid: /[a-z]/.test(passwordValue) },
    { label: t('auth.pass_rule_number', 'One number'), valid: /\d/.test(passwordValue) },
    { label: t('auth.pass_rule_symbol', 'One symbol'), valid: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const passedChecks = passwordChecks.filter((rule) => rule.valid).length;
  const strengthPercent = Math.min(100, (passedChecks / passwordChecks.length) * 100);

  const strengthConfig =
    passedChecks <= 2
      ? { label: t('auth.password_strength_weak', 'Weak'), color: 'var(--color-danger)' }
      : passedChecks <= 4
        ? { label: t('auth.password_strength_medium', 'Medium'), color: 'var(--color-warning)' }
        : { label: t('auth.password_strength_strong', 'Strong'), color: 'var(--color-success)' };

  const isFormFilled =
    fullNameValue.trim().length > 0 &&
    usernameValue.trim().length > 0 &&
    emailValue.trim().length > 0 &&
    passwordValue.trim().length > 0 &&
    confirmPasswordValue.trim().length > 0;

  const isSubmitDisabled = loading || !isFormFilled || !isValid;

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  React.useEffect(() => {
    i18n.changeLanguage(language);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const THEMES = [
    { code: 'light', label: 'Light', icon: Sun },
    { code: 'dark', label: 'Dark', icon: Moon },
  ];

  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      const nameParts = data.full_name.trim().split(' ');
      await axios.post(buildApiUrl('/auth/register/'), {
        username: data.username,
        email: data.email,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' '),
        password: data.password,
        password2: data.confirm_password,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      const msg = error.response?.data?.detail
        || Object.values(error.response?.data || {}).flat().join(' ')
        || 'Registration failed.';
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans animate-page-enter" style={{ background: 'var(--color-bg-page)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-primary)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: '#4F46E5' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-primary)' }}>
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">TechMart Savdo</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            {t('auth.register_hero_title1', 'Create your')}
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #F4522D, #FF8C69)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('auth.register_hero_title2', 'account')}
            </span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-8">
            {t('auth.register_hero_subtitle', "Join TechMart Savdo's financial platform and start managing your business finances today.")}
          </p>
          <div className="flex flex-col gap-3">
            {[
              t('auth.register_feat1', 'Secure JWT authentication'),
              t('auth.register_feat2', 'Role-based access control'),
              t('auth.register_feat3', 'Real-time financial insights'),
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col px-4 sm:px-8 py-8 sm:py-10 relative overflow-y-auto">
        {/* Top-right: Language & Theme dropdowns */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-8 flex items-center gap-1.5 z-10">
          <Dropdown
            options={LANGUAGES}
            value={language}
            onChange={handleLanguageChange}
            icon={Globe}
            compact
          />
          <Dropdown
            options={THEMES.map(th => ({ code: th.code, label: th.label }))}
            value={theme}
            onChange={(code) => setTheme(code as 'light' | 'dark')}
            icon={ThemeIcon}
            compact
          />
        </div>
        {/* Back to login */}
        <div className="flex items-center justify-between mb-6 mt-8 sm:mt-0">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            style={{ color: 'var(--color-text-main)', opacity: 0.6 }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.back_to_login', 'Back to sign in')}
          </Link>
          <div className="lg:hidden flex items-center gap-2">
            <div className="p-2 rounded-xl" style={{ background: 'var(--color-primary)' }}>
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">TechMart Savdo</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm mt-8 sm:mt-0">
            <div className="mb-8">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
                style={{ background: 'var(--color-primary-light)' }}
              >
                <UserPlus className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-main)' }}>
                {t('auth.create_account', 'Create account')}
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-main)', opacity: 0.5 }}>
                {t('auth.fill_details', 'Fill in your details to get started')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                  {t('auth.full_name', 'Full Name')}
                </label>
                <input
                  {...register('full_name')}
                  type="text"
                  autoComplete="name"
                  placeholder={t('auth.full_name_placeholder', 'John Smith')}
                  className="input-base w-full"
                />
                {errors.full_name && <p className="mt-1.5 text-xs text-red-500">{errors.full_name.message}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                  {t('auth.username', 'Username')}
                </label>
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  placeholder={t('auth.username_placeholder', 'johnsmith')}
                  className="input-base w-full"
                />
                {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                  {t('auth.email', 'Email Address')}
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
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.password_placeholder', 'Min. 8 characters')}
                    className="input-base w-full pr-11"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    style={{ color: 'var(--color-text-main)', opacity: 0.4 }} tabIndex={-1}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}

                <div className="mt-3 rounded-xl border p-3"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'linear-gradient(135deg, var(--color-primary-dim), transparent)'
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: 'var(--color-text-main)' }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                      {t('auth.password_strength', 'Password strength')}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: strengthConfig.color }}>
                      {strengthConfig.label}
                    </span>
                  </div>

                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${strengthPercent}%`,
                        background: `linear-gradient(90deg, ${strengthConfig.color}, var(--color-primary))`,
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {passwordChecks.map((rule) => (
                      <div
                        key={rule.label}
                        className="flex items-center gap-1.5 text-[11px]"
                        style={{ color: rule.valid ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                      >
                        {rule.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
                  {t('auth.confirm_password', 'Confirm Password')}
                </label>
                <div className="relative">
                  <input
                    {...register('confirm_password')}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.confirm_password_placeholder', 'Repeat your password')}
                    className="input-base w-full pr-11"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    style={{ color: 'var(--color-text-main)', opacity: 0.4 }} tabIndex={-1}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="mt-1.5 text-xs text-red-500">{errors.confirm_password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full justify-center py-3 text-sm mt-1 inline-flex items-center gap-2 rounded-xl border font-semibold transition-all duration-200"
                style={isSubmitDisabled
                  ? {
                      background: 'transparent',
                      color: 'var(--color-text-main)',
                      opacity: 0.45,
                      borderColor: 'var(--color-border-strong)',
                      boxShadow: 'none',
                    }
                  : {
                      background: 'var(--color-primary)',
                      color: 'white',
                      borderColor: 'transparent',
                      boxShadow: '0 1px 2px rgba(244,82,45,0.3), 0 4px 12px rgba(244,82,45,0.2)',
                    }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.creating_account', 'Creating account...')}</>
                  : <><UserPlus className="w-4 h-4" /> {t('auth.create_account', 'Create account')}</>
                }
              </button>

              {!isFormFilled && (
                <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                  {t('auth.fill_all_fields', 'Please fill all fields to activate account creation.')}
                </p>
              )}

              <p className="text-center text-sm" style={{ color: 'var(--color-text-main)', opacity: 0.5 }}>
                {t('auth.already_have_account', 'Already have an account?')} {' '}
                <Link to="/login" className="font-semibold hover:underline"
                  style={{ color: 'var(--color-primary)', opacity: 1 }}>
                  {t('auth.login', 'Sign in')}
                </Link>
              </p>
            </form>

            <div className="mt-5 flex items-center gap-2 text-xs p-3 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)', opacity: 0.6 }}>
              <ShieldCheck className="w-4 h-4 shrink-0 text-green-500" style={{ opacity: 1 }} />
              {t('auth.admin_approval', 'Admin approval may be required to activate your account.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
