'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Award, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { attestationsApi, inscriptionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AttestationsAdminPage() {
  const [attestations, setAttestations] = useState<any[]>([]);
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInscriptionId, setSelectedInscriptionId] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchAttestations = async () => {
    // Récupère toutes via verify (pas d'endpoint admin list dans ce MVP — on liste depuis les inscriptions)
    setLoading(false);
  };

  useEffect(() => {
    fetchAttestations();
    inscriptionsApi.list({ status: 'VALIDEE', limit: 200 })
      .then(({ data }) => setInscriptions(data.data));
  }, []);

  const handleGenerate = async () => {
    if (!selectedInscriptionId) return;
    const insc = inscriptions.find(i => String(i.id) === selectedInscriptionId);
    if (!insc) return;
    setGenerating(true);
    try {
      const { data } = await attestationsApi.create({
        participantId: insc.participant?.id,
        formationId: insc.formation?.id,
      });
      toast.success('Attestation générée avec succès !');
      setShowModal(false);
      setSelectedInscriptionId('');
      // Ajouter à la liste locale
      setAttestations(prev => [data, ...prev]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attestations</h1>
          <p className="text-gray-500 text-sm">Générer et gérer les attestations de formation</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Générer une attestation
        </button>
      </div>

      {attestations.length === 0 ? (
        <div className="card text-center py-16">
          <Award className="mx-auto w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune attestation générée dans cette session.</p>
          <p className="text-gray-400 text-sm mt-1">Les attestations générées apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attestations.map(att => (
            <div key={att.id} className="card border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">Attestation générée</span>
              </div>
              <p className="font-bold text-gray-900">{att.participant?.user?.firstName} {att.participant?.user?.lastName}</p>
              <p className="text-sm text-gray-600 mt-0.5">{att.formation?.titre}</p>
              <p className="text-xs text-gray-400 mt-2">Code : {att.code}</p>
              <p className="text-xs text-gray-400">
                Émise le {format(new Date(att.dateEmission), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal génération */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900">Générer une attestation</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participant et formation *
                </label>
                <select
                  value={selectedInscriptionId}
                  onChange={e => setSelectedInscriptionId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choisir une inscription validée...</option>
                  {inscriptions.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.participant?.user?.firstName} {i.participant?.user?.lastName} — {i.formation?.titre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Seules les inscriptions validées peuvent recevoir une attestation.
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedInscriptionId || generating}
                  className="btn-primary flex-1 justify-center"
                >
                  {generating && <Loader2 size={14} className="animate-spin" />}
                  Générer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
