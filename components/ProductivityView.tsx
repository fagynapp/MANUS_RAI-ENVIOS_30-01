
// Fixed: Removed corrupted JSX fragment between header and form conditional
import React, { useState } from 'react';
import { Officer, ProductivityLog, IncidentType } from '../types';
import { Plus, Save, Trash2 } from 'lucide-react';

interface ProductivityViewProps {
  currentUser: Officer;
  logs: ProductivityLog[];
  onAddLog: (log: ProductivityLog) => void;
  onDeleteLog: (id: string) => void;
}

export const ProductivityView: React.FC<ProductivityViewProps> = ({ 
  currentUser, 
  logs, 
  onAddLog,
  onDeleteLog
}) => {
  const [showForm, setShowForm] = useState(false);


  // Form State
  const [formData, setFormData] = useState<Partial<ProductivityLog>>({
    type: IncidentType.Abordagem,
    arrests: 0,
    flagrante: false,
    seizures: [],
    description: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: ProductivityLog = {
      id: Date.now().toString(),
      officerId: currentUser.id,
      date: new Date().toLocaleDateString('pt-BR'),
      type: formData.type as IncidentType,
      description: formData.description || '',
      location: formData.location || '',
      arrests: formData.arrests || 0,
      seizures: formData.seizures || [],
      flagrante: formData.flagrante || false,
    };
    onAddLog(newLog);
    setShowForm(false);
    setFormData({
      type: IncidentType.Abordagem,
      arrests: 0,
      flagrante: false,
      seizures: [],
      description: '',
      location: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-l-4 border-police-600 pl-4">
        <h2 className="app-h2 text-police-900">Registro de Produtividade</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-police-600 text-white rounded hover:bg-police-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nova Ocorrência
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-police-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Natureza</label>
                <select 
                  className="w-full border-gray-300 border rounded-md p-2 focus:ring-2 focus:ring-police-500 focus:outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as IncidentType})}
                >
                  {(Object.values(IncidentType) as string[]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input 
                  type="text" 
                  required
                  className="w-full border-gray-300 border rounded-md p-2 focus:ring-2 focus:ring-police-500 focus:outline-none"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Rua A, Bairro Centro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presos</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full border-gray-300 border rounded-md p-2"
                    value={formData.arrests}
                    onChange={e => setFormData({...formData, arrests: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-center pt-6">
                  <input 
                    type="checkbox" 
                    id="flagrante"
                    className="h-4 w-4 text-police-600 focus:ring-police-500 border-gray-300 rounded"
                    checked={formData.flagrante}
                    onChange={e => setFormData({...formData, flagrante: e.target.checked})}
                  />
                  <label htmlFor="flagrante" className="ml-2 block text-sm text-gray-900">
                    Flagrante Delito
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada (Histórico)</label>
              <textarea 
                rows={4}
                className="w-full border-gray-300 border rounded-md p-2 focus:ring-2 focus:ring-police-500 focus:outline-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva a dinâmica dos fatos..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="flex items-center gap-2 bg-police-700 text-white px-6 py-2 rounded hover:bg-police-800 transition-colors"
              >
                <Save size={18} />
                Salvar Ocorrência
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-police-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-police-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-police-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-police-500 uppercase tracking-wider">Natureza</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-police-500 uppercase tracking-wider">Local</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-police-500 uppercase tracking-wider">Resultado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-police-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-police-800">{log.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.arrests > 0 ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {log.arrests} Preso(s)
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Sem prisões
                    </span>
                  )}
                  {log.flagrante && <span className="ml-2 text-xs font-bold text-red-600">FLAGRANTE</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onDeleteLog(log.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Nenhuma ocorrência registrada neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
