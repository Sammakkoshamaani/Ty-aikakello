import { Shift } from '../types';
import { formatLocalDateKey } from './timeUtils';

export function getInitialSeedShifts(): Shift[] {
  const now = new Date();
  const shifts: Shift[] = [];

  // Helper to create timestamp on a relative day offset (e.g., -1 is yesterday)
  const createRelativeShift = (
    dayOffset: number,
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
    breakMinutes = 45,
    notes = ''
  ): Shift => {
    const shiftDate = new Date(now);
    shiftDate.setDate(shiftDate.getDate() + dayOffset);

    const startTime = new Date(shiftDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(shiftDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    const breaks = [];
    if (breakMinutes > 0) {
      const breakStart = new Date(startTime.getTime() + 3.5 * 60 * 60 * 1000);
      const breakEnd = new Date(breakStart.getTime() + breakMinutes * 60 * 1000);
      breaks.push({
        id: `brk-${startTime.getTime()}`,
        startTime: breakStart.getTime(),
        endTime: breakEnd.getTime(),
        type: 'lunch' as const,
      });
    }

    return {
      id: `shift-${startTime.getTime()}`,
      date: formatLocalDateKey(startTime),
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      breaks,
      notes,
      hourlyRate: 25,
      tags: ['Normaali'],
    };
  };

  // Eilen (-1 pv)
  shifts.push(
    createRelativeShift(-1, 8, 30, 17, 0, 45, 'Koko päivän vuoro - sprintin tehtävät ja asiakaspalaveri')
  );

  // 2 päivää sitten (2 osavuoroa)
  const d2Morning = createRelativeShift(-2, 8, 0, 12, 15, 0, 'Aamuvuoro - inventaario ja tiimipalaveri');
  const d2Afternoon = createRelativeShift(-2, 13, 0, 17, 30, 15, 'Iltapäivävuoro - tukipyyntöjen käsittely');
  shifts.push(d2Morning, d2Afternoon);

  // 3 päivää sitten
  shifts.push(
    createRelativeShift(-3, 9, 0, 17, 45, 60, 'Suunnittelukatselmus, asiakasperehdytys ja dokumentaatio')
  );

  // 4 päivää sitten
  shifts.push(
    createRelativeShift(-4, 8, 15, 16, 45, 30, 'Tuotantojulkaisut ja järjestelmän ylläpito')
  );

  // 5 päivää sitten
  shifts.push(
    createRelativeShift(-5, 8, 45, 17, 15, 45, 'Viikkosuunnittelu ja sprintin retrospektiivi')
  );

  // 7 päivää sitten
  shifts.push(
    createRelativeShift(-7, 9, 0, 17, 30, 45, 'Vuosinäkymän suunnittelu ja ominaisuustestaus')
  );

  // 8 päivää sitten
  shifts.push(
    createRelativeShift(-8, 8, 30, 16, 30, 30, 'Asiakasperehdytykset ja koulutusmateriaalit')
  );

  return shifts;
}
