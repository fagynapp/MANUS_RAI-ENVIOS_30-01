
import React, { useState } from 'react';
import { LeaveRequest, LeaveType, LeaveStatus, Officer } from '../types';
import { Calendar, FilePlus, CheckCircle, XCircle, Clock } from 'lucide-react';

interface LeaveViewProps {
  currentUser: Officer;
  requests: LeaveRequest[];
  onAddRequest: (req: LeaveRequest) => void;
}

export const LeaveView: React.FC<LeaveViewProps> = ({ currentUser, requests, onAddRequest }) => {
  const [showForm, setShowForm] = useState(false);


  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    type: LeaveType.Medical,
    startDate: '',
    endDate: '',
    reason: '',
    cid: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: LeaveRequest = {
      id: Date.now().toString(),
      officerId: currentUser.id,
      type: formData.type as LeaveType,
      startDate: formData.startDate!,
      endDate: formData.endDate!,
      reason: formData.reason || '',
      cid: formData.cid,
      status: LeaveStatus.Pending
    };
    onAddRequest(newReq);
    setShowForm(false);
    setFormData({ type: LeaveType.Medical, startDate: '', endDate: '', reason: '', cid: '' });
  };

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.Approved: return <CheckCircle size={18} className="text-green-500" />;
      case LeaveStatus.Rejected: return <XCircle size={18} className="text-red-500" />;
      default: return <Clock size={18} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-l-4 border-police-600 pl-4">
        <h2 className="app-h2 text-police-900">Gestão de Dispensas</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-police-600 text-white rounded hover:bg-police-700 transition-colors shadow-sm"
          >
            <FilePlus size={18} />
            Solicitar Dispensa
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-police-200">
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Afastamento</label>
                <select 
                  className="w-full border-gray-300 border rounded-md p-2"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as LeaveType})}
                >
                  {(Object.values(LeaveType) as string[]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {formData.type === LeaveType.Medical && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CID (Opcional)</label>
                    <input 
                      type="text" 
                      className="w-full border-gray-300 border rounded-md p-2"
                      value={formData.cid}
                      onChange={e => setFormData({...formData, cid: e.target.value})}
                      placeholder="Código da Doença"
                    />
                 </div>
              )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border-gray-300 border rounded-md p-2"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border-gray-300 border rounded-md p-2"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa</label>
                <textarea 
                  rows={3}
                  required
                  className="w-full border-gray-300 border rounded-md p-2"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  placeholder="Motivo da solicitação..."
                />
             </div>

             <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="bg-police-700 text-white px-6 py-2 rounded hover:bg-police-800 transition-colors"
              >
                Enviar Solicitação
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-1 h-full ${
               req.status === LeaveStatus.Approved ? 'bg-green-500' : 
               req.status === LeaveStatus.Rejected ? 'bg-red-500' : 'bg-amber-400'
             }`}></div>
             
             <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                   <Calendar className="text-police-400" size={18} />
                   <span className="font-semibold text-gray-800">{req.type}</span>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-medium uppercase text-gray-600">
                   {getStatusIcon(req.status)}
                   {req.status}
                </div>
             </div>

             <div className="text-sm text-gray-600 mb-3">
                <p>De: <span className="font-medium text-gray-900">{req.startDate}</span></p>
                <p>Até: <span className="font-medium text-gray-900">{req.endDate}</span></p>
             </div>
             
             <p className="text-sm text-gray-500 italic border-t pt-2">
               "{req.reason}"
             </p>
          </div>
        ))}
         {requests.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400">
              Nenhuma solicitação de dispensa encontrada.
            </div>
         )}
      </div>
    </div>
  );
};
