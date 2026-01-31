
import React, { useState, useRef } from 'react';
import { User, RAI, OccurrenceNature } from '../types';
import { FilePlus2, Search, Check, AlertTriangle, ShieldAlert, CalendarDays, Lock } from 'lucide-react';

interface RAIFormProps {
  user: User;
  rais: RAI[];
  setRais: React.Dispatch<React.SetStateAction<RAI[]>>;
  natures: OccurrenceNature[];
}

const RAIForm: React.FC<RAIFormProps> = ({ user, rais, setRais, natures }) => {
  const activeNatures = (natures || []).filter(n => n.active !== false);
  const [formData, setFormData] = useState({
    numeroRAI: '',
    dataRAI: '',
    naturezaId: activeNatures[0]?.id || '',
    observacoes: ''
  });
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const datePickerRef = useRef<HTMLInputElement | null>(null);

  const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');
  const maskDateBR = (v: string) => {
    const d = onlyDigits(v).slice(0, 8);
    const dd = d.slice(0, 2);
    const mm = d.slice(2, 4);
    const yyyy = d.slice(4, 8);
    if (d.length <= 2) return dd;
    if (d.length <= 4) return `${dd}/${mm}`;
    return `${dd}/${mm}/${yyyy}`;
  };

    const isoToDateBR = (iso: string) => {
    if (!iso) return '';
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    return `${m[3]}/${m[2]}/${m[1]}`;
  };

const dateBRToISO = (masked: string) => {
    const d = onlyDigits(masked);
    if (d.length !== 8) return '';
    const dd = d.slice(0, 2);
    const mm = d.slice(2, 4);
    const yyyy = d.slice(4, 8);
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarning('');

    // Validations
    if (!/^\d{8}$/.test(formData.numeroRAI)) {
      setError('O número do RAI deve conter exatamente 8 dígitos.');
      return;
    }

    const isoDate = dateBRToISO(formData.dataRAI);
    if (!isoDate) {
      setError('Informe a Data da Ocorrência no formato dd/mm/aaaa.');
      return;
    }

    // Duplicate check: Same user can't use same RAI twice
    const userDuplicate = rais.find(r => r.userId === user.id && r.numeroRAI === formData.numeroRAI);
    if (userDuplicate) {
      setError('Você já registrou este RAI anteriormente.');
      return;
    }

    // Duplicate check: RAI can be used max 3 times by different users
    const globalCount = rais.filter(r => r.numeroRAI === formData.numeroRAI).length;
    if (globalCount >= 3) {
      setError('Este RAI já atingiu o limite máximo de 3 registros permitidos pelo sistema.');
      return;
    }

    const nature = activeNatures.find(n => n.id === formData.naturezaId) || activeNatures[0];
    
    // Check for > 90 days
    const raiDate = new Date(isoDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - raiDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isExpired = diffDays > 90;
    
    const newRAI: RAI = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      matricula: user.matricula,
      numeroRAI: formData.numeroRAI,
      dataRAI: isoDate,
      naturezaId: formData.naturezaId,
      naturezaNome: nature?.name || 'Natureza Desconhecida',
      pontos: isExpired ? 0 : (nature?.points || 0),
      observacoes: formData.observacoes,
      status: isExpired ? 'EXPIRED' : 'PENDING',
      createdAt: new Date().toISOString()
    };

    setRais(prev => [...prev, newRAI]);
    
    if (isExpired) {
      setWarning('Este RAI possui mais de 90 dias. O registro foi salvo para conferência, porém os pontos NÃO foram computados. Entre em contato com a ADMIN para solicitar a liberação.');
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setFormData({
      numeroRAI: '',
      dataRAI: '',
      naturezaId: activeNatures[0]?.id || '',
      observacoes: ''
    });
  };

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white bg-opacity-20 rounded-2xl">
              <FilePlus2 size={32} />
            </div>
            <div>
              <h2 className="app-h3">Novo Registro de RAI</h2>
              <p className="app-secondary text-blue-100">Preencha as informações da ocorrência</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-amber-800 font-medium leading-tight">
              <b>Atenção:</b> Pontos disponíveis imediatamente para RAIs dentro do prazo. RAIs com mais de 90 dias exigem liberação da administração.
            </p>
          </div>

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100">
              <Check className="shrink-0" />
              <p className="font-bold">RAI registrado com sucesso! Pontos disponíveis para uso.</p>
            </div>
          )}

          {warning && (
            <div className="bg-orange-50 text-orange-700 p-5 rounded-xl flex items-start gap-3 border border-orange-200">
              <Lock className="shrink-0 mt-1" />
              <p className="font-bold text-sm leading-relaxed">{warning}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
              <AlertTriangle className="shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Número do RAI (8 dígitos)</label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  maxLength={8}
                  placeholder="00000000"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={formData.numeroRAI}
                  onChange={e => setFormData({...formData, numeroRAI: e.target.value.replace(/\D/g, '')})}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Data da Ocorrência</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="dd/mm/aaaa"
                  className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={formData.dataRAI}
                  onChange={e => setFormData({ ...formData, dataRAI: maskDateBR(e.target.value) })}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = datePickerRef.current;
                    if (!el) return;
                    // @ts-ignore
                    if (typeof el.showPicker === 'function') el.showPicker();
                    else el.click();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
                  title="Selecionar data"
                >
                  <CalendarDays size={18} />
                </button>
                <input
                  ref={datePickerRef}
                  type="date"
                  className="hidden"
                  onChange={(e) => {
                    const br = isoToDateBR(e.target.value);
                    if (br) setFormData(prev => ({ ...prev, dataRAI: br }));
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Natureza da Ocorrência</label>
            <select 
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.naturezaId}
              onChange={e => setFormData({...formData, naturezaId: e.target.value})}
            >
              {activeNatures.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.points} pts)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Observações (Opcional)</label>
            <textarea 
              rows={3}
              placeholder="Descreva detalhes relevantes..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.observacoes}
              onChange={e => setFormData({...formData, observacoes: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Salvar Registro
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} />
          Regras de Validação
        </h4>
        <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
          <li>Limite de Uso: Cada RAI pode ser compartilhado por até 3 policiais.</li>
          <li>Registro Único: É proibido registrar o mesmo RAI mais de uma vez.</li>
          <li><b>Prazo de 90 Dias:</b> RAIs com mais de 90 dias não computam pontos automaticamente e exigem liberação manual da ADMIN.</li>
          <li>Uso dos Pontos: A liberação é imediata após o registro (dentro do prazo), porém sujeita a auditoria.</li>
          <li>Prazo de Auditoria: A administração validará a pontuação em até 7 dias úteis.</li>
        </ul>
      </div>
    </div>
  );
};

export default RAIForm;
