import { isWeekend } from './dateUtils';
import { isHoliday, getHolidayLabel, getPublicHolidays } from './holidayUtils';

export interface Day {
  number: number;
  isCurrent: boolean;
  holidayLabel?: string | null;
  isHoliday: boolean;
  isWeekend: boolean;
  isOpportunity: boolean;
}

export interface Opportunity {
  month: number;
  days: number[];
}

function isDayOff(date: Date, publicHolidays: ReturnType<typeof getPublicHolidays>): boolean {
  return isWeekend(date) || isHoliday(date, publicHolidays);
}

export function getCalendarData(year: number): Day[][][] {
  const publicHolidays = getPublicHolidays(year);

  return Array.from({ length: 12 }, (_, month) => {
    const firstDay = new Date(Date.UTC(year, month, 1));
    let startOfWeek = new Date(firstDay);
    while (startOfWeek.getUTCDay() !== 1) {
      startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 1);
    }

    return Array.from({ length: 6 * 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setUTCDate(startOfWeek.getUTCDate() + i);
      const isCurrentMonth = date.getUTCMonth() === month;

      const day: Day = {
        number: date.getUTCDate(),
        isHoliday: isHoliday(date, publicHolidays),
        isWeekend: isWeekend(date),
        isOpportunity: false,
        isCurrent: isCurrentMonth,
        holidayLabel: getHolidayLabel(date, publicHolidays),
      };

      if (isCurrentMonth && !isDayOff(date, publicHolidays)) {
        const offHits = Array.from({ length: 5 }, (_, j) => {
          const offDate = new Date(date);
          offDate.setUTCDate(date.getUTCDate() + j - 2);
          return isDayOff(offDate, publicHolidays);
        });
        if (offHits.filter(Boolean).length >= 3) {
          day.isOpportunity = true;
        }
      }

      return day;
    })
      .reduce((weeks, day, i) => {
        const weekIndex = Math.floor(i / 7);
        if (!weeks[weekIndex]) {
          weeks[weekIndex] = [];
        }
        weeks[weekIndex].push(day);
        return weeks;
      }, [] as Day[][])
      .map((week) => {
        return week.map((day, i) => {
          if (day.isOpportunity) {
            const prevDay = week[i - 1];
            const nextDay = week[i + 1];
            if (
              prevDay &&
              prevDay.isCurrent &&
              !isDayOff(new Date(Date.UTC(year, month, prevDay.number)), publicHolidays)
            ) {
              prevDay.isOpportunity = true;
            }
            if (
              nextDay &&
              nextDay.isCurrent &&
              !isDayOff(new Date(Date.UTC(year, month, nextDay.number)), publicHolidays)
            ) {
              nextDay.isOpportunity = true;
            }
          }
          return day;
        });
      });
  });
}

export function getOpportunities(calendarData: Day[][][]): Opportunity[] {
  return calendarData.flatMap((monthData, monthIndex) =>
    monthData.flatMap((weekData) =>
      weekData.filter((day) => day.isOpportunity && day.isCurrent)
    ).length > 0
      ? [
        {
          month: monthIndex,
          days: monthData
            .flatMap((weekData) =>
              weekData.filter((day) => day.isOpportunity && day.isCurrent)
            )
            .map((day) => day.number),
        },
      ]
      : []
  );
}

export function getCellClass(day: Day): string {
  const baseClass = "p-2 text-center relative group";
  if (!day.isCurrent) return `${baseClass} text-gray-300`;
  if (day.isOpportunity) return `${baseClass} bg-green-300 font-bold`;
  if (day.isHoliday) return `${baseClass} bg-red-200`;
  if (day.isWeekend) return `${baseClass} bg-gray-100`;
  return baseClass;
}