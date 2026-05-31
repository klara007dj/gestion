'use client';
import { useState, useEffect } from 'react';
import { attestationsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Award, Download, CheckCircle2, Calendar, Clock } from 'lucide-react';

export default function AttestationsPage() {
  const [attestations, setAttestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attestationsApi.myAttestations()
      .then(({ data }) => setAttestations(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (attestation: any) => {
    // Génère un texte simple téléchargeable (en production on pourrait générer un PDF)
    const content = `
ATTESTATION DE FORMATION
========================

Centre de formation : SECEL SARL

Cette attestation certifie que :

${attestation.participant?.user?.firstName} ${attestation.participant?.user?.lastName}

a suivi et complété avec succès la formation :

"${attestation.formation?.titre}"

Domaine       : ${attestation.formation?.domaine?.nom}
Durée         : ${attestation.formation?.duree}
Période       : du ${format(new Date(attestation.formation?.dateDebut), 'dd MMMM yyyy', { locale: fr })}
                au ${format(new Date(attestation.formation?.dateFin), 'dd MMMM yyyy', { locale: fr })}
Date d'émission : ${format(new Date(attestation.dateEmission), 'dd MMMM yyyy', { locale: fr })}

Code de vérification : ${attestation.code}

Vérifiable sur : ${window.location.origin}/verify/${attestation.code}

_______________________________
SECEL SARL — Direction
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attestation-${attestation.formation?.titre?.replace(/\s+/g, '-').toLowerCase()}-${attestation.code.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes attestations</h1>
        <p className="text-gray-500 text-sm mt-1">{attestations.length} attestation(s) disponible(s)</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
        </div>
      ) : attestations.length === 0 ? (
        <div className="text-center py-20">
          <Award className="mx-auto w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune attestation disponible pour le moment.</p>
          <p className="text-gray-400 text-sm mt-1">Les attestations sont générées après validation de votre formation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attestations.map(att => (
            <div key={att.id} className="card border-l-4 border-l-green-500">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="text-xs font-medium text-green-700">Attestation validée</span>
                    </div>
                    <p className="text-xs text-gray-400">Code : {att.code.slice(0, 12)}...</p>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{att.formation?.titre}</h3>
              <p className="text-sm text-blue-600 font-medium mb-3">{att.formation?.domaine?.nom}</p>

              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-gray-400" />
                  <span>Durée : {att.formation?.duree}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-gray-400" />
                  <span>
                    {format(new Date(att.formation?.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                    {format(new Date(att.formation?.dateFin), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={13} className="text-gray-400" />
                  <span>Émise le {format(new Date(att.dateEmission), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
              </div>

              <button
                onClick={() => handleDownload(att)}
                className="btn-primary w-full justify-center text-sm py-2"
              >
                <Download size={14} />
                Télécharger l'attestation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
