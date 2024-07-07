import { getEasterSundayDay, getEasterMondayDay, getEasterSundayMonth, getEasterMondayMonth } from './dateUtils';

export function getPublicHolidays(year: number) {
  return [
    { month: 1, day: 1, label: "Naujieji metai" },
    { month: 2, day: 16, label: "Lietuvos valstybės atkūrimo diena" },
    { month: 3, day: 11, label: "Lietuvos nepriklausomybės atkūrimo diena" },
    {
      month: getEasterSundayMonth(year),
      day: getEasterSundayDay(year),
      label: "Velykos",
    },
    {
      month: getEasterMondayMonth(year),
      day: getEasterMondayDay(year),
      label: "Velykų antroji diena",
    },
    { month: 5, day: 1, label: "Tarptautinė darbo diena" },
    { month: 6, day: 24, label: "Joninės, Rasos" },
    { month: 7, day: 6, label: "Valstybės (Lietuvos karaliaus Mindaugo karūnavimo) diena" },
    { month: 8, day: 15, label: "Žolinė (Švč. Mergelės Marijos ėmimo į dangų diena)" },
    { month: 11, day: 1, label: "Visų šventųjų diena" },
    { month: 12, day: 24, label: "Kūčios" },
    { month: 12, day: 25, label: "Šv. Kalėdos" },
    { month: 12, day: 26, label: "Šv. Kalėdų antroji diena" },
  ];
}

export function isHoliday(date: Date, publicHolidays: ReturnType<typeof getPublicHolidays>): boolean {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  return publicHolidays.some((holiday) => month === holiday.month && day === holiday.day);
}

export function getHolidayLabel(date: Date, publicHolidays: ReturnType<typeof getPublicHolidays>): string | null {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  for (const holiday of publicHolidays) {
    if (month === holiday.month && day === holiday.day) {
      return holiday.label;
    }
  }
  return null;
}