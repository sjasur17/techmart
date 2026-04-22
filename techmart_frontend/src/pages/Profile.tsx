import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardBody } from '../components/ui/Card';
import { User, Mail, Phone, Building, Shield, Edit3, Check, X, KeyRound, Upload, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/axios';

export const Profile = () => {
  const { user, setAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarCleared, setAvatarCleared] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const [pwData, setPwData] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!avatarFile) return;
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  useEffect(() => {
    setFormData({
      full_name: user?.full_name || user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
    });
  }, [user]);

  const avatarSrc = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    return user?.avatar_url || null;
  }, [avatarPreview, user?.avatar_url]);

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = new FormData();
      const [firstName, ...restName] = formData.full_name.trim().split(' ');
      payload.append('first_name', firstName || '');
      payload.append('last_name', restName.join(' '));
      payload.append('phone', formData.phone);
      payload.append('department', formData.department);
      if (avatarCleared) {
        payload.append('avatar', '');
      } else if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      const res = await apiClient.patch('/auth/me/', payload);
      setAuth({
        access: localStorage.getItem('access_token') || '',
        refresh: localStorage.getItem('refresh_token') || '',
        user: res.data,
      });
      toast.success('Profile updated!');
      setEditing(false);
      setAvatarCleared(false);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = async () => {
    if (pwData.newPw !== pwData.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (pwData.newPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    toast.success('Password change feature requires backend endpoint');
    setPwData({ current: '', newPw: '', confirm: '' });
    setShowPw(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          My Profile
        </h1>
        <p className="text-textMain/50 text-sm mt-1">Manage your personal information</p>
      </div>

      {/* Avatar + name card */}
      <Card>
        <CardBody className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.full_name || user?.username || 'Profile photo'}
                  className="w-20 h-20 rounded-2xl object-cover shadow-medium border"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-medium"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), #FF8C69)' }}
                >
                  {initials}
                </div>
              )}
              {editing && (
                <label
                  className="absolute -right-2 -bottom-2 inline-flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer shadow-sm bg-white text-primary hover:scale-105 transition-transform"
                  style={{ borderColor: 'var(--color-border)' }}
                  title={avatarSrc ? 'Change photo' : 'Upload photo'}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAvatarFile(file);
                      setAvatarCleared(false);
                    }}
                  />
                  <Camera className="w-4 h-4" />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.full_name || user?.username}</h2>
              <p className="text-sm text-textMain/50">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user?.is_superuser && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
                {user?.is_accountant && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Accountant
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all hover:border-primary/40 hover:text-primary w-full sm:w-auto"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Edit3 className="w-4 h-4" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:border-primary/40 hover:text-primary w-full sm:w-auto"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Upload className="w-4 h-4" />
                {avatarSrc ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarSrc && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    setAvatarCleared(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:border-red-300 hover:text-red-500 w-full sm:w-auto"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <X className="w-4 h-4" />
                  Remove photo
                </button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Info fields */}
      <Card>
        <CardBody className="p-4 sm:p-6 space-y-5">
          <h3 className="font-semibold text-sm text-textMain/60 uppercase tracking-wide">Personal Information</h3>

          {[
            { label: 'Full Name', key: 'full_name', icon: User, type: 'text', placeholder: 'John Smith' },
            { label: 'Email', key: 'email', icon: Mail, type: 'email', placeholder: 'email@company.com', disabled: true },
            { label: 'Phone', key: 'phone', icon: Phone, type: 'tel', placeholder: '+998 90 123 45 67' },
            { label: 'Department', key: 'department', icon: Building, type: 'text', placeholder: 'e.g. Finance' },
          ].map(({ label, key, icon: Icon, type, placeholder, disabled }) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary-light)' }}>
                <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-textMain/50 font-medium block mb-1">{label}</label>
                {editing && !disabled ? (
                  <input
                    type={type}
                    value={(formData as any)[key]}
                    onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="input-base w-full"
                  />
                ) : (
                  <p className="text-sm font-medium">
                    {(formData as any)[key] || <span className="text-textMain/30 italic">Not set</span>}
                  </p>
                )}
              </div>
            </div>
          ))}

          {editing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary gap-2 justify-center"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:border-primary/40"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Change password */}
      <Card>
        <CardBody className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-light)' }}>
                <KeyRound className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">Security</p>
                <p className="text-xs text-textMain/50">Change your password</p>
              </div>
            </div>
            <button
              onClick={() => setShowPw(!showPw)}
              className="text-sm font-medium px-3 py-2 rounded-xl border transition-all hover:border-primary/40 hover:text-primary w-full sm:w-auto"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {showPw ? 'Cancel' : 'Change password'}
            </button>
          </div>

          {showPw && (
            <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {[
                { label: 'Current password', key: 'current' },
                { label: 'New password', key: 'newPw' },
                { label: 'Confirm new password', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-textMain/50 font-medium block mb-1">{label}</label>
                  <input
                    type="password"
                    value={(pwData as any)[key]}
                    onChange={e => setPwData(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="input-base w-full"
                  />
                </div>
              ))}
              <button onClick={handlePwChange} className="btn-primary mt-1">
                Update password
              </button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
