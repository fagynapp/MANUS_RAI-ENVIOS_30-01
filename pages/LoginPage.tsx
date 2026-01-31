
import React, { useState } from 'react';
import { User, UserRole, Pelotao } from '../types';
import { ShieldCheck, LogIn, ChevronRight, Lock, User as UserIcon, Terminal, Monitor } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nomeGuerra: '',
    matricula: '',
    graduacao: 'SD',
    pelotao: 'ALPHA' as Pelotao,
    nascimento: '',
    telefone: ''
  });

  const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');
  const toTitleCase = (v: string) =>
    (v || '')
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const maskDate = (digits: string) => {
    const d = onlyDigits(digits).slice(0, 8);
    const dd = d.slice(0, 2);
    const mm = d.slice(2, 4);
    const yy = d.slice(4, 8);
    if (d.length <= 2) return dd;
    if (d.length <= 4) return `${dd}/${mm}`;
    return `${dd}/${mm}/${yy}`;
  };

  const dateMaskedToISO = (masked: string) => {
    const d = onlyDigits(masked);
    if (d.length !== 8) return '';
    const dd = d.slice(0, 2);
    const mm = d.slice(2, 4);
    const yyyy = d.slice(4, 8);
    return `${yyyy}-${mm}-${dd}`;
  };

  const maskPhone = (digits: string) => {
    const d = onlyDigits(digits).slice(0, 11);
    const ddd = d.slice(0, 2);
    const a = d.slice(2, 7);
    const b = d.slice(7, 11);
    if (d.length <= 2) return ddd ? `(${ddd}` : '';
    if (d.length <= 7) return `(${ddd})${a}`;
    return `(${ddd})${a}-${b}`;
  };

  const handleQuickLogin = (role: UserRole, label: string) => {
    // Fixed: Added missing 'status' and 'almanaquePosition' properties to mock user
    const mockUser: User = {
      id: `test-${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@teste.com`,
      name: `${label} TESTE`,
      nomeGuerra: label.toUpperCase(),
      matricula: role === UserRole.OFFICER ? '12345' : '00001',
      // Mantemos apenas praças como opção padrão no sistema.
      graduacao: role === UserRole.OFFICER ? 'SD' : 'SUB TEN',
      pelotao: 'ALPHA',
      nascimento: '1990-01-01',
      telefone: '62999999999',
      role: role,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      almanaquePosition: 1
    };
    onLogin(mockUser);
  };

  const handleSimpleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const role = isAdminMode || formData.email.includes('adm') ? UserRole.ADM : UserRole.OFFICER;
    // Fixed: Added missing 'status' and 'almanaquePosition' properties to mock user
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: (formData.email || (isAdminMode ? 'admin@pm.go.gov.br' : 'policial@pm.go.gov.br')).toLowerCase(),
      name: (formData.name || formData.nomeGuerra || (isAdminMode ? 'ADMINISTRADOR' : 'NOME GUERRA')).trim(),
      nomeGuerra: formData.nomeGuerra || (isAdminMode ? 'ADMIN' : 'SOLDADO'),
      matricula: formData.matricula || (isAdminMode ? '00001' : '12345'),
      graduacao: formData.graduacao,
      pelotao: formData.pelotao,
      nascimento: dateMaskedToISO(formData.nascimento) || formData.nascimento || '1985-01-01',
      telefone: onlyDigits(formData.telefone) || '62999999999',
      role: role,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      almanaquePosition: 1
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
        <div className={`p-8 text-center transition-colors duration-500 ${isAdminMode ? 'bg-slate-800' : 'bg-blue-700'} text-white`}>
          <div className="inline-flex items-center justify-center p-3 bg-white bg-opacity-20 rounded-xl mb-4">
            {isAdminMode ? <Lock size={48} /> : <ShieldCheck size={48} />}
          </div>
          <h1 className="app-h2">RAI ENVIOS</h1>
          <p className="text-blue-100 text-sm mt-1">
            {isAdminMode ? 'Portal de Administração - BPM Terminal' : 'BPM Terminal - Sistema de Produtividade'}
          </p>
        </div>

        <div className="p-8">
          {/* Quick Access Buttons for Testing */}
          <div className="mb-8 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Acesso Rápido (Desenvolvimento)</p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleQuickLogin(UserRole.OFFICER, 'Usuário 1')}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <UserIcon size={20} />
                <span className="text-[10px] font-bold">Usuário 1</span>
              </button>
              <button 
                onClick={() => handleQuickLogin(UserRole.ADM, 'Admin 1')}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <ShieldCheck size={20} />
                <span className="text-[10px] font-bold">Admin 1</span>
              </button>
              <button 
                onClick={() => handleQuickLogin(UserRole.TI, 'TI 1')}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <Monitor size={20} />
                <span className="text-[10px] font-bold">TI 1</span>
              </button>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-2 bg-white text-gray-400 uppercase font-bold tracking-widest">ou login manual</span>
            </div>
          </div>

          <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => { setIsAdminMode(false); setIsRegistering(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${!isAdminMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserIcon size={16} /> Policial
            </button>
            <button 
              onClick={() => { setIsAdminMode(true); setIsRegistering(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${isAdminMode ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Lock size={16} /> Administrador
            </button>
          </div>

          {!isRegistering ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <form onSubmit={handleSimpleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder={isAdminMode ? "admin@pm.go.gov.br" : "exemplo@pm.go.gov.br"}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                {isAdminMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave de Acesso</label>
                    <input 
                      type="password" 
                      required
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <button 
                  type="submit"
                  className={`w-full ${isAdminMode ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2`}
                >
                  <LogIn size={20} />
                  <span>{isAdminMode ? 'Acessar Painel ADM' : 'Entrar no Sistema'}</span>
                </button>
              </form>
              {!isAdminMode && (
                <button 
                  onClick={() => setIsRegistering(true)}
                  className="w-full text-center text-sm font-bold text-blue-600 hover:underline"
                >
                  Não tem conta? Cadastre-se
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSimpleLogin} className="space-y-5 animate-in slide-in-from-right duration-300">
              <h2 className="app-h3 text-gray-800">Auto Cadastro</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nome e sobrenome"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    onBlur={() => setFormData(prev => ({ ...prev, name: toTitleCase(prev.name) }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Graduação</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.graduacao}
                      onChange={e => setFormData({ ...formData, graduacao: e.target.value })}
                    >
                      <option value="SUB TEN">SUB TEN</option>
                      <option value="1ºSGT">1ºSGT</option>
                      <option value="2ºSGT">2ºSGT</option>
                      <option value="3ºSGT">3ºSGT</option>
                      <option value="CB">CB</option>
                      <option value="SD">SD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome de Guerra</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                      placeholder="SOARES"
                      value={formData.nomeGuerra}
                      onChange={e => setFormData({ ...formData, nomeGuerra: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Matrícula (5 dígitos)</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={5}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="12345"
                      value={formData.matricula}
                      onChange={e => setFormData({ ...formData, matricula: onlyDigits(e.target.value).slice(0, 5) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nascimento</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="dd/mm/aaaa"
                      value={formData.nascimento}
                      onChange={e => setFormData({ ...formData, nascimento: maskDate(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Telefone</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="(62)99999-9999"
                      value={formData.telefone}
                      onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">E-mail</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="exemplo@gmail.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Pelotão/Equipe</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as Pelotao[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, pelotao: t })}
                        className={`py-3 rounded-xl text-[11px] font-black uppercase transition-all border ${formData.pelotao === t ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  Cadastrar <ChevronRight size={18} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
