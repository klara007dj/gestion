'use client';
import { useState } from 'react';
import { attestationsApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, CheckCircle2, XCircle, GraduationCap, Award, Loader2 } from 'lucide-react';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const { data } = await attestationsApi.verify(code.trim());
      setResult(data);
    } catch {
      setError('Attestation non trouvée ou invalide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Vérification d'attestation</h1>
          <p className="text-slate-400 text-sm mt-1">Entrez le code de vérification de l'attestation</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="Code de vérification..."
              className="input-field flex-1"
            />
            <button onClick={handleVerify} disabled={loading || !code.trim()} className="btn-primary px-4">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <XCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-5 p-5 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="text-green-600" size={22} />
                <span className="font-bold text-green-800">Attestation valide</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between py-1 border-b border-green-100">
                  <span className="text-gray-500">Titulaire</span>
                  <span className="font-semibold">
                    {result.participant?.user?.firstName} {result.participant?.user?.lastName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-green-100">
                  <span className="text-gray-500">Formation</span>
                  <span className="font-medium text-right max-w-[200px]">{result.formation?.titre}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-green-100">
                  <span className="text-gray-500">Période</span>
                  <span>
                    {format(new Date(result.formation?.dateDebut), 'dd MMM yyyy', { locale: fr })} →{' '}
                    {format(new Date(result.formation?.dateFin), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Date d'émission</span>
                  <span>{format(new Date(result.dateEmission), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            Ce service permet de vérifier l'authenticité des attestations délivrées par SECEL SARL.
          </p>
        </div>
      </div>
    </div>
  );
}
