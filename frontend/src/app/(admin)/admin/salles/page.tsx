'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Loader2, DoorOpen, Power } from 'lucide-react';
import { sallesApi } from '@/lib/api';

type FormData = { nom: string; capacite: string };

export default function SallesPage() {
  const [salles, setSalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();

  const fetchSalles = () => {
    setLoading(true);
    sallesApi.list().then(({ data }) => setSalles(data)).finally(() => setLoading(false));
  };
  useEffect(fetchSalles, []);

  const openCreate = () => { setEditTarget(null); reset({ nom: '', capacite: '' }); setShowModal(true); };
  const openEdit = (s: any) => { setEditTarget(s); reset({ nom: s.nom, capacite: String(s.capacite) }); setShowModal(true); };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { nom: data.nom.trim(), capacite: parseInt(data.capacite, 10) };
      if (editTarget) {
        await sallesApi.update(editTarget.id, payload);
        toast.success('Salle mise à jour.');
      } else {
        await sallesApi.create(payload);
        toast.success('Salle créée.');
      }
      setShowModal(false);
      fetchSalles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const toggleActive = async (s: any) => {
    try {
      await sallesApi.update(s.id, { isActive: !s.isActive });
      toast.success(s.isActive ? 'Salle désactivée.' : 'Salle activée.');
      fetchSalles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette salle ?')) return;
    try {
      await sallesApi.remove(id);
      toast.success('Salle supprimée.');
      fetchSalles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Impossible de supprimer (séances liées).');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salles</h1>
          <p className="text-gray-500 text-sm">{salles.length} salle(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nouvelle salle
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      ) : salles.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">Aucune salle pour le moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salles.map(s => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                    <DoorOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.nom}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Capacité : {s.capacite} place(s)</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {s.isActive
                        ? <span className="badge-success">Active</span>
                        : <span className="badge-gray">Inactive</span>}
                      <span className="text-xs text-gray-400">{s._count?.seances || 0} séance(s)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleActive(s)} title={s.isActive ? 'Désactiver' : 'Activer'}
                    className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors">
                    <Power size={14} />
                  </button>
                  <button onClick={() => openEdit(s)} title="Modifier"
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} title="Supprimer"
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900">{editTarget ? 'Modifier la salle' : 'Nouvelle salle'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input {...register('nom', { required: 'Nom requis' })} className="input-field" placeholder="Ex: Salle A1" />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacité *</label>
                <input
                  {...register('capacite', {
                    required: 'Capacité requise',
                    min: { value: 1, message: 'La capacité doit être supérieure à 0' },
                  })}
                  type="number" min={1} className="input-field" placeholder="Ex: 25"
                />
                {errors.capacite && <p className="text-red-500 text-xs mt-1">{errors.capacite.message}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {editTarget ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
