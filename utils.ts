
import { Pelotao } from './types';
import { SHIFT_START_DATES, POINT_COSTS, HOLIDAYS_2026 } from './constants';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDayType = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 5 || day === 6; // Fri, Sat, Sun
  const isHoliday = HOLIDAYS_2026.includes(dateStr);
  
  if (isWeekend || isHoliday) return 'WEEKEND';
  return 'WEEKDAY';
};

export const getDispenseCost = (dateStr: string, userBirthday: string): number => {
  const type = getDayType(dateStr);
  const baseCost = type === 'WEEKEND' ? POINT_COSTS.WEEKEND_HOLIDAY : POINT_COSTS.WEEKDAY;
  
  // Check if it's user's birthday (month and day)
  const bDay = new Date(userBirthday);
  const dDate = new Date(dateStr);
  const isBirthday = bDay.getUTCMonth() === dDate.getUTCMonth() && bDay.getUTCDate() === dDate.getUTCDate();
  
  return isBirthday ? baseCost * POINT_COSTS.BIRTHDAY_DISCOUNT : baseCost;
};

export const getShiftForDate = (dateStr: string): Pelotao | null => {
  const targetDate = new Date(dateStr + 'T12:00:00');
  // Simple 4-day cycle calculation based on ALPHA's base date
  const baseAlpha = new Date(SHIFT_START_DATES.ALPHA + 'T12:00:00');
  const diffTime = targetDate.getTime() - baseAlpha.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return null;
  
  const cycle = diffDays % 4;
  const teamMap: Pelotao[] = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
  return teamMap[cycle];
};

export const isOffDay = (dateStr: string, userPelotao: Pelotao): boolean => {
  const teamOnDuty = getShiftForDate(dateStr);
  return teamOnDuty !== userPelotao;
};

export const isWithin90Days = (dateStr: string): boolean => {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = now.getTime() - target.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days <= 90;
};
