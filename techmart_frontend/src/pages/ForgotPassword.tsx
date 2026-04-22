import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { buildApiUrl } from '../api/config';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await axios.post(buildApiUrl('/auth/password-reset/'), data);
      toast.success(t('auth.reset_sent', 'Password reset link sent. Please check your email.'));
    } catch {
      toast.success(
        t(
          'auth.reset_contact_admin',
          'Reset link service is currently unavailable. Please contact your administrator.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 animate-page-enter"
      style={{ background: 'var(--color-bg-page)' }}>
      <div className="w-full max-w-md rounded-2xl border p-6 sm:p-8"
        style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium mb-5 hover:text-primary transition-colors"
          style={{ color: 'var(--color-text-main)', opacity: 0.7 }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('auth.back_to_login', 'Back to sign in')}
        </Link>

        <div className="mb-6">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-light), rgba(244,82,45,0.22))' }}
          >
            <KeyRound className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>
            {t('auth.forgot_password', 'Forgot password?')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-main)', opacity: 0.6 }}>
            {t('auth.reset_password_help', 'Enter your email address and we will send reset instructions.')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-main)' }}>
              {t('auth.email', 'Email address')}
            </label>
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="example@gmail.com"
                className="input-base w-full pl-11"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--color-text-main)', opacity: 0.35 }} />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.sending', 'Sending...')}</>
              : t('auth.send_reset_link', 'Send reset link')
            }
          </button>
        </form>
      </div>
    </div>
  );
};
