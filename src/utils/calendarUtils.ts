import { isWeekend, addDays } from './dateUtils';
import { isHoliday, getHolidayLabel, getPublicHolidays } from './holidayUtils';

export interface Day {
  date: Date;
  number: number;
  isCurrentMonth: boolean;
  holidayLabel?: string | null;
  isHoliday: boolean;
  isWeekend: boolean;
  isLongWeekend: boolean;
  isOpportunity: boolean;
  isExtendedWeekend: boolean;
}

export interface Opportunity {
  month: number;
  days: number[];
}

function isDayOff(date: Date, publicHolidays: ReturnType<typeof getPublicHolidays>): boolean {
  return isWeekend(date) || isHoliday(date, publicHolidays);
}

function getMonthDays(year: number, month: number, publicHolidays: ReturnType<typeof getPublicHolidays>): Day[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startDate = new Date(firstDay);
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay() + (startDate.getUTCDay() === 0 ? -6 : 1));

  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(startDate, i);
    return {
      date,
      number: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === month,
      isHoliday: isHoliday(date, publicHolidays),
      isWeekend: isWeekend(date),
      isLongWeekend: false,
      isOpportunity: false,
      isExtendedWeekend: false,
      holidayLabel: getHolidayLabel(date, publicHolidays),
    };
  });
}

function markLongWeekends(days: Day[]): void {
  let consecutiveDaysOff = 0;
  days.forEach((day, index) => {
    if (isDayOff(day.date, [])) {
      consecutiveDaysOff++;
      if (consecutiveDaysOff > 2) {
        for (let i = index; i > index - consecutiveDaysOff; i--) {
          days[i].isLongWeekend = true;
        }
      }
    } else {
      consecutiveDaysOff = 0;
    }
  });
}

function markOpportunityDays(days: Day[]): void {
  days.forEach((day, index) => {
    if (index > 0 && index < days.length - 1 && day.isCurrentMonth && !isDayOff(day.date, [])) {
      const prevDay = days[index - 1];
      const nextDay = days[index + 1];
      if ((prevDay.isWeekend || prevDay.isHoliday) && (nextDay.isWeekend || nextDay.isHoliday)) {
        day.isOpportunity = true;
      }
    }
  });
}

function markExtendedWeekends(days: Day[]): void {
  let extendedWeekend = false;
  days.forEach((day) => {
    if (day.isOpportunity || isDayOff(day.date, [])) {
      extendedWeekend = true;
    } else {
      extendedWeekend = false;
    }
    day.isExtendedWeekend = extendedWeekend;
  });
}

export function getCalendarData(year: number): Day[][][] {
  const publicHolidays = getPublicHolidays(year);

  return Array.from({ length: 12 }, (_, month) => {
    const monthDays = getMonthDays(year, month, publicHolidays);
    markLongWeekends(monthDays);
    markOpportunityDays(monthDays);
    markExtendedWeekends(monthDays);

    return monthDays.reduce((weeks, day, i) => {
      const weekIndex = Math.floor(i / 7);
      if (!weeks[weekIndex]) {
        weeks[weekIndex] = [];
      }
      weeks[weekIndex].push(day);
      return weeks;
    }, [] as Day[][]);
  });
}

export function getOpportunities(calendarData: Day[][][]): Opportunity[] {
  return calendarData.flatMap((monthData, monthIndex) => {
    const opportunityDays = monthData.flat().filter(day => day.isOpportunity && day.isCurrentMonth);
    return opportunityDays.length > 0
      ? [{
        month: monthIndex,
        days: opportunityDays.map(day => day.number),
      }]
      : [];
  });
}