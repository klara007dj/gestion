'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Loader2, BookOpen } from 'lucide-react';
import { domainesApi } from '@/lib/api';

export default function DomainesPage() {
  const [domaines, setDomaines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ nom: string; description?: string }>();

  const fetch = () => {
    domainesApi.list().then(({ data }) => setDomaines(data)).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const openCreate = () => { setEditTarget(null); reset({ nom: '', description: '' }); setShowModal(true); };
  const openEdit = (d: any) => { setEditTarget(d); reset({ nom: d.nom, description: d.description || '' }); setShowModal(true); };

  const onSubmit = async (data: any) => {
    try {
      if (editTarget) {
        await domainesApi.update(editTarget.id, data);
        toast.success('Domaine mis à jour.');
      } else {
        await domainesApi.create(data);
        toast.success('Domaine créé.');
      }
      setShowModal(false);
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce domaine ?')) return;
    try {
      await domainesApi.delete(id);
      toast.success('Domaine supprimé.');
      fetch();
    } catch {
      toast.error('Impossible de supprimer (des formations y sont liées).');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Domaines de formation</h1>
          <p className="text-gray-500 text-sm">{domaines.length} domaine(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nouveau domaine
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domaines.map(d => (
            <div key={d.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.nom}</h3>
                    {d.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{d.description}</p>}
                    <p className="text-xs text-blue-600 mt-1">
                      {d._count?.formations || 0} formation(s)
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
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
              <h2 className="font-bold text-gray-900">{editTarget ? 'Modifier le domaine' : 'Nouveau domaine'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input {...register('nom', { required: true })} className="input-field" placeholder="Ex: Développement Web" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea {...register('description')} rows={3} className="input-field" placeholder="Description du domaine..." />
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
