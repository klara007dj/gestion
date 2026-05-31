'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Calendar, Clock, Users, DollarSign, BookOpen, Loader2, GraduationCap } from 'lucide-react';
import { formationsApi, domainesApi, inscriptionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

const niveauLabels: Record<string, string> = {
  DEBUTANT: 'Débutant', INTERMEDIAIRE: 'Intermédiaire', AVANCE: 'Avancé', EXPERT: 'Expert'
};
const niveauColors: Record<string, string> = {
  DEBUTANT: 'badge-success', INTERMEDIAIRE: 'badge-info', AVANCE: 'badge-warning', EXPERT: 'badge-danger'
};

export default function CataloguePage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [domaines, setDomaines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domaineFilter, setDomaineFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [inscribing, setInscribing] = useState<number | null>(null);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);

  const fetchFormations = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 9 };
      if (search) params.search = search;
      if (domaineFilter) params.domaineId = domaineFilter;
      if (niveauFilter) params.niveau = niveauFilter;
      const { data } = await formationsApi.list(params);
      setFormations(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFormations(); }, [search, domaineFilter, niveauFilter, page]);

  useEffect(() => {
    domainesApi.list().then(({ data }) => setDomaines(data));
  }, []);

  const handleInscription = async (formationId: number) => {
    setInscribing(formationId);
    try {
      await inscriptionsApi.create({ formationId });
      toast.success('Demande d\'inscription envoyée ! En attente de validation.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setInscribing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catalogue des formations</h1>
        <p className="text-gray-500 text-sm mt-1">{meta.total} formation(s) disponible(s)</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher une formation..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={domaineFilter}
          onChange={e => { setDomaineFilter(e.target.value); setPage(1); }}
          className="input-field sm:w-48"
        >
          <option value="">Tous les domaines</option>
          {domaines.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
        <select
          value={niveauFilter}
          onChange={e => { setNiveauFilter(e.target.value); setPage(1); }}
          className="input-field sm:w-44"
        >
          <option value="">Tous les niveaux</option>
          {Object.entries(niveauLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Grille de cartes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : formations.length === 0 ? (
        <div className="text-center py-20">
          <GraduationCap className="mx-auto w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune formation disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {formations.map(f => {
            const placesRestantes = f.placesMax - (f._count?.inscriptions || 0);
            const isFull = placesRestantes <= 0;
            return (
              <div key={f.id} className="card flex flex-col hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-blue-600 font-medium">{f.domaine?.nom}</span>
                    <h3 className="font-bold text-gray-900 mt-0.5 leading-tight">{f.titre}</h3>
                  </div>
                  <span className={clsx('ml-2 shrink-0', niveauColors[f.niveau] || 'badge-gray')}>
                    {niveauLabels[f.niveau] || f.niveau}
                  </span>
                </div>

                {/* Description */}
                {f.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{f.description}</p>
                )}

                {/* Infos */}
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    <span>
                      {format(new Date(f.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                      {format(new Date(f.dateFin), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span>{f.duree}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400 shrink-0" />
                    <span>
                      {isFull
                        ? <span className="text-red-500 font-medium">Complet</span>
                        : <span>{placesRestantes} place(s) restante(s)</span>}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-lg font-bold text-gray-900">
                    {Number(f.prix).toLocaleString('fr-FR')} FCFA
                  </span>
                  <button
                    onClick={() => handleInscription(f.id)}
                    disabled={isFull || inscribing === f.id}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                      isFull
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                  >
                    {inscribing === f.id && <Loader2 size={13} className="animate-spin" />}
                    {isFull ? 'Complet' : "S'inscrire"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(meta.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={clsx(
                'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                page === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
