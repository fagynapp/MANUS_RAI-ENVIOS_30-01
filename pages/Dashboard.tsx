
import React from 'react';
import { User, RAI, DispenseRequest, SystemConfig, HolidayRelease, BirthdayRelease } from '../types';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Megaphone,
  Gift,
  Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  user: User;
  rais: RAI[];
  dispenses: DispenseRequest[];
  userBalance: number;
  config: SystemConfig;
  holidayReleases?: HolidayRelease[];
  birthdayReleases?: BirthdayRelease[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, rais, dispenses, userBalance, config, holidayReleases = [], birthdayReleases = [] }) => {
  const userRais = rais.filter(r => r.userId === user.id);
  const userDispenses = dispenses.filter(d => d.userId === user.id);
  
  const pendingRais = userRais.filter(r => r.status === 'PENDING').length;
  const approvedRais = userRais.filter(r => r.status === 'APPROVED').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHoliday = holidayReleases.find(h => h.data === todayStr);
  const isMyBirthday = birthdayReleases.find(b => b.matricula === user.matricula && b.dataAniversario.slice(5) === todayStr.slice(5));

  const upcomingDispense = userDispenses
    .filter(d => new Date(d.dataDispensa) >= new Date() && d.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.dataDispensa).getTime() - new Date(b.dataDispensa).getTime())[0];

  const chartData = userRais
    .slice(-7)
    .map(r => ({
      name: r.numeroRAI,
      pontos: r.pontos,
      status: r.status
    }));

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
        {subValue && <span className="text-sm font-medium text-gray-500">{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {config.cpcEnabled && (
        <div className="bg-red-600 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between animate-bounce-slow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><Megaphone size={24} /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">Comunicado Urgente</p>
              <h3 className="text-lg font-bold">Dispensa do CPC liberada. Aguarde sua vez conforme a prioridade.</h3>
            </div>
          </div>
          <button onClick={() => window.location.hash = '#/calendar'} className="px-6 py-2 bg-white text-red-600 rounded-xl text-xs font-black uppercase hover:bg-red-50 transition-colors">Ver Calendário</button>
        </div>
      )}

      {todayHoliday && (
        <div className="bg-amber-500 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><Star size={24} /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">Data Especial: {todayHoliday.motivo}</p>
              <h3 className="text-lg font-bold">Hoje a pontuação é diferenciada: {todayHoliday.pontos} pontos!</h3>
            </div>
          </div>
        </div>
      )}

      {isMyBirthday && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 rounded-3xl text-white shadow-xl flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-white/20 rounded-lg"><Gift size={20} /></div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Parabéns pelo seu dia! 🎂</h3>
            </div>
            <p className="text-pink-100 font-bold">Hoje você tem 50% de desconto em qualquer requerimento de dispensa!</p>
            <p className="text-[10px] text-white/60 mt-2 font-black uppercase tracking-widest">* Sujeito a disponibilidade de vagas no dia.</p>
          </div>
          <Gift size={120} className="absolute -right-6 -bottom-6 text-white opacity-20 rotate-12" />
        </div>
      )}

      <div className="flex items-center justify-between bg-blue-700 p-8 rounded-3xl text-white shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl lg:app-h1 mb-2">Olá, {user.graduacao} {user.nomeGuerra}!</h2>
          <p className="text-blue-100 flex items-center gap-2">
            <Clock size={18} />
            Seu próximo serviço está agendado em seu calendário.
          </p>
        </div>
        <Award size={100} className="absolute -right-4 -bottom-4 text-white opacity-10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pontos Ativos" 
          value={userBalance} 
          subValue="pts"
          icon={TrendingUp} 
          color="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Próxima Dispensa" 
          value={upcomingDispense ? new Date(upcomingDispense.dataDispensa).toLocaleDateString('pt-BR') : '---'} 
          icon={Calendar} 
          color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="RAIs Pendentes" 
          value={pendingRais} 
          icon={AlertCircle} 
          color="bg-orange-100 text-orange-600" 
        />
        <StatCard 
          title="RAIs Aprovados" 
          value={approvedRais} 
          icon={CheckCircle2} 
          color="bg-indigo-100 text-indigo-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            Desempenho Recente (RAIs)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="pontos" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'APPROVED' ? '#2563eb' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            Atividade Recente
          </h3>
          <div className="space-y-4">
            {userRais.length === 0 && <p className="text-sm text-gray-500 italic">Nenhuma atividade registrada.</p>}
            {userRais.slice(-5).reverse().map(rai => (
              <div key={rai.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className={`mt-1 p-2 rounded-lg ${
                  rai.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 
                  rai.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {rai.status === 'APPROVED' ? <CheckCircle2 size={16} /> : 
                   rai.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">RAI {rai.numeroRAI}</p>
                  <p className="text-xs text-gray-500">{rai.naturezaNome}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(rai.createdAt).toLocaleDateString('pt-BR')} às {new Date(rai.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div className="ml-auto text-sm font-bold text-blue-600">
                  +{rai.pontos}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
