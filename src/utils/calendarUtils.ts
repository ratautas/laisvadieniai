import { isWeekend, addDays } from './dateUtils';
import { isHoliday, getHolidayLabel, getPublicHolidays } from './holidayUtils';

export interface Day {
  number: number;
  isCurrent: boolean;
  holidayLabel?: string | null;
  isHoliday: boolean;
  isWeekend: boolean;
  isLongWeekend: boolean;
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

    const monthData = Array.from({ length: 6 * 7 }, (_, i) => {
      const date = addDays(startOfWeek, i);
      const isCurrentMonth = date.getUTCMonth() === month;

      const day: Day = {
        number: date.getUTCDate(),
        isHoliday: isHoliday(date, publicHolidays),
        isWeekend: isWeekend(date),
        isLongWeekend: false,
        isOpportunity: false,
        isCurrent: isCurrentMonth,
        holidayLabel: getHolidayLabel(date, publicHolidays),
      };

      return day;
    });

    // Identify long weekends
    for (let i = 0; i < monthData.length; i++) {
      if (isDayOff(addDays(startOfWeek, i), publicHolidays)) {
        let consecutiveDaysOff = 1;
        while (i + consecutiveDaysOff < monthData.length && isDayOff(addDays(startOfWeek, i + consecutiveDaysOff), publicHolidays)) {
          consecutiveDaysOff++;
        }
        if (consecutiveDaysOff > 2) {
          for (let j = 0; j < consecutiveDaysOff; j++) {
            monthData[i + j].isLongWeekend = true;
          }
        }
        i += consecutiveDaysOff - 1;
      }
    }

    // Identify opportunity days
    for (let i = 1; i < monthData.length - 1; i++) {
      const prevDay = monthData[i - 1];
      const currentDay = monthData[i];
      const nextDay = monthData[i + 1];

      if (currentDay.isCurrent && !isDayOff(addDays(startOfWeek, i), publicHolidays)) {
        if ((prevDay.isWeekend || prevDay.isHoliday) && (nextDay.isWeekend || nextDay.isHoliday)) {
          currentDay.isOpportunity = true;
          prevDay.isOpportunity = true;
          nextDay.isOpportunity = true;
        }
      }
    }

    return monthData.reduce((weeks, day, i) => {
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