'use client';
import { useState, useEffect } from 'react';
import { statsApi } from '@/lib/api';
import { BookOpen, Users, Calendar, CheckCircle2, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export default function FormateurDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.formateur()
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm">Vos formations en cours</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl"><BookOpen className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Formations actives</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalFormations || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl"><Users className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total participants</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.formations?.reduce((s: number, f: any) => s + (f._count?.inscriptions || 0), 0) || 0}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Présences enregistrées</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.formations?.reduce((s: number, f: any) => s + (f._count?.presences || 0), 0) || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Liste formations */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Mes formations</h2>
        {!stats?.formations?.length ? (
          <div className="card text-center py-12">
            <GraduationCap className="mx-auto w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune formation assignée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.formations.map((f: any) => (
              <div key={f.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.titre}</h3>
                    <p className="text-sm text-blue-600 mt-0.5">{f.domaine?.nom}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {format(new Date(f.dateDebut), 'dd MMM', { locale: fr })} → {format(new Date(f.dateFin), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={13} />
                        {f._count?.inscriptions || 0} participant(s)
                      </span>
                    </div>
                  </div>
                  <Link href={`/formateur/presences?formationId=${f.id}`}
                    className="btn-primary text-sm py-1.5 px-3">
                    Présences
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
