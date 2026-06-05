'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Loader2, CalendarDays } from 'lucide-react';
import CalendarView from '@/components/planning/CalendarView';
import { seancesApi, sallesApi, formationsApi, usersApi } from '@/lib/api';

type FormData = {
  titre?: string;
  formationId: string;
  formateurId: string;
  salleId: string;
  date: string;
  heureDebut: string;
  heureFin: string;
};

export default function AdminPlanningPage() {
  const [showModal, setShowModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [formations, setFormations] = useState<any[]>([]);
  const [formateurs, setFormateurs] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();

  useEffect(() => {
    Promise.all([
      formationsApi.list({ limit: 100 }),
      usersApi.list({ role: 'FORMATEUR', limit: 100 }),
      sallesApi.list(),
    ]).then(([f, u, s]) => {
      setFormations(f.data.data || []);
      setFormateurs(u.data.data || []);
      setSalles((s.data || []).filter((sl: any) => sl.isActive));
    }).catch(() => toast.error('Erreur de chargement des données.'));
  }, []);

  const openCreate = () => {
    reset({ titre: '', formationId: '', formateurId: '', salleId: '', date: '', heureDebut: '', heureFin: '' });
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await seancesApi.create({
        titre: data.titre?.trim() || undefined,
        formationId: parseInt(data.formationId, 10),
        formateurId: parseInt(data.formateurId, 10),
        salleId: parseInt(data.salleId, 10),
        date: data.date,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
      });
      toast.success('Séance planifiée.');
      setShowModal(false);
      setReloadKey(k => k + 1);
    } catch (err: any) {
      // 409 = conflit de salle ou de formateur → message renvoyé par l'API
      toast.error(err.response?.data?.error || 'Erreur lors de la planification');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" /> Planning
          </h1>
          <p className="text-gray-500 text-sm">Emploi du temps des formations</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nouvelle séance
        </button>
      </div>

      <CalendarView role="ADMIN" reloadKey={reloadKey} />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900">Nouvelle séance</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre (optionnel)</label>
                <input {...register('titre')} className="input-field" placeholder="Ex: Module 1 — Introduction" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formation *</label>
                <select {...register('formationId', { required: 'Formation requise' })} className="input-field">
                  <option value="">Choisir...</option>
                  {formations.map(f => <option key={f.id} value={f.id}>{f.titre}</option>)}
                </select>
                {errors.formationId && <p className="text-red-500 text-xs mt-1">{errors.formationId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formateur *</label>
                  <select {...register('formateurId', { required: 'Formateur requis' })} className="input-field">
                    <option value="">Choisir...</option>
                    {formateurs.filter(f => f.formateur?.id).map(f => (
                      <option key={f.id} value={f.formateur.id}>{f.firstName} {f.lastName}</option>
                    ))}
                  </select>
                  {errors.formateurId && <p className="text-red-500 text-xs mt-1">{errors.formateurId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salle *</label>
                  <select {...register('salleId', { required: 'Salle requise' })} className="input-field">
                    <option value="">Choisir...</option>
                    {salles.map(s => <option key={s.id} value={s.id}>{s.nom} ({s.capacite} pl.)</option>)}
                  </select>
                  {errors.salleId && <p className="text-red-500 text-xs mt-1">{errors.salleId.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input {...register('date', { required: 'Date requise' })} type="date" className="input-field" />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure début *</label>
                  <input {...register('heureDebut', { required: 'Heure de début requise' })} type="time" className="input-field" />
                  {errors.heureDebut && <p className="text-red-500 text-xs mt-1">{errors.heureDebut.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin *</label>
                  <input {...register('heureFin', { required: 'Heure de fin requise' })} type="time" className="input-field" />
                  {errors.heureFin && <p className="text-red-500 text-xs mt-1">{errors.heureFin.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Planifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
