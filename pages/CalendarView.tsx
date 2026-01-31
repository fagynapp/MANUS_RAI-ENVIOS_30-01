
import React, { useState, useMemo } from 'react';
import { User, DispenseRequest, RAI, Pelotao, UserRole, SystemConfig } from '../types';
import { RANK_WEIGHTS } from '../constants';
import { getShiftForDate, getDispenseCost, formatDate, isOffDay } from '../utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  XCircle,
  Coins,
  Send,
  Info,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Lock,
  Megaphone
} from 'lucide-react';

interface CalendarViewProps {
  user: User;
  users: User[];
  dispenses: DispenseRequest[];
  setDispenses: React.Dispatch<React.SetStateAction<DispenseRequest[]>>;
  userBalance: number;
  rais: RAI[];
  setRais: React.Dispatch<React.SetStateAction<RAI[]>>;
  config: SystemConfig;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user, users, dispenses, setDispenses, userBalance, rais, setRais, config }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [dispenseType, setDispenseType] = useState<'PRODUTIVIDADE' | 'CPC'>('PRODUTIVIDADE');

  // Vagas por dia seguem parâmetro global (ADM pode ajustar em Parâmetros Globais)
  const maxVagas = config.maxDispensesPerDay || 2;

  const monthKeyFromDateStr = (dStr: string) => (dStr || '').slice(0, 7);
  const isWithinCpcPeriod = (dStr: string) => {
    const m = monthKeyFromDateStr(dStr);
    const start = (config.cpcPeriodStart || '1900-01');
    const end = (config.cpcPeriodEnd || '2999-12');
    return m >= start && m <= end;
  };

  const allTeams: Pelotao[] = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
  const scopeTeams = (config.cpcTeamsEnabled && config.cpcTeamsEnabled.length) ? config.cpcTeamsEnabled : allTeams;

  const pointsForUser = (uid: string) => rais
    .filter(r => r.userId === uid && r.status === 'APPROVED' && !r.usedForDispensaId)
    .reduce((s, r) => s + r.pontos, 0);

  const sortByCriteria = (a: User, b: User) => {
    if (config.cpcPriorityCriteria === 'ALMANAQUE') {
      const weightA = RANK_WEIGHTS[a.graduacao] || 0;
      const weightB = RANK_WEIGHTS[b.graduacao] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return a.almanaquePosition - b.almanaquePosition;
    }
    // RANKING (pontuação)
    const pa = pointsForUser(a.id);
    const pb = pointsForUser(b.id);
    if (pb !== pa) return pb - pa;
    // desempate: almanaque
    const weightA = RANK_WEIGHTS[a.graduacao] || 0;
    const weightB = RANK_WEIGHTS[b.graduacao] || 0;
    if (weightA !== weightB) return weightB - weightA;
    return a.almanaquePosition - b.almanaquePosition;
  };

  const campaignCpcDispenses = useMemo(
    () => dispenses.filter(d => d.type === 'CPC' && d.status !== 'CANCELLED' && isWithinCpcPeriod(d.dataDispensa)),
    [dispenses, config.cpcPeriodStart, config.cpcPeriodEnd]
  );

  const priorityQueue = useMemo(() => {
    if (!config.cpcEnabled) return [];
    if (!scopeTeams.includes(user.pelotao)) return [];

    const alreadyChosen = new Set(campaignCpcDispenses.map(d => d.userId));
    const availableUsers = users
      .filter(u => u.role === UserRole.OFFICER)
      .filter(u => scopeTeams.includes(u.pelotao))
      .filter(u => !alreadyChosen.has(u.id))
      .filter(u => u.pelotao === user.pelotao);

    return [...availableUsers].sort(sortByCriteria);
  }, [config.cpcEnabled, config.cpcPriorityCriteria, config.cpcTeamsEnabled, users, campaignCpcDispenses, rais, user.pelotao]);

  const isMyTurn = config.cpcEnabled && priorityQueue.length > 0 && priorityQueue[0].id === user.id;

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    const firstDay = date.getDay();
    for (let i = 0; i < firstDay; i++) days.push(null);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const handleMonthChange = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    setSelectedDay(null);
  };

  const dayInfo = useMemo(() => {
    if (!selectedDay) return null;
    const teamOnDuty = getShiftForDate(selectedDay);
    const cost = getDispenseCost(selectedDay, user.nascimento);
    const dayDispenses = dispenses.filter(d => d.dataDispensa === selectedDay && d.status !== 'CANCELLED');
    const takenDispenses = dayDispenses.filter(d => !d.blockedDay);
    const userAlreadyRequested = dispenses.some(d => d.userId === user.id && d.dataDispensa === selectedDay && d.status !== 'CANCELLED');
    const isOff = isOffDay(selectedDay, user.pelotao);
    const isBlocked = dayDispenses.some(d => d.blockedDay);
    // Bloqueio não deve consumir vagas; somente dispensas efetivas
    const isFull = takenDispenses.length >= maxVagas;
    return { teamOnDuty, cost, dayDispenses, userAlreadyRequested, isOff, isFull, isBlocked };
  }, [selectedDay, dispenses, user]);

  const requestDispense = () => {
    if (!selectedDay || !dayInfo) return;
    if (dayInfo.isOff) {
      setMessage({ text: 'Sistema não permite dispensa em dia de folga.', type: 'error' });
      return;
    }
    if (dayInfo.isBlocked) {
      setMessage({ text: 'Este dia não está disponível para agendamento.', type: 'error' });
      return;
    }
    if (dayInfo.isFull) {
      setMessage({ text: 'Vagas esgotadas para este dia.', type: 'error' });
      return;
    }

    if (dispenseType === 'CPC') {
      if (!config.cpcEnabled) {
        setMessage({ text: 'Dispensa CPC não está liberada no momento.', type: 'error' });
        return;
      }
      if (!scopeTeams.includes(user.pelotao)) {
        setMessage({ text: 'Dispensa CPC não está liberada para sua equipe nesta campanha.', type: 'error' });
        return;
      }
      if (!isWithinCpcPeriod(selectedDay)) {
        setMessage({ text: `Data fora do período da campanha CPC (${config.cpcPeriodStart} até ${config.cpcPeriodEnd}).`, type: 'error' });
        return;
      }
      if (!isMyTurn) {
        setMessage({ text: 'Aguarde sua vez. Existe policial com prioridade superior na sua equipe.', type: 'error' });
        return;
      }
    }

    const cost = dispenseType === 'CPC' ? 0 : getDispenseCost(selectedDay, user.nascimento);
    if (dispenseType === 'PRODUTIVIDADE' && userBalance < cost) {
      setMessage({ text: `Saldo insuficiente. Necessário ${cost} pontos.`, type: 'error' });
      return;
    }

    let remainingToDebit = cost;
    const updatedRais = [...rais];
    const requestId = Math.random().toString(36).substr(2, 9);
    
    if (dispenseType === 'PRODUTIVIDADE') {
      const userRais = rais.filter(r => r.userId === user.id && (r.status === 'APPROVED' || r.status === 'PENDING') && !r.usedForDispensaId);
      const sortedRais = [...userRais].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      for (const rai of sortedRais) {
        if (remainingToDebit <= 0) break;
        const index = updatedRais.findIndex(r => r.id === rai.id);
        if (index !== -1) {
          if (rai.pontos <= remainingToDebit) {
            updatedRais[index] = { ...updatedRais[index], usedForDispensaId: requestId };
            remainingToDebit -= rai.pontos;
          } else {
            const surplusPoints = rai.pontos - remainingToDebit;
            updatedRais[index] = { ...updatedRais[index], pontos: remainingToDebit, usedForDispensaId: requestId };
            updatedRais.push({
              ...updatedRais[index],
              id: Math.random().toString(36).substr(2, 9),
              pontos: surplusPoints,
              usedForDispensaId: undefined,
              createdAt: new Date().toISOString()
            });
            remainingToDebit = 0;
          }
        }
      }
    }

    let cpcPosicaoGeral: number | undefined;
    let cpcPosicaoEquipe: number | undefined;
    if (dispenseType === 'CPC') {
      const alreadyChosen = new Set(campaignCpcDispenses.map(d => d.userId));
      const globalEligible = users
        .filter(u => u.role === UserRole.OFFICER)
        .filter(u => scopeTeams.includes(u.pelotao))
        .filter(u => !alreadyChosen.has(u.id))
        .slice()
        .sort(sortByCriteria);
      cpcPosicaoGeral = globalEligible.findIndex(u => u.id === user.id) + 1;
      const teamEligible = globalEligible.filter(u => u.pelotao === user.pelotao);
      cpcPosicaoEquipe = teamEligible.findIndex(u => u.id === user.id) + 1;
    }

    const newRequest: DispenseRequest = {
      id: requestId,
      userId: user.id,
      userName: user.nomeGuerra,
      pelotao: user.pelotao,
      dataDispensa: selectedDay,
      pontosDebitados: cost,
      status: 'RESERVED',
      createdAt: new Date().toISOString(),
      type: dispenseType,
      cpcCriteria: dispenseType === 'CPC' ? config.cpcPriorityCriteria : undefined,
      cpcPosicaoGeral: dispenseType === 'CPC' ? cpcPosicaoGeral : undefined,
      cpcPosicaoEquipe: dispenseType === 'CPC' ? cpcPosicaoEquipe : undefined
    };

    setRais(updatedRais);
    setDispenses(prev => [...prev, newRequest]);
    setMessage({ text: `${dispenseType === 'CPC' ? 'Dispensa CPC' : 'Dispensa Produtividade'} reservada com sucesso!`, type: 'success' });
  };

  const cancelRequest = (id: string) => {
    setRais(prev => prev.map(r => r.usedForDispensaId === id ? { ...r, usedForDispensaId: undefined } : r));
    setDispenses(prev => prev.map(d => d.id === id ? { ...d, status: 'CANCELLED' } : d));
    setMessage({ text: 'Dispensa cancelada.', type: 'info' });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
          Calendário Operacional
        </h2>
        <div className="flex gap-4">
          {config.cpcEnabled && (
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isMyTurn ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
              {isMyTurn ? <CheckCircle2 size={14} /> : <Lock size={14} />}
              {!scopeTeams.includes(user.pelotao)
                ? 'CPC não liberado para sua equipe'
                : (isMyTurn
                    ? 'Sua vez de escolher (CPC)'
                    : (priorityQueue.length > 0
                        ? `Vez de: ${priorityQueue[0].graduacao} ${priorityQueue[0].nomeGuerra}`
                        : 'Fila CPC finalizada'))}
            </div>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-8 transition-all duration-500 ${isExpanded ? 'lg:flex-col' : ''}`}>
        <div className={`transition-all duration-500 ${isExpanded ? 'w-full' : 'flex-1'}`}>
          <div className="bg-white rounded-[40px] shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-8 flex items-center justify-between border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleMonthChange(-1)} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={() => handleMonthChange(1)} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/30">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {daysInMonth.map((date, idx) => {
                if (!date) return <div key={idx} className="aspect-square bg-gray-50/10 border-r border-b border-gray-200"></div>;
                
                const dStr = formatDate(date);
                const isSelected = selectedDay === dStr;
                const dayDispenses = dispenses.filter(d => d.dataDispensa === dStr && d.status !== 'CANCELLED');
                const taken = dayDispenses.filter(d => !d.blockedDay);
                const isBlocked = dayDispenses.some(d => d.blockedDay);
                const isOff = isOffDay(dStr, user.pelotao);
                // Bloqueio não consome vaga; somente dispensas efetivas
                const numVagasRestantes = maxVagas - taken.length;
                const isFull = numVagasRestantes <= 0;

                let bgColor = "bg-white";
                let textColor = "text-gray-900";
                let statusText = "";

                if (isBlocked) {
                  bgColor = "bg-white";
                  statusText = "NÃO DISPONÍVEL";
                } else if (isOff) {
                  bgColor = "bg-[#FFEB3B]"; 
                  statusText = "FOLGA";
                } else if (isFull) {
                  bgColor = "bg-[#FF3B30]"; 
                  textColor = "text-white";
                  statusText = "INDISPONÍVEL:";
                } else {
                  bgColor = "bg-[#C6FF00]"; 
                  statusText = `VAGAS:${numVagasRestantes}`;
                }

                return (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedDay(dStr)} 
                    className={`min-h-[110px] aspect-square w-full border-r border-b border-gray-200 p-2 transition-all flex flex-col text-left relative overflow-hidden ${bgColor} ${isSelected ? 'ring-4 ring-blue-500 ring-inset z-10' : 'hover:opacity-95'}`}
                  >
                    <span className={`text-sm font-semibold absolute top-1.5 left-2 ${textColor} ${isFull || isOff ? '' : 'opacity-40'}`}>
                      {date.getDate()}
                    </span>
                    
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
                      <p className={`text-[11px] lg:text-[12px] font-black uppercase leading-tight ${textColor}`}>
                        {statusText}
                      </p>
                      
                      <div className="mt-1 space-y-0.5 w-full overflow-hidden">
                        {dayDispenses.filter(d => !d.blockedDay).map((d) => (
                          <p key={d.id} className={`text-[9px] lg:text-[10px] font-semibold uppercase truncate ${textColor}`}>
                             {users.find(u => u.id === d.userId)?.graduacao} {d.userName} ({d.type === 'PRODUTIVIDADE' ? 'PROD.' : d.type})
                          </p>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`shrink-0 transition-all duration-500 ${isExpanded ? 'w-full grid grid-cols-1 md:grid-cols-2 gap-6' : 'w-full lg:w-96'}`}>
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 p-8 sticky top-8">
            {selectedDay ? (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                </div>

                {config.cpcEnabled && (
                   <div className="flex bg-gray-100 p-1 rounded-2xl">
                      <button 
                        onClick={() => setDispenseType('PRODUTIVIDADE')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${dispenseType === 'PRODUTIVIDADE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                      >
                        Produtividade
                      </button>
                      <button 
                        onClick={() => setDispenseType('CPC')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${dispenseType === 'CPC' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                      >
                        Comando (CPC)
                      </button>
                   </div>
                )}

                {dispenseType === 'PRODUTIVIDADE' && dayInfo && !dayInfo.isBlocked && !dayInfo.isOff && (
                  <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-white/20 rounded-xl"><Coins size={20} /></div>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Investimento</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-black">{dayInfo.cost}</span>
                       <span className="text-xs font-bold opacity-70">PONTOS</span>
                    </div>
                  </div>
                )}

                {dispenseType === 'CPC' && (
                  <div className={`p-6 rounded-3xl shadow-lg border ${isMyTurn ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-white/20 rounded-xl"><Megaphone size={20} /></div>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Liberação CPC</span>
                    </div>
                    <p className="text-xs font-bold uppercase leading-tight">
                      {isMyTurn ? 'Você está autorizado a escolher sua folga agora.' : 'Aguarde sua vez conforme a prioridade.'}
                    </p>
                  </div>
                )}

                {message && (
                  <div className={`p-4 rounded-2xl text-xs font-bold border animate-in zoom-in duration-200 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 
                    message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-3">
                  {dayInfo?.userAlreadyRequested ? (
                    <button 
                      onClick={() => {
                        const d = dayInfo.dayDispenses.find(d => d.userId === user.id && d.status !== 'CANCELLED');
                        if (d) cancelRequest(d.id);
                      }}
                      className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-700 shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Cancelar Reserva
                    </button>
                  ) : (
                    <button 
                      onClick={requestDispense}
                      disabled={dayInfo?.isOff || dayInfo?.isFull || dayInfo?.isBlocked || (dispenseType === 'CPC' && !isMyTurn)}
                      className={`w-full py-4 rounded-2xl font-black uppercase text-xs shadow-xl transition-all flex items-center justify-center gap-2 text-white ${dispenseType === 'CPC' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
                    >
                      <Send size={18} /> 
                      {dayInfo?.isOff ? 'FOLGA' : 
                       dayInfo?.isBlocked ? 'NÃO DISPONÍVEL' : 
                       dayInfo?.isFull ? 'INDISPONÍVEL' : 
                       dispenseType === 'CPC' && !isMyTurn ? 'AGUARDE SUA VEZ' : 
                       `Solicitar Dispensa (${dispenseType === 'CPC' ? 'CPC' : 'PROD.'})`}
                    </button>
                  )}
                </div>
                
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes da Escala</h4>
                   <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-500 uppercase">Equipe de Serviço</span>
                      <span className="text-blue-600">{dayInfo?.teamOnDuty}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-500 uppercase">Status do Dia</span>
                      <span className={dayInfo?.isBlocked || dayInfo?.isOff ? "text-red-500" : "text-green-600"}>
                        {dayInfo?.isBlocked ? "BLOQUEADO" : dayInfo?.isOff ? "FOLGA" : "ATIVO"}
                      </span>
                   </div>
                   <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Policiais Escalados</p>
                      {dayInfo?.dayDispenses.filter(d => !d.blockedDay).length === 0 ? (
                        <p className="text-[10px] italic text-gray-400">Nenhum agendamento para este dia.</p>
                      ) : (
                        <div className="space-y-2">
                          {dayInfo?.dayDispenses.filter(d => !d.blockedDay).map(d => (
                            <div key={d.id} className="flex items-center gap-2 text-[11px] font-black uppercase text-gray-700">
                              <CheckCircle2 size={14} className="text-blue-500" />
                              {d.userName} ({d.type === 'PRODUTIVIDADE' ? 'PROD.' : d.type})
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24">
                <CalendarIcon size={64} className="mx-auto text-gray-100 mb-6" />
                <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Gestão de Agenda</h3>
                <p className="text-xs text-gray-400 font-bold max-w-[200px] mx-auto mt-2">Selecione uma data no quadro para verificar disponibilidade e solicitar sua dispensa.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
