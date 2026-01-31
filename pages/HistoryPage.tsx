
import React, { useState, useMemo } from 'react';
import { User, RAI, DispenseRequest } from '../types';
import { 
  FileText, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronDown, 
  Calendar,
  MessageSquare,
  ClipboardList,
  Pencil,
  Trash2,
  Check,
  Filter,
  AlertTriangle
} from 'lucide-react';

interface HistoryPageProps {
  user: User;
  rais: RAI[];
  setRais: React.Dispatch<React.SetStateAction<RAI[]>>;
  dispenses: DispenseRequest[];
  setDispenses: React.Dispatch<React.SetStateAction<DispenseRequest[]>>;
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

const HistoryPage: React.FC<HistoryPageProps> = ({ user, rais, setRais, dispenses, setDispenses }) => {
  const [expandedRaiId, setExpandedRaiId] = useState<string | null>(null);
  const [editingRaiId, setEditingRaiId] = useState<string | null>(null);
  const [editObservations, setEditObservations] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  
  const userRais = useMemo(() => {
    let filtered = rais.filter(r => r.userId === user.id);
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    return [...filtered].reverse();
  }, [rais, user.id, statusFilter]);

  const userDispenses = dispenses.filter(d => d.userId === user.id).reverse();

  const handleCancelDispense = (dispenseId: string) => {
    if (window.confirm('Deseja realmente cancelar esta reserva? Os pontos serão devolvidos ao seu saldo.')) {
      setRais(prev => prev.map(r => r.usedForDispensaId === dispenseId ? { ...r, usedForDispensaId: undefined } : r));
      setDispenses(prev => prev.map(d => d.id === dispenseId ? { ...d, status: 'CANCELLED' } : d));
    }
  };

  const handleDeleteRAI = (e: React.MouseEvent, raiId: string) => {
    e.stopPropagation();
    const rai = rais.find(r => r.id === raiId);
    if (rai?.usedForDispensaId) {
      alert('Não é possível excluir um RAI que já foi utilizado para financiar uma dispensa ativa.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este registro permanentemente?')) {
      setRais(prev => prev.filter(r => r.id !== raiId));
      setExpandedRaiId(null);
    }
  };

  const handleEditRAI = (e: React.MouseEvent, rai: RAI) => {
    e.stopPropagation();
    setEditingRaiId(rai.id);
    setEditObservations(rai.observacoes || '');
  };

  const saveEdit = (e: React.MouseEvent, raiId: string) => {
    e.stopPropagation();
    setRais(prev => prev.map(r => r.id === raiId ? { ...r, observacoes: editObservations } : r));
    setEditingRaiId(null);
  };

  const toggleExpand = (id: string) => {
    if (editingRaiId && editingRaiId !== id) {
       if (!window.confirm('Deseja descartar as alterações na edição atual?')) return;
       setEditingRaiId(null);
    }
    setExpandedRaiId(expandedRaiId === id ? null : id);
  };

  const FilterChip = ({ status, label }: { status: StatusFilter, label: string }) => (
    <button
      onClick={() => setStatusFilter(status)}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        statusFilter === status 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500">
      <section>
        <div className="mb-6 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <FileText size={24} />
              </div>
              {/* Tipografia ajustada conforme padrão (reduzida em 2 níveis) */}
              <h2 className="app-h3 text-gray-800">Meus Registros (RAIs)</h2>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                Total: {userRais.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-2 text-gray-400">
              <Filter size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Filtros:</span>
            </div>
            <FilterChip status="ALL" label="Todos" />
            <FilterChip status="PENDING" label="Pendentes" />
            <FilterChip status="APPROVED" label="Aprovados" />
            <FilterChip status="REJECTED" label="Reprovados" />
            <FilterChip status="EXPIRED" label="Expirados" />
          </div>
        </div>
        
        <div className="space-y-3">
          {userRais.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <ClipboardList size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 italic">
                {statusFilter === 'ALL' 
                  ? 'Nenhum registro de produtividade encontrado.' 
                  : `Nenhum registro com status "${statusFilter}" encontrado.`}
              </p>
            </div>
          ) : (
            userRais.map(rai => (
              <div 
                key={rai.id} 
                className={`bg-white rounded-3xl border transition-all duration-500 overflow-hidden ${
                  expandedRaiId === rai.id 
                    ? 'border-blue-200 shadow-xl ring-4 ring-blue-50' 
                    : 'border-gray-100 hover:border-gray-200 shadow-sm'
                }`}
              >
                {/* Accordion Header (Card clickable) */}
                <button 
                  onClick={() => toggleExpand(rai.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`p-3 rounded-2xl transition-colors shrink-0 ${
                      rai.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 
                      rai.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 
                      rai.status === 'EXPIRED' ? 'bg-slate-50 text-slate-400' : 'bg-orange-50 text-orange-600'
                    }`}>
                      <ClipboardList size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm lg:text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        RAI: {rai.numeroRAI} - {rai.naturezaNome}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          rai.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                          rai.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                          rai.status === 'EXPIRED' ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {rai.status === 'APPROVED' ? 'Aprovado' : rai.status === 'REJECTED' ? 'Reprovado' : rai.status === 'EXPIRED' ? 'Expirado' : 'Auditoria'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold hidden sm:inline">•</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase hidden sm:inline">+{rai.pontos} PONTOS</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    {expandedRaiId === rai.id ? (
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <ChevronDown size={24} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-300 transition-all">
                        <ChevronRight size={24} />
                      </div>
                    )}
                  </div>
                </button>

                {/* Accordion Content (Dropdown) */}
                {expandedRaiId === rai.id && (
                  <div className="px-8 pb-8 pt-2 border-t border-gray-50 bg-gradient-to-b from-gray-50/30 to-white animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                      
                      {/* Metadata Line */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                            <Clock size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data de Cadastro</p>
                            <p className="text-sm font-bold text-gray-700 truncate">
                              {new Date(rai.createdAt).toLocaleDateString('pt-BR')} às {new Date(rai.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <div className="p-2 bg-green-50 text-green-500 rounded-lg shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data da Ocorrência</p>
                            <p className="text-sm font-bold text-gray-700 truncate">
                              {new Date(rai.dataRAI + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        {rai.rejectionReason && (
                          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100 shadow-sm">
                            <div className="p-2 bg-red-100 text-red-500 rounded-lg shrink-0">
                              <AlertTriangle size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Motivo da Reprovação</p>
                              <p className="text-xs font-bold text-red-700 mt-1">{rai.rejectionReason}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Observations Block */}
                      <div className="flex flex-col bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-gray-400" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações de Registro</p>
                        </div>
                        {editingRaiId === rai.id ? (
                          <div className="flex-1 flex flex-col gap-3 animate-in fade-in duration-200">
                            <textarea 
                              className="flex-1 w-full p-3 bg-gray-50 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 italic"
                              value={editObservations}
                              onChange={(e) => setEditObservations(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setEditingRaiId(null); }}
                                  className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-xl text-xs font-black uppercase hover:bg-gray-200 transition-colors"
                                >
                                  Descartar
                                </button>
                                <button 
                                  onClick={(e) => saveEdit(e, rai.id)}
                                  className="flex-[2] bg-blue-600 text-white py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                  <Check size={14} /> Salvar Alterações
                                </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 italic text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200">
                            {rai.observacoes ? rai.observacoes : <span className="text-gray-400 font-medium">(Sem observações cadastradas)</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Line (Footer of expansion) */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
                      <button 
                        onClick={(e) => handleEditRAI(e, rai)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${
                          editingRaiId === rai.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        <Pencil size={14} /> Editar Registro
                      </button>
                      
                      <button 
                        onClick={(e) => handleDeleteRAI(e, rai.id)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={14} /> Excluir Registro
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          {/* Tipografia ajustada conforme padrão (reduzida em 2 níveis) */}
          <h2 className="app-h3 text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-700 rounded-xl">
              <CalendarCheck size={24} />
            </div>
            Minhas Dispensas
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userDispenses.length === 0 ? (
            <div className="col-span-full p-16 bg-white rounded-3xl border border-gray-100 text-center shadow-sm">
               <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
               <p className="text-gray-400 italic">Você ainda não solicitou dispensas.</p>
            </div>
          ) : (
            userDispenses.map(dispense => (
              <div key={dispense.id} className="bg-white p-7 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all group duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      dispense.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      dispense.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {dispense.status}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${dispense.type === 'CPC' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      {dispense.type === 'PRODUTIVIDADE' ? 'PROD.' : dispense.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">#{dispense.id.slice(0, 5)}</span>
                </div>
                
                <div className="mb-8">
                  <h4 className="text-2xl font-black text-gray-900 leading-tight mb-1">
                    {new Date(dispense.dataDispensa + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </h4>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">{new Date(dispense.dataDispensa + 'T12:00:00').toLocaleDateString('pt-BR', { year: 'numeric' })}</p>
                </div>
                
                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Custo</span>
                    <span className="text-2xl font-black text-blue-600 group-hover:scale-110 transition-transform inline-block">
                      {dispense.type === 'CPC' ? '0' : dispense.pontosDebitados} <span className="text-xs font-bold text-blue-400">PTS</span>
                    </span>
                  </div>
                  
                  {dispense.status === 'RESERVED' && (
                    <button 
                      onClick={() => handleCancelDispense(dispense.id)}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      title="Cancelar Reserva"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default HistoryPage;
