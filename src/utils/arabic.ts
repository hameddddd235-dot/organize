import { parseLocalYMD } from './dateUtils';
// src/utils/arabic.ts

/**
 * Normalizes Arabic text for robust searching and comparison.
 * - Removes diacritics (tashkeel)
 * - Normalizes alef variations (أ, إ, آ, ٱ -> ا)
 * - Normalizes yaa and alef maksura (ى -> ي)
 * - Normalizes taa marbuta to haa for loose matching (ة -> ه)
 * - Collapses repeated whitespace
 */
export function normalizeArabic(text: string, looseTaaMarbuta: boolean = true): string {
  if (!text) return '';

  let normalized = text
    // Convert Arabic-Indic digits to standard digits
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel / kashida
    .replace(/\u0640/g, '')
    // Normalize Alef
    .replace(/[إأآٱ]/g, 'ا')
    // Normalize Alef Maksura
    .replace(/ى/g, 'ي');

  if (looseTaaMarbuta) {
    normalized = normalized.replace(/ة/g, 'ه');
  }

  return normalized
    .replace(/[,\.،؛:\-\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Converts Arabic digits (٠١٢٣٤٥٦٧٨٩) to standard ASCII digits (0123456789)
 */
export function convertArabicDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));
}

/**
 * Arabic Levant month names to 2-digit month strings
 */
const ARABIC_MONTHS: Record<string, string> = {
  'كانون الثاني': '01',
  'يناير': '01',
  'شباط': '02',
  'فبراير': '02',
  'اذار': '03',
  'آذار': '03',
  'مارس': '03',
  'نيسان': '04',
  'ابريل': '04',
  'أبريل': '04',
  'ايار': '05',
  'أيار': '05',
  'مايو': '05',
  'حزيران': '06',
  'يونيو': '06',
  'تموز': '07',
  'يوليو': '07',
  'اب': '08',
  'آب': '08',
  'اغسطس': '08',
  'أغسطس': '08',
  'ايلول': '09',
  'أيلول': '09',
  'سبتمبر': '09',
  'تشرين الاول': '10',
  'تشرين الأول': '10',
  'اكتوبر': '10',
  'أكتوبر': '10',
  'تشرين الثاني': '11',
  'نوفمبر': '11',
  'كانون الاول': '12',
  'كانون الأول': '12',
  'ديسمبر': '12',
};

const MONTH_NAME_PATTERN = Object.keys(ARABIC_MONTHS).map((m) => normalizeArabic(m)).join('|');

/**
 * Parses duration specified in Arabic (words or digits).
 * Examples:
 * - "ثلاثة أيام" -> 3
 * - "لمدة ٣ أيام" -> 3
 * - "لمدة يومين" -> 2
 * - "يوم واحد" -> 1
 * - "أسبوع" -> 7
 */
export function parseArabicDuration(text: string): number | null {
  if (!text) return null;
  const cleanDigits = convertArabicDigits(text);
  const norm = normalizeArabic(text);

  // 1. Explicit digit pattern: "3 أيام" or "لمدة 5 يوم"
  const digitMatch = cleanDigits.match(/(?:لمدة|خلال)?\s*(\d+)\s*(?:أيام|ايام|يوم|اياماً|يوماً)/i);
  if (digitMatch) {
    const val = parseInt(digitMatch[1], 10);
    if (!isNaN(val) && val > 0) return val;
  }

  // Unicode-aware boundaries after normalization (JS \b does not delimit Arabic words).
  const words: [string, number][] = [
    ['يوم واحد|يوم فقط', 1], ['يومان|يومين', 2],
    ['ثلاثه ايام|ثلاث ايام', 3], ['اربعه ايام|اربع ايام', 4],
    ['خمسه ايام|خمس ايام', 5], ['سته ايام|ست ايام', 6],
    ['سبعه ايام|سبع ايام', 7], ['ثمانيه ايام|ثماني ايام', 8],
    ['تسعه ايام|تسع ايام', 9], ['عشره ايام|عشر ايام', 10],
    ['اسبوعان|اسبوعين', 14], ['اسبوع واحد|اسبوع', 7],
    // A bare "شهر" usually names a calendar month ("شهر تشرين الثاني"), so require a duration context.
    ['شهر واحد|لمده شهر|المده شهر|خلال شهر', 30],
  ];
  for (const [phrase, days] of words) {
    if (new RegExp(`(?:^|[^\\p{L}])(?:${phrase})(?=$|[^\\p{L}])`, 'u').test(norm)) {
      // "خلال شهر تشرين الثاني" names a month, not a 30-day duration.
      if (days === 30 && new RegExp(`شهر\\s+(?:${MONTH_NAME_PATTERN})`, 'u').test(norm)) continue;
      return days;
    }
  }

  return null;
}

/**
 * Parses dates written in Arabic natural text or numeric format.
 * Examples:
 * - "5 تشرين الثاني 2026" -> "2026-11-05"
 * - "٥ تشرين الثاني ٢٠٢٦" -> "2026-11-05"
 * - "2026-11-05" -> "2026-11-05"
 * - "05/11/2026" or "5/11/2026" -> "2026-11-05"
 */
export function parseArabicDate(text: string): string | null {
  if (!text) return null;
  const clean = convertArabicDigits(text).trim();

  // Pattern 1: ISO YYYY-MM-DD
  const isoMatch = clean.match(/\b(20\d\d)[-\/\.](0?[1-9]|1[0-2])[-\/\.]([0-2]?\d|3[01])\b/);
  if (isoMatch) {
    const date = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    return parseLocalYMD(date) ? date : null;
  }

  // Pattern 2: D/M/YYYY or DD/MM/YYYY
  const slashMatch = clean.match(/\b([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](20\d\d)\b/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    const date = `${year}-${month}-${day}`;
    return parseLocalYMD(date) ? date : null;
  }

  // Pattern 3: D [Month Name] YYYY (e.g. 5 تشرين الثاني 2026)
  const normText = normalizeArabic(clean);
  const generalYearMatch = clean.match(/\b(20\d\d)\b/);
  const docYear = generalYearMatch ? generalYearMatch[1] : '';

  // Take the date that appears first in the text, not the earliest month of the year,
  // so a range such as "28 كانون الأول 2026 إلى 3 كانون الثاني 2027" keeps its real start.
  let earliest: { index: number; date: string | null } | null = null;
  for (const [monthName, monthNum] of Object.entries(ARABIC_MONTHS)) {
    const normMonth = normalizeArabic(monthName);

    // Numeric day + whole month word + optional year ("3 ابار" is not "3 آب")
    const regex = new RegExp(`(?<!\\d)(\\d{1,2})\\s*(?:من\\s*)?${normMonth}(?![\\p{L}])(?:\\s+(\\d{4}))?`, 'iu');
    const m = normText.match(regex);
    if (m && m.index !== undefined && (!earliest || m.index < earliest.index)) {
      const day = m[1].padStart(2, '0');
      const year = m[2] || docYear;
      const date = `${year}-${monthNum}-${day}`;
      earliest = { index: m.index, date: parseLocalYMD(date) ? date : null };
    }
  }

  return earliest?.date ?? null;
}
