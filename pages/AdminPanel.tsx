
import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, RAI, DispenseRequest, OccurrenceNature, UserRole, SystemLog, SystemConfig, Pelotao, ExpirationRelease, HolidayRelease, BirthdayRelease } from '../types';
import AdminReleases from './AdminReleases';
import { getShiftForDate, formatDate, getDispenseCost } from '../utils';
import { RANK_WEIGHTS, PRACAS_GRADUACOES, normalizeGraduacao } from '../constants';
import { 
  Check, 
  X, 
  Trash2, 
  Search, 
  ShieldCheck, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  UserPlus, 
  FileSpreadsheet, 
  Settings,
  Maximize2,
  Minimize2,
  Save,
  ArrowUp,
  ArrowDown,
  Megaphone,
  Plus,
  Filter,
  CalendarDays,
  Activity,
  UserCheck,
  ClipboardList,
  AlertCircle,
  Download,
  ListOrdered,
  HelpCircle,
  Eye,
  SkipForward,
  Ban,
  Clock,
  History as HistoryIcon,
  Pencil,
  Shield
} from 'lucide-react';

interface AdminPanelProps {
  user: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  rais: RAI[];
  setRais: React.Dispatch<React.SetStateAction<RAI[]>>;
  dispenses: DispenseRequest[];
  setDispenses: React.Dispatch<React.SetStateAction<DispenseRequest[]>>;
  natures: OccurrenceNature[];
  setNatures: React.Dispatch<React.SetStateAction<OccurrenceNature[]>>;
  logs: SystemLog[];
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  addLog: (action: string, details: string, type?: 'INFO' | 'WARNING' | 'CRITICAL') => void;
  addNotification: (userId: string, title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  expirationReleases: ExpirationRelease[];
  setExpirationReleases: React.Dispatch<React.SetStateAction<ExpirationRelease[]>>;
  holidayReleases: HolidayRelease[];
  setHolidayReleases: React.Dispatch<React.SetStateAction<HolidayRelease[]>>;
  birthdayReleases: BirthdayRelease[];
  setBirthdayReleases: React.Dispatch<React.SetStateAction<BirthdayRelease[]>>;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const { 
    user, rais, dispenses, users, setUsers, setRais, setDispenses, natures, setNatures, config, setConfig, addLog, logs, addNotification,
    expirationReleases, setExpirationReleases, holidayReleases, setHolidayReleases, birthdayReleases, setBirthdayReleases
  } = props;

  // Helpers (padronização de entrada)
  const toTitleCase = (value: string) => {
    const v = (value || '').trim().replace(/\s+/g, ' ');
    return v
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const isoToBr = (iso: string) => {
    if (!iso) return '';
    // If already BR
    if (iso.includes('/')) return iso;
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    return `${m[3]}/${m[2]}/${m[1]}`;
  };

  const brToIso = (br: string) => {
    const v = (br || '').trim();
    if (!v) return '';
    if (v.includes('-')) return v.slice(0, 10); // already ISO
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return '';
    return `${m[3]}-${m[2]}-${m[1]}`;
  };

  const digitsOnly = (v: string, max?: number) => {
    const d = (v || '').replace(/\D/g, '');
    return typeof max === 'number' ? d.slice(0, max) : d;
  };

  const formatTelefone = (v: string) => {
    const d = digitsOnly(v, 11);
    if (d.length <= 2) return d;
    const ddd = d.slice(0, 2);
    const rest = d.slice(2);
    if (rest.length <= 4) return `${ddd}${rest}`;
    if (rest.length <= 8) return `${ddd}${rest.slice(0, 4)}-${rest.slice(4)}`;
    return `${ddd}${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  };

  const maskNascimento = (v: string) => {
    const d = digitsOnly(v, 8);
    const dd = d.slice(0, 2);
    const mm = d.slice(2, 4);
    const yyyy = d.slice(4, 8);
    let out = dd;
    if (mm) out += `/${mm}`;
    if (yyyy) out += `/${yyyy}`;
    return out;
  };

  const raiStatusLabel = (s: RAI['status']) => {
    if (s === 'PENDING') return 'PENDENTE';
    if (s === 'APPROVED') return 'APROVADO';
    if (s === 'REJECTED') return 'REPROVADO';
    return 'EXPIRADO';
  };

  // Estados Globais
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calendarTeam, setCalendarTeam] = useState<Pelotao>('ALPHA');
  const [calendarAction, setCalendarAction] = useState<'BLOCK' | 'MARK' | 'CANCEL'>('MARK');
  const [showMarkModal, setShowMarkModal] = useState<null | {
    dateStr: string;
    userId: string;
    type: 'CPC' | 'PROD';
    creditDebit: 'CREDITO' | 'DEBITO';
    observacoes: string;
  }>(null);
  
  // Estados Dispensas
  const [dispenseActiveTab, setDispenseActiveTab] = useState<'CPC' | 'PROD' | 'HIST'>('CPC');
  const [manualUser, setManualUser] = useState('');
  const [manualTeam, setManualTeam] = useState<Pelotao>("ALPHA");
  const [manualMatricula, setManualMatricula] = useState("");
  const [manualDate, setManualDate] = useState('');
  const [manualObs, setManualObs] = useState('');
  const [manualCreditDebit, setManualCreditDebit] = useState<'CREDITO' | 'DEBITO'>('DEBITO');
  const [filterTeam, setFilterTeam] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCpc, setSearchCpc] = useState("");
  const [searchProd, setSearchProd] = useState("");
  const [searchHist, setSearchHist] = useState("");
  const [histTypeFilter, setHistTypeFilter] = useState<'ALL' | 'CPC' | 'PRODUTIVIDADE'>('ALL');
  const [histTeamFilter, setHistTeamFilter] = useState<'ALL' | 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA'>('ALL');
  // Registrar Natureza controls
  const [natureSearch, setNatureSearch] = useState('');
  type NatureSortField = 'name' | 'points' | 'active';
  const [natureSortField, setNatureSortField] = useState<NatureSortField>('points');
  const [natureSortDir, setNatureSortDir] = useState<'DESC' | 'ASC'>('DESC');
  const [auditTab, setAuditTab] = useState<'PENDENTES' | 'APROVADOS' | 'REJEITADOS'>('PENDENTES');

  // CPC Campaign settings
  const [cpcViewTeam, setCpcViewTeam] = useState<Pelotao | 'TODAS'>('TODAS');
  const [cpcPeriodStart, setCpcPeriodStart] = useState<string>(config.cpcPeriodStart || '2026-01');
  const [cpcPeriodEnd, setCpcPeriodEnd] = useState<string>(config.cpcPeriodEnd || '2026-12');
  const [cpcCriteria, setCpcCriteria] = useState<SystemConfig['cpcPriorityCriteria']>(config.cpcPriorityCriteria || 'ALMANAQUE');
  const [cpcTeamsEnabled, setCpcTeamsEnabled] = useState<Pelotao[]>(config.cpcTeamsEnabled || ['ALPHA','BRAVO','CHARLIE','DELTA']);

  // Estados Gestão Usuários
  const [showUserModal, setShowUserModal] = useState<Partial<User> | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userTeamFilter, setUserTeamFilter] = useState<Pelotao | 'ALL'>('ALL');

  // Naturezas (CRUD)
  const [natureModal, setNatureModal] = useState<OccurrenceNature | null>(null);

  const maxVagas = config.maxDispensesPerDay || 2;

  // Formata data/hora para exibição em tabelas (pt-BR). Mantém robustez para valores vazios.
  const formatDateTime = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('pt-BR');
  };

  const getGraduacaoRank = (g: string) => {
    const norm = normalizeGraduacao(g);
    return RANK_WEIGHTS[norm] ?? -1;
  };

  const sortByAlmanaque = (a: User, b: User) => {
    const ra = getGraduacaoRank(a.graduacao);
    const rb = getGraduacaoRank(b.graduacao);
    // Maior peso = maior prioridade (SUB TEN > SGT > CB > SD)
    if (ra !== rb) return rb - ra;
    return (a.almanaquePosition || 0) - (b.almanaquePosition || 0);
  };

  const monthKeyFromDateStr = (dStr: string) => (dStr || '').slice(0, 7);
  const isWithinCpcPeriod = (dStr: string) => {
    const m = monthKeyFromDateStr(dStr);
    const start = (config.cpcPeriodStart || '1900-01');
    const end = (config.cpcPeriodEnd || '2999-12');
    return m >= start && m <= end;
  };

  // --- LÓGICAS ---

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

  const filteredNatures = useMemo(() => {
    const term = (natureSearch || '').trim().toLowerCase();
    const dir = natureSortDir === 'ASC' ? 1 : -1;
    return (natures || [])
      .filter(n => !term || (n.name || '').toLowerCase().includes(term))
      .slice()
      .sort((a, b) => {
        let primary = 0;
        if (natureSortField === 'name') {
          primary = (a.name || '').localeCompare(b.name || '');
        } else if (natureSortField === 'points') {
          primary = (a.points || 0) - (b.points || 0);
        } else {
          // active
          primary = Number(a.active) - Number(b.active);
        }
        if (primary !== 0) return primary * dir;
        // Secondary (stable): name
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [natures, natureSearch, natureSortField, natureSortDir]);


  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUserModal) return;

    const u0 = showUserModal as User;
    // Normaliza entradas conforme instruções
    const normalizedFullName = toTitleCase(u0.name || '');
    const normalizedNomeGuerra = (u0.nomeGuerra || '').trim().toUpperCase();
    const normalizedMatricula = digitsOnly(u0.matricula || '', 5);
    const normalizedNascimentoIso = brToIso(isoToBr(u0.nascimento || ''));
    const normalizedTelefone = formatTelefone(u0.telefone || '');
    const normalizedEmail = (u0.email || '').trim().toLowerCase();

    const u: User = {
      ...u0,
      graduacao: normalizeGraduacao(u0.graduacao),
      name: normalizedFullName,
      nomeGuerra: normalizedNomeGuerra,
      matricula: normalizedMatricula,
      nascimento: normalizedNascimentoIso,
      telefone: normalizedTelefone,
      email: normalizedEmail
    };
    if (!u.name || !u.matricula || !u.nomeGuerra || !u.graduacao) return alert('Preencha os campos obrigatórios.');
    if (u.matricula.length !== 5) return alert('Matrícula deve ter 5 dígitos.');
    if (!u.nascimento) return alert('Informe o nascimento (dd/mm/aaaa).');
    if (!PRACAS_GRADUACOES.includes(u.graduacao)) return alert('Graduação inválida. Use apenas: SUB TEN, 1ºSGT, 2ºSGT, 3ºSGT, CB, SD.');

    const isEdit = users.find(existing => existing.id === u.id);
    const duplicateMatricula = users.find(existing => existing.matricula === u.matricula && existing.id !== u.id);

    if (duplicateMatricula) return alert('Matrícula já cadastrada no sistema.');

    if (isEdit) {
      setUsers(prev => prev.map(item => item.id === u.id ? u : item));
      addLog('USER_EDIT', `Usuário ${u.nomeGuerra} editado por ADM`);
    } else {
      const newUser: User = {
        ...u,
        id: Math.random().toString(36).substr(2, 9),
        role: u.role || UserRole.OFFICER,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        almanaquePosition: u.almanaquePosition || (users.length + 1)
      };
      setUsers(prev => [...prev, newUser]);
      addLog('USER_CREATE', `Novo usuário ${u.nomeGuerra} cadastrado`);
    }
    setShowUserModal(null);
  };

  const handleManualRegister = () => {
    if (!manualUser || !manualDate || !manualObs) return alert('Preencha todos os campos para o registro manual.');

    const selUser = users.find(u => u.id === manualUser);
    if (!selUser) return;
    
    const cost = getDispenseCost(manualDate, selUser.nascimento);
    const userAvailableRais = rais.filter(r => r.userId === selUser.id && (r.status === 'APPROVED' || r.status === 'PENDING') && !r.usedForDispensaId);
    const userPoints = userAvailableRais.reduce((s,r) => s+r.pontos, 0);

    if (manualCreditDebit === 'DEBITO') {
      if (userPoints < cost) return alert(`Policial possui apenas ${userPoints} pontos. Custo: ${cost} pts.`);
    }

    const requestId = Math.random().toString(36).substr(2, 9);
    
    const updatedRais = [...rais];
    if (manualCreditDebit === 'DEBITO') {
      // Lógica FIFO Avançada (Divisão de RAI se necessário)
      let remainingToDebit = cost;
      const sortedRais = [...userAvailableRais].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

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

    const newRequest: DispenseRequest = {
      id: requestId,
      userId: selUser.id,
      userName: selUser.nomeGuerra,
      pelotao: selUser.pelotao,
      dataDispensa: manualDate,
      pontosDebitados: manualCreditDebit === 'DEBITO' ? cost : 0,
      creditDebit: manualCreditDebit,
      observacoes: manualObs,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      type: 'PRODUTIVIDADE',
      manualRegistration: true
    };

    setRais(updatedRais);
    setDispenses(prev => [...prev, newRequest]);
    addLog('MANUAL_DISPENSE', `Registro Manual: ${selUser.nomeGuerra} | Data: ${manualDate}`);
    addNotification(selUser.id, 'Dispensa Aprovada', `Sua dispensa para o dia ${manualDate} foi lançada administrativamente.`, 'success');

    setManualUser('');
    setManualDate('');
    setManualObs('');
    setManualCreditDebit('DEBITO');
    alert('Dispensa registrada com sucesso!');
  };

  const updateRAIStatus = (rai: RAI, status: 'APPROVED' | 'REJECTED') => {
    let reason = '';
    if (status === 'REJECTED') {
      reason = window.prompt('Motivo da reprovação:') || '';
      if (!reason) return alert('Motivo obrigatório.');
      if (rai.usedForDispensaId) {
         setDispenses(prev => prev.map(d => d.id === rai.usedForDispensaId ? { ...d, status: 'CANCELLED' } : d));
         addNotification(rai.userId, 'Dispensa Cancelada', `Sua dispensa associada ao RAI ${rai.numeroRAI} foi cancelada devido à reprovação do RAI.`, 'error');
      }
      addNotification(rai.userId, 'RAI Reprovado', `O RAI ${rai.numeroRAI} foi reprovado. Motivo: ${reason}`, 'error');
    } else {
      addNotification(rai.userId, 'RAI Aprovado', `O RAI ${rai.numeroRAI} foi auditado e aprovado com sucesso (+${rai.pontos} pts).`, 'success');
    }

    setRais(prev => prev.map(r => r.id === rai.id ? { ...r, status, auditedBy: user.nomeGuerra, auditDate: new Date().toISOString(), rejectionReason: reason || undefined } : r));
    addLog('AUDIT', `RAI ${rai.numeroRAI} ${status}`);
  };

  const toggleDayBlock = (dStr: string) => {
    const existing = dispenses.find(d => d.dataDispensa === dStr && d.blockedDay);
    if (existing) {
      setDispenses(prev => prev.filter(d => d.id !== existing.id));
    } else {
      setDispenses(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'SYSTEM', userName: 'ADM', pelotao: 'ALPHA', dataDispensa: dStr, pontosDebitados: 0, status: 'APPROVED', createdAt: new Date().toISOString(), type: 'OUTROS', blockedDay: true
      }]);
    }
  };

  const adminCreateDispense = (opts: {
    dateStr: string;
    userId: string;
    type: 'CPC' | 'PROD';
    creditDebit: 'CREDITO' | 'DEBITO';
    observacoes?: string;
  }) => {
    const selUser = users.find(u => u.id === opts.userId);
    if (!selUser) return alert('Policial não encontrado.');
    const dStr = opts.dateStr;

    const existingDay = dispenses.filter(d => d.dataDispensa === dStr && d.status !== 'CANCELLED');
    if (existingDay.some(d => d.blockedDay)) return alert('Dia bloqueado. Desbloqueie antes de cadastrar dispensa.');
    const taken = existingDay.filter(d => !d.blockedDay);
    if (taken.length >= maxVagas) return alert('Dia já está com todas as vagas preenchidas.');

    const requestId = Math.random().toString(36).substr(2, 9);
    let pontosDebitados = 0;
    let updatedRais = [...rais];

    // CPC é gratuita: sempre Crédito
    const finalType = opts.type === 'CPC' ? 'CPC' : 'PRODUTIVIDADE';
    const finalCreditDebit: 'CREDITO' | 'DEBITO' = opts.type === 'CPC' ? 'CREDITO' : opts.creditDebit;

    if (finalType === 'PRODUTIVIDADE' && finalCreditDebit === 'DEBITO') {
      const cost = getDispenseCost(dStr, selUser.nascimento);
      const userAvailableRais = rais.filter(r => r.userId === selUser.id && r.status === 'APPROVED' && !r.usedForDispensaId);
      const userPoints = userAvailableRais.reduce((s,r) => s+r.pontos, 0);
      if (userPoints < cost) return alert(`Pontos insuficientes. Disponível: ${userPoints} | Custo: ${cost}`);
      pontosDebitados = cost;

      let remaining = cost;
      const sortedRais = [...userAvailableRais].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (const rai of sortedRais) {
        if (remaining <= 0) break;
        const idx = updatedRais.findIndex(r => r.id === rai.id);
        if (idx === -1) continue;
        if (rai.pontos <= remaining) {
          updatedRais[idx] = { ...updatedRais[idx], usedForDispensaId: requestId };
          remaining -= rai.pontos;
        } else {
          const surplus = rai.pontos - remaining;
          updatedRais[idx] = { ...updatedRais[idx], pontos: remaining, usedForDispensaId: requestId };
          updatedRais.push({
            ...updatedRais[idx],
            id: Math.random().toString(36).substr(2, 9),
            pontos: surplus,
            usedForDispensaId: undefined,
            createdAt: new Date().toISOString()
          });
          remaining = 0;
        }
      }
    }

    const newRequest: DispenseRequest = {
      id: requestId,
      userId: selUser.id,
      userName: selUser.nomeGuerra,
      pelotao: selUser.pelotao,
      dataDispensa: dStr,
      pontosDebitados,
      creditDebit: finalCreditDebit,
      observacoes: (opts.observacoes || '').trim() || undefined,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      type: finalType,
      manualRegistration: true
    };

    setRais(updatedRais);
    setDispenses(prev => [...prev, newRequest]);
    addLog('ADMIN_DISPENSE', `ADM cadastrou dispensa (${finalType}/${finalCreditDebit}) para ${selUser.nomeGuerra} em ${dStr}`);
    addNotification(selUser.id, 'Dispensa Agendada', `A administração agendou uma dispensa (${finalType}) para o dia ${dStr}.`, 'success');
  };

  const cancelDispensesForDay = (dStr: string) => {
    const dayRequests = dispenses.filter(d => d.dataDispensa === dStr && !d.blockedDay && d.status !== 'CANCELLED');
    if (!dayRequests.length) return alert('Nenhuma dispensa para cancelar neste dia.');
    if (!window.confirm(`Cancelar ${dayRequests.length} dispensa(s) do dia ${dStr}?`)) return;
    setDispenses(prev => prev.map(d => (d.dataDispensa === dStr && !d.blockedDay) ? { ...d, status: 'CANCELLED' } : d));
    
    // Notify users
    dayRequests.forEach(d => {
       addNotification(d.userId, 'Dispensa Cancelada', `Sua dispensa do dia ${dStr} foi cancelada pela administração.`, 'warning');
    });

    addLog('CANCEL_DAY_DISPENSES', `ADM cancelou dispensas do dia ${dStr}`);
  };

  // --- RENDERS ---

  const renderDispensesModule = () => {
    const allTeams: Pelotao[] = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
    const scopeTeams = cpcTeamsEnabled.length ? cpcTeamsEnabled : allTeams;

    const pointsForUser = (uid: string) => rais
      .filter(r => r.userId === uid && r.status === 'APPROVED' && !r.usedForDispensaId)
      .reduce((s, r) => s + r.pontos, 0);

    const sortByCriteria = (a: User, b: User) => {
      if (config.cpcPriorityCriteria === 'ALMANAQUE') return sortByAlmanaque(a, b);
      // RANKING (pontuação)
      const pa = pointsForUser(a.id);
      const pb = pointsForUser(b.id);
      if (pb !== pa) return pb - pa;
      return sortByAlmanaque(a, b);
    };

    const campaignCpcDispenses = dispenses
      .filter(d => d.type === 'CPC' && d.status !== 'CANCELLED')
      .filter(d => isWithinCpcPeriod(d.dataDispensa));

    const alreadyChosen = new Set(campaignCpcDispenses.map(d => d.userId));
    const eligibleUsers = users
      .filter(u => u.role === UserRole.OFFICER)
      .filter(u => scopeTeams.includes(u.pelotao))
      .filter(u => !alreadyChosen.has(u.id));

    const queueByTeam: Record<Pelotao, User[]> = {
      ALPHA: [], BRAVO: [], CHARLIE: [], DELTA: []
    };
    for (const t of scopeTeams) {
      queueByTeam[t] = eligibleUsers.filter(u => u.pelotao === t).slice().sort(sortByCriteria);
    }

    const viewTeams = cpcViewTeam === 'TODAS' ? scopeTeams : [cpcViewTeam];
    const viewQueue = viewTeams.flatMap(t => (queueByTeam[t] || []).map((u, idx) => ({ u, idx, t })));
    const nextToAuthorizedByTeam: Partial<Record<Pelotao, User | undefined>> = {};
    for (const t of scopeTeams) {
      nextToAuthorizedByTeam[t] = (queueByTeam[t] || [])[0];
    }

    const applyCpcCampaignSettings = () => {
      if (cpcPeriodStart > cpcPeriodEnd) {
        alert('Período inválido: início maior que fim.');
        return;
      }
      setConfig({
        ...config,
        cpcPriorityCriteria: cpcCriteria,
        cpcPeriodStart,
        cpcPeriodEnd,
        cpcTeamsEnabled: scopeTeams
      });
      addLog('CPC_SETTINGS', `Atualizou campanha CPC: ${cpcPeriodStart}..${cpcPeriodEnd} | ${cpcCriteria} | Equipes: ${scopeTeams.join(', ')}`);
    };

    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setDispenseActiveTab('CPC')} className={`px-8 py-4 text-[11px] font-black uppercase border-b-2 transition-all ${dispenseActiveTab === 'CPC' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}>CPC (Fila)</button>
          <button onClick={() => setDispenseActiveTab('PROD')} className={`px-8 py-4 text-[11px] font-black uppercase border-b-2 transition-all ${dispenseActiveTab === 'PROD' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Produtividade (Manual)</button>
          <button onClick={() => setDispenseActiveTab('HIST')} className={`px-8 py-4 text-[11px] font-black uppercase border-b-2 transition-all ${dispenseActiveTab === 'HIST' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400'}`}>Histórico</button>
        </div>

        {dispenseActiveTab === 'CPC' ? (
          <div className="space-y-6">
            <div className={`p-8 rounded-[40px] border flex flex-col lg:flex-row justify-between items-center gap-6 ${config.cpcEnabled ? 'bg-white border-red-100' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <Megaphone className={config.cpcEnabled ? 'text-red-600' : 'text-gray-400'} size={24} />
                <h3 className="text-sm font-black uppercase">Fila do Comando Geral</h3>
              </div>
              <button onClick={() => setConfig({...config, cpcEnabled: !config.cpcEnabled})} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase text-white ${config.cpcEnabled ? 'bg-red-600' : 'bg-green-600'}`}>{config.cpcEnabled ? 'Desativar Fila' : 'Liberar Campanha'}</button>
            </div>
            <details className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <summary className="list-none cursor-pointer select-none p-8 flex items-center justify-between">
                <span className="text-sm font-black uppercase text-gray-900">Configuração da Campanha</span>
                <span className="text-gray-400 text-xl leading-none">▾</span>
              </summary>
              <div className="px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Período (Início)</label>
                  <div className="relative">
  <input type="month" className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={cpcPeriodStart} onChange={e => setCpcPeriodStart(e.target.value)} />
  <CalendarIcon className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
</div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Período (Fim)</label>
                  <div className="relative">
  <input type="month" className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={cpcPeriodEnd} onChange={e => setCpcPeriodEnd(e.target.value)} />
  <CalendarIcon className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
</div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Critério</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={cpcCriteria} onChange={e => setCpcCriteria(e.target.value as any)}>
                    <option value="RANKING">Ranking (pontos)</option>
                    <option value="ALMANAQUE">Almanaque (graduação)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Matrícula</label>
                  <input type="text" readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={manualMatricula} />
                </div>
                <div className="flex items-end">
                  <button onClick={applyCpcCampaignSettings} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-slate-800 transition-all">Salvar Configurações</button>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-3">Liberação</label>
                <div className="flex flex-wrap gap-3">
                  {allTeams.map(t => {
                    const checked = cpcTeamsEnabled.includes(t);
                    return (
                      <button key={t} type="button" onClick={() => {
                        setCpcTeamsEnabled(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                      }} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border ${checked ? 'bg-white border-slate-900 text-slate-900' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>{t}</button>
                    );
                  })}
                  <button type="button" onClick={() => setCpcTeamsEnabled(allTeams)} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase border bg-gray-50 border-gray-100 text-gray-600">Todas</button>
                </div>
                <p className="mt-3 text-[10px] text-gray-400 font-bold leading-tight">A fila CPC é sempre por equipe. A configuração acima define quais equipes participam da campanha e o período de datas permitido para escolha.</p>
              </div>
            
              </div>
            </details>

            <details className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <summary className="list-none cursor-pointer select-none p-8 flex items-center justify-between">
                <span className="text-sm font-black uppercase text-gray-900">Lista de Prioridade (Pendentes)</span>
                <span className="text-gray-400 text-xl leading-none">▾</span>
              </summary>
              <div className="px-8 pb-8">
              <div className="p-8 border-b border-gray-50 font-black text-sm uppercase flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <span>Lista de Prioridade (Pendentes)</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Equipe</span>
                  <select className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase" value={cpcViewTeam} onChange={e => setCpcViewTeam(e.target.value as any)}>
                    <option value="TODAS">Todas</option>
                    {scopeTeams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                    <tr>
                      <th className="px-8 py-4">Equipe</th>
                      <th className="px-8 py-4">Posição</th>
                      <th className="px-8 py-4">Policial</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {viewQueue.length ? viewQueue.map(({ u, idx, t }) => (
                      <tr key={u.id} className={`text-sm ${u.id === nextToAuthorizedByTeam[t]?.id ? 'bg-red-50/50' : ''}`}>
                        <td className="px-8 py-4 font-black">{t}</td>
                        <td className="px-8 py-4 font-black">{idx + 1}º</td>
                        <td className="px-8 py-4 uppercase font-black">{normalizeGraduacao(u.graduacao)} {u.nomeGuerra}</td>
                        <td className="px-8 py-4 font-black">
                          {u.id === nextToAuthorizedByTeam[t]?.id ? <span className="text-red-600 animate-pulse">AUTORIZADO</span> : <span className="text-gray-300">AGUARDANDO</span>}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-8 py-10 text-center text-xs text-gray-400 font-bold">Sem pendências na fila CPC para os filtros atuais.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            
              </div>
            </details>

            <details className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <summary className="list-none cursor-pointer select-none p-8 flex items-center justify-between border-b border-gray-50">
                <span className="font-black text-sm uppercase">Solicitações CPC Registradas (nesta campanha)</span>
                <span className="text-gray-400 text-xl leading-none">▾</span>
              </summary>
              <div className="p-8">

              <div className="px-8 py-4 border-b border-gray-50 flex items-center gap-3">
                <Search size={18} className="text-gray-400" />
                <input value={searchCpc} onChange={e=>setSearchCpc(e.target.value)} placeholder="Pesquisar por data, equipe, policial ou matrícula..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                    <tr>
                      <th className="px-8 py-4">Critério</th>
                      <th className="px-8 py-4">Posição Geral</th>
                      <th className="px-8 py-4">Posição Equipe</th>
                      <th className="px-8 py-4">Policial</th>
                      <th className="px-8 py-4">Matrícula</th>
                      <th className="px-8 py-4">Data Escolhida</th>
                      <th className="px-8 py-4">Data do Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaignCpcDispenses
                      .filter(d => {
                        const term = (searchCpc || '').trim().toLowerCase();
                        if (!term) return true;
                        const u = users.find(us => us.id === d.userId);
                        const hay = [d.dataDispensa, d.userName, u?.matricula, u?.pelotao, d.cpcCriteria, String(d.cpcPosicaoGeral ?? ''), String(d.cpcPosicaoEquipe ?? ''), formatDateTime(d.createdAt)].join(' ').toLowerCase();
                        return hay.includes(term);
                      })
                      .slice()
                      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                      .map(d => {
                        const u = users.find(us => us.id === d.userId);
                        return (
                          <tr key={d.id} className="text-sm">
                            <td className="px-8 py-4 font-black">{d.cpcCriteria || config.cpcPriorityCriteria}</td>
                            <td className="px-8 py-4 font-black">{d.cpcPosicaoGeral ?? '-'}</td>
                            <td className="px-8 py-4 font-black">{d.cpcPosicaoEquipe ?? '-'}</td>
                            <td className="px-8 py-4 uppercase font-black">{normalizeGraduacao(u?.graduacao || '')} {d.userName}</td>
                            <td className="px-8 py-4 font-black">{u?.matricula || '-'}</td>
                            <td className="px-8 py-4 font-black">{d.dataDispensa}</td>
                            <td className="px-8 py-4 font-black">{formatDateTime(d.createdAt)}</td>
                          </tr>
                        );
                      })}
                    {!campaignCpcDispenses.length && (
                      <tr><td colSpan={7} className="px-8 py-10 text-center text-xs text-gray-400 font-bold">Nenhuma solicitação CPC registrada neste período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            
              </div>
            </details>
          </div>
        ) : dispenseActiveTab === 'PROD' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2 text-blue-600"><Plus size={18} /> Cadastro Manual</h3>
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Policial</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={manualUser} onChange={e => { const id=e.target.value; setManualUser(id); const uu=users.find(x=>x.id===id); setManualMatricula(uu?.matricula||''); }}>
                    <option value="">Selecionar...</option>
                    {users
                      .filter(u => u.role === UserRole.OFFICER)
                      .filter(u => u.pelotao === manualTeam)
                      .slice()
                      .sort(sortByAlmanaque)
                      .map(u => <option key={u.id} value={u.id}>{normalizeGraduacao(u.graduacao)} {u.nomeGuerra}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Data Folga</label>
                  <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Equipe</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase" value={manualTeam} onChange={e => { setManualTeam(e.target.value as any); setManualUser(''); setManualMatricula(''); }}>
                    <option value="ALPHA">ALPHA</option>
                    <option value="BRAVO">BRAVO</option>
                    <option value="CHARLIE">CHARLIE</option>
                    <option value="DELTA">DELTA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Matrícula</label>
                  <input readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={manualMatricula} placeholder="—" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Observação</label>
                  <input type="text" placeholder="Motivo administrativo" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={manualObs} onChange={e => setManualObs(e.target.value)} />
                </div>
              </div>

              {/* Ações abaixo dos campos */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setManualCreditDebit('CREDITO')}
                  className={`py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${
                    manualCreditDebit === 'CREDITO'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}
                >
                  CRÉDITO
                </button>

                <button
                  type="button"
                  onClick={() => setManualCreditDebit('DEBITO')}
                  className={`py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${
                    manualCreditDebit === 'DEBITO'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  DÉBITO
                </button>

                <button
                  type="button"
                  onClick={handleManualRegister}
                  className="py-3 rounded-2xl text-[11px] font-black uppercase bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all"
                >
                  REGISTRAR
                </button>
              </div>
            </div>
            <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden">
               <div className="p-8 border-b border-gray-50 font-black text-sm uppercase">Histórico Recente (Manual)</div>
               <div className="px-8 py-4 border-b border-gray-50 flex items-center gap-3">
                 <Search size={18} className="text-gray-400" />
                 <input value={searchProd} onChange={e=>setSearchProd(e.target.value)} placeholder="Pesquisar por data, equipe, policial ou matrícula..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                     <tr><th className="px-8 py-4">Data</th><th className="px-8 py-4">Policial</th><th className="px-8 py-4 text-center">Pontos</th><th className="px-8 py-4 text-right">Ações</th></tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {dispenses.filter(d => d.manualRegistration && d.status !== 'CANCELLED')
                       .filter(d => { const t=(searchProd||'').trim().toLowerCase(); if(!t) return true; const u=users.find(us=>us.id===d.userId); const hay=[d.dataDispensa,d.pelotao,d.userName,u?.matricula,d.observacoes].join(' ').toLowerCase(); return hay.includes(t); })
                       .reverse().map(d => (
                       <tr key={d.id} className="text-sm">
                         <td className="px-8 py-4 font-black">{d.dataDispensa}</td>
                         <td className="px-8 py-4 uppercase font-black">{d.userName}</td>
                         <td className="px-8 py-4 text-center font-black text-blue-600">-{d.pontosDebitados}</td>
                         <td className="px-8 py-4 text-right">
                           <button onClick={() => { if(window.confirm('Excluir?')) setDispenses(prev => prev.map(req => req.id === d.id ? {...req, status: 'CANCELLED'} : req)); }} className="text-red-500 p-2"><Trash2 size={16} /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50">
                <div className="font-black text-sm uppercase flex items-center gap-2">
                  <HistoryIcon size={16} /> Histórico de Dispensas
                </div>

                {/* Busca abaixo do título */}
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                      value={searchHist}
                      onChange={e=>setSearchHist(e.target.value)}
                      placeholder="Pesquisar por data, equipe, policial ou matrícula..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Filtros CPC / PROD (acima dos filtros de equipe) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHistTypeFilter(histTypeFilter === 'CPC' ? 'ALL' : 'CPC')}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                      histTypeFilter === 'CPC' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                  >
                    CPC
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistTypeFilter(histTypeFilter === 'PRODUTIVIDADE' ? 'ALL' : 'PRODUTIVIDADE')}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                      histTypeFilter === 'PRODUTIVIDADE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                  >
                    PROD.
                  </button>
                </div>

                {/* Filtro de Equipe (abaixo da busca) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['ALL','ALPHA','BRAVO','CHARLIE','DELTA'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHistTeamFilter(t)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        histTeamFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {t === 'ALL' ? 'Geral' : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                    <tr>
                      <th className="px-8 py-4">Data</th>
                      <th className="px-8 py-4">Equipe</th>
                      <th className="px-8 py-4">Tipo</th>
                      <th className="px-8 py-4">Policial</th>
                      <th className="px-8 py-4">Matrícula</th>
                      <th className="px-8 py-4">Observação</th>
                      <th className="px-8 py-4 text-center">Status</th>
                      <th className="px-8 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dispenses
                      .slice()
                      .sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))
                      .filter(d=>{
                        const teamOk = (histTeamFilter === 'ALL') || (d.pelotao === histTeamFilter);
                        const typeOk = (histTypeFilter === 'ALL') || (d.type === histTypeFilter);
                        if(!teamOk || !typeOk) return false;

                        const t=(searchHist||'').trim().toLowerCase();
                        if(!t) return true;
                        const u=users.find(us=>us.id===d.userId);
                        const hay=[d.dataDispensa,d.pelotao,d.type,d.userName,u?.matricula,d.observacoes,d.status].join(' ').toLowerCase();
                        return hay.includes(t);
                      })
                      .map(d=>{
                        const u=users.find(us=>us.id===d.userId);
                        return (
                          <tr key={d.id} className="text-sm">
                            <td className="px-8 py-4 font-black">{d.dataDispensa}</td>
                            <td className="px-8 py-4 font-black">{d.pelotao}</td>
                            <td className="px-8 py-4 font-black">{d.type}</td>
                            <td className="px-8 py-4 uppercase font-black">{normalizeGraduacao(u?.graduacao||'')} {d.userName}</td>
                            <td className="px-8 py-4 font-black">{u?.matricula||'-'}</td>
                            <td className="px-8 py-4 font-bold text-gray-500">{d.observacoes||'-'}</td>
                            <td className="px-8 py-4 text-center font-black">{d.status === 'CANCELLED' ? 'CANCELADA' : 'ATIVA'}</td>
                            <td className="px-8 py-4 text-right">
                              {d.status !== 'CANCELLED' ? (
                                <button onClick={()=>{ if(window.confirm('Cancelar dispensa?')) setDispenses(prev=>prev.map(x=>x.id===d.id?{...x,status:'CANCELLED'}:x)); }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl" title="Cancelar"><Trash2 size={16} /></button>
                              ) : <span className="text-[10px] font-black text-gray-400">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    {!dispenses.length && <tr><td colSpan={8} className="px-8 py-10 text-center text-xs text-gray-400 font-bold">Sem registros.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
	      </div>
    );
  };

  const renderUsersModule = () => {
    const filtered = users.filter(u => {
      if (userTeamFilter !== 'ALL' && u.pelotao !== userTeamFilter) return false;
      const term = (userSearch || '').trim().toLowerCase();
      if (!term) return true;
      const g = (normalizeGraduacao(u.graduacao) || '').toLowerCase();
      return (
        (u.nomeGuerra || '').toLowerCase().includes(term) ||
        (u.matricula || '').toLowerCase().includes(term) ||
        g.includes(term)
      );
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-900 uppercase">Gestão de Policiais</h2>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input type="text" placeholder="Graduação, Nome ou Matrícula..." className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              {/* Botão + ao lado da busca */}
              <button
                onClick={() => setShowUserModal({
                  graduacao: 'SD',
                  pelotao: 'ALPHA',
                  role: UserRole.OFFICER,
                  name: '',
                  nomeGuerra: '',
                  matricula: '',
                  telefone: '',
                  nascimento: '',
                  email: '',
                  almanaquePosition: users.length + 1
                } as any)}
                className="flex items-center justify-center w-full sm:w-auto px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase shadow-lg hover:bg-slate-800 transition-all"
                title="Novo Policial"
              >
                <UserPlus size={18} />
              </button>
           </div>
           <div className="px-8 pb-6">
             <div className="flex gap-2 flex-wrap items-center">
               <button type="button" onClick={() => setUserTeamFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${userTeamFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>Geral</button>
               {(['ALPHA','BRAVO','CHARLIE','DELTA'] as Pelotao[]).map(t => (
                 <button key={t} type="button" onClick={() => setUserTeamFilter(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${userTeamFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{t}</button>
               ))}
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                 <tr>
                   <th className="px-8 py-4">Policial</th>
                   <th className="px-8 py-4 text-center">Matrícula</th>
                   <th className="px-8 py-4 text-center">Equipe</th>
                   <th className="px-8 py-4 text-center">Aniversário</th>
                   <th className="px-8 py-4 text-center">Telefone</th>
                   <th className="px-8 py-4">Email</th>
                   <th className="px-8 py-4 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {filtered.map(u => (
                   <tr key={u.id} className="text-sm hover:bg-gray-50/30">
                     <td className="px-8 py-5">
                       <div className="font-black uppercase">{normalizeGraduacao(u.graduacao)} {u.nomeGuerra}</div>
                     </td>
                     <td className="px-8 py-5 text-center font-bold text-gray-500">{u.matricula}</td>
                     <td className="px-8 py-5 text-center"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black">{u.pelotao}</span></td>
                     <td className="px-8 py-5 text-center font-bold text-gray-500">{u.nascimento ? new Date(u.nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                     <td className="px-8 py-5 text-center font-bold text-gray-500">{u.telefone || '-'}</td>
                     <td className="px-8 py-5 text-xs font-bold text-gray-600">{u.email || '-'}</td>
                     <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
  <button type="button" onClick={() => setShowUserModal(u)} className="p-2 text-blue-600 bg-blue-50 rounded-xl"><Pencil size={16} /></button>
  <button type="button" onClick={() => { if(window.confirm('Excluir policial?')) { setUsers(prev => prev.filter(item => item.id !== u.id)); setRais(prev => prev.filter(r => r.userId !== u.id)); setDispenses(prev => prev.filter(d => d.userId !== u.id)); addLog('DELETE_USER', `Excluiu policial ${u.nomeGuerra} (${u.matricula})`); } }} className="p-2 text-red-600 bg-red-50 rounded-xl"><Trash2 size={16} /></button>
</div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <form onSubmit={handleSaveUser} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                   <h3 className="font-black uppercase tracking-widest text-sm">{showUserModal.id ? 'Editar Policial' : 'Novo Policial'}</h3>
                   <button type="button" onClick={() => setShowUserModal(null)}><X size={20} /></button>
                </div>
                <div className="p-8 space-y-4">
                   {/* Ordem dos campos conforme especificação (Gestão de Policiais > Novo Policial) */}
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome Completo</label>
                     <input
                       type="text"
                       className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                       value={showUserModal.name || ''}
                       onChange={e => setShowUserModal({ ...showUserModal, name: e.target.value })}
                       placeholder="Ex.: Nome Completo"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Graduação</label>
                       <select
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                         value={showUserModal.graduacao}
                         onChange={e => setShowUserModal({ ...showUserModal, graduacao: e.target.value })}
                       >
                         {PRACAS_GRADUACOES.map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome de Guerra</label>
                       <input
                         type="text"
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100 uppercase"
                         value={showUserModal.nomeGuerra || ''}
                         onChange={e => setShowUserModal({ ...showUserModal, nomeGuerra: e.target.value.toUpperCase() })}
                         placeholder="Ex.: SOARES"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Matrícula (5 dígitos)</label>
                       <input
                         type="text"
                         inputMode="numeric"
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                         value={showUserModal.matricula || ''}
                         onChange={e => setShowUserModal({ ...showUserModal, matricula: digitsOnly(e.target.value, 5) })}
                         placeholder="12345"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nascimento (dd/mm/aaaa)</label>
                       <input
                         type="text"
                         inputMode="numeric"
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                         value={isoToBr(showUserModal.nascimento || '')}
                         onChange={e => setShowUserModal({ ...showUserModal, nascimento: maskNascimento(e.target.value) })}
                         placeholder="dd/mm/aaaa"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Telefone (6299999-9999)</label>
                       <input
                         type="tel"
                         inputMode="numeric"
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                         value={showUserModal.telefone || ''}
                         onChange={e => setShowUserModal({ ...showUserModal, telefone: formatTelefone(e.target.value) })}
                         placeholder="6299999-9999"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">E-mail</label>
                       <input
                         type="email"
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                         value={showUserModal.email || ''}
                         onChange={e => setShowUserModal({ ...showUserModal, email: (e.target.value || '').toLowerCase() })}
                         placeholder="exemplo@gmail.com"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Almanaque (Posição)</label>
                       <input
                         type="number"
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                         value={showUserModal.almanaquePosition}
                         onChange={e => setShowUserModal({ ...showUserModal, almanaquePosition: parseInt(e.target.value) })}
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Perfil</label>
                       <select
                         className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                         value={showUserModal.role}
                         onChange={e => setShowUserModal({ ...showUserModal, role: e.target.value as UserRole })}
                       >
                         <option value={UserRole.OFFICER}>USUÁRIO</option>
                         <option value={UserRole.ADM}>ADMINISTRADOR</option>
                       </select>
                     </div>
                   </div>

                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Pelotão/Equipe</label>
                     <select
                       className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                       value={showUserModal.pelotao}
                       onChange={e => setShowUserModal({ ...showUserModal, pelotao: e.target.value as Pelotao })}
                     >
                       <option value="ALPHA">ALPHA</option>
                       <option value="BRAVO">BRAVO</option>
                       <option value="CHARLIE">CHARLIE</option>
                       <option value="DELTA">DELTA</option>
                     </select>
                   </div>
                   <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase mt-4 shadow-lg">Salvar Cadastro</button>
                </div>
             </form>
          </div>
        )}
      </div>
    );
  };

  
  const RankingModule: React.FC = () => {
    const [rankTeam, setRankTeam] = useState<Pelotao | 'GERAL'>('GERAL');
    const [rankSearch, setRankSearch] = useState('');
    const [rankStart, setRankStart] = useState('');
    const [rankEnd, setRankEnd] = useState('');
    const [rankNature, setRankNature] = useState<string>('TODAS');

    const approvedRais = rais.filter(r => r.status === 'APPROVED');

    const withinPeriod = (d: string) => {
      if (!d) return true;
      const dt = new Date(d);
      if (rankStart) {
        const s = new Date(rankStart + 'T00:00:00');
        if (dt < s) return false;
      }
      if (rankEnd) {
        const e = new Date(rankEnd + 'T23:59:59');
        if (dt > e) return false;
      }
      return true;
    };

    const rows = users
      .filter(u => u.role === UserRole.OFFICER)
      .filter(u => (rankTeam === 'GERAL' ? true : u.pelotao === rankTeam))
      .map(u => {
        const userRais = approvedRais
          .filter(r => r.userId === u.id)
          .filter(r => withinPeriod(r.dataRAI || r.createdAt))
          .filter(r => (rankNature === 'TODAS' ? true : r.naturezaId === rankNature));
        const total = userRais.reduce((s, r) => s + (r.pontos || 0), 0);
        return { user: u, total, totalRais: userRais.length };
      })
      .filter(row => {
        const term = (rankSearch || '').trim().toLowerCase();
        if (!term) return true;
        const g = (normalizeGraduacao(row.user.graduacao) || '').toLowerCase();
        return (
          (row.user.nomeGuerra || '').toLowerCase().includes(term) ||
          (row.user.matricula || '').toLowerCase().includes(term) ||
          g.includes(term)
        );
      })
      .sort((a, b) => b.total - a.total);

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase">Ranking Resultados</h2>
            <p className="text-sm text-gray-400 font-bold">Ranking por pontuação de RAI(s) aprovados.</p>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          {/* Busca acima do menu */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input value={rankSearch} onChange={e => setRankSearch(e.target.value)} placeholder="Graduação, nome ou matrícula..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" />
          </div>

          

          {/* Filtros por período / natureza (sem títulos) */}
          <div className="flex gap-2 flex-wrap items-center">
            <input type="date" value={rankStart} onChange={e => setRankStart(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
            <input type="date" value={rankEnd} onChange={e => setRankEnd(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
            <select value={rankNature} onChange={e => setRankNature(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold">
              <option value="TODAS">Todas</option>
              {(natures || []).filter(n => n.active).slice().sort((a,b)=>b.points-a.points).map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.points})</option>
              ))}
            </select>
          </div>

          {/* Menu Geral/Equipes abaixo do filtro por período */}
          <div className="flex gap-2 flex-wrap items-center">
            <button type="button" onClick={() => setRankTeam('GERAL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${rankTeam === 'GERAL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>Geral</button>
            {(['ALPHA','BRAVO','CHARLIE','DELTA'] as Pelotao[]).map(t => (
              <button key={t} type="button" onClick={() => setRankTeam(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${rankTeam === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                <tr>
                  <th className="px-8 py-5">Posição</th>
                  <th className="px-8 py-5">Policial</th>
                  <th className="px-8 py-5">Matrícula</th>
                  <th className="px-8 py-5 text-center">Equipe</th>
                  <th className="px-8 py-5 text-center">Total RAIs</th>
                  <th className="px-8 py-5 text-right">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, idx) => (
                  <tr key={row.user.id} className="hover:bg-gray-50/30 text-sm">
                    <td className="px-8 py-5"><span className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black">{idx + 1}</span></td>
                    <td className="px-8 py-5 font-black uppercase">{normalizeGraduacao(row.user.graduacao)} {row.user.nomeGuerra}</td>
                    <td className="px-8 py-5 font-bold text-gray-500">{row.user.matricula}</td>
                    <td className="px-8 py-5 text-center"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black">{row.user.pelotao}</span></td>
                    <td className="px-8 py-5 text-center font-bold text-gray-500">{row.totalRais}</td>
                    <td className="px-8 py-5 text-right font-black text-blue-700">{row.total}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-10 text-center text-xs font-bold text-gray-400">Nenhum resultado para os filtros selecionados.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  const AlmanaqueModule: React.FC = () => {
    const [almScope, setAlmScope] = useState<Pelotao | 'GERAL'>('GERAL');
    const [almSearch, setAlmSearch] = useState('');
    const [almEdit, setAlmEdit] = useState<null | {
      userId: string;
      almanaquePosition: number;
      almanaqueTeamPosition: number;
      pelotao: Pelotao;
    }>(null);

    const officers = users.filter(u => u.role === UserRole.OFFICER);

    const calcTeamPos = (u: User) => {
      const teamUsers = officers.filter(x => x.pelotao === u.pelotao).slice().sort(sortByAlmanaque);
      const idx = teamUsers.findIndex(x => x.id === u.id);
      return idx >= 0 ? idx + 1 : 0;
    };

    const rows = officers
      .filter(u => (almScope === 'GERAL' ? true : u.pelotao === almScope))
      .filter(u => {
        const term = (almSearch || '').trim().toLowerCase();
        if (!term) return true;
        const g = (normalizeGraduacao(u.graduacao) || '').toLowerCase();
        return (
          (u.nomeGuerra || '').toLowerCase().includes(term) ||
          (u.matricula || '').toLowerCase().includes(term) ||
          g.includes(term)
        );
      })
      .slice()
      .sort(sortByAlmanaque)
      .map((u, idx) => {
        const posGeral = officers.slice().sort(sortByAlmanaque).findIndex(x => x.id === u.id) + 1;
        const posEquipe = u.almanaqueTeamPosition || calcTeamPos(u);
        return { u, posGeral, posEquipe };
      });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase">Almanaque</h2>
            <p className="text-sm text-gray-400 font-bold">Gerencie posições por graduação (hierarquia) e antiguidade.</p>
          </div>
          
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Graduação, nome ou matrícula..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={almSearch}
                onChange={e => setAlmSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const first = officers.slice().sort(sortByAlmanaque)[0];
                if (!first) return alert('Nenhum policial cadastrado.');
                setAlmEdit({
                  userId: first.id,
                  almanaquePosition: Number(first.almanaquePosition || 1),
                  almanaqueTeamPosition: Number(first.almanaqueTeamPosition || calcTeamPos(first) || 1),
                  pelotao: first.pelotao
                });
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black uppercase flex items-center justify-center hover:bg-gray-100 transition-all"
              title="Cadastrar no almanaque"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {(['GERAL','ALPHA','BRAVO','CHARLIE','DELTA'] as const).map(t => (
              <button key={t} type="button" onClick={() => setAlmScope(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${almScope === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{t === 'GERAL' ? 'Geral' : t}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                <tr>
                  <th className="px-8 py-5">Posição Geral</th>
                  <th className="px-8 py-5">Posição Equipe</th>
                  <th className="px-8 py-5">Atualização</th>
                  <th className="px-8 py-5">Policial</th>
                  <th className="px-8 py-5">Matrícula</th>
                  <th className="px-8 py-5">Equipe</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(({ u, posGeral, posEquipe }) => (
                  <tr key={u.id} className="hover:bg-gray-50/30 text-sm">
                    <td className="px-8 py-5 font-black text-blue-700">{posGeral}</td>
                    <td className="px-8 py-5 font-black text-gray-700">{posEquipe}</td>
                    <td className="px-8 py-5 font-bold text-gray-500">{u.almanaqueUpdatedAt ? formatDateTime(u.almanaqueUpdatedAt) : '-'}</td>
                    <td className="px-8 py-5 font-black uppercase">{normalizeGraduacao(u.graduacao)} {u.nomeGuerra}</td>
                    <td className="px-8 py-5 font-bold text-gray-500">{u.matricula}</td>
                    <td className="px-8 py-5"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black">{u.pelotao}</span></td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setAlmEdit({ userId: u.id, almanaquePosition: Number(u.almanaquePosition || 1), almanaqueTeamPosition: Number(u.almanaqueTeamPosition || posEquipe || 1), pelotao: u.pelotao })} className="p-2 text-blue-600 bg-blue-50 rounded-xl"><Pencil size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-8 py-10 text-center text-xs font-bold text-gray-400">Nenhum policial encontrado.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {almEdit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-sm">Editar Almanaque</h3>
                <button type="button" onClick={() => setAlmEdit(null)}><X size={20} /></button>
              </div>
              <div className="p-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Policial</label>
                  <select
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100"
                    value={almEdit.userId}
                    onChange={e => {
                      const uid = e.target.value;
                      const uu = officers.find(x => x.id === uid);
                      if (!uu) return;
                      setAlmEdit({
                        userId: uid,
                        almanaquePosition: Number(uu.almanaquePosition || 1),
                        almanaqueTeamPosition: Number(uu.almanaqueTeamPosition || calcTeamPos(uu) || 1),
                        pelotao: uu.pelotao
                      });
                    }}
                  >
                    {officers.slice().sort(sortByAlmanaque).map(u => (
                      <option key={u.id} value={u.id}>{normalizeGraduacao(u.graduacao)} {u.nomeGuerra} - {u.matricula} ({u.pelotao})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Posição Geral</label>
                    <input type="number" className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100" value={almEdit.almanaquePosition} onChange={e => setAlmEdit({ ...almEdit, almanaquePosition: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Posição Equipe</label>
                    <input type="number" className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100" value={almEdit.almanaqueTeamPosition} onChange={e => setAlmEdit({ ...almEdit, almanaqueTeamPosition: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Equipe</label>
                    <select className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100" value={almEdit.pelotao} onChange={e => setAlmEdit({ ...almEdit, pelotao: e.target.value as Pelotao })}>
                      <option value="ALPHA">ALPHA</option><option value="BRAVO">BRAVO</option><option value="CHARLIE">CHARLIE</option><option value="DELTA">DELTA</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const uu = officers.find(x => x.id === almEdit.userId);
                    if (!uu) return;
                    const now = new Date().toISOString();
                    setUsers(prev => prev.map(x => x.id === uu.id ? { ...x, pelotao: almEdit.pelotao, almanaquePosition: almEdit.almanaquePosition, almanaqueTeamPosition: almEdit.almanaqueTeamPosition, almanaqueUpdatedAt: now } : x));
                    addLog('ALMANAQUE_UPDATE', `Atualizou almanaque de ${uu.nomeGuerra} (${uu.matricula}) | Geral: ${almEdit.almanaquePosition} | Equipe: ${almEdit.almanaqueTeamPosition} | Pelotão: ${almEdit.pelotao}`);
                    setAlmEdit(null);
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase mt-2 shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

return (
    <Routes>
      <Route path="dash" element={
        <div className="space-y-8 animate-in fade-in">
           <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Painel Geral ADM</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">RAIs Pendentes</p><h3 className="text-4xl font-black text-amber-600">{rais.filter(r => r.status === 'PENDING').length}</h3></div>
              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Dispensas (Mês)</p><h3 className="text-4xl font-black text-blue-600">{dispenses.filter(d => !d.blockedDay && d.status !== 'CANCELLED').length}</h3></div>
	           </div>
	        </div>
	      } />
      <Route path="dispenses" element={renderDispensesModule()} />
      <Route path="calendar" element={
        <div className="flex flex-col gap-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Escala & Calendário</h2>
            {/* Botão somente com ícone (sem texto) */}
            <button onClick={() => setIsCalendarExpanded(!isCalendarExpanded)} className="p-2 bg-white border rounded-xl">{isCalendarExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
          </div>

          {/* Barra horizontal: MÊS | ALPHA | BRAVO | CHARLIE | DELTA */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1))} className="p-2 border rounded-xl"><ChevronLeft/></button>
              <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase">
                {currentMonth.toLocaleDateString('pt-BR', {month:'long', year:'numeric'})}
              </div>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1))} className="p-2 border rounded-xl"><ChevronRight/></button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['ALPHA','BRAVO','CHARLIE','DELTA'] as Pelotao[]).map(t => (
                <button key={t} onClick={() => setCalendarTeam(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase border ${calendarTeam === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200'}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Barra de ações (horizontal) */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={() => setCalendarAction('BLOCK')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase border ${calendarAction === 'BLOCK' ? 'bg-white border-slate-900 text-slate-900' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>Bloquear Dia</button>
              <button type="button" onClick={() => setCalendarAction('MARK')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase border ${calendarAction === 'MARK' ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>Marcar Dispensa</button>
              <button type="button" onClick={() => setCalendarAction('CANCEL')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase border ${calendarAction === 'CANCEL' ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>Cancelar Dispensa</button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedDay) return alert('Selecione um dia.');
                  if (calendarAction === 'BLOCK') return toggleDayBlock(selectedDay);
                  if (calendarAction === 'CANCEL') return cancelDispensesForDay(selectedDay);
                  // MARK
                  const firstUser = users.filter(u => u.role === UserRole.OFFICER && u.pelotao === calendarTeam).slice().sort(sortByAlmanaque)[0];
                  setShowMarkModal({ dateStr: selectedDay, userId: firstUser?.id || '', type: 'PROD', creditDebit: 'CREDITO', observacoes: '' });
                }}
                className="px-6 py-3 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white"
              >REGISTRAR</button>
            </div>
            <div className="text-[10px] font-bold text-gray-400">
              {selectedDay ? `Dia selecionado: ${selectedDay}` : 'Selecione um dia no calendário'}
            </div>
          </div>

          {/* Calendário */}
            <div className={`bg-white rounded-[40px] shadow-2xl border border-gray-200 overflow-hidden ${isCalendarExpanded ? '' : ''}`}>
            <div className="grid grid-cols-7 bg-gray-50 border-b">{['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => <div key={d} className="py-4 text-center text-xs font-black text-gray-400 uppercase">{d}</div>)}</div>
            <div className="grid grid-cols-7">
              {daysInMonth.map((date, idx) => {
                if (!date) return <div key={idx} className="aspect-square bg-gray-50/10 border-r border-b"></div>;
                const dStr = formatDate(date);
                const isSelected = selectedDay === dStr;

                const dayDisp = dispenses.filter(d => d.dataDispensa === dStr && d.status !== 'CANCELLED');
                const isBlocked = dayDisp.some(d => d.blockedDay);
                const onDutyTeam = getShiftForDate(dStr);
                const isEquipeOff = onDutyTeam !== calendarTeam;
                const taken = dayDisp.filter(d => !d.blockedDay);
                const vagasRestantes = Math.max(0, maxVagas - taken.length);

                let statusLabel = '';
                if (isBlocked) statusLabel = 'NÃO DISPONÍVEL';
                else if (isEquipeOff) statusLabel = 'FOLGA';
                else if (vagasRestantes <= 0) statusLabel = 'INDISPONÍVEL';
                else statusLabel = `VAGAS: ${vagasRestantes}`;

                let bgColor = 'bg-white';
                if (isBlocked) bgColor = 'bg-gray-100 opacity-80';
                else if (isEquipeOff) bgColor = 'bg-[#FFEB3B]';
                else if (vagasRestantes <= 0) bgColor = 'bg-red-500 text-white';
                else bgColor = 'bg-[#C6FF00]';

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(dStr)}
                    className={`min-h-[120px] aspect-square w-full border-r border-b p-2 flex flex-col relative ${bgColor} ${isSelected ? 'ring-4 ring-blue-500 ring-inset z-10' : ''}`}
                  >
                    <span className="text-sm font-semibold absolute top-1 left-2">{date.getDate()}</span>
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
                      <p className="text-[11px] uppercase leading-tight font-black">{statusLabel}</p>
                      <div className="mt-1 space-y-0.5">
                        {taken.map(d => (
                          <p key={d.id} className="text-[9px] uppercase truncate max-w-[110px] font-semibold">{d.userName}</p>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

          {/* Pop-up Marcar Dispensa */}
          {showMarkModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <h3 className="font-black uppercase tracking-widest text-sm">Marcar Dispensa - {showMarkModal.dateStr}</h3>
                  <button type="button" onClick={() => setShowMarkModal(null)}><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Equipe</label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black">{calendarTeam}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tipo de Dispensa</label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={showMarkModal.type} onChange={e => setShowMarkModal({ ...showMarkModal, type: e.target.value as any, creditDebit: e.target.value === 'CPC' ? 'CREDITO' : showMarkModal.creditDebit })}>
                        <option value="PROD">PROD. (Produtividade)</option>
                        <option value="CPC">CPC (Comando Geral)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Policial (filtrado por equipe)</label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" value={showMarkModal.userId} onChange={e => setShowMarkModal({ ...showMarkModal, userId: e.target.value })}>
                        <option value="">Selecionar...</option>
                        {users.filter(u => u.role === UserRole.OFFICER && u.pelotao === calendarTeam).slice().sort(sortByAlmanaque).map(u => (
                          <option key={u.id} value={u.id}>{normalizeGraduacao(u.graduacao)} {u.nomeGuerra} | {u.matricula}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Crédito / Débito</label>
                      <div className="flex gap-2">
                        <button type="button" disabled={showMarkModal.type === 'CPC'} onClick={() => setShowMarkModal({ ...showMarkModal, creditDebit: 'CREDITO' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border ${showMarkModal.creditDebit === 'CREDITO' ? 'bg-white border-slate-900 text-slate-900' : 'bg-gray-50 border-gray-100 text-gray-400'} ${showMarkModal.type === 'CPC' ? 'opacity-50 cursor-not-allowed' : ''}`}>Crédito</button>
                        <button type="button" disabled={showMarkModal.type === 'CPC'} onClick={() => setShowMarkModal({ ...showMarkModal, creditDebit: 'DEBITO' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border ${showMarkModal.creditDebit === 'DEBITO' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'} ${showMarkModal.type === 'CPC' ? 'opacity-50 cursor-not-allowed' : ''}`}>Débito</button>
                      </div>
                      {showMarkModal.type === 'CPC' ? (
                        <p className="mt-2 text-[10px] text-gray-400 font-bold">CPC é gratuita (Crédito obrigatório).</p>
                      ) : (
                        <ul className="mt-2 text-[10px] text-gray-400 font-bold list-disc ml-4 space-y-1">
                          <li>Crédito não desconta pontos.</li>
                          <li>Débito consome pontos.</li>
                        </ul>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Observações</label>
                      <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" value={showMarkModal.observacoes} onChange={e => setShowMarkModal({ ...showMarkModal, observacoes: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowMarkModal(null)} className="flex-1 py-4 rounded-2xl border text-[10px] font-black uppercase">Cancelar</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showMarkModal.userId) return alert('Selecione o policial.');
                        adminCreateDispense({
                          dateStr: showMarkModal.dateStr,
                          userId: showMarkModal.userId,
                          type: showMarkModal.type,
                          creditDebit: showMarkModal.creditDebit,
                          observacoes: showMarkModal.observacoes
                        });
                        setShowMarkModal(null);
                      }}
                      className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg"
                    >Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      } />
      <Route path="audit" element={
        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm animate-in fade-in">
           <div className="p-8 border-b bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
             <span className="font-black text-sm uppercase">Auditoria de Produtividade</span>
             <div className="flex gap-2">
               <button onClick={() => setAuditTab("PENDENTES")} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${auditTab === "PENDENTES" ? 'bg-slate-900 text-white' : 'bg-white text-gray-500'}`}>Pendentes</button>
               <button onClick={() => setAuditTab("APROVADOS")} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${auditTab === "APROVADOS" ? 'bg-slate-900 text-white' : 'bg-white text-gray-500'}`}>Aprovados</button>
               <button onClick={() => setAuditTab("REJEITADOS")} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${auditTab === "REJEITADOS" ? 'bg-slate-900 text-white' : 'bg-white text-gray-500'}`}>Rejeitados</button>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                  <tr>
                    <th className="px-8 py-5">Envio</th>
                    <th className="px-8 py-5">Data RAI</th>
                    <th className="px-8 py-5">Nº RAI</th>
                    <th className="px-8 py-5">Natureza</th>
                    <th className="px-8 py-5 text-center">Pontos</th>
                    <th className="px-8 py-5">Policial</th>
                    <th className="px-8 py-5">Matrícula</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {props.rais.filter(r => {
                     if (auditTab === 'PENDENTES') return r.status === 'PENDING';
                     if (auditTab === 'APROVADOS') return r.status === 'APPROVED';
                     return r.status === 'REJECTED';
                   }).map(r => {
                     const pol = props.users.find(u => u.id === r.userId);
                     return (
                       <tr key={r.id} className="text-sm">
                          <td className="px-8 py-6 font-bold text-gray-500">{formatDateTime(r.createdAt)}</td>
                          <td className="px-8 py-6 font-bold text-gray-500">{isoToBr(r.dataRAI)}</td>
                          <td className="px-8 py-6 font-mono font-bold text-blue-600">{r.numeroRAI}</td>
                          <td className="px-8 py-6 font-bold">{r.naturezaNome}</td>
                          <td className="px-8 py-6 text-center font-black text-blue-700">+{r.pontos}</td>
                          <td className="px-8 py-6 font-black uppercase">
                            {pol ? `${pol.graduacao} ${pol.nomeGuerra}` : '---'}
                          </td>
                          <td className="px-8 py-6 font-bold text-gray-500">{pol?.matricula || '---'}</td>
                          <td className="px-8 py-6 text-right">
                             {auditTab === 'PENDENTES' ? (
                               <div className="flex justify-end gap-2">
                                 <button onClick={() => updateRAIStatus(r, 'APPROVED')} className="p-2 bg-green-50 text-green-600 rounded-lg"><Check size={18}/></button>
                                 <button onClick={() => updateRAIStatus(r, 'REJECTED')} className="p-2 bg-red-50 text-red-600 rounded-lg"><X size={18}/></button>
                               </div>
                             ) : <span className="font-black uppercase text-gray-400">{raiStatusLabel(r.status)}</span>}
                          </td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
           </div>
        </div>
      } />
      <Route path="natures" element={
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase">Registrar Natureza</h2>
              <p className="text-sm text-gray-400 font-bold">Cadastre/edite naturezas e pontuação do RAI.</p>
            </div>
          </div>


          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar natureza..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                  value={natureSearch}
                  onChange={e => setNatureSearch(e.target.value)}
                />
              </div>

              {/* Botão + ao lado (em telas pequenas ele quebra para baixo naturalmente) */}
              <button
                type="button"
                onClick={() => setNatureModal({ id: '', name: '', points: 0, active: true })}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center shadow-lg hover:bg-slate-800 transition-all"
                title="Nova Natureza"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Ordenação agora fica nos cabeçalhos da tabela (ícones de setas em cada campo). */}
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
                  <tr>
                    <th className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        Natureza
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-200"
                          title="Ordenar por Natureza"
                          onClick={() => {
                            if (natureSortField === 'name') setNatureSortDir(natureSortDir === 'ASC' ? 'DESC' : 'ASC');
                            else { setNatureSortField('name'); setNatureSortDir('ASC'); }
                          }}
                        >
                          {natureSortField === 'name' && natureSortDir === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </button>
                      </div>
                    </th>
                    <th className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        Pontos
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-200"
                          title="Ordenar por Pontos"
                          onClick={() => {
                            if (natureSortField === 'points') setNatureSortDir(natureSortDir === 'ASC' ? 'DESC' : 'ASC');
                            else { setNatureSortField('points'); setNatureSortDir('DESC'); }
                          }}
                        >
                          {natureSortField === 'points' && natureSortDir === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </button>
                      </div>
                    </th>
                    <th className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        Status
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-200"
                          title="Ordenar por Status"
                          onClick={() => {
                            if (natureSortField === 'active') setNatureSortDir(natureSortDir === 'ASC' ? 'DESC' : 'ASC');
                            else { setNatureSortField('active'); setNatureSortDir('DESC'); }
                          }}
                        >
                          {natureSortField === 'active' && natureSortDir === 'ASC' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </button>
                      </div>
                    </th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredNatures.map(n => (
                    <tr key={n.id} className="hover:bg-gray-50/30">
                      <td className="px-8 py-6 font-black text-sm">{n.name}</td>
                      <td className="px-8 py-6 text-center font-black text-blue-700">{n.points}</td>
                      <td className="px-8 py-6 text-center font-black">
                        {n.active ? <span className="text-green-600">ATIVA</span> : <span className="text-gray-400">INATIVA</span>}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => setNatureModal(n)} className="p-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><Pencil size={18} /></button>
                        <button onClick={() => {
                          if (!window.confirm("Excluir esta natureza?")) return;
                          setNatures(prev => prev.filter(x => x.id !== n.id));
                          addLog("DELETE_NATURE", `Excluiu natureza ${n.name} (${n.points} pts)`);
                        }} className="p-3 bg-red-50 text-red-700 rounded-2xl hover:bg-red-700 hover:text-white transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {(!natures || natures.length === 0) && (
                    <tr><td colSpan={4} className="px-8 py-10 text-center text-xs text-gray-400 font-bold">Nenhuma natureza cadastrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {natureModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in">
                <h3 className="text-sm font-black uppercase mb-6">{natureModal.id ? 'Editar Natureza' : 'Nova Natureza'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Nome</label>
        <input value={showUserModal.name || ''} onChange={e => setShowUserModal({ ...showUserModal, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" placeholder="Ex.: Nome Completo" />                </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Pontos</label>
                      <input type="number" value={natureModal.points} onChange={e => setNatureModal({ ...natureModal, points: Number(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Status</label>
                      <select value={natureModal.active ? 'ATIVA' : 'INATIVA'} onChange={e => setNatureModal({ ...natureModal, active: e.target.value === 'ATIVA' })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black">
                        <option value="ATIVA">Ativa</option>
                        <option value="INATIVA">Inativa</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => setNatureModal(null)} className="flex-1 py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 text-[10px] font-black uppercase">Cancelar</button>
                  <button onClick={() => {
                    // Mantém padrão (não força CAIXA ALTA) e normaliza para Title Case
                    const name = toTitleCase((natureModal.name || '').trim());
                    if (!name) return alert('Informe o nome da natureza.');
                    if (!Number.isFinite(natureModal.points)) return alert('Informe os pontos.');
                    if (natureModal.id) {
                      setNatures(prev => prev.map(n => n.id === natureModal.id ? { ...n, name, points: Number(natureModal.points), active: !!natureModal.active } : n));
                    } else {
                      const newId = 'NAT-' + Math.random().toString(36).slice(2, 9).toUpperCase();
                      setNatures(prev => [...prev, { id: newId, name, points: Number(natureModal.points), active: !!natureModal.active }]);
                    }
                    setNatureModal(null);
                  }} className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase shadow-lg hover:bg-slate-800 transition-all">Salvar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      } />

      <Route path="users" element={renderUsersModule()} />
      <Route path="ranking" element={<RankingModule />} />
      <Route path="almanaque" element={<AlmanaqueModule />} />
      <Route path="releases" element={
        <AdminReleases 
          users={users} 
          natures={natures} 
          rais={rais}
          expirationReleases={expirationReleases} 
          setExpirationReleases={setExpirationReleases}
          holidayReleases={holidayReleases}
          setHolidayReleases={setHolidayReleases}
          birthdayReleases={birthdayReleases}
          setBirthdayReleases={setBirthdayReleases}
          addLog={addLog}
        />
      } />
      <Route path="config" element={
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8 animate-in fade-in">
           <h3 className="text-xl font-black uppercase flex items-center gap-3"><Settings className="text-blue-600" size={24}/> Configurações de Sistema</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-3">Vagas por Dia</label><input type="number" className="w-full px-5 py-4 bg-gray-50 rounded-2xl border" value={config.maxDispensesPerDay} onChange={e => setConfig({...config, maxDispensesPerDay: parseInt(e.target.value) || 1})} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-3">Validade Pontos (Dias)</label><input type="number" className="w-full px-5 py-4 bg-gray-50 rounded-2xl border" value={config.validityDays} onChange={e => setConfig({...config, validityDays: parseInt(e.target.value) || 1})} /></div>
           </div>
           <button onClick={() => alert('Configurações salvas.')} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase shadow-lg">Salvar Alterações</button>
        </div>
      } />
      <Route path="logs" element={
        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
           <div className="p-8 border-b bg-gray-50 font-black text-sm uppercase">Logs de Auditoria</div>
           <div className="overflow-x-auto max-h-[600px]">
             <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0"><tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Horário</th><th className="px-8 py-5">Ação</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                   {logs.map(log => (<tr key={log.id} className="text-[11px]"><td className="px-8 py-4 font-mono text-gray-400">{new Date(log.timestamp).toLocaleString()}</td><td className="px-8 py-4"><span className="font-black text-blue-600 uppercase">{log.action}</span> - {log.details}</td></tr>))}
                </tbody>
             </table>
           </div>
        </div>
      } />
      <Route path="*" element={<Navigate to="dash" />} />
    </Routes>
  );
};

export default AdminPanel;
