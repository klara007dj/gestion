'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Save, Loader2, Key, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usersApi, authApi } from '@/lib/api';

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Requis'),
  newPassword: z.string().min(6, 'Min 6 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export default function ParametresPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'profile' | 'security'>('profile');

  const pf = useForm({ resolver: zodResolver(profileSchema), defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', phone: '' } });
  const pwf = useForm({ resolver: zodResolver(pwdSchema) });

  const onProfile = async (data: any) => {
    try {
      await usersApi.updateMe(data);
      await refreshUser();
      toast.success('Profil mis à jour.');
    } catch { toast.error('Erreur.'); }
  };

  const onPwd = async (data: any) => {
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Mot de passe modifié.');
      pwf.reset();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 text-sm">Gérez votre compte administrateur</p>
      </div>

      {/* Carte identité */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold">
          {user?.firstName[0]}{user?.lastName[0]}
        </div>
        <div>
          <p className="font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="badge-danger text-xs mt-0.5 inline-block">Administrateur</span>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b gap-1">
        {[
          { key: 'profile', label: 'Profil', icon: Save },
          { key: 'security', label: 'Sécurité', icon: Shield },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={pf.handleSubmit(onProfile)} className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input {...pf.register('firstName')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input {...pf.register('lastName')} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={user?.email} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input {...pf.register('phone')} type="tel" className="input-field" placeholder="+237..." />
          </div>
          <button type="submit" disabled={pf.formState.isSubmitting} className="btn-primary">
            {pf.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
            <Save size={14} /> Enregistrer
          </button>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={pwf.handleSubmit(onPwd)} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
            <input {...pwf.register('currentPassword')} type="password" className="input-field" placeholder="••••••••" />
            {pwf.formState.errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{String(pwf.formState.errors.currentPassword.message)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input {...pwf.register('newPassword')} type="password" className="input-field" placeholder="••••••••" />
            {pwf.formState.errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{String(pwf.formState.errors.newPassword.message)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
            <input {...pwf.register('confirmPassword')} type="password" className="input-field" placeholder="••••••••" />
            {pwf.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{String(pwf.formState.errors.confirmPassword.message)}</p>
            )}
          </div>
          <button type="submit" disabled={pwf.formState.isSubmitting} className="btn-primary">
            {pwf.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
            <Key size={14} /> Modifier le mot de passe
          </button>
        </form>
      )}
    </div>
  );
}
