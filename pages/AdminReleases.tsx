
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Lock, 
  Calendar, 
  Clock, 
  Gift, 
  Plus, 
  Save, 
  Trash2, 
  Search, 
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  User, 
  OccurrenceNature, 
  Pelotao, 
  ExpirationRelease, 
  HolidayRelease, 
  BirthdayRelease,
  RAI
} from '../types';

interface AdminReleasesProps {
  users: User[];
  natures: OccurrenceNature[];
  rais: RAI[];
  expirationReleases: ExpirationRelease[];
  setExpirationReleases: React.Dispatch<React.SetStateAction<ExpirationRelease[]>>;
  holidayReleases: HolidayRelease[];
  setHolidayReleases: React.Dispatch<React.SetStateAction<HolidayRelease[]>>;
  birthdayReleases: BirthdayRelease[];
  setBirthdayReleases: React.Dispatch<React.SetStateAction<BirthdayRelease[]>>;
  addLog: (action: string, details: string, type?: 'INFO' | 'WARNING' | 'CRITICAL') => void;
}

const AdminReleases: React.FC<AdminReleasesProps> = ({
  users,
  natures,
  rais,
  expirationReleases,
  setExpirationReleases,
  holidayReleases,
  setHolidayReleases,
  birthdayReleases,
  setBirthdayReleases,
  addLog
}) => {
  const [activeTab, setActiveTab] = useState<'EXPIRADOS' | 'FERIADOS' | 'ANIVERSARIO'>('EXPIRADOS');
  
  // Estados para formulários
  const [expForm, setExpForm] = useState<Partial<ExpirationRelease>>({
    dataRAI: '',
    dataExp: '',
    limite: 4,
    numeroRAI: '',
    naturezaId: '',
    matricula: '',
    validade: '',
    motivo: ''
  });

  const [holidayForm, setHolidayForm] = useState<Partial<HolidayRelease>>({
    data: '',
    pontos: 140,
    motivo: ''
  });

  const [birthdayForm, setBirthdayForm] = useState<Partial<BirthdayRelease>>({
    dataAniversario: '',
    equipe: 'ALPHA',
    matricula: '',
    observacoes: ''
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');

  // Helpers
  const findUserByMatricula = (matricula: string) => users.find(u => u.matricula === matricula);

  // Lógica de busca automática de RAI disparada pela mudança no número do RAI
  const handleRAILookup = (numero: string) => {
    const val = numero.replace(/\D/g, '').slice(0, 8);
    setExpForm(prev => ({ ...prev, numeroRAI: val }));

    if (val.length === 8) {
      const foundRAI = rais.find(r => r.numeroRAI === val);
      if (foundRAI) {
        // Calcula data de expiração (90 dias após dataRAI)
        let expDate = foundRAI.dataRAI;
        try {
            const d = new Date(foundRAI.dataRAI);
            d.setDate(d.getDate() + 90);
            expDate = d.toISOString().split('T')[0];
        } catch(e) {}

        setExpForm(prev => ({
          ...prev,
          naturezaId: foundRAI.naturezaId,
          dataRAI: foundRAI.dataRAI,
          dataExp: expDate,
        }));
      } else {
        // Se não encontrar, limpa os campos automáticos mas mantém o número digitado
        setExpForm(prev => ({
          ...prev,
          naturezaId: '',
          dataRAI: '',
          dataExp: '',
        }));
      }
    }
  };

  const handleSaveExpiration = () => {
    if (!expForm.dataRAI || !expForm.numeroRAI || !expForm.matricula || !expForm.validade) {
      return alert('Preencha todos os campos obrigatórios (Número do RAI válido, Matrícula e Nova Validade).');
    }
    const user = findUserByMatricula(expForm.matricula);
    if (!user) return alert('Policial não encontrado com esta matrícula.');

    const nature = natures.find(n => n.id === expForm.naturezaId);

    const newRelease: ExpirationRelease = {
      id: Math.random().toString(36).substr(2, 9),
      dataRAI: expForm.dataRAI!,
      dataExp: expForm.dataExp || '',
      limite: expForm.limite || 4,
      numeroRAI: expForm.numeroRAI!,
      naturezaId: expForm.naturezaId || '',
      naturezaNome: nature?.name || 'Não informada',
      policialNome: user.name,
      matricula: expForm.matricula!,
      validade: expForm.validade!,
      motivo: expForm.motivo || '',
      createdAt: new Date().toISOString()
    };

    setExpirationReleases(prev => [newRelease, ...prev]);
    addLog('LIBERACAO_EXPIRADO', `Liberado RAI ${newRelease.numeroRAI} para ${newRelease.policialNome}`);
    setExpForm({ dataRAI: '', dataExp: '', limite: 4, numeroRAI: '', naturezaId: '', matricula: '', validade: '', motivo: '' });
  };

  const handleSaveHoliday = () => {
    if (!holidayForm.data || !holidayForm.pontos) return alert('Preencha data e pontos.');
    
    const newHoliday: HolidayRelease = {
      id: Math.random().toString(36).substr(2, 9),
      data: holidayForm.data!,
      pontos: holidayForm.pontos!,
      motivo: holidayForm.motivo || '',
      createdAt: new Date().toISOString()
    };

    setHolidayReleases(prev => [newHoliday, ...prev]);
    addLog('CADASTRO_FERIADO', `Cadastrado feriado/evento em ${newHoliday.data} (${newHoliday.pontos} pts)`);
    setHolidayForm({ data: '', pontos: 140, motivo: '' });
  };

  const handleSaveBirthday = () => {
    if (!birthdayForm.dataAniversario || !birthdayForm.matricula) return alert('Preencha data e matrícula.');
    const user = findUserByMatricula(birthdayForm.matricula);
    if (!user) return alert('Policial não encontrado.');

    const newBirthday: BirthdayRelease = {
      id: Math.random().toString(36).substr(2, 9),
      dataAniversario: birthdayForm.dataAniversario!,
      equipe: birthdayForm.equipe || 'ALPHA',
      policialNome: user.name,
      matricula: birthdayForm.matricula!,
      observacoes: birthdayForm.observacoes || '',
      createdAt: new Date().toISOString()
    };

    setBirthdayReleases(prev => [newBirthday, ...prev]);
    addLog('CADASTRO_ANIVERSARIO', `Cadastrado aniversário de ${newBirthday.policialNome} (${newBirthday.matricula})`);
    setBirthdayForm({ dataAniversario: '', equipe: 'ALPHA', matricula: '', observacoes: '' });
  };

  const filteredExpirations = expirationReleases.filter(r => 
    r.numeroRAI.includes(searchTerm) || r.policialNome.toLowerCase().includes(searchTerm.toLowerCase()) || r.matricula.includes(searchTerm)
  );

  const filteredHolidays = holidayReleases.filter(h => h.motivo.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredBirthdays = birthdayReleases.filter(b => 
    b.policialNome.toLowerCase().includes(searchTerm.toLowerCase()) || b.matricula.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <Lock size={24} />
            </div>
            Gestão de Liberações
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Controle de exceções, feriados e benefícios</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
        {(['EXPIRADOS', 'FERIADOS', 'ANIVERSARIO'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário (Esquerda) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" />
              {activeTab === 'EXPIRADOS' ? 'Liberar RAI Expirado' : activeTab === 'FERIADOS' ? 'Novo Feriado/Evento' : 'Cadastrar Aniversariante'}
            </h3>

            {activeTab === 'EXPIRADOS' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Pesquisar RAI (8 dígitos)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      maxLength={8}
                      value={expForm.numeroRAI} 
                      onChange={e => handleRAILookup(e.target.value)} 
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" 
                      placeholder="Digite o número do RAI..." 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Natureza</label>
                  <select 
                    value={expForm.naturezaId} 
                    disabled 
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 appearance-none"
                  >
                    <option value="">Preenchimento Automático...</option>
                    {natures.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Data RAI</label>
                    <input type="date" value={expForm.dataRAI} readOnly className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl text-xs font-bold text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Data Expiração</label>
                    <input type="date" value={expForm.dataExp} readOnly className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl text-xs font-bold text-gray-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Matrícula</label>
                    <input 
                      type="text" 
                      value={expForm.matricula} 
                      onChange={e => setExpForm({...expForm, matricula: e.target.value})} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" 
                      placeholder="Matrícula Policial" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Nova Validade</label>
                    <input type="date" value={expForm.validade} onChange={e => setExpForm({...expForm, validade: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
                  </div>
                </div>

                {expForm.matricula && findUserByMatricula(expForm.matricula) && (
                  <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black text-blue-700 uppercase">{findUserByMatricula(expForm.matricula)?.name}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Motivo da Liberação</label>
                  <textarea 
                    value={expForm.motivo} 
                    onChange={e => setExpForm({...expForm, motivo: e.target.value})} 
                    rows={3} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold resize-none" 
                    placeholder="Descreva o motivo da liberação..."
                  ></textarea>
                </div>

                <button
                  onClick={handleSaveExpiration}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Salvar Liberação
                </button>
              </div>
            )}

            {activeTab === 'FERIADOS' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Data do Feriado/Evento</label>
                  <input type="date" value={holidayForm.data} onChange={e => setHolidayForm({...holidayForm, data: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Pontuação Necessária (Custo)</label>
                  <input type="number" value={holidayForm.pontos} onChange={e => setHolidayForm({...holidayForm, pontos: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" placeholder="Ex: 140" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Descrição/Motivo</label>
                  <input type="text" value={holidayForm.motivo} onChange={e => setHolidayForm({...holidayForm, motivo: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" placeholder="Ex: Natal, Réveillon, Evento Local" />
                </div>
                <button
                  onClick={handleSaveHoliday}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Salvar Feriado
                </button>
              </div>
            )}

            {activeTab === 'ANIVERSARIO' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Data Aniversário</label>
                    <input type="date" value={birthdayForm.dataAniversario} onChange={e => setBirthdayForm({...birthdayForm, dataAniversario: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Equipe</label>
                    <select value={birthdayForm.equipe} onChange={e => setBirthdayForm({...birthdayForm, equipe: e.target.value as Pelotao})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold">
                      <option value="ALPHA">ALPHA</option>
                      <option value="BRAVO">BRAVO</option>
                      <option value="CHARLIE">CHARLIE</option>
                      <option value="DELTA">DELTA</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Matrícula</label>
                  <input type="text" value={birthdayForm.matricula} onChange={e => setBirthdayForm({...birthdayForm, matricula: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" placeholder="Digite a matrícula..." />
                </div>
                {birthdayForm.matricula && findUserByMatricula(birthdayForm.matricula) && (
                  <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black text-blue-700 uppercase">{findUserByMatricula(birthdayForm.matricula)?.name}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Observações</label>
                  <input type="text" value={birthdayForm.observacoes} onChange={e => setBirthdayForm({...birthdayForm, observacoes: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" placeholder="Opcional..." />
                </div>
                <button
                  onClick={handleSaveBirthday}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Salvar Aniversário
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Listagem (Direita) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Histórico de Registros</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                  <tr>
                    <th className="px-8 py-4">Informação</th>
                    <th className="px-8 py-4">Detalhes</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeTab === 'EXPIRADOS' && filteredExpirations.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-blue-600 uppercase">RAI {r.numeroRAI}</span>
                          <span className="text-[10px] font-bold text-gray-400 mt-0.5">{r.naturezaNome}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 uppercase">{r.policialNome}</span>
                          <span className="text-[10px] font-bold text-gray-400 mt-0.5">Válido até: {r.validade}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => setExpirationReleases(prev => prev.filter(x => x.id !== r.id))}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'FERIADOS' && filteredHolidays.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 uppercase">{h.motivo}</span>
                          <span className="text-[10px] font-bold text-gray-400 mt-0.5">{h.data}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
                          {h.pontos} PONTOS
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => setHolidayReleases(prev => prev.filter(x => x.id !== h.id))}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'ANIVERSARIO' && filteredBirthdays.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 uppercase">{b.policialNome}</span>
                          <span className="text-[10px] font-bold text-gray-400 mt-0.5">Equipe: {b.equipe}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 uppercase">{b.dataAniversario}</span>
                          <span className="text-[10px] font-bold text-gray-400 mt-0.5">{b.matricula}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => setBirthdayReleases(prev => prev.filter(x => x.id !== b.id))}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {((activeTab === 'EXPIRADOS' && filteredExpirations.length === 0) || 
                    (activeTab === 'FERIADOS' && filteredHolidays.length === 0) || 
                    (activeTab === 'ANIVERSARIO' && filteredBirthdays.length === 0)) && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-50 rounded-full text-gray-300 mb-4">
                            <Search size={32} />
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum registro encontrado</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReleases;
