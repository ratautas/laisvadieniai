import { isWeekend, addDays } from './dateUtils';
import { isHoliday, getHolidayLabel, getPublicHolidays } from './holidayUtils';

export interface Day {
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

export function getCalendarData(year: number): Day[][][] {
  const publicHolidays = getPublicHolidays(year);

  return Array.from({ length: 12 }, (_, month) => {
    const firstDay = new Date(Date.UTC(year, month, 1));
    let startOfWeek = new Date(firstDay);
    while (startOfWeek.getUTCDay() !== 1) {
      startOfWeek = addDays(startOfWeek, -1);
    }

    const monthData = Array.from({ length: 42 }, (_, i) => {
      const date = addDays(startOfWeek, i);
      const isCurrentMonth = date.getUTCMonth() === month;

      const day: Day = {
        number: date.getUTCDate(),
        isHoliday: isHoliday(date, publicHolidays),
        isWeekend: isWeekend(date),
        isLongWeekend: false,
        isOpportunity: false,
        isExtendedWeekend: false,
        isCurrentMonth: isCurrentMonth,
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

      if (currentDay.isCurrentMonth && !isDayOff(addDays(startOfWeek, i), publicHolidays)) {
        if ((prevDay.isWeekend || prevDay.isHoliday) && (nextDay.isWeekend || nextDay.isHoliday)) {
          currentDay.isOpportunity = true;
        }
      }
    }

    // Identify extended weekends
    for (let i = 0; i < monthData.length; i++) {
      if (monthData[i].isOpportunity || isDayOff(addDays(startOfWeek, i), publicHolidays)) {
        let extendedWeekendLength = 1;
        while (i + extendedWeekendLength < monthData.length &&
          (monthData[i + extendedWeekendLength].isOpportunity ||
            isDayOff(addDays(startOfWeek, i + extendedWeekendLength), publicHolidays))) {
          extendedWeekendLength++;
        }
        if (extendedWeekendLength > 2) {
          for (let j = 0; j < extendedWeekendLength; j++) {
            monthData[i + j].isExtendedWeekend = true;
          }
        }
        i += extendedWeekendLength - 1;
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
      weekData.filter((day) => day.isOpportunity && day.isCurrentMonth)
    ).length > 0
      ? [
        {
          month: monthIndex,
          days: monthData
            .flatMap((weekData) =>
              weekData.filter((day) => day.isOpportunity && day.isCurrentMonth)
            )
            .map((day) => day.number),
        },
      ]
      : []
  );
}