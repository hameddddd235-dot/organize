// src/utils/dateUtils.ts

/**
 * Parses YYYY-MM-DD into pure local Year, Month, Day integers
 * Avoiding any UTC offset shifts or timezone rollovers.
 */
export function parseLocalYMD(ymd: string): { year: number; month: number; day: number } | null {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}

/**
 * Formats Year, Month, Day into YYYY-MM-DD string
 */
export function formatYMD(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Adds a specific number of calendar days to a YYYY-MM-DD string
 * using local midnight representation, completely safe from UTC daylight shift.
 */
export function addDays(ymd: string, days: number): string {
  const parsed = parseLocalYMD(ymd);
  if (!parsed || !Number.isFinite(days)) return ymd;
  // Use local Date constructor (year, monthIndex, day)
  const d = new Date(parsed.year, parsed.month - 1, parsed.day);
  d.setDate(d.getDate() + days);
  return formatYMD(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Calculates number of calendar days between two YYYY-MM-DD strings (inclusive: day count)
 */
export function dateDiffDays(startYmd: string, endYmd: string): number {
  const s = parseLocalYMD(startYmd);
  const e = parseLocalYMD(endYmd);
  if (!s || !e) return 1;

  const d1 = new Date(s.year, s.month - 1, s.day);
  const d2 = new Date(e.year, e.month - 1, e.day);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // inclusive
}

/**
 * Determines whether two date intervals [start1, end1] and [start2, end2] overlap (inclusive).
 * Two intervals overlap if: max(start1, start2) <= min(end1, end2)
 */
export function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  // Lexicographical comparison works strictly for ISO 'YYYY-MM-DD'
  const maxStart = start1 > start2 ? start1 : start2;
  const minEnd = end1 < end2 ? end1 : end2;
  return maxStart <= minEnd;
}

/**
 * Calculates the number of overlapping days between two intervals
 */
export function getOverlapDays(start1: string, end1: string, start2: string, end2: string): number {
  if (!datesOverlap(start1, end1, start2, end2)) return 0;
  const maxStart = start1 > start2 ? start1 : start2;
  const minEnd = end1 < end2 ? end1 : end2;
  return dateDiffDays(maxStart, minEnd);
}

/**
 * Formats a YYYY-MM-DD date into friendly Syrian Arabic notation
 * e.g. "2026-11-05" -> "5 تشرين الثاني 2026"
 */
const ARABIC_MONTH_NAMES = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

export function formatArabicDateFriendly(ymd: string): string {
  const parsed = parseLocalYMD(ymd);
  if (!parsed) return ymd;
  const monthName = ARABIC_MONTH_NAMES[parsed.month - 1] || '';
  return `${parsed.day} ${monthName} ${parsed.year}`;
}

/**
 * Calendar day of a stored ISO timestamp in the user's timezone.
 * Slicing the UTC string shows the previous day between midnight and 03:00 in Damascus.
 */
export function formatTimestampArabic(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatArabicDateFriendly(formatYMD(d.getFullYear(), d.getMonth() + 1, d.getDate()));
}

/** Reject incomplete schedules at every persistence boundary. */
export function validateProjectDates(project: { start_date: string; end_date: string; duration_days: number }): void {
  if (!parseLocalYMD(project.start_date) || !parseLocalYMD(project.end_date) || project.end_date < project.start_date) {
    throw new Error('يرجى تحديد تاريخ بدء وانتهاء صالحين وبالترتيب الصحيح');
  }
  if (!Number.isInteger(project.duration_days) || project.duration_days < 1 ||
      dateDiffDays(project.start_date, project.end_date) !== project.duration_days) {
    throw new Error('مدة العمل يجب أن تطابق الفترة بين تاريخي البدء والانتهاء');
  }
}
