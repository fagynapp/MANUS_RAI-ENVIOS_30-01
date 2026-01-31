
export type Pelotao = 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA';

export enum UserRole {
  OFFICER = 'OFFICER',
  ADM = 'ADM',
  TI = 'TI'
}

export interface User {
  id: string;
  email: string;
  name: string;
  nomeGuerra: string;
  matricula: string;
  graduacao: string;
  pelotao: Pelotao;
  nascimento: string;
  telefone: string;
  role: UserRole;
  createdAt: string;
  status: 'ACTIVE' | 'BLOCKED';
  almanaquePosition: number; // Posição oficial no Almanaque
  almanaqueUpdatedAt?: string; // Data da última atualização do Almanaque
  almanaqueTeamPosition?: number; // Posição dentro da equipe (opcional, quando houver)
}

export type Officer = User;

export interface OccurrenceNature {
  id: string;
  name: string;
  points: number;
  active: boolean;
}

export interface RAI {
  id: string;
  userId: string;
  matricula: string;
  numeroRAI: string;
  dataRAI: string;
  naturezaId: string;
  naturezaNome: string;
  pontos: number;
  observacoes: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  usedForDispensaId?: string;
  auditedBy?: string;
  auditDate?: string;
  rejectionReason?: string;
}

export type DispenseType = 'PRODUTIVIDADE' | 'CPC' | 'OUTROS';

export interface DispenseRequest {
  id: string;
  userId: string;
  userName: string;
  pelotao: Pelotao;
  dataDispensa: string;
  pontosDebitados: number;
  // Crédito = não debita pontos; Débito = debita pontos via FIFO/consumo.
  creditDebit?: 'CREDITO' | 'DEBITO';
  observacoes?: string;
  status: 'RESERVED' | 'APPROVED' | 'CANCELLED';
  createdAt: string;
  type: DispenseType;
  manualRegistration?: boolean;
  blockedDay?: boolean;

  // CPC campaign metadata (auditing / transparency)
  cpcCriteria?: 'RANKING' | 'ALMANAQUE';
  cpcPosicaoGeral?: number;
  cpcPosicaoEquipe?: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SystemConfig {
  maxDispensesPerDay: number;
  validityDays: number;
  allowExtraPoints: number;
  fifoEnabled: boolean;
  maxAdvanceDays: number;
  minIntervalDays: number;
  cpcEnabled: boolean; // Se a dispensa do Comando Geral está ativa
  cpcPriorityCriteria: 'ALMANAQUE' | 'RANKING'; // Critério de fila
  cpcPeriodStart: string; // YYYY-MM
  cpcPeriodEnd: string;   // YYYY-MM
  cpcTeamsEnabled: Pelotao[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  createdAt: string;
}

// Additional types for components
export enum IncidentType {
  Abordagem = 'Abordagem',
  Prisao = 'Prisao',
  Apreensao = 'Apreensao',
  Outros = 'Outros'
}

export interface ProductivityLog {
  id: string;
  officerId: string;
  date: string;
  type: IncidentType | string;
  description: string;
  location: string;
  arrests: number;
  seizures: string[];
  flagrante: boolean;
}

export enum LeaveType {
  Medical = 'Medical',
  Personal = 'Personal',
  Vacation = 'Vacation'
}

export enum LeaveStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export interface LeaveRequest {
  id: string;
  officerId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  cid?: string;
  status: LeaveStatus;
}
export interface ExpirationRelease {
  id: string;
  dataRAI: string;
  dataExp: string;
  limite: number;
  numeroRAI: string;
  naturezaId: string;
  naturezaNome: string;
  policialNome: string;
  matricula: string;
  validade: string;
  motivo: string;
  createdAt: string;
}

export interface HolidayRelease {
  id: string;
  data: string;
  pontos: number;
  motivo: string;
  createdAt: string;
}

export interface BirthdayRelease {
  id: string;
  dataAniversario: string;
  equipe: Pelotao;
  policialNome: string;
  matricula: string;
  observacoes: string;
  createdAt: string;
}
