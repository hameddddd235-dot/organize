import { ExtractedWorkOrder, AuthorityType, WorkType, Zone } from '../types';
import { normalizeArabic, parseArabicDate, convertArabicDigits, parseArabicDuration } from './arabic';
import { matchZone } from './zoneMatcher';
import { addDays, dateDiffDays } from './dateUtils';
import { normalizeExtraction } from './extraction';

/** Conservative offline extractor. Missing information stays empty for human review. */
export function parseWorkOrderArabic(rawText: string, zones: Zone[], _options?: { mode?: string }): ExtractedWorkOrder {
  const clean = convertArabicDigits(rawText).replace(/[\u064B-\u065F\u0670]/g, '');
  const warnings: string[] = [];
  const evidence: { field: string; quote: string }[] = [];
  const body = clean.split(/(?:الموضوع\s*[:：]|يرجى\s+|المطلوب\s*[:：])/).slice(1).join(' ') || clean;
  const rules: [WorkType, RegExp][] = [
    ['sanitation', /صرف صحي|ريغار|ريكار|قساطل الصرف/],
    ['water', /مياه|انبوب مياه|تسرب/],
    ['electricity', /كهرباء|توتر|محطه تحويل/],
    ['telecom', /اتصالات|الياف|فايبر|هاتف/],
    ['paving', /تعبيد|تزفيت|اسفلت/],
  ];
  const found = rules.filter(([, regex]) => regex.test(normalizeArabic(body)));
  let workType: WorkType | '' = found.length === 1 ? found[0][0] : '';
  if (found.length > 1) warnings.push('ذُكر أكثر من نوع عمل؛ اختر العمل المقصود أو افصل الأوامر إلى مشاريع مستقلة.');
  const header = clean.split(/الموضوع|يرجى|المطلوب/)[0];
  const authorities = rules.filter(([, regex]) => regex.test(normalizeArabic(header)));
  const authority: AuthorityType | '' = authorities.length === 1 ? authorities[0][0] : workType;
  const subject = clean.match(/الموضوع\s*[:：]\s*([^\n،؛.]+)/)?.[1]?.trim() || '';
  const documentReference = clean.match(/(?:رقم\s*(?:الكتاب|الأمر|الامر)?|العدد)\s*[:：]\s*([^\s\n،؛]+)/)?.[1] || '';
  const documentDateText = clean.match(/(?:تاريخ\s*(?:الكتاب|الإصدار|الاصدار)|التاريخ)\s*[:：]\s*([^\n،؛]+)/)?.[1];
  const documentDate = documentDateText ? parseArabicDate(documentDateText) || '' : '';
  // Prefer execution labels over an administrative date in the letterhead.
  const startPhrase = clean.match(/(?:اعتبارا\s*(?:من)?|بدءا\s*(?:من)?|ابتداء\s*(?:من)?|تاريخ\s*(?:البدء|بدء التنفيذ|التنفيذ)|يبدأ\s*(?:العمل)?|يبدا\s*(?:العمل)?)\s*[:：]?\s*([^\n،؛]+)/)?.[1];
  const rangeEnd = /(?:^|\s)(?:حتى|إلى|الى)\s+(?:تاريخ\s*)?[:：]?\s*(?=\d)|تاريخ\s*الانتهاء/;
  const startText = (startPhrase || (documentDateText ? body : clean)).split(/حتى|تاريخ\s*الانتهاء/)[0].split(rangeEnd)[0];
  let startDate = parseArabicDate(startText) || '';
  if (!startPhrase && documentDate && startDate === documentDate) {
    startDate = '';
    warnings.push('تاريخ الكتاب لا يثبت تاريخ بدء التنفيذ؛ يرجى تحديد موعد التنفيذ.');
  }
  let duration = parseArabicDuration(body) || 0;
  // "إلى" alone also ends a street span ("من تقاطع البلدية إلى ساحة الأشمر"); count it only before a day number.
  const until = clean.match(/(?:حتى|(?:إلى|الى)\s+تاريخ|(?:إلى|الى)(?=\s+\d)|تاريخ\s*(?:الانتهاء|نهاية التنفيذ))\s*[:：]?\s*([^\n،؛]+)/)?.[1];
  let endDate = until ? parseArabicDate(until) || '' : '';
  if (startDate && endDate) {
    if (endDate < startDate) {
      warnings.push('تاريخ الانتهاء المذكور يسبق البداية؛ صحح الجدول قبل الحفظ.');
      endDate = ''; duration = 0;
    } else {
      const days = dateDiffDays(startDate, endDate);
      if (duration && duration !== days) warnings.push('المدة المكتوبة لا تطابق الفترة الزمنية؛ اعتُمدت الفترة الصريحة وتلزم مراجعتها.');
      duration = days;
    }
  } else if (startDate && duration) endDate = addDays(startDate, duration - 1);

  const zoneResult = matchZone(body, zones);
  const zone = zoneResult.matchedZone;
  // Stop location capture at schedule clauses instead of swallowing the rest of the memo.
  const street = clean.match(/(?:شارع|أوتستراد|اوتستراد|كورنيش)\s+[^\n،؛,.]+/)?.[0]
    ?.split(/\s+(?:اعتبارا|بدءا|ابتداء|بتاريخ|ولمدة|لمدة|بداية التنفيذ|تاريخ البدء|من(?=\s+\d))/)[0].trim() || '';
  const landmark = clean.match(/(?:قرب|بجانب|أمام|امام)\s+([^\n،؛,.]+)/)?.[1]
    ?.split(/\s+(?:اعتبارا|بدءا|بتاريخ|ولمدة|لمدة)/)[0].trim() || '';
  const dimension = (pattern: RegExp) => Number(clean.match(pattern)?.[1] || 0);
  const length = dimension(/(?:بطول|الطول|طول)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:متر|م\b)/);
  const width = dimension(/(?:بعرض|العرض|عرض)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:متر|م\b)/);
  const uncertain = !zone || zoneResult.isAmbiguous || !street || /تقريبي|غير محدد|غير مؤكد/.test(street);
  for (const [field, quote] of [['street_segment', street], ['landmark', landmark], ['document_reference', documentReference]] as const) {
    if (quote && rawText.includes(quote)) evidence.push({ field, quote });
  }
  if (startPhrase) {
    const original = rawText.split(/[\n،؛]/).find(line => /اعتبار|بدء|ابتداء|يبدأ|يبدا/.test(line));
    if (original) evidence.push({ field: 'start_date', quote: original.trim() });
  }
  return normalizeExtraction({
    authority, authority_name_ar: '', work_type: workType, work_type_name_ar: '',
    title_ar: subject || 'أمر عمل بلدي', original_location: street, street, street_segment: street,
    neighborhood: zone?.name_ar || '', zone_id: zone?.id || '', zone_name_ar: zone?.name_ar || '', landmark,
    start_date: startDate, end_date: endDate, duration_days: duration,
    road_length_m: length, road_width_m: width, location_review_needed: uncertain,
    location_confidence: uncertain ? 0 : zoneResult.confidence,
    missing_fields: [], extraction_source: 'offline_parser', warnings, evidence,
    document_reference: documentReference, document_date: documentDate,
  }, zones, rawText);
}
