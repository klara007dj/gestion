'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, CreditCard, X, Loader2 } from 'lucide-react';
import { paiementsApi, inscriptionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [meta, setMeta] = useState({ total: 0 });
  const [totalPercu, setTotalPercu] = useState(0);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchPaiements = async () => {
    setLoading(true);
    try {
      const { data } = await paiementsApi.list({ limit: 50 });
      setPaiements(data.data);
      setMeta(data.meta);
      const total = data.data.filter((p: any) => p.status === 'PAYE')
        .reduce((s: number, p: any) => s + Number(p.montant), 0);
      setTotalPercu(total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaiements();
    inscriptionsApi.list({ status: 'VALIDEE', limit: 100 })
      .then(({ data }) => setInscriptions(data.data));
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await paiementsApi.create(data);
      toast.success('Paiement enregistré.');
      setShowModal(false);
      reset();
      fetchPaiements();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const statusMap: Record<string, string> = {
    PAYE: 'badge-success', EN_ATTENTE: 'badge-warning', PARTIEL: 'badge-info', REMBOURSE: 'badge-gray'
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-500 text-sm">{meta.total} paiement(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Enregistrer un paiement
        </button>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl"><CreditCard className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total perçu</p>
            <p className="text-xl font-bold text-gray-900">{totalPercu.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl"><CreditCard className="w-6 h-6 text-orange-500" /></div>
          <div>
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-xl font-bold text-gray-900">
              {paiements.filter(p => p.status === 'EN_ATTENTE').length} paiement(s)
            </p>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Participant', 'Formation', 'Montant', 'Mode', 'Référence', 'Date', 'Statut'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Chargement...</td></tr>
            ) : paiements.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun paiement</td></tr>
            ) : paiements.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.participant?.user?.firstName} {p.participant?.user?.lastName}</p>
                  <p className="text-xs text-gray-400">{p.participant?.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs max-w-[150px] truncate">{p.inscription?.formation?.titre}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{Number(p.montant).toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-gray-600">{p.modePaiement || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.reference || '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.datePaiement ? format(new Date(p.datePaiement), 'dd/MM/yyyy', { locale: fr }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={statusMap[p.status] || 'badge-gray'}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900">Enregistrer un paiement</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inscription *</label>
                <select {...register('inscriptionId', { required: true })} className="input-field">
                  <option value="">Choisir une inscription validée...</option>
                  {inscriptions.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.participant?.user?.firstName} {i.participant?.user?.lastName} — {i.formation?.titre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input {...register('montant', { required: true })} type="number" className="input-field" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select {...register('modePaiement')} className="input-field">
                  <option value="">Choisir...</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Virement">Virement bancaire</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                <input {...register('reference')} className="input-field" placeholder="N° de transaction..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea {...register('notes')} rows={2} className="input-field" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
