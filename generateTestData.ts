
import { User, UserRole, RAI, Pelotao } from './types';

export const generateTestData = () => {
  const users: User[] = [
    {
      id: 'user-alpha-1',
      name: 'JOÃO SILVA SANTOS',
      nomeGuerra: 'JOÃO SILVA',
      email: 'joao@teste.com',
      matricula: '11111',
      graduacao: 'SD',
      pelotao: 'ALPHA',
      nascimento: '1992-05-15',
      telefone: '62999991111',
      role: UserRole.OFFICER,
      status: 'ACTIVE',
      almanaquePosition: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-bravo-1',
      name: 'MARIA OLIVEIRA SOUZA',
      nomeGuerra: 'MARIA OLIVEIRA',
      email: 'maria@teste.com',
      matricula: '22222',
      graduacao: 'CB',
      pelotao: 'BRAVO',
      nascimento: '1988-10-20',
      telefone: '62999992222',
      role: UserRole.OFFICER,
      status: 'ACTIVE',
      almanaquePosition: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-charlie-1',
      name: 'CARLOS PEREIRA LIMA',
      nomeGuerra: 'CARLOS LIMA',
      email: 'carlos@teste.com',
      matricula: '33333',
      graduacao: '3º SGT',
      pelotao: 'CHARLIE',
      nascimento: '1985-03-12',
      telefone: '62999993333',
      role: UserRole.OFFICER,
      status: 'ACTIVE',
      almanaquePosition: 3,
      createdAt: new Date().toISOString()
    }
  ];

  const rais: RAI[] = [
    // RAIs Pendentes (para Auditoria)
    {
      id: 'rai-pending-1',
      userId: 'user-alpha-1',
      matricula: '11111',
      numeroRAI: '20260001',
      dataRAI: '2026-01-20',
      naturezaId: '1',
      naturezaNome: 'Prisão em flagrante – homicídio/latrocínio',
      pontos: 50,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rai-pending-2',
      userId: 'user-bravo-1',
      matricula: '22222',
      numeroRAI: '20260002',
      dataRAI: '2026-01-22',
      naturezaId: '4',
      naturezaNome: 'Tráfico de drogas',
      pontos: 30,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    },
    // RAIs Aprovados
    {
      id: 'rai-approved-1',
      userId: 'user-charlie-1',
      matricula: '33333',
      numeroRAI: '20260003',
      dataRAI: '2026-01-15',
      naturezaId: '2',
      naturezaNome: 'Estatuto do Desarmamento',
      pontos: 40,
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    },
    // RAI Antigo (> 90 dias) para teste de bloqueio
    {
      id: 'rai-expired-1',
      userId: 'user-alpha-1',
      matricula: '11111',
      numeroRAI: '20250001',
      dataRAI: '2025-09-01',
      naturezaId: '3',
      naturezaNome: 'Roubo/Furto de celular',
      pontos: 0,
      status: 'EXPIRED',
      createdAt: new Date().toISOString()
    }
  ];

  return { users, rais };
};
