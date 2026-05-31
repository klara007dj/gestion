'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Loader2, Calendar, Users, DollarSign, X } from 'lucide-react';
import { formationsApi, domainesApi, usersApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

const niveaux = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'EXPERT'];
const niveauLabels: Record<string, string> = {
  DEBUTANT: 'Débutant', INTERMEDIAIRE: 'Intermédiaire', AVANCE: 'Avancé', EXPERT: 'Expert'
};

const schema = z.object({
  titre: z.string().min(3, 'Titre trop court'),
  description: z.string().optional(),
  domaineId: z.string().min(1, 'Domaine requis'),
  niveau: z.string(),
  duree: z.string().min(1, 'Durée requise'),
  dateDebut: z.string().min(1, 'Date début requise'),
  dateFin: z.string().min(1, 'Date fin requise'),
  prix: z.string().min(1, 'Prix requis'),
  placesMax: z.string().min(1, 'Places requises'),
  formateurId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function FormationsPage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [domaines, setDomaines] = useState<any[]>([]);
  const [formateurs, setFormateurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { niveau: 'DEBUTANT' },
  });

  const fetchFormations = async () => {
    setLoading(true);
    try {
      const { data } = await formationsApi.list({ search, page, limit: 10 });
      setFormations(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, [search, page]);

  useEffect(() => {
    Promise.all([
      domainesApi.list(),
      usersApi.list({ role: 'FORMATEUR' }),
    ]).then(([d, u]) => {
      setDomaines(d.data);
      setFormateurs(u.data.data || []);
    });
  }, []);

  const openCreate = () => { setEditTarget(null); reset({ niveau: 'DEBUTANT' }); setShowModal(true); };
  const openEdit = (f: any) => {
    setEditTarget(f);
    reset({
      titre: f.titre, description: f.description || '',
      domaineId: String(f.domaineId), niveau: f.niveau,
      duree: f.duree, prix: String(f.prix), placesMax: String(f.placesMax),
      dateDebut: f.dateDebut?.slice(0, 10), dateFin: f.dateFin?.slice(0, 10),
      formateurId: f.formateurId ? String(f.formateurId) : '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, domaineId: parseInt(data.domaineId), prix: parseFloat(data.prix), placesMax: parseInt(data.placesMax) };
      if (editTarget) {
        await formationsApi.update(editTarget.id, payload);
        toast.success('Formation mise à jour.');
      } else {
        await formationsApi.create(payload);
        toast.success('Formation créée.');
      }
      setShowModal(false);
      fetchFormations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Désactiver cette formation ?')) return;
    try {
      await formationsApi.delete(id);
      toast.success('Formation désactivée.');
      fetchFormations();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
          <p className="text-gray-500 text-sm">{meta.total} formation(s) au total</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nouvelle formation
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher une formation..."
          className="input-field pl-9"
        />
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Titre', 'Domaine', 'Niveau', 'Période', 'Prix', 'Places', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Chargement...</td></tr>
            ) : formations.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Aucune formation trouvée</td></tr>
            ) : formations.map(f => (
              <tr key={f.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{f.titre}</td>
                <td className="px-4 py-3 text-gray-600">{f.domaine?.nom}</td>
                <td className="px-4 py-3">
                  <span className="badge-info">{niveauLabels[f.niveau] || f.niveau}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {format(new Date(f.dateDebut), 'dd/MM/yy')} → {format(new Date(f.dateFin), 'dd/MM/yy')}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-800 font-medium">{Number(f.prix).toLocaleString()} FCFA</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users size={12} />
                    {f._count?.inscriptions || 0}/{f.placesMax}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {f.isActive
                    ? <span className="badge-success">Active</span>
                    : <span className="badge-gray">Inactive</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(f)} className="text-blue-600 hover:text-blue-800"><Edit size={15} /></button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(meta.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={clsx('w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border')}
            >{i + 1}</button>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900">{editTarget ? 'Modifier la formation' : 'Nouvelle formation'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input {...register('titre')} className="input-field" placeholder="Ex: Formation Développement Web" />
                {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea {...register('description')} rows={3} className="input-field" placeholder="Description de la formation..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domaine *</label>
                  <select {...register('domaineId')} className="input-field">
                    <option value="">Choisir...</option>
                    {domaines.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                  {errors.domaineId && <p className="text-red-500 text-xs mt-1">{errors.domaineId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <select {...register('niveau')} className="input-field">
                    {niveaux.map(n => <option key={n} value={n}>{niveauLabels[n]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée *</label>
                <input {...register('duree')} className="input-field" placeholder="Ex: 40 heures, 2 semaines" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                  <input {...register('dateDebut')} type="date" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin *</label>
                  <input {...register('dateFin')} type="date" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA) *</label>
                  <input {...register('prix')} type="number" className="input-field" placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Places max *</label>
                  <input {...register('placesMax')} type="number" className="input-field" placeholder="20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formateur</label>
                <select {...register('formateurId')} className="input-field">
                  <option value="">Non assigné</option>
                  {formateurs.map(f => (
                    <option key={f.id} value={f.formateur?.id}>{f.firstName} {f.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
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
