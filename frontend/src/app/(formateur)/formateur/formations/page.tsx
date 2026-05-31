'use client';
import { useState, useEffect } from 'react';
import { formationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Users, Clock, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

const niveauLabels: Record<string, string> = {
  DEBUTANT: 'Débutant', INTERMEDIAIRE: 'Intermédiaire', AVANCE: 'Avancé', EXPERT: 'Expert'
};

export default function FormateurFormationsPage() {
  const { user } = useAuth();
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On récupère toutes les formations actives — côté formateur elles sont filtrées par son ID via le backend
    formationsApi.list({ limit: 100 })
      .then(({ data }) => {
        // Filtrer côté client celles assignées à ce formateur
        const filtered = data.data.filter((f: any) =>
          f.formateur?.user?.email === user?.email
        );
        setFormations(filtered);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const now = new Date();

  const getStatus = (f: any) => {
    const start = new Date(f.dateDebut);
    const end = new Date(f.dateFin);
    if (now < start) return { label: 'À venir', class: 'badge-info' };
    if (now > end) return { label: 'Terminée', class: 'badge-gray' };
    return { label: 'En cours', class: 'badge-success' };
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes formations</h1>
        <p className="text-gray-500 text-sm">{formations.length} formation(s) assignée(s)</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : formations.length === 0 ? (
        <div className="card text-center py-16">
          <GraduationCap className="mx-auto w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune formation assignée pour le moment.</p>
          <p className="text-gray-400 text-sm mt-1">L'administrateur vous assignera des formations prochainement.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formations.map(f => {
            const status = getStatus(f);
            return (
              <div key={f.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{f.titre}</h3>
                      <span className={status.class}>{status.label}</span>
                      <span className="badge-info text-xs">{niveauLabels[f.niveau] || f.niveau}</span>
                    </div>
                    <p className="text-sm text-blue-600 font-medium mb-2">{f.domaine?.nom}</p>

                    {f.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{f.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {format(new Date(f.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                        {format(new Date(f.dateFin), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-400" />
                        {f.duree}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-gray-400" />
                        {f._count?.inscriptions || 0} / {f.placesMax} participants
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/formateur/presences?formationId=${f.id}`}
                      className="btn-primary text-sm py-1.5 px-3"
                    >
                      Présences
                    </Link>
                    <Link
                      href={`/formateur/participants?formationId=${f.id}`}
                      className="btn-secondary text-sm py-1.5 px-3 text-center"
                    >
                      Participants
                    </Link>
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
