export const LOCALE = "lt-LT";

export function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export function getEasterSundayDay(year: number): number {
  const easter = calculateEaster(year);
  return easter.getUTCDate();
}

export function getEasterMondayDay(year: number): number {
  const easter = calculateEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setUTCDate(easter.getUTCDate() + 1);
  return easterMonday.getUTCDate();
}

export function getEasterSundayMonth(year: number): number {
  const easter = calculateEaster(year);
  return easter.getUTCMonth() + 1;
}

export function getEasterMondayMonth(year: number): number {
  const easter = calculateEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setUTCDate(easter.getUTCDate() + 1);
  return easterMonday.getUTCMonth() + 1;
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function getMonthNames(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(year, i, 1));
    return new Intl.DateTimeFormat(LOCALE, { month: "long" }).format(date);
  });
}

export function getWeekdayNames(): string[] {
  const weekFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(2023, 0, 2 + i)); // Start from Monday
    return weekFormatter.format(date);
  });
}