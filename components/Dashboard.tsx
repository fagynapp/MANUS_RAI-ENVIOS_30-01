import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ProductivityLog, IncidentType, LeaveRequest, LeaveStatus } from '../types';
import { Shield, AlertTriangle, FileText, Activity } from 'lucide-react';

interface DashboardProps {
  logs: ProductivityLog[];
  leaveRequests: LeaveRequest[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Dashboard: React.FC<DashboardProps> = ({ logs, leaveRequests }) => {
  // Aggregate logs by type for charts
  const logsByType = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(logsByType).map(key => ({
    name: key,
    value: logsByType[key]
  }));

  // Stats
  const totalArrests = logs.reduce((acc, log) => acc + log.arrests, 0);
  const activeLeave = leaveRequests.filter(l => l.status === LeaveStatus.Approved).length;
  const totalIncidents = logs.length;

  return (
    <div className="space-y-6">
      <h2 className="app-h2 text-police-900 border-l-4 border-police-600 pl-4">
        Painel de Comando
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-police-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-police-500 uppercase font-semibold">Total Ocorrências</p>
              <p className="app-h1 text-police-800">{totalIncidents}</p>
            </div>
            <Shield className="w-10 h-10 text-police-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-police-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-police-500 uppercase font-semibold">Detidos (Flagrante)</p>
              <p className="app-h1 text-red-600">{totalArrests}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-police-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-police-500 uppercase font-semibold">Efetivo Afastado</p>
              <p className="app-h1 text-amber-600">{activeLeave}</p>
            </div>
            <Activity className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-police-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-police-500 uppercase font-semibold">Relatórios Gerados</p>
              <p className="app-h1 text-blue-600">12</p>
            </div>
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-police-200">
          <h3 className="text-lg font-semibold text-police-800 mb-4">Produtividade por Natureza</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#334e68" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-police-200">
          <h3 className="text-lg font-semibold text-police-800 mb-4">Distribuição de Tipos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
