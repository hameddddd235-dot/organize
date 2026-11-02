# البرومبت 4 من 13: التحليل والمستودع

أكمل نسخ المشروع. هذه الملفات تحتوي تحليل أوامر العمل، والاتصال بالخادم، وطبقة حفظ البيانات.

قواعد النسخ في هذا البرومبت:
- أنشئ كل ملف محاط بالعلامتين <<<FILE: المسار>>> و<<<END FILE>>> في المسار نفسه، وبمحتواه حرفياً. العلامتان نفسهما لا تدخلان في الملف.
- لا تُعد صياغة أي نص عربي، ولا تغيّر أي class أو لون أو اسم أو رقم، ولا تحسّن الكود ولا تعيد تنظيمه.
- إذا كان ملف بهذا المسار موجوداً، فاستبدله بالكامل.
- قد لا يعمل المشروع قبل البرومبت 11 لأن بعض الملفات لم تصل بعد. لا تنشئ بدائل مؤقتة ولا تحذف أي import.
- عند الانتهاء اكتب أسماء الملفات التي أنشأتها فقط، وانتظر البرومبت التالي.

<<<FILE: src/utils/extraction.ts>>>
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
<<<END FILE>>>

<<<FILE: src/utils/localParser.ts>>>
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
<<<END FILE>>>

<<<FILE: src/services/aiService.ts>>>
// src/services/aiService.ts
import { isValidExtraction, normalizeExtraction } from '../utils/extraction';
export { isValidExtraction } from '../utils/extraction';
import { Zone, ExtractedWorkOrder } from '../types';

export interface AIAnalysisResult {
  success: boolean;
  data?: ExtractedWorkOrder;
  error?: string;
  canFallbackToLocal: boolean;
  analyzerMode: 'REAL_AI' | 'LOCAL_RULES' | 'BROKEN';
}

/**
 * Service to manage AI document extraction.
 * Ensures security: API keys are NEVER embedded in client frontend code.
 * Honestly reports connection status and enforces fallback to deterministic local rules.
 */
declare const __AI_BACKEND_URL__: string;

export class AIService {
  private connected = false;
  private backendUrl: string | null;

  constructor(url = typeof __AI_BACKEND_URL__ !== 'undefined' ? __AI_BACKEND_URL__ : '') {
    this.backendUrl = url.trim() || null;
  }

