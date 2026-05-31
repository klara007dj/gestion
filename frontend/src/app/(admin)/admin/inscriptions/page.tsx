'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Check, X, Clock, Filter } from 'lucide-react';
import { inscriptionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; class: string }> = {
  EN_ATTENTE: { label: 'En attente', class: 'badge-warning' },
  VALIDEE: { label: 'Validée', class: 'badge-success' },
  REFUSEE: { label: 'Refusée', class: 'badge-danger' },
  ANNULEE: { label: 'Annulée', class: 'badge-gray' },
};

export default function InscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0 });
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchInscriptions = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await inscriptionsApi.list(params);
      setInscriptions(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInscriptions(); }, [statusFilter, page]);

  const handleStatus = async (id: number, status: string) => {
    setProcessingId(id);
    try {
      await inscriptionsApi.updateStatus(id, { status });
      toast.success(status === 'VALIDEE' ? 'Inscription validée ✓' : 'Inscription refusée');
      fetchInscriptions();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inscriptions</h1>
          <p className="text-gray-500 text-sm">{meta.total} inscription(s)</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['', 'EN_ATTENTE', 'VALIDEE', 'REFUSEE', 'ANNULEE'].map(s => (
          <button key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            {s === '' ? 'Tous' : statusConfig[s]?.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Participant', 'Formation', 'Date inscription', 'Paiement', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chargement...</td></tr>
            ) : inscriptions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Aucune inscription</td></tr>
            ) : inscriptions.map(insc => {
              const paiementTotal = insc.paiements?.reduce((s: number, p: any) => s + Number(p.montant), 0) || 0;
              return (
                <tr key={insc.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {insc.participant?.user?.firstName} {insc.participant?.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{insc.participant?.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 max-w-[180px] truncate">{insc.formation?.titre}</p>
                    <p className="text-xs text-gray-400">{Number(insc.formation?.prix).toLocaleString()} FCFA</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {format(new Date(insc.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    {paiementTotal > 0
                      ? <span className="badge-success">{paiementTotal.toLocaleString()} FCFA</span>
                      : <span className="badge-warning">Non payé</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusConfig[insc.status]?.class || 'badge-gray'}>
                      {statusConfig[insc.status]?.label || insc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {insc.status === 'EN_ATTENTE' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(insc.id, 'VALIDEE')}
                          disabled={processingId === insc.id}
                          className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                          title="Valider"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleStatus(insc.id, 'REFUSEE')}
                          disabled={processingId === insc.id}
                          className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                          title="Refuser"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
