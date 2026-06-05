'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { inscriptionsApi, paiementsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClipboardList, Calendar, CheckCircle2, Clock, XCircle, CreditCard, X, Loader2, Hourglass } from 'lucide-react';
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
  const [payInsc, setPayInsc] = useState<any | null>(null);
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInscriptions = () => {
    setLoading(true);
    inscriptionsApi.list({})
      .then(({ data }) => setInscriptions(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInscriptions(); }, []);

  const openPayModal = (insc: any, solde: number) => {
    setPayInsc(insc);
    setMontant(String(solde));
    setModePaiement('');
    setReference('');
  };

  const submitPaiement = async (e: FormEvent) => {
    e.preventDefault();
    if (!payInsc) return;
    setSubmitting(true);
    try {
      await paiementsApi.create({
        inscriptionId: payInsc.id,
        montant,
        modePaiement,
        reference,
      });
      toast.success('Paiement envoyé ✓ En attente de validation par l\'administration.');
      setPayInsc(null);
      fetchInscriptions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

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
            const paiements = insc.paiements || [];
            const paiementPaye = paiements
              .filter((p: any) => p.status === 'PAYE')
              .reduce((s: number, p: any) => s + Number(p.montant), 0);
            const enAttente = paiements.find((p: any) => p.status === 'EN_ATTENTE');
            const solde = Number(insc.formation?.prix || 0) - paiementPaye;
            const canPay = insc.status === 'VALIDEE' && solde > 0 && !enAttente;

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
                    {enAttente && (
                      <p className="text-sm text-orange-600 mt-2 bg-orange-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                        <Hourglass size={13} />
                        Paiement de {Number(enAttente.montant).toLocaleString('fr-FR')} FCFA en attente de validation
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      {Number(insc.formation?.prix).toLocaleString('fr-FR')} FCFA
                    </p>
                    {paiementPaye > 0 && (
                      <p className="text-sm text-green-600">Payé : {paiementPaye.toLocaleString('fr-FR')} FCFA</p>
                    )}
                    {solde > 0 && insc.status === 'VALIDEE' && (
                      <p className="text-sm text-orange-600">Reste : {solde.toLocaleString('fr-FR')} FCFA</p>
                    )}
                    {solde <= 0 && insc.status === 'VALIDEE' && (
                      <p className="text-sm text-green-600 font-medium">Soldé ✓</p>
                    )}
                    {canPay && (
                      <button
                        onClick={() => openPayModal(insc, solde)}
                        className="btn-primary mt-2 text-sm"
                      >
                        <CreditCard size={15} /> Payer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de paiement */}
      {payInsc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900">Payer ma formation</h2>
              <button onClick={() => setPayInsc(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={submitPaiement} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {payInsc.formation?.titre}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input
                  type="number" min="1" required
                  value={montant} onChange={e => setMontant(e.target.value)}
                  className="input-field" placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select value={modePaiement} onChange={e => setModePaiement(e.target.value)} className="input-field">
                  <option value="">Choisir...</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Virement">Virement bancaire</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                <input
                  value={reference} onChange={e => setReference(e.target.value)}
                  className="input-field" placeholder="N° de transaction Mobile Money..."
                />
              </div>
              <p className="text-xs text-gray-400">
                Votre paiement sera transmis à l'administration pour validation.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPayInsc(null)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Payer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
