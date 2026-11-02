import { parseLocalYMD, dateDiffDays } from './dateUtils';
import { Zone, ExtractedWorkOrder } from '../types';

export function isValidExtraction(value: unknown, zones: Zone[]): value is ExtractedWorkOrder {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  const strings = ['authority', 'authority_name_ar', 'work_type', 'work_type_name_ar', 'title_ar',
    'original_location', 'neighborhood', 'street', 'zone_id', 'zone_name_ar', 'street_segment',
    'landmark', 'start_date', 'end_date'];
  if (!strings.every(key => typeof data[key] === 'string')) return false;
  if (!['', 'water', 'electricity', 'sanitation', 'telecom', 'paving'].includes(data.work_type as string)) return false;
  if (!['', 'water', 'electricity', 'sanitation', 'telecom', 'paving', 'municipality_maintenance'].includes(data.authority as string)) return false;
  if (data.zone_id !== '' && !zones.some(z => z.id === data.zone_id)) return false;
  if (!Array.isArray(data.missing_fields) || !data.missing_fields.every(f => typeof f === 'string')) return false;
  if (typeof data.location_review_needed !== 'boolean') return false;
  if (typeof data.location_confidence !== 'number' || !Number.isFinite(data.location_confidence) || data.location_confidence < 0 || data.location_confidence > 1) return false;
  if (!['road_length_m', 'road_width_m', 'duration_days'].every(key => typeof data[key] === 'number' && Number.isFinite(data[key]) && (data[key] as number) >= 0)) return false;
  if (!Number.isInteger(data.duration_days)) return false;
  if (data.start_date && !parseLocalYMD(data.start_date as string)) return false;
  if (data.end_date && !parseLocalYMD(data.end_date as string)) return false;
  if (data.start_date && data.end_date && (data.end_date < data.start_date || dateDiffDays(data.start_date as string, data.end_date as string) !== data.duration_days)) return false;
  if (data.warnings !== undefined && (!Array.isArray(data.warnings) || !data.warnings.every(w => typeof w === 'string'))) return false;
  if (data.evidence !== undefined && (!Array.isArray(data.evidence) || !data.evidence.every(e => e && typeof e.field === 'string' && typeof e.quote === 'string'))) return false;
  if (data.document_reference !== undefined && typeof data.document_reference !== 'string') return false;
  if (data.document_date !== undefined && (typeof data.document_date !== 'string' || (data.document_date && !parseLocalYMD(data.document_date)))) return false;
  return true;
}


export const FIELD_LABELS: Record<string, string> = {
  authority: 'الجهة المنفذة', work_type: 'نوع العمل', zone_id: 'الحي المعتمد', neighborhood: 'الحي',
  street_segment: 'المقطع الطرقي', street: 'الشارع', start_date: 'بداية التنفيذ', end_date: 'نهاية التنفيذ',
  duration_days: 'مدة التنفيذ', landmark: 'المعلم الأقرب', road_length_m: 'طول الطريق', road_width_m: 'عرض الطريق',
  document_reference: 'رقم الكتاب', document_date: 'تاريخ الكتاب', title_ar: 'موضوع أمر العمل',
};
export const AUTHORITY_NAMES: Record<string, string> = {
  water: 'المؤسسة العامة لمياه الشرب', electricity: 'الشركة العامة للكهرباء', sanitation: 'مديرية الصرف الصحي',
  telecom: 'الشركة السورية للاتصالات', paving: 'مديرية الصيانة والتعبيد البلدية', municipality_maintenance: 'الصيانة العامة',
};
export const WORK_NAMES: Record<string, string> = {
  water: 'مياه وشبكات ضخ', electricity: 'تمديدات كهرباء', sanitation: 'صرف صحي ومطريات',
  telecom: 'اتصالات وألياف ضوئية', paving: 'تعبيد وتزفيت سطحي',
};
export const REQUIRED_EXTRACTION_FIELDS = ['authority', 'work_type', 'zone_id', 'street_segment', 'start_date', 'end_date', 'duration_days'] as const;
export function normalizeExtraction(input: ExtractedWorkOrder, zones: Zone[], rawText: string): ExtractedWorkOrder {
  const data = { ...input };
  data.authority_name_ar = AUTHORITY_NAMES[data.authority] || '';
  data.work_type_name_ar = WORK_NAMES[data.work_type] || '';
  const zone = zones.find(z => z.id === data.zone_id);
  data.zone_id = zone?.id || '';
  data.zone_name_ar = zone?.name_ar || '';
  data.neighborhood = zone?.name_ar || '';
  data.location_review_needed = data.location_review_needed || !zone || !data.street_segment || data.location_confidence < 0.8;
  data.missing_fields = Object.keys(FIELD_LABELS).filter(key => !data[key as keyof ExtractedWorkOrder]);
  data.warnings = [...new Set(data.warnings || [])];
  data.evidence = (data.evidence || []).filter(e => e.quote.trim() && rawText.includes(e.quote) && FIELD_LABELS[e.field]);
  return data;
}
