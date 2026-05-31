'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { presencesApi, inscriptionsApi, formationsApi } from '@/lib/api';
import { Save, Users, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

type AttStatus = 'PRESENT' | 'ABSENT' | 'RETARD' | 'EXCUSE';
const statusOptions: { value: AttStatus; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Présent',  color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'ABSENT',  label: 'Absent',   color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'RETARD',  label: 'Retard',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'EXCUSE',  label: 'Excusé',   color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

function PresencesContent() {
  const searchParams = useSearchParams();
  const formationId = searchParams.get('formationId');

  const [formations, setFormations] = useState<any[]>([]);
  const [selectedFormation, setSelectedFormation] = useState(formationId || '');
  const [participants, setParticipants] = useState<any[]>([]);
  const [presences, setPresences] = useState<Record<number, AttStatus>>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    formationsApi.list({ limit: 50 }).then(({ data }) => setFormations(data.data));
  }, []);

  useEffect(() => {
    if (!selectedFormation) return;
    setLoadingParticipants(true);
    inscriptionsApi.list({ formationId: selectedFormation, status: 'VALIDEE', limit: 100 })
      .then(({ data }) => {
        const list = data.data;
        setParticipants(list);
        // Init tous à PRESENT
        const init: Record<number, AttStatus> = {};
        list.forEach((insc: any) => { init[insc.participant?.id] = 'PRESENT'; });
        setPresences(init);
      })
      .finally(() => setLoadingParticipants(false));
  }, [selectedFormation]);

  const handleSave = async () => {
    if (!selectedFormation || !participants.length) return;
    setSaving(true);
    try {
      const payload = participants.map(insc => ({
        participantId: insc.participant?.id,
        status: presences[insc.participant?.id] || 'PRESENT',
      }));
      await presencesApi.bulkCreate({ formationId: parseInt(selectedFormation), date, presences: payload });
      toast.success(`${payload.length} présences enregistrées !`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(presences).filter(s => s === 'PRESENT').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prise de présences</h1>
        <p className="text-gray-500 text-sm">Enregistrez les présences d'une session</p>
      </div>

      {/* Sélection formation + date */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
            <select
              value={selectedFormation}
              onChange={e => setSelectedFormation(e.target.value)}
              className="input-field"
            >
              <option value="">Choisir une formation...</option>
              {formations.map(f => <option key={f.id} value={f.id}>{f.titre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de la session</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Liste participants */}
      {selectedFormation && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-500" />
              <span className="font-medium text-gray-800">
                {participants.length} participant(s)
              </span>
              {participants.length > 0 && (
                <span className="text-sm text-gray-500">
                  — {presentCount} présent(s)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              {format(new Date(date), 'EEEE dd MMMM yyyy', { locale: fr })}
            </div>
          </div>

          {loadingParticipants ? (
            <div className="py-12 text-center text-gray-400">Chargement des participants...</div>
          ) : participants.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              Aucun participant inscrit et validé pour cette formation.
            </div>
          ) : (
            <>
              {/* En-tête colonnes */}
              <div className="hidden md:grid grid-cols-[1fr_auto] gap-4 px-5 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Participant</span>
                <span>Statut de présence</span>
              </div>

              <div className="divide-y">
                {participants.map((insc: any, idx: number) => {
                  const p = insc.participant;
                  const currentStatus = presences[p?.id] || 'PRESENT';
                  return (
                    <div key={p?.id || idx} className="px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{p?.user?.firstName} {p?.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{p?.user?.email}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {statusOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setPresences(prev => ({ ...prev, [p?.id]: opt.value }))}
                            className={clsx(
                              'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                              currentStatus === opt.value
                                ? opt.color + ' ring-2 ring-offset-1 ring-current'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-4 border-t bg-gray-50 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Enregistrer les présences
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PresencesPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-gray-400">Chargement...</div>}>
      <PresencesContent />
    </Suspense>
  );
}
