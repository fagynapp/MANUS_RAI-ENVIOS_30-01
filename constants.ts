import { Pelotao, OccurrenceNature } from './types';

export const SHIFT_START_DATES: Record<Pelotao, string> = {
  ALPHA: '2026-01-02',
  BRAVO: '2026-01-03',
  CHARLIE: '2026-01-04',
  DELTA: '2026-01-05'
};

export const RANK_WEIGHTS: Record<string, number> = {
  // Oficiais superiores e intermediários
  'CEL': 120,
  'TEN CEL': 110,
  'MAJ': 100,
  'CAP': 90,
  '1º TEN': 80,
  '2º TEN': 70,
  // Praças (ordem de prioridade no Almanaque)
  'SUB TEN': 60,
  '1º SGT': 50,
  '2º SGT': 40,
  '3º SGT': 30,
  'CB': 20,
  'SD': 10
};

export const PRACAS_GRADUACOES: string[] = [
  'CEL', 
  'TEN CEL', 
  'MAJ', 
  'CAP', 
  '1º TEN', 
  '2º TEN', 
  'SUB TEN', 
  '1º SGT', 
  '2º SGT', 
  '3º SGT', 
  'CB', 
  'SD'
];

// Normaliza variações antigas para o padrão atual
export const normalizeGraduacao = (g: string): string => {
  const raw = (g || '').trim().toUpperCase();
  const map: Record<string, string> = {
    '1º SGT': '1º SGT',
    '2º SGT': '2º SGT',
    '3º SGT': '3º SGT',
    '1° SGT': '1º SGT',
    '2° SGT': '2º SGT',
    '3° SGT': '3º SGT',
    '1ºSGT': '1º SGT',
    '2ºSGT': '2º SGT',
    '3ºSGT': '3º SGT',
    '1° TEN': '1º TEN',
    '2° TEN': '2º TEN',
    '1ºTEN': '1º TEN',
    '2ºTEN': '2º TEN',
    'SUBTEN': 'SUB TEN',
    'SUB-TEN': 'SUB TEN',
    'SUBTEN.': 'SUB TEN'
  };
  return map[raw] || raw;
};

export const DEFAULT_NATURES: OccurrenceNature[] = [
  { id: '1', name: 'Prisão em flagrante – homicídio/latrocínio', points: 50, active: true },
  { id: '2', name: 'Estatuto do Desarmamento', points: 40, active: true },
  { id: '3', name: 'Roubo/Furto de celular', points: 40, active: true },
  { id: '4', name: 'Tráfico de drogas', points: 30, active: true },
  { id: '5', name: 'Crimes sexuais', points: 30, active: true },
  { id: '6', name: 'Embriaguez ao volante', points: 15, active: true },
  { id: '7', name: 'Foragido recapturado', points: 10, active: true },
  { id: '8', name: 'TCO usuário de drogas', points: 2, active: true }
];

export const POINT_COSTS = {
  WEEKDAY: 100, 
  WEEKEND_HOLIDAY: 140,
  BIRTHDAY_DISCOUNT: 0.5
};

export const HOLIDAYS_2026 = [
  '2026-01-01', '2026-02-17', '2026-04-03', '2026-04-21', '2026-05-01', 
  '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-12-25',
];