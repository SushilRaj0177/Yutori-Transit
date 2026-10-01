import type { DayType } from "@/engine/crowding";

/** Tokyo has no DST, so a fixed offset is exact. */
const JST_OFFSET_MIN = 9 * 60;
/** Railway service days in Tokyo roll over at roughly 04:00, not midnight. */
const SERVICE_DAY_START_MIN = 4 * 60;

export interface JstClock {
  hour: number; // fractional hour, 0–24
  minuteOfServiceDay: number; // minutes since 00:00, with 00:00–03:59 counted as 24:00–27:59
  dayType: DayType; // Japanese public holidays are not modelled yet
}

export function jstClock(now: Date = new Date()): JstClock {
  const jst = new Date(now.getTime() + JST_OFFSET_MIN * 60_000);
  const minute = jst.getUTCHours() * 60 + jst.getUTCMinutes();
  // Before 04:00 still belongs to the previous service day.
  const serviceDate = minute < SERVICE_DAY_START_MIN ? new Date(jst.getTime() - 86_400_000) : jst;
  const dow = serviceDate.getUTCDay();
  return {
    hour: minute / 60 + jst.getUTCSeconds() / 3600,
    minuteOfServiceDay: minute < SERVICE_DAY_START_MIN ? minute + 1440 : minute,
    dayType: dow === 0 || dow === 6 ? "holiday" : "weekday",
  };
}

/** "HH:MM" from a timetable → minutes of the service day (after-midnight trains count past 24:00). */
export function timetableMinute(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const minute = Number(m[1]) * 60 + Number(m[2]);
  return minute < SERVICE_DAY_START_MIN ? minute + 1440 : minute;
}
