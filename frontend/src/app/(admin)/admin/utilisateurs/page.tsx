'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Loader2, UserCheck, UserX, Search } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

const roleLabels: Record<string, string> = { ADMIN: 'Admin', FORMATEUR: 'Formateur', PARTICIPANT: 'Participant' };
const roleColors: Record<string, string> = { ADMIN: 'badge-danger', FORMATEUR: 'badge-info', PARTICIPANT: 'badge-gray' };

export default function UtilisateursPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0 });
  const [toggling, setToggling] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await usersApi.list(params);
      setUsers(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleToggle = async (id: number) => {
    setToggling(id);
    try {
      const { data } = await usersApi.toggle(id);
      toast.success(data.isActive ? 'Compte activé.' : 'Compte désactivé.');
      fetchUsers();
    } catch {
      toast.error('Erreur');
    } finally {
      setToggling(null);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await usersApi.createFormateur(data);
      toast.success('Formateur créé.');
      setShowModal(false);
      reset();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{meta.total} utilisateur(s)</p>
        </div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Ajouter un formateur
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..." className="input-field pl-9"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-44">
          <option value="">Tous les rôles</option>
          <option value="ADMIN">Admin</option>
          <option value="FORMATEUR">Formateur</option>
          <option value="PARTICIPANT">Participant</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nom', 'Email', 'Téléphone', 'Rôle', 'Inscrit le', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun utilisateur trouvé</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={roleColors[u.role] || 'badge-gray'}>{roleLabels[u.role] || u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  {u.isActive
                    ? <span className="badge-success">Actif</span>
                    : <span className="badge-danger">Désactivé</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(u.id)}
                    disabled={toggling === u.id}
                    title={u.isActive ? 'Désactiver' : 'Activer'}
                    className={clsx(
                      'p-1.5 rounded-lg transition-colors',
                      u.isActive
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    )}
                  >
                    {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal formateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900">Créer un formateur</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input {...register('firstName', { required: true })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input {...register('lastName', { required: true })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input {...register('email', { required: true })} type="email" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input {...register('phone')} type="tel" className="input-field" placeholder="+237..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input {...register('password', { required: true, minLength: 6 })} type="password" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                <input {...register('specialite')} className="input-field" placeholder="Ex: Développement Web" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
