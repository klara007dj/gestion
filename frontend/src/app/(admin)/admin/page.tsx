'use client';
import { useEffect, useState } from 'react';
import { statsApi } from '@/lib/api';
import { GraduationCap, Users, ClipboardList, CreditCard, Award, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  formations: { total: number; actives: number; top: any[]; parDomaine: any[] };
  participants: { total: number };
  formateurs: { total: number };
  inscriptions: { total: number; enAttente: number; validees: number; parMois: any[] };
  finances: { totalPercu: number; paiementsEnAttente: number };
  attestations: { total: number };
}

const StatCard = ({ icon: Icon, label, value, color, sub }: any) => (
  <div className="card flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.dashboard()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-gray-100" />
      ))}
    </div>
  );

  if (!stats) return <p className="text-gray-500">Impossible de charger les statistiques.</p>;

  const chartData = (stats.inscriptions.parMois || []).map((m: any) => ({
    mois: format(new Date(m.mois), 'MMM', { locale: fr }),
    total: parseInt(m.total),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble du centre de formation</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Formations actives" value={stats.formations.actives}
          color="bg-blue-600" sub={`${stats.formations.total} au total`} />
        <StatCard icon={Users} label="Participants" value={stats.participants.total}
          color="bg-purple-600" sub={`${stats.formateurs.total} formateurs`} />
        <StatCard icon={ClipboardList} label="Inscriptions" value={stats.inscriptions.total}
          color="bg-emerald-600" sub={`${stats.inscriptions.enAttente} en attente`} />
        <StatCard icon={CreditCard} label="Revenus perçus"
          value={`${Number(stats.finances.totalPercu).toLocaleString('fr-FR')} FCFA`}
          color="bg-orange-600" sub={`${stats.finances.paiementsEnAttente} paiements en attente`} />
        <StatCard icon={Award} label="Attestations" value={stats.attestations.total}
          color="bg-teal-600" sub="Délivrées" />
        <StatCard icon={Clock} label="En attente" value={stats.inscriptions.enAttente}
          color="bg-yellow-500" sub="Inscriptions à traiter" />
        <StatCard icon={TrendingUp} label="Taux validation"
          value={stats.inscriptions.total
            ? `${Math.round((stats.inscriptions.validees / stats.inscriptions.total) * 100)}%`
            : '0%'}
          color="bg-indigo-600" sub="Inscriptions validées" />
        <StatCard icon={BookOpen} label="Domaines" value={stats.formations.parDomaine.length}
          color="bg-rose-600" sub="Domaines actifs" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscriptions par mois */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Inscriptions (6 derniers mois)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top formations */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Top formations les plus demandées</h2>
          <div className="space-y-3">
            {stats.formations.top.slice(0, 5).map((f: any, i: number) => (
              <div key={f.id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.titre}</p>
                  <p className="text-xs text-gray-400">{f.domaine?.nom}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {f._count?.inscriptions} inscrits
                </span>
              </div>
            ))}
            {!stats.formations.top.length && (
              <p className="text-gray-400 text-sm text-center py-4">Aucune formation pour le moment</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