  public async checkBackend(): Promise<string> {
    if (!this.backendUrl) return 'عنوان خادم التحليل غير مهيأ';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(this.backendUrl.replace(/\/analyze$/, '/health'), { signal: controller.signal });
      if (!response.ok) throw new Error();
      const status = await response.json();
      if (status.provider !== 'gemini' || typeof status.configured !== 'boolean') throw new Error();
      return status.configured ? 'خادم Gemini جاهز والمفتاح مضبوط. صلاحية المفتاح تُتحقق عند أول تحليل.' : 'الخادم يعمل؛ أضف GEMINI_API_KEY في إعداداته لتفعيل Gemini.';
    } catch { return 'تعذر الوصول إلى خادم التحليل. تحقق من تشغيله وإعداد عنوانه.'; }
    finally { clearTimeout(timer); }
  }

  public getStatus() {
    return {
      mode: this.connected ? 'REAL_AI' as const : 'LOCAL_RULES' as const,
      isBackendConfigured: Boolean(this.backendUrl),
      isBackendConnected: this.connected,
      messageAr: this.connected ? 'نجح آخر اتصال بخادم التحليل' : this.backendUrl
        ? 'تم إعداد عنوان الخادم؛ لم يتم التحقق من الاتصال بعد'
        : 'المحلل المحلي متاح. لم يتم إعداد خادم ذكاء اصطناعي.',
    };
  }

  /**
   * Attempts extraction via AI backend if configured.
   * If no backend is configured or the call fails, returns an honest explicit error
   * without fabricating mock data as real AI.
   */
  public async extractWorkOrder(rawText: string, zones: Zone[]): Promise<AIAnalysisResult> {
    if (!this.backendUrl) {
      return {
        success: false,
        error: 'تعذر الاتصال بمزود الذكاء الاصطناعي: الخادم الخلفي غير مهيأ. شغّل خدمة التحليل واضبط عنوانها؛ مفاتيح Gemini تحفظ في الخادم فقط.',
        canFallbackToLocal: true,
        analyzerMode: 'LOCAL_RULES',
      };
    }

    this.connected = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    try {

      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          zones: zones.map(z => ({ id: z.id, name_ar: z.name_ar, aliases: z.aliases })),
        }),
        signal: controller.signal,
      });


      if (!response.ok) {
        return {
          success: false,
          // Vite's proxy answers 500 when the API on port 8787 is not running.
          error: response.status === 500 ? 'تعذر الوصول إلى خادم التحليل. شغّل الموقع بالأمر npm run dev ثم أعد المحاولة، أو اختر التحليل المحلي.' : response.status === 503 ? 'خدمة AI غير مهيأة بعد. أكمل إعدادات الخادم أو اختر التحليل المحلي.' : response.status === 429 ? 'طلبات التحليل كثيرة حالياً؛ أعد المحاولة بعد قليل.' : response.status === 504 ? 'استغرق التحليل وقتاً أطول من المسموح. أعد المحاولة.' : `تعذر إكمال التحليل (رمز ${response.status}). يمكنك إعادة المحاولة أو اختيار التحليل المحلي.`,
          canFallbackToLocal: true,
          analyzerMode: 'BROKEN',
        };
      }

      const json: unknown = await response.json();
      if (!isValidExtraction(json, zones)) throw new Error('استجابة الخادم لا تطابق حقول أمر العمل المطلوبة');
      this.connected = true;
      return {
        success: true,
        data: {
          ...normalizeExtraction(json, zones, rawText),
          extraction_source: 'real_ai',
        },
        canFallbackToLocal: false,
        analyzerMode: 'REAL_AI',
      };
    } catch (e: any) {
      return {
        success: false,
        error: `خطأ في الاتصال بالذكاء الاصطناعي: ${e?.message || 'انتهت مهلة الطلب'}`,
        canFallbackToLocal: true,
        analyzerMode: 'BROKEN',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const aiService = new AIService();
<<<END FILE>>>

<<<FILE: src/services/repository.ts>>>
// src/services/repository.ts
import { Zone, Project, Conflict, CoordinationDecision } from '../types';
import { INITIAL_ZONES, INITIAL_PROJECTS } from '../data/seedData';
import { detectConflicts, findSimilarPavingGroups, SimilarPavingGroup, validateProjectUpdate } from '../utils/conflictDetector';
import { calculatePotentialSavings } from '../utils/financial';
import { formatArabicDateFriendly, addDays, validateProjectDates, dateDiffDays } from '../utils/dateUtils';
import { proposeGenericCoordinationSchedule } from '../utils/scheduler';

const STORAGE_KEYS = {
  ZONES: 'nabd_zones_v1',
  PROJECTS: 'nabd_projects_v1',
  COORDINATIONS: 'nabd_coordinations_v1',
  CONFLICT_RECORDS: 'nabd_conflict_records_v1',
  PROTOCOL_SERIAL: 'nabd_protocol_serial_v1',
  DEMO_MODE: 'nabd_demo_mode_v1',
};

export class MunicipalDataRepository {
  private zones: Zone[] = [];
  private projects: Project[] = [];
  private coordinations: CoordinationDecision[] = [];
  private conflictRecords: Record<string, Conflict> = {};
  private protocolSerial: number = 42;
  private savedWorkspace: string | null = null;

  public isScenarioPreview(): boolean { return this.savedWorkspace !== null; }

  public exitScenario(): void {
    if (!this.savedWorkspace) return;
    const state = JSON.parse(this.savedWorkspace);
    this.zones = state.zones;
    this.projects = state.projects;
    this.coordinations = state.coordinations;
    this.conflictRecords = state.conflictRecords;
    this.protocolSerial = state.protocolSerial;
    this.savedWorkspace = null;
  }

  constructor() {
    this.init();
  }

  private getStorage(): Storage | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch {
      // Access denied or not available
    }
    return (globalThis as any).__mockStorage || null;
  }

  private init() {
    try {
      const storage = this.getStorage();
      const storedZones = storage?.getItem(STORAGE_KEYS.ZONES);
      const storedProjects = storage?.getItem(STORAGE_KEYS.PROJECTS);
      const storedCoord = storage?.getItem(STORAGE_KEYS.COORDINATIONS);
      const storedConflicts = storage?.getItem(STORAGE_KEYS.CONFLICT_RECORDS);
      const storedSerial = storage?.getItem(STORAGE_KEYS.PROTOCOL_SERIAL);

      if (storedZones) {
        this.zones = JSON.parse(storedZones);
      } else {
        this.zones = structuredClone(INITIAL_ZONES);
        storage?.setItem(STORAGE_KEYS.ZONES, JSON.stringify(this.zones));
      }

      if (storedProjects) {
        this.projects = JSON.parse(storedProjects);
      } else {
        this.projects = structuredClone(INITIAL_PROJECTS);
        storage?.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(this.projects));
      }

      if (storedCoord) {
        this.coordinations = JSON.parse(storedCoord);
      } else {
        this.coordinations = [];
      }

      if (storedConflicts) {
        this.conflictRecords = JSON.parse(storedConflicts);
      } else {
        this.conflictRecords = {};
      }

      if (storedSerial) {
        this.protocolSerial = parseInt(storedSerial, 10);
      } else {
        this.protocolSerial = 42;
      }
    } catch (e) {
      this.zones = structuredClone(INITIAL_ZONES);
      this.projects = structuredClone(INITIAL_PROJECTS);
      this.coordinations = [];
      this.conflictRecords = {};
      this.protocolSerial = 42;
    }
  }

  private persist() {
    if (this.isScenarioPreview()) return;
    try {
      const storage = this.getStorage();
      if (!storage) return;
      storage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(this.zones));
      storage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(this.projects));
      storage.setItem(STORAGE_KEYS.COORDINATIONS, JSON.stringify(this.coordinations));
      storage.setItem(STORAGE_KEYS.CONFLICT_RECORDS, JSON.stringify(this.conflictRecords));
      storage.setItem(STORAGE_KEYS.PROTOCOL_SERIAL, String(this.protocolSerial));
    } catch (e) {
      console.warn('Failed to persist to storage', e);
    }
  }

  public getZones(): Zone[] {
    return structuredClone(this.zones);
  }

  public getProjects(): Project[] {
    return structuredClone(this.projects);
  }

  public getProjectById(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  public createProject(data: any): Project {
    // Derive from the highest serial: projects.length reuses codes after a deletion.
    const year = new Date().getFullYear();
    const nextNum = Math.max(0, ...this.projects.map((p) => Number(p.code.split('-').pop()) || 0)) + 1;
    const code = `PRJ-${year}-${String(nextNum).padStart(3, '0')}`;
    const newProject: Project = {
      title_ar: data.title_ar || 'أمر عمل بلدي',
      authority: data.authority || 'paving',
      authority_name_ar: data.authority_name_ar || 'مديرية الصيانة والإنشاءات البلدية',
      work_type: data.work_type || 'paving',
      work_type_name_ar: data.work_type_name_ar || 'تعبيد وتزفيت سطحي',
      zone_id: data.zone_id || 'zone-midan',
      zone_name_ar: data.zone_name_ar || 'حي الميدان',
      street_segment: data.street_segment || '',
      landmark: data.landmark || '',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      duration_days: data.duration_days ?? 0,
      road_length_m: data.road_length_m || 0,
      road_width_m: data.road_width_m || 0,
      status: data.status || 'planned',
      source: data.source || data.extraction_source || 'offline_parser',
      location_confidence: data.location_confidence ?? 1.0,
      location_review_needed: data.location_review_needed ?? false,
      original_text: data.original_text || data.source_text_snippet || '',
      ...data,
      id: `prj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code,
      created_at: new Date().toISOString(),
      is_synthetic: true,
    };

    validateProjectDates(newProject);
    this.projects.unshift(newProject);
    this.persist();
    return newProject;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | null {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const previous = this.projects[idx];
    const candidate = { ...previous, ...updates };
    // Dates are authoritative when callers provide an end date; derive the inclusive duration.
    if (updates.end_date !== undefined && updates.duration_days === undefined) {
      candidate.duration_days = dateDiffDays(candidate.start_date, candidate.end_date);
    }
    validateProjectDates(candidate);
    this.projects[idx] = candidate;
    const relevantFields: (keyof Project)[] = ['start_date', 'end_date', 'work_type', 'zone_id',
      'street_segment', 'status', 'location_confidence', 'location_review_needed'];
    const changed = relevantFields.some(field => previous[field] !== candidate[field]);
    const detected = this.detectCurrentConflicts();
    for (const [key, record] of Object.entries(this.conflictRecords)) {
      if (record.project_a_id !== id && record.project_b_id !== id) continue;
      const current = detected.find(c => c.id === key);
      if (changed && current) {
        this.conflictRecords[key] = current;
        for (const decision of this.coordinations) {
          if (decision.conflict_id === key) decision.review_status = 'pending';
        }
      } else if (!current && (record.status === 'detected' || record.status === 'reviewed')) {
        delete this.conflictRecords[key];
      }
    }

    // A protocol must not keep certifying a date the project no longer has.
    for (const decision of this.coordinations) {
      if (decision.action_applied_to_project && decision.rescheduled_project_id === id &&
          decision.approved_paving_date !== candidate.start_date) {
        decision.review_status = 'pending';
      }
    }

    this.persist();
    return this.projects[idx];
  }

  public deleteProject(id: string): boolean {
    const prevLen = this.projects.length;
    this.projects = this.projects.filter((p) => p.id !== id);
    this.coordinations = this.coordinations.filter(
      (c) => c.paving_project_id !== id && !c.conflict_id.includes(id) && !c.predecessor_project_ids.includes(id)
    );
    // Clean up stored conflict records for this project
    for (const [key, record] of Object.entries(this.conflictRecords)) {
      if (record.project_a_id === id || record.project_b_id === id || key.includes(id)) {
        delete this.conflictRecords[key];
      }
    }
    this.persist();
    return this.projects.length < prevLen;
  }

  /**
   * Retrieves all conflicts: active detected, under review, and previously resolved/dismissed records.
   */
  private detectCurrentConflicts(): Conflict[] {
    const result = new Map(detectConflicts(this.projects).map(c => [c.id, c]));
    // Preserve the safety policy of each approved schedule when projects change.
    for (const decision of this.coordinations) {
      if (!decision.paving_project_id) continue;
      for (const conflict of detectConflicts(this.projects, decision.safety_buffer_days)) {
        if (conflict.id === decision.conflict_id) result.set(conflict.id, conflict);
      }
    }
    return [...result.values()];
  }

  public getConflicts(): Conflict[] {
    const rawDetected = this.detectCurrentConflicts();
    const resultMap: Record<string, Conflict> = {};

    // 1. Incorporate raw detected conflicts
    for (const c of rawDetected) {
      const saved = this.conflictRecords[c.id];
      if (saved && !(saved.status === 'resolved' && saved.resolution_type === 'rescheduled' && (c.is_blocking || c.conflict_type === 'paving_sequence_notice'))) {
        // Merge persistent decision state
        resultMap[c.id] = {
          ...c,
          status: saved.status,
          resolved_at: saved.resolved_at,
          resolved_by: saved.resolved_by,
          resolution_type: saved.resolution_type,
          resolution_notes: saved.resolution_notes,
          protocol_number: saved.protocol_number,
          avoided_cost_syp: saved.avoided_cost_syp,
          approved_paving_date: saved.approved_paving_date,
        };
      } else {
        resultMap[c.id] = c;
      }
    }

    // 2. Also keep previously resolved or dismissed conflicts that were fixed by rescheduling
    // so they don't vanish from the audit register!
    for (const [id, savedConflict] of Object.entries(this.conflictRecords)) {
      const pAExists = this.projects.some((p) => p.id === savedConflict.project_a_id);
      const pBExists = this.projects.some((p) => p.id === savedConflict.project_b_id);
      if (!pAExists || !pBExists) {
        continue;
      }
      if (!resultMap[id] && (savedConflict.status === 'resolved' || savedConflict.status === 'dismissed')) {
        resultMap[id] = savedConflict;
      }
    }

    return Object.values(resultMap);
  }

  /** Fresh scan of the entire registry, independent of dashboard filters and prior dismissals.
   * This is an audit result; it does not erase engineering decisions or their history.
   */
  public scanAllProjects(): { projectsChecked: number; excludedProjects: number; conflicts: Conflict[]; similarPaving: SimilarPavingGroup[] } {
    const active = this.projects.filter(p => p.status !== 'completed' && p.status !== 'suspended');
    return { projectsChecked: active.length, excludedProjects: this.projects.length - active.length,
      conflicts: this.detectCurrentConflicts(), similarPaving: findSimilarPavingGroups(this.projects) };
  }

  public getCoordinationDecisions(): CoordinationDecision[] {
    return [...this.coordinations];
  }

  public getCoordinationDecisionForConflict(conflictId: string): CoordinationDecision | null {
    return this.coordinations.find((c) => c.conflict_id === conflictId) || null;
  }

  public saveCoordinationDecision(decision: CoordinationDecision): void {
    const idx = this.coordinations.findIndex((c) => c.conflict_id === decision.conflict_id);
    if (idx >= 0) {
      this.coordinations[idx] = decision;
    } else {
      this.coordinations.unshift(decision);
    }
    this.persist();
  }

  /**
   * Generates a sequential municipal protocol number e.g. "محضر-دمشق-2026-042"
   */
  public nextProtocolNumber(): string {
    this.protocolSerial += 1;
    this.persist();
    return `محضر-دمشق-${new Date().getFullYear()}-${String(this.protocolSerial).padStart(3, '0')}`;
  }

  /**
   * Formally resolves a conflict with an approved schedule, issuing an official protocol.
   */
  public approveCoordinationSchedule(
    conflictId: string,
    approvedDate: string,
    notesOrOptions?: string | {
      notes?: string;
      engineerName?: string;
      applyDateToProject?: boolean;
      chosenRescheduledProjectId?: string;
      safetyBufferDays?: number;
      roadLengthM?: number;
      roadWidthM?: number;
      costPerM2?: number;
    },
    engineerNameArg?: string,
    applyDateToProjectArg?: boolean,
    chosenRescheduledProjectIdArg?: string
  ): { decision: CoordinationDecision; updatedProject: Project | null } {
    const options = typeof notesOrOptions === 'object' && notesOrOptions !== null
      ? notesOrOptions
      : {
          notes: typeof notesOrOptions === 'string' ? notesOrOptions : undefined,
          engineerName: engineerNameArg,
          applyDateToProject: applyDateToProjectArg,
          chosenRescheduledProjectId: chosenRescheduledProjectIdArg,
        };

    const notes = options.notes;
    const engineerName = options.engineerName || 'م. عمار الشريف (رئيس قسم التنسيق البلدي)';
    const applyDateToProject = options.applyDateToProject ?? true;
    const chosenRescheduledProjectId = options.chosenRescheduledProjectId;
    const safetyBufferDays = options.safetyBufferDays ?? 5;

    const conflicts = this.getConflicts();
    const conflict = conflicts.find((c) => c.id === conflictId) || this.conflictRecords[conflictId];
    
    let pA: Project | undefined;
    let pB: Project | undefined;
    let projectToReschedule: Project | undefined;
    let fixedProject: Project | undefined;

    if (conflict) {
      pA = this.getProjectById(conflict.project_a_id);
      pB = this.getProjectById(conflict.project_b_id);
    }

    if (pA && pB) {
      if (chosenRescheduledProjectId === pA.id) {
        projectToReschedule = pA;
        fixedProject = pB;
      } else if (chosenRescheduledProjectId === pB.id) {
        projectToReschedule = pB;
        fixedProject = pA;
      } else if (pA.work_type === 'paving' && pB.work_type !== 'paving') {
        projectToReschedule = pA;
        fixedProject = pB;
      } else if (pB.work_type === 'paving' && pA.work_type !== 'paving') {
        projectToReschedule = pB;
        fixedProject = pA;
      } else if (pB.start_date >= pA.start_date) {
        // Later project is deferred
        projectToReschedule = pB;
        fixedProject = pA;
      } else {
        projectToReschedule = pA;
        fixedProject = pB;
      }
    } else {
      projectToReschedule = pA || pB;
    }

    if (!conflict || !pA || !pB || !projectToReschedule || !fixedProject) {
      throw new Error('التعارض أو أحد مشاريعه غير موجود');
    }
    const predecessorDate = fixedProject.end_date;

    // Calculate financial savings (Rule 6: only for verified paving conflicts, 0 for utility-to-utility)
    const isPavingConflict = pA?.work_type === 'paving' || pB?.work_type === 'paving';
    const pavingPrj = projectToReschedule.work_type === 'paving' ? projectToReschedule : null;
    if (isPavingConflict) {
      if (!applyDateToProject || !pavingPrj) throw new Error('يجب تطبيق الجدولة على مشروع التزفيت المختار');
      if (!Number.isInteger(safetyBufferDays) || safetyBufferDays < 1) throw new Error('فترة الأمان غير صالحة');
      const candidate = { ...pavingPrj, start_date: approvedDate,
        end_date: addDays(approvedDate, pavingPrj.duration_days - 1) };
      validateProjectDates(candidate);
      const validation = validateProjectUpdate(pavingPrj.id, candidate, this.projects, safetyBufferDays);
      if (validation.hasBlockingConflict || validation.hasReviewNotice || validation.coordinationNotices.some(c => c.conflict_type === 'paving_sequence_notice')) {
        throw new Error('لا يمكن اعتماد الموعد: يوجد تعارض أو موقع يحتاج مراجعة بعد الجدولة');
      }
    }

    const fin = isPavingConflict && pavingPrj
      ? calculatePotentialSavings({
          roadLengthM: options.roadLengthM ?? pavingPrj.road_length_m,
          roadWidthM: options.roadWidthM ?? pavingPrj.road_width_m,
          costPerM2: options.costPerM2,
        })
      : {
          roadLengthM: 0,
          roadWidthM: 0,
          costPerM2: 0,
          totalAvoidableCostSYP: 0,
        };

    const protocolNum = this.nextProtocolNumber();
    const nowIso = new Date().toISOString();

    const isSameType = Boolean(pA && pB && pA.work_type === pB.work_type);
    const coordType = isPavingConflict 
      ? 'paving_stagger' 
      : (isSameType ? 'same_work_stagger' : 'utility_coordination');

    const decision: CoordinationDecision = {
      id: `coord-${conflictId}`,
      conflict_id: conflictId,
      protocol_number: protocolNum,
      paving_project_id: pavingPrj ? pavingPrj.id : '',
      predecessor_project_ids: fixedProject ? [fixedProject.id] : [],
      predecessor_completion_date: predecessorDate,
      // Re-approving must keep the first date, not the one set by the previous approval.
      original_start_date: this.getCoordinationDecisionForConflict(conflictId)?.original_start_date ?? projectToReschedule.start_date,
      safety_buffer_days: safetyBufferDays,
      proposed_paving_date: approvedDate,
      approved_paving_date: approvedDate,
      road_length_m: fin.roadLengthM,
      road_width_m: fin.roadWidthM,
      cost_per_m2: fin.costPerM2,
      estimated_avoidable_cost: fin.totalAvoidableCostSYP,
      review_status: 'approved',
      reviewed_by: engineerName,
      reviewed_at: nowIso,
      notes: notes || (isPavingConflict 
        ? `تم اعتماد الجدولة المنسقة وتتابع الأعمال للمشروع (${pavingPrj?.code || projectToReschedule?.code}) وفض التعارض نهائياً`
        : `محضر اعتماد تنسيق ميداني واشتراطات سلامة مهنية بين ورشات (${pA?.code}) و (${pB?.code}) دون تعديل المواعيد المعتمدة`),
      action_applied_to_project: isPavingConflict && applyDateToProject,
      rescheduled_project_id: pavingPrj?.id || projectToReschedule.id,
      coordination_type: coordType,
    };

    this.saveCoordinationDecision(decision);

    // Apply new date ONLY to paving projects per Rule 5 (Only generate automatic proposed rescheduling dates for paving projects)
    let updatedProject: Project | null = null;
    if (applyDateToProject && isPavingConflict && pavingPrj) {
      const duration = pavingPrj.duration_days || 1;
      const end = addDays(approvedDate, duration - 1);

      updatedProject = this.updateProject(pavingPrj.id, {
        start_date: approvedDate,
        end_date: end,
      });
    }

    // Update or record the conflict state as 'resolved'
    if (conflict) {
      this.conflictRecords[conflictId] = {
        ...conflict,
        status: 'resolved',
        resolved_at: nowIso,
        resolved_by: engineerName,
        resolution_type: isPavingConflict ? 'rescheduled' : 'joint_execution',
        resolution_notes: notes || (isPavingConflict 
          ? `تم فض التعارض عبر تتابع الأعمال وتأجيل موعد (${pavingPrj?.code || projectToReschedule?.code}) إلى (${approvedDate}) بموجب المحضر الرسمي`
          : `تم اعتماد محضر التنسيق الميداني واشتراطات السلامة المشتركة دون تغيير التواريخ المعتمدة`),
        protocol_number: protocolNum,
        avoided_cost_syp: fin.totalAvoidableCostSYP,
        approved_paving_date: approvedDate,
      };
    }

    this.persist();
    return { decision, updatedProject };
  }

  /**
   * Quick-resolves any conflict (including same-type works) by staggering the later project
   * right after the earlier one finishes, with an automatic protocol and record.
   */
  public quickResolveConflictByStagger(
    conflictId: string,
    engineerName: string = 'م. عمار الشريف (رئيس قسم التنسيق البلدي)'
  ): { decision: CoordinationDecision; updatedProject: Project | null } {
    const conflicts = this.getConflicts();
    const conflict = conflicts.find((c) => c.id === conflictId) || this.conflictRecords[conflictId];
    if (!conflict) {
      throw new Error('التعارض غير موجود');
    }

    const pA = this.getProjectById(conflict.project_a_id);
    const pB = this.getProjectById(conflict.project_b_id);

    if (!pA || !pB) {
      return this.approveCoordinationSchedule(conflictId, '2026-11-15', undefined, engineerName, true);
    }

    const isPaving = pA.work_type === 'paving' || pB.work_type === 'paving';
    if (!isPaving) {
      // Rule 2: Two underground utilities do NOT auto-reschedule; record field coordination notice approval without date changes
      return this.approveCoordinationSchedule(
        conflictId,
        pB.start_date,
        'محضر اعتماد تنسيق ميداني واشتراطات سلامة لأعمال مرافق متزامنة دون تعديل المواعيد المعتمدة تلقائياً',
        engineerName,
        false
      );
    }

    const safetyBuffer = 5;

    const schedule = proposeGenericCoordinationSchedule(
      pA,
      pB,
      safetyBuffer,
      undefined,
      this.projects
    );

    return this.approveCoordinationSchedule(
      conflictId,
      schedule.proposedStartDate,
      schedule.explanation,
      engineerName,
      true,
      schedule.rescheduledProject.id
    );
  }

  /**
   * Dismisses a conflict with official engineering justification (e.g. verified different side of road or no clash).
   */
  public dismissConflict(
    conflictId: string,
    reason: string,
    engineerName: string = 'المهندس المشرف الميداني'
  ): Conflict | null {
    const conflict = this.getConflicts().find((c) => c.id === conflictId);
    if (!conflict) return null;

    const protocolNum = this.nextProtocolNumber();
    const updated: Conflict = {
      ...conflict,
      status: 'dismissed',
      resolved_at: new Date().toISOString(),
      resolved_by: engineerName,
      resolution_type: 'dismissed_with_reason',
      resolution_notes: reason,
      protocol_number: protocolNum,
    };

    this.conflictRecords[conflictId] = updated;
    this.persist();
    return updated;
  }

  /**
   * Reopens a resolved or dismissed conflict back to active state.
   * Returns false when the current schedule no longer produces the conflict, so
   * there is nothing to list; its protocol still moves to review.
   */
  public reopenConflict(conflictId: string): boolean {
    if (!this.conflictRecords[conflictId]) return false;
    delete this.conflictRecords[conflictId];
    const decision = this.coordinations.find((c) => c.conflict_id === conflictId);
    if (decision) decision.review_status = 'pending';
    this.persist();
    return this.detectCurrentConflicts().some((c) => c.id === conflictId);
  }

  /**
   * Updates street segment for a project directly and triggers re-detection.
   */
  public updateStreetSegment(projectId: string, newSegment: string): Project | null {
    return this.updateProject(projectId, {
      street_segment: newSegment,
      location_review_needed: false,
      location_confidence: 1.0,
    });
  }

  public resetToSeedData(): void {
    this.zones = structuredClone(INITIAL_ZONES);
    this.projects = structuredClone(INITIAL_PROJECTS);
    this.coordinations = [];
    this.conflictRecords = {};
    this.protocolSerial = 42;
    this.persist();
  }

  /**
   * Applies specific pre-configured demonstration scenarios
   */
  public applyScenario(scenario: 'A' | 'B' | 'C' | 'D' | 'E'): void {
    if (!this.savedWorkspace) {
      this.savedWorkspace = JSON.stringify({ zones: this.zones, projects: this.projects,
        coordinations: this.coordinations, conflictRecords: this.conflictRecords, protocolSerial: this.protocolSerial });
    }
    this.resetToSeedData();

    if (scenario === 'A') {
      // Scenario A: Paving Nov 6 overlaps water digging Nov 5-7 in same segment -> High conflict!
    } else if (scenario === 'B') {
      // Scenario B: Keep only Projects 1 and 3 (Water in Jazmatiya and Electricity in Corniche) -> 0 conflicts!
      this.projects = this.projects.filter(
        (p) => p.id === 'prj-demo-001' || p.id === 'prj-demo-003'
      );
      this.persist();
    } else if (scenario === 'C') {
      // Scenario C: Uncertain location alias -> needs_review flag
      this.projects = this.projects.filter(
        (p) => p.id === 'prj-demo-004' || p.id === 'prj-demo-005' || p.id === 'prj-demo-006'
      );
      this.persist();
    } else if (scenario === 'D') {
      // Scenario D: Coordinated paving after underground job and buffer -> no active conflict
      const pavingIdx = this.projects.findIndex((p) => p.id === 'prj-demo-002');
      if (pavingIdx >= 0) {
        this.projects[pavingIdx].start_date = '2026-11-13';
        this.projects[pavingIdx].end_date = '2026-11-13';
      }
      const mazzehPavingIdx = this.projects.findIndex((p) => p.id === 'prj-demo-006');
      if (mazzehPavingIdx >= 0) {
        this.projects[mazzehPavingIdx].start_date = '2026-11-24';
        this.projects[mazzehPavingIdx].end_date = '2026-11-25';
      }
      this.persist();
    } else if (scenario === 'E') {
      // Scenario E: Focus on financial recalculation
    }
  }
}

export const repository = new MunicipalDataRepository();
<<<END FILE>>>
