import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardBody } from '../components/ui/Card';
import { User, Mail, Phone, Building, Shield, Edit3, Check, X, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/axios';

export const Profile = () => {
  const { user, setAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const [pwData, setPwData] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await apiClient.patch('/auth/me/', {
        first_name: formData.full_name.split(' ')[0],
        last_name: formData.full_name.split(' ').slice(1).join(' '),
        phone: formData.phone,
        department: formData.department,
      });
      toast.success('Profile updated!');
      setEditing(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
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
        <CardBody className="p-6">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-medium"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), #FF8C69)' }}
            >
              {initials}
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all hover:border-primary/40 hover:text-primary"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Edit3 className="w-4 h-4" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Info fields */}
      <Card>
        <CardBody className="p-6 space-y-5">
          <h3 className="font-semibold text-sm text-textMain/60 uppercase tracking-wide">Personal Information</h3>

          {[
            { label: 'Full Name', key: 'full_name', icon: User, type: 'text', placeholder: 'John Smith' },
            { label: 'Email', key: 'email', icon: Mail, type: 'email', placeholder: 'email@company.com', disabled: true },
            { label: 'Phone', key: 'phone', icon: Phone, type: 'tel', placeholder: '+998 90 123 45 67' },
            { label: 'Department', key: 'department', icon: Building, type: 'text', placeholder: 'e.g. Finance' },
          ].map(({ label, key, icon: Icon, type, placeholder, disabled }) => (
            <div key={key} className="flex items-center gap-4">
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
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary gap-2"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:border-primary/40"
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
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
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
              className="text-sm font-medium px-3 py-2 rounded-xl border transition-all hover:border-primary/40 hover:text-primary"
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
