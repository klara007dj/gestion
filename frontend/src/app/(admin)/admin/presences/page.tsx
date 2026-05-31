'use client';
import { useState, useEffect } from 'react';
import { presencesApi, formationsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  PRESENT: { label: 'Présent',  icon: CheckCircle2, color: 'text-green-600' },
  ABSENT:  { label: 'Absent',   icon: XCircle,      color: 'text-red-500' },
  RETARD:  { label: 'Retard',   icon: Clock,        color: 'text-yellow-600' },
  EXCUSE:  { label: 'Excusé',   icon: AlertCircle,  color: 'text-blue-500' },
};

export default function PresencesAdminPage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [presences, setPresences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    formationsApi.list({ limit: 100 }).then(({ data }) => setFormations(data.data));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    presencesApi.getByFormation(selected)
      .then(({ data }) => setPresences(data))
      .finally(() => setLoading(false));
  }, [selected]);

  // Grouper par date
  const grouped = presences.reduce((acc: any, p: any) => {
    const date = format(new Date(p.date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(p);
    return acc;
  }, {});

  const stats = {
    total: presences.length,
    presents: presences.filter(p => p.status === 'PRESENT').length,
    absents: presences.filter(p => p.status === 'ABSENT').length,
    retards: presences.filter(p => p.status === 'RETARD').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
        <p className="text-gray-500 text-sm">Consulter les feuilles de présence par formation</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner une formation</label>
        <select value={selected} onChange={e => setSelected(e.target.value)} className="input-field max-w-md">
          <option value="">Choisir une formation...</option>
          {formations.map(f => <option key={f.id} value={f.id}>{f.titre}</option>)}
        </select>
      </div>

      {selected && (
        <>
          {/* Stats rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total enregistrés', value: stats.total, color: 'bg-gray-100 text-gray-700' },
              { label: 'Présents', value: stats.presents, color: 'bg-green-100 text-green-700' },
              { label: 'Absents', value: stats.absents, color: 'bg-red-100 text-red-700' },
              { label: 'Retards', value: stats.retards, color: 'bg-yellow-100 text-yellow-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Détail par date */}
          {loading ? (
            <div className="card py-12 text-center text-gray-400">Chargement...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="card py-12 text-center text-gray-400">
              <Users className="mx-auto mb-3 w-10 h-10 text-gray-300" />
              Aucune présence enregistrée pour cette formation.
            </div>
          ) : (
            Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(date => (
              <div key={date} className="card p-0 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
                  <Calendar size={15} className="text-gray-500" />
                  <span className="font-semibold text-gray-800">
                    {format(new Date(date + 'T00:00:00'), 'EEEE dd MMMM yyyy', { locale: fr })}
                  </span>
                  <span className="ml-auto text-sm text-gray-500">{grouped[date].length} présence(s)</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {grouped[date].map((p: any) => {
                      const cfg = statusConfig[p.status] || statusConfig.PRESENT;
                      const StatusIcon = cfg.icon;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-5 py-2.5 font-medium text-gray-900">
                            {p.participant?.user?.firstName} {p.participant?.user?.lastName}
                          </td>
                          <td className="px-5 py-2.5 text-gray-500 text-xs">{p.participant?.user?.email}</td>
                          <td className="px-5 py-2.5">
                            <span className={clsx('flex items-center gap-1 text-sm font-medium', cfg.color)}>
                              <StatusIcon size={14} />
                              {cfg.label}
                            </span>
                          </td>
                          {p.notes && (
                            <td className="px-5 py-2.5 text-xs text-gray-400 italic">{p.notes}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
