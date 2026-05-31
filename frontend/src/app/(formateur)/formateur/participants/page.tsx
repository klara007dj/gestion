'use client';
import { useState, useEffect } from 'react';
import { inscriptionsApi, formationsApi } from '@/lib/api';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FormateurParticipantsPage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    formationsApi.list({ limit: 100 }).then(({ data }) => setFormations(data.data));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    inscriptionsApi.list({ formationId: selected, status: 'VALIDEE', limit: 100 })
      .then(({ data }) => setParticipants(data.data))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
        <p className="text-gray-500 text-sm">Liste des apprenants par formation</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
        <select value={selected} onChange={e => setSelected(e.target.value)} className="input-field max-w-md">
          <option value="">Choisir une formation...</option>
          {formations.map(f => <option key={f.id} value={f.id}>{f.titre}</option>)}
        </select>
      </div>

      {selected && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
            <Users size={15} className="text-gray-500" />
            <span className="font-semibold text-gray-800">{participants.length} participant(s) inscrit(s)</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Chargement...</div>
          ) : participants.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Aucun participant validé pour cette formation.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-white">
                <tr>
                  {['#', 'Nom', 'Email', 'Téléphone', 'Inscrit le'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {participants.map((insc: any, i: number) => (
                  <tr key={insc.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {insc.participant?.user?.firstName} {insc.participant?.user?.lastName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail size={13} className="text-gray-400" />
                        {insc.participant?.user?.email}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {insc.participant?.user?.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone size={13} className="text-gray-400" />
                          {insc.participant?.user?.phone}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {format(new Date(insc.createdAt), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
