'use client';
import { useState, useEffect } from 'react';
import { inscriptionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClipboardList, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  EN_ATTENTE: { label: 'En attente', class: 'badge-warning', icon: Clock },
  VALIDEE:    { label: 'Validée',    class: 'badge-success', icon: CheckCircle2 },
  REFUSEE:    { label: 'Refusée',    class: 'badge-danger',  icon: XCircle },
  ANNULEE:    { label: 'Annulée',    class: 'badge-gray',    icon: XCircle },
};

export default function MesInscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inscriptionsApi.list({})
      .then(({ data }) => setInscriptions(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes inscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">{inscriptions.length} inscription(s)</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : inscriptions.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="mx-auto w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Vous n'avez pas encore d'inscription.</p>
          <a href="/participant/formations" className="btn-primary inline-flex">
            Voir le catalogue
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {inscriptions.map(insc => {
            const cfg = statusConfig[insc.status] || statusConfig.EN_ATTENTE;
            const StatusIcon = cfg.icon;
            const paiementTotal = insc.paiements?.reduce((s: number, p: any) => s + Number(p.montant), 0) || 0;
            const solde = Number(insc.formation?.prix || 0) - paiementTotal;

            return (
              <div key={insc.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{insc.formation?.titre}</h3>
                      <span className={clsx('shrink-0', cfg.class)}>
                        <StatusIcon size={11} className="inline mr-1" />{cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {format(new Date(insc.formation?.dateDebut), 'dd MMM yyyy', { locale: fr })}
                        {' → '}
                        {format(new Date(insc.formation?.dateFin), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span>Inscrit le {format(new Date(insc.createdAt), 'dd/MM/yyyy', { locale: fr })}</span>
                    </div>
                    {insc.motifRefus && (
                      <p className="text-sm text-red-600 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">
                        Motif : {insc.motifRefus}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      {Number(insc.formation?.prix).toLocaleString('fr-FR')} FCFA
                    </p>
                    {paiementTotal > 0 && (
                      <p className="text-sm text-green-600">Payé : {paiementTotal.toLocaleString()} FCFA</p>
                    )}
                    {solde > 0 && insc.status === 'VALIDEE' && (
                      <p className="text-sm text-orange-600">Reste : {solde.toLocaleString()} FCFA</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
