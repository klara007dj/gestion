'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Save, Loader2, Key } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usersApi, authApi } from '@/lib/api';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Prénom trop court'),
  lastName: z.string().min(2, 'Nom trop court'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(6, 'Nouveau mot de passe min 6 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ProfileData = z.infer<typeof profileSchema>;
type PwdData = z.infer<typeof pwdSchema>;

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: '',
      address: '',
    },
  });

  const pwdForm = useForm<PwdData>({ resolver: zodResolver(pwdSchema) });

  const onProfileSubmit = async (data: ProfileData) => {
    try {
      await usersApi.updateMe(data);
      await refreshUser();
      toast.success('Profil mis à jour.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const onPwdSubmit = async (data: PwdData) => {
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Mot de passe modifié.');
      pwdForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Avatar */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div>
          <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-blue-600 mt-0.5">
            {user.participant?.numInscription && `N° ${user.participant.numInscription.slice(0, 12)}...`}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={15} /> Informations
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'password'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Key size={15} /> Mot de passe
        </button>
      </div>

      {/* Formulaire profil */}
      {activeTab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input {...profileForm.register('firstName')} className="input-field" />
              {profileForm.formState.errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input {...profileForm.register('lastName')} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={user.email} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input {...profileForm.register('phone')} type="tel" className="input-field" placeholder="+237 6XX XXX XXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <textarea {...profileForm.register('address')} rows={2} className="input-field" placeholder="Votre adresse..." />
          </div>
          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="btn-primary"
          >
            {profileForm.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
            <Save size={14} />
            Enregistrer
          </button>
        </form>
      )}

      {/* Formulaire mot de passe */}
      {activeTab === 'password' && (
        <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
            <input {...pwdForm.register('currentPassword')} type="password" className="input-field" placeholder="••••••••" />
            {pwdForm.formState.errors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{pwdForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input {...pwdForm.register('newPassword')} type="password" className="input-field" placeholder="••••••••" />
            {pwdForm.formState.errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{pwdForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
            <input {...pwdForm.register('confirmPassword')} type="password" className="input-field" placeholder="••••••••" />
            {pwdForm.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{pwdForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={pwdForm.formState.isSubmitting}
            className="btn-primary"
          >
            {pwdForm.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
            <Key size={14} />
            Modifier le mot de passe
          </button>
        </form>
      )}
    </div>
  );
}
