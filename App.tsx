
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  FileCheck, 
  Settings, 
  LogOut, 
  Bell,
  Menu,
  ShieldCheck,
  History,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  BarChart3,
  Search,
  Lock,
  ListFilter,
  GraduationCap,
  CalendarDays,
  Check,
  X,
  Trash2
} from 'lucide-react';

import { User, UserRole, RAI, DispenseRequest, Pelotao, OccurrenceNature, SystemLog, SystemConfig, Notification } from './types';
import { DEFAULT_NATURES } from './constants';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RAIForm from './pages/RAIForm';
import CalendarView from './pages/CalendarView';
import AdminPanel from './pages/AdminPanel';
import HistoryPage from './pages/HistoryPage';
import AdminReleases from './pages/AdminReleases';
import { generateTestData } from './generateTestData';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rais, setRais] = useState<RAI[]>([]);
  const [dispenses, setDispenses] = useState<DispenseRequest[]>([]);
  const [natures, setNatures] = useState<OccurrenceNature[]>(DEFAULT_NATURES.map(n => ({...n, active: true})));
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expirationReleases, setExpirationReleases] = useState<ExpirationRelease[]>([]);
  const [holidayReleases, setHolidayReleases] = useState<HolidayRelease[]>([]);
  const [birthdayReleases, setBirthdayReleases] = useState<BirthdayRelease[]>([]);
  const [config, setConfig] = useState<SystemConfig>({
    maxDispensesPerDay: 2,
    validityDays: 90,
    allowExtraPoints: 20,
    fifoEnabled: true,
    maxAdvanceDays: 60,
    minIntervalDays: 30,
    cpcEnabled: false,
    cpcPriorityCriteria: 'ALMANAQUE',
    cpcPeriodStart: '2026-01',
    cpcPeriodEnd: '2026-12',
    cpcTeamsEnabled: ['ALPHA','BRAVO','CHARLIE','DELTA']
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [isAdminExpanded, setIsAdminExpanded] = useState(() => {
    const saved = localStorage.getItem('admin_expanded');
    return saved === null ? true : saved === 'true'; 
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('rai_user');
    const savedUsers = localStorage.getItem('rai_all_users');
    const savedRais = localStorage.getItem('rai_data');
    const savedDispenses = localStorage.getItem('rai_dispenses');
    const savedNatures = localStorage.getItem('rai_natures');
    const savedLogs = localStorage.getItem('rai_logs');
    const savedConfig = localStorage.getItem('rai_config');
    const savedNotifications = localStorage.getItem('rai_notifications');
    const savedExpirationReleases = localStorage.getItem('rai_expiration_releases');
    const savedHolidayReleases = localStorage.getItem('rai_holiday_releases');
    const savedBirthdayReleases = localStorage.getItem('rai_birthday_releases');

    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedExpirationReleases) setExpirationReleases(JSON.parse(savedExpirationReleases));
    if (savedHolidayReleases) setHolidayReleases(JSON.parse(savedHolidayReleases));
    if (savedBirthdayReleases) setBirthdayReleases(JSON.parse(savedBirthdayReleases));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedRais) setRais(JSON.parse(savedRais));
    if (savedDispenses) setDispenses(JSON.parse(savedDispenses));
    if (savedNatures) setNatures(JSON.parse(savedNatures));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    // Inject test data if none exists
    if (!savedUsers || JSON.parse(savedUsers).length <= 1) {
      const { users: testUsers, rais: testRais } = generateTestData();
      setUsers(prev => [...prev, ...testUsers]);
      setRais(prev => [...prev, ...testRais]);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rai_user', JSON.stringify(currentUser));
      setUsers(prev => prev.find(u => u.id === currentUser.id) ? prev : [...prev, { ...currentUser, almanaquePosition: prev.length + 1 }]);
    }
  }, [currentUser]);

  useEffect(() => { localStorage.setItem('rai_all_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('rai_data', JSON.stringify(rais)); }, [rais]);
  useEffect(() => { localStorage.setItem('rai_dispenses', JSON.stringify(dispenses)); }, [dispenses]);
  useEffect(() => { localStorage.setItem('rai_natures', JSON.stringify(natures)); }, [natures]);
  useEffect(() => { localStorage.setItem('rai_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('rai_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('rai_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('rai_expiration_releases', JSON.stringify(expirationReleases)); }, [expirationReleases]);
  useEffect(() => { localStorage.setItem('rai_holiday_releases', JSON.stringify(holidayReleases)); }, [holidayReleases]);
  useEffect(() => { localStorage.setItem('rai_birthday_releases', JSON.stringify(birthdayReleases)); }, [birthdayReleases]);

  // Click outside listener for notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  const toggleAdminAccordion = () => {
    const newState = !isAdminExpanded;
    setIsAdminExpanded(newState);
    localStorage.setItem('admin_expanded', String(newState));
  };

  const addLog = (action: string, details: string, type: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') => {
    if (!currentUser) return;
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.nomeGuerra,
      action,
      details,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 1000));
  };

  const addNotification = (userId: string, title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      type: type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.filter(n => n.userId !== currentUser.id));
  };

  const handleLogout = () => {
    addLog('LOGOUT', 'Usuário saiu do sistema');
    setCurrentUser(null);
    localStorage.removeItem('rai_user');
  };

  const userBalance = useMemo(() => {
    if (!currentUser) return 0;
    return rais.filter(r => r.userId === currentUser.id && (r.status === 'APPROVED' || r.status === 'PENDING') && !r.usedForDispensaId)
               .reduce((sum, r) => sum + r.pontos, 0);
  }, [rais, currentUser]);

  const myNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => n.userId === currentUser.id);
  }, [notifications, currentUser]);

  const unreadCount = myNotifications.filter(n => !n.read).length;

  const NavItem = ({ to, icon: Icon, label, indent = false }: { to: string, icon: any, label: string, indent?: boolean }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        title={isCollapsed ? label : undefined}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative group ${indent ? 'ml-4' : ''} ${
          isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="shrink-0"><Icon size={indent ? 16 : 20} /></div>
        {!isCollapsed && <span className={`font-semibold ${indent ? 'text-sm' : 'text-base'} whitespace-nowrap`}>{label}</span>}
        {isCollapsed && (
          <div className="fixed left-20 ml-2 px-3 py-2 bg-gray-900 text-white text-xs font-semibold uppercase rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap tracking-widest">
            {label}
          </div>
        )}
      </Link>
    );
  };

  if (!currentUser) return <LoginPage onLogin={setCurrentUser} />;

  const isAdmin = currentUser.role === UserRole.ADM || currentUser.role === UserRole.TI;

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-gray-50/50">
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`fixed lg:static inset-y-0 left-0 bg-white border-r border-gray-100 z-30 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-24' : 'w-80'}`}>
          <div className="flex flex-col h-full p-4 lg:p-6">
            <div className={`flex items-center justify-between mb-10 px-2 overflow-hidden ${isCollapsed ? 'flex-col gap-4' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shrink-0"><ShieldCheck size={28} /></div>
                {!isCollapsed && (
                  <div className="animate-in slide-in-from-left duration-300">
                    <h1 className="text-xl font-black text-gray-900 tracking-tighter">RAI ENVIOS</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">BPM Terminal</p>
                  </div>
                )}
              </div>
              
              {/* Botão X para fechar no mobile ou recolher no desktop */}
              <button 
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  } else {
                    toggleCollapse();
                  }
                }}
                className={`p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? '' : 'lg:ml-2'}`}
                title="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
              {!isAdmin ? (
                <>
                  <p className={`text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 px-4 ${isCollapsed ? 'hidden' : ''}`}>Operacional</p>
                  <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                  <NavItem to="/calendar" icon={CalendarIcon} label="Calendário" />
                  <NavItem to="/rais" icon={FileCheck} label="Registrar RAI" />
                  <NavItem to="/history" icon={History} label="Meu Histórico" />
                </>
              ) : (
                <div className="pt-2">
                  <p className={`text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 px-4 ${isCollapsed ? 'hidden' : ''}`}>Gestão Administrativa</p>
                  <button 
                    onClick={isCollapsed ? undefined : toggleAdminAccordion}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isAdminExpanded && !isCollapsed ? 'bg-gray-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Activity size={20} />
                      {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">Área de Gestão ADM</span>}
                    </div>
                    {!isCollapsed && (isAdminExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                  </button>
                  
                  {(isAdminExpanded || isCollapsed) && (
                    <div className={`space-y-1 mt-1 ${isCollapsed ? 'mt-2' : 'animate-in slide-in-from-top-2 duration-300'}`}>
                      <NavItem to="/admin/dash" icon={LayoutDashboard} label="Painel Geral" indent={!isCollapsed} />
                      <NavItem to="/admin/dispenses" icon={CalendarDays} label="Dispensas" indent={!isCollapsed} />
                      <NavItem to="/admin/calendar" icon={CalendarIcon} label="Escala & Calendário" indent={!isCollapsed} />
                      <NavItem to="/admin/audit" icon={ShieldCheck} label="Auditoria Produtividade" indent={!isCollapsed} />
                      <NavItem to="/admin/natures" icon={FileText} label="Registrar Natureza" indent={!isCollapsed} />
                      <NavItem to="/admin/releases" icon={Lock} label="Liberações" indent={!isCollapsed} />
                      <NavItem to="/admin/users" icon={Users} label="Gestão de Policiais" indent={!isCollapsed} />
                      <NavItem to="/admin/almanaque" icon={GraduationCap} label="Almanaque" indent={!isCollapsed} />
                      <NavItem to="/admin/ranking" icon={BarChart3} label="Ranking Resultados" indent={!isCollapsed} />
                      <NavItem to="/admin/config" icon={Settings} label="Configurações" indent={!isCollapsed} />
                      <NavItem to="/admin/logs" icon={History} label="Logs de Sistema" indent={!isCollapsed} />
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="mt-auto space-y-2 pt-4 border-t border-gray-50">
              <button onClick={toggleCollapse} className={`hidden lg:flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-blue-600 rounded-xl transition-all font-black text-xs uppercase ${isCollapsed ? 'justify-center' : ''}`}>
                {isCollapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /><span>Recolher Menu</span></>}
              </button>
              <button onClick={handleLogout} className={`flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-black text-xs uppercase ${isCollapsed ? 'justify-center' : ''}`}>
                <LogOut size={18} />{!isCollapsed && <span>Sair</span>}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 shrink-0 sticky top-0 z-20">
            <div className="flex items-center space-x-4">
              <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl hidden lg:block" onClick={toggleCollapse} title="Recolher/Expandir menu">
                {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest lg:block hidden">Terminal BPM - {isAdmin ? 'Gestão ADM' : 'Operacional'}</h2>
            </div>
            <div className="flex items-center space-x-6">
              {!isAdmin && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Atual</span>
                  <span className="text-xl font-black text-blue-600">{userBalance} <span className="text-xs">PTS</span></span>
                </div>
              )}
              
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors relative"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Notificações</h3>
                      <div className="flex gap-2">
                        <button onClick={markAllNotificationsAsRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-800" title="Marcar tudo como lido">
                          <Check size={14} />
                        </button>
                        <button onClick={clearNotifications} className="text-[10px] font-bold text-red-500 hover:text-red-700" title="Limpar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {myNotifications.length === 0 ? (
                         <div className="p-8 text-center">
                            <Bell size={24} className="mx-auto text-gray-200 mb-2"/>
                            <p className="text-xs text-gray-400 font-bold">Sem notificações.</p>
                         </div>
                      ) : (
                        myNotifications.slice(0, 20).map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                               <div className={`mt-0.5 p-1 rounded-full shrink-0 ${
                                 notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                 notif.type === 'error' ? 'bg-red-100 text-red-600' : 
                                 'bg-blue-100 text-blue-600'
                               }`}>
                                  {notif.type === 'success' ? <Check size={12} /> : notif.type === 'error' ? <X size={12} /> : <Bell size={12} />}
                               </div>
                               <div>
                                  <h4 className={`text-xs font-bold leading-tight ${!notif.read ? 'text-gray-900' : 'text-gray-500'}`}>{notif.title}</h4>
                                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                                  <p className="text-[9px] text-gray-300 mt-2 font-bold uppercase">{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                               </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 max-w-[1600px] mx-auto w-full">
            <Routes>
              <Route path="/" element={!isAdmin ? <Dashboard user={currentUser} rais={rais} dispenses={dispenses} userBalance={userBalance} config={config} holidayReleases={holidayReleases} birthdayReleases={birthdayReleases} /> : <Navigate to="/admin/dash" />} />
              
              {!isAdmin && (
                <>
                  <Route path="/calendar" element={<CalendarView user={currentUser} users={users} dispenses={dispenses} userBalance={userBalance} setDispenses={setDispenses} rais={rais} setRais={setRais} config={config} />} />
                  <Route path="/rais" element={<RAIForm user={currentUser} rais={rais} setRais={setRais} natures={natures} />} />
                  <Route path="/history" element={<HistoryPage user={currentUser} rais={rais} setRais={setRais} dispenses={dispenses} setDispenses={setDispenses} />} />
                </>
              )}
              
              {isAdmin && (
                <Route path="/admin/*" element={
                  <AdminPanel 
                    user={currentUser} users={users} setUsers={setUsers} rais={rais} setRais={setRais} 
                    dispenses={dispenses} setDispenses={setDispenses} natures={natures} setNatures={setNatures} 
                    logs={logs} config={config} setConfig={setConfig} addLog={addLog} 
                    addNotification={addNotification}
                    expirationReleases={expirationReleases} setExpirationReleases={setExpirationReleases}
                    holidayReleases={holidayReleases} setHolidayReleases={setHolidayReleases}
                    birthdayReleases={birthdayReleases} setBirthdayReleases={setBirthdayReleases}
                  />
                } />
              )}
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
