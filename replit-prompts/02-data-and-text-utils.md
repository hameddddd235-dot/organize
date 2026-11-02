# البرومبت 2 من 13: الأنواع والبيانات وأدوات النص والتاريخ

أكمل نسخ المشروع. هذه الملفات تحتوي الأنواع وبيانات دمشق التجريبية وأدوات التواريخ والنص العربي.

قواعد النسخ في هذا البرومبت:
- أنشئ كل ملف محاط بالعلامتين <<<FILE: المسار>>> و<<<END FILE>>> في المسار نفسه، وبمحتواه حرفياً. العلامتان نفسهما لا تدخلان في الملف.
- لا تُعد صياغة أي نص عربي، ولا تغيّر أي class أو لون أو اسم أو رقم، ولا تحسّن الكود ولا تعيد تنظيمه.
- إذا كان ملف بهذا المسار موجوداً، فاستبدله بالكامل.
- قد لا يعمل المشروع قبل البرومبت 11 لأن بعض الملفات لم تصل بعد. لا تنشئ بدائل مؤقتة ولا تحذف أي import.
- عند الانتهاء اكتب أسماء الملفات التي أنشأتها فقط، وانتظر البرومبت التالي.

<<<FILE: src/types/index.ts>>>
// src/types/index.ts

export type AuthorityType = 
  | 'water'                   // المؤسسة العامة لمياه الشرب
  | 'electricity'             // الشركة العامة للكهرباء
  | 'sanitation'              // مديرية الصرف الصحي
  | 'telecom'                 // الشركة السورية للاتصالات
  | 'paving'                  // مديرية الصيانة والتعبيد البلدية
  | 'municipality_maintenance'; // الصيانة العامة

export type WorkType = 
  | 'water'
  | 'electricity'
  | 'sanitation'
  | 'telecom'
  | 'paving';

export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'suspended';

export type ExtractionSource = 'offline_parser' | 'real_ai' | 'simulated_ai' | 'manual_entry';

export interface Zone {
  id: string;
  name_ar: string;
  neighborhood_ar: string;
  aliases: string[];
}

export interface Project {
  document_reference?: string;
  document_date?: string;
  analysis_warnings?: string[];
  analysis_evidence?: { field: string; quote: string }[];
  id: string;
  code: string; // e.g. "PRJ-2026-001"
  authority: AuthorityType;
  authority_name_ar: string;
  work_type: WorkType;
  work_type_name_ar: string;
  title_ar: string;
  original_text: string;
  zone_id: string;
  zone_name_ar: string;
  street_segment: string;
  landmark?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  duration_days: number;
  status: ProjectStatus;
  source: ExtractionSource;
  location_confidence: number; // 0.0 to 1.0
  location_review_needed: boolean;
  road_length_m: number;
  road_width_m: number;
  created_at: string;
  is_synthetic: boolean;
}

export type ConflictSeverity = 'high' | 'notice' | 'review' | 'medium';

export type ConflictType = 
  | 'paving_sequence_notice'         // Non-overlapping sequencing/safety advice
  | 'paving_conflict'                 // تعارض مع التزفيت (blocking)
  | 'paving_before_excavation'         // تعارض مع التزفيت (alias for compatibility)
  | 'utility_coordination_notice'     // تنبيه تنسيقي (non-blocking)
  | 'overlapping_excavation'          // تنبيه تنسيقي (alias for compatibility)
  | 'same_work_type_collision'        // تنبيه تنسيقي (alias for compatibility)
  | 'uncertain_location_review'       // بحاجة إلى مراجعة
  | 'spatial_proximity_needs_review'  // بحاجة إلى مراجعة (alias for compatibility)
  | 'no_conflict';                    // لا يوجد تعارض

export interface Conflict {
  id: string;
  project_a_id: string; // Project A (e.g. Underground digging)
  project_b_id: string; // Project B (e.g. Paving or another digging)
  conflict_type: ConflictType;
  conflict_type_label_ar: string; // "تعارض مع التزفيت" | "تنبيه تنسيقي" | "بحاجة إلى مراجعة" | "لا يوجد تعارض"
  severity: ConflictSeverity;
  is_blocking: boolean; // Only true for confirmed paving-related blocking conflicts!
  explanation: string;
  zone_id: string;
  zone_name_ar: string;
  street_segment: string;
  temporal_overlap_days: number;
  status: 'detected' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  // Practical operational resolution fields
  resolved_at?: string;
  resolved_by?: string;
  resolution_type?: 'rescheduled' | 'location_corrected' | 'joint_execution' | 'dismissed_with_reason';
  resolution_notes?: string;
  protocol_number?: string;
  avoided_cost_syp?: number;
  approved_paving_date?: string;
}

export interface CoordinationDecision {
  id: string;
  conflict_id: string;
  protocol_number: string;
  paving_project_id: string;
  predecessor_project_ids: string[];
  predecessor_completion_date: string;
  original_start_date?: string; // Rescheduled project's date before this decision
  safety_buffer_days: number;
  proposed_paving_date: string;
  approved_paving_date: string | null;
  road_length_m: number;
  road_width_m: number;
  cost_per_m2: number;
  estimated_avoidable_cost: number;
  review_status: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  action_applied_to_project?: boolean;
  rescheduled_project_id?: string;
  coordination_type?: 'paving_stagger' | 'same_work_stagger' | 'excavation_stagger' | 'utility_coordination';
}

export interface ZoneMatchResult {
  matchedZone: Zone | null;
  confidence: number;
  matchedAlias?: string;
  isAmbiguous: boolean;
  candidateZones: { zone: Zone; score: number; reason: string }[];
}

export interface ExtractedWorkOrder {
  document_reference?: string;
  document_date?: string;
  warnings?: string[];
  evidence?: { field: string; quote: string }[];

  authority: AuthorityType | '';
  authority_name_ar: string;
  work_type: WorkType | '';
  work_type_name_ar: string;
  title_ar: string;
  original_location: string;
  neighborhood: string;
  street: string;
  zone_id: string;
  zone_name_ar: string;
  street_segment: string;
  landmark: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  missing_fields: string[];
  location_confidence: number;
  location_review_needed: boolean;
  extraction_source: ExtractionSource;
  road_length_m: number;
  road_width_m: number;
}
<<<END FILE>>>

<<<FILE: src/data/seedData.ts>>>
// src/data/seedData.ts
import { Zone, Project } from '../types';

export const INITIAL_ZONES: Zone[] = [
  {
    id: 'zone-midan',
    name_ar: 'حي الميدان',
    neighborhood_ar: 'دمشق - الميدان الفوقاني والوسطاني',
    aliases: [
      'الميدان',
      'حي الميدان',
      'شارع الميدان الرئيسي',
      'ميدان جزماتية',
      'باب مصلى',
      'بوابة الميدان',
      'الجزماتية'
    ],
  },
  {
    id: 'zone-mezzeh',
    name_ar: 'حي المزة',
    neighborhood_ar: 'دمشق الغربية - المزة فيلات وأوتستراد',
    aliases: [
      'المزة',
      'حي المزة',
      'اوتستراد المزة',
      'أوتستراد المزة',
      'مزة فيلات غربية',
      'مزة فيلات شرقية',
      'مزة جبل',
      'شيخ سعد',
      'المزة القديمة',
      'شارع الجلاء',
      'الجلاء'
    ],
  },
  {
    id: 'zone-qassaa',
    name_ar: 'حي القصاع',
    neighborhood_ar: 'دمشق الشرقية - باب توما والقصاع',
    aliases: [
      'القصاع',
      'حي القصاع',
      'شارع القصاع',
      'الغساني',
      'برج الروس',
      'ساحة جورج خوري',
      'باب شرقي',
      'باب توما'
    ],
  },
  {
    id: 'zone-kafrsouseh',
    name_ar: 'كفرسوسة',
    neighborhood_ar: 'دمشق الجنوبية الغربية - تنظيم كفرسوسة',
    aliases: [
      'كفرسوسة',
      'كفر سوسة',
      'تنظيم كفرسوسة',
      'كفرسوسة البلد',
      'شارع اللوان'
    ],
  },
  {
    id: 'zone-sarouja',
    name_ar: 'ساروجة',
    neighborhood_ar: 'دمشق المركزية - سوق ساروجة والعقيبة',
    aliases: [
      'ساروجة',
      'سوق ساروجة',
      'حي ساروجة',
      'شارع الثورة',
      'شارع بغداد',
      'العقيبة'
    ],
  },
  {
    id: 'zone-ruknaldin',
    name_ar: 'ركن الدين',
    neighborhood_ar: 'دمشق الشمالية - سفح قاسيون',
    aliases: [
      'ركن الدين',
      'حي ركن الدين',
      'شارع أسد الدين',
      'ساحة شمدين',
      'ميسات'
    ],
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-demo-001',
    code: 'PRJ-2026-001',
    authority: 'water',
    authority_name_ar: 'المؤسسة العامة لمياه الشرب بدمشق',
    work_type: 'water',
    work_type_name_ar: 'مياه وشبكات ضخ',
    title_ar: 'استبدال أنبوب مياه رئيسي قطر 300 مم متضرر',
    original_text: 'إلى بلدية الميدان: يرجى العلم بأنه تم تكليف ورشات مؤسسة مياه الشرب بالبدء بأعمال حفر واستبدال خط المياه الرئيسي المغذي في شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر ابتداءً من تاريخ 5 تشرين الثاني 2026 ولمدة 3 أيام عمل حتى 7 تشرين الثاني 2026.',
    zone_id: 'zone-midan',
    zone_name_ar: 'حي الميدان',
    street_segment: 'شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر',
    landmark: 'جامع الماجد',
    start_date: '2026-11-05',
    end_date: '2026-11-07',
    duration_days: 3,
    status: 'planned',
    source: 'offline_parser',
    location_confidence: 1.0,
    location_review_needed: false,
    road_length_m: 420,
    road_width_m: 14,
    created_at: '2026-10-28T09:00:00Z',
    is_synthetic: true,
  },
  {
    id: 'prj-demo-002',
    code: 'PRJ-2026-002',
    authority: 'paving',
    authority_name_ar: 'مديرية الصيانة والإنشاءات البلدية',
    work_type: 'paving',
    work_type_name_ar: 'تعبيد وتزفيت سطحي',
    title_ar: 'تزفيت وإعادة تأهيل قميص إسفلتي لشارع الجزماتية',
    original_text: 'أمر تشغيل صيانة طرق رقم 402/ص: تنفيذ مد قميص إسفلتي ساخن وإعادة تأهيل طبقة الاهتراء في شارع الجزماتية الممتد بين تقاطع البلدية وساحة الأشمر، وذلك بتاريخ 6 تشرين الثاني 2026 (يوم واحد) لإعادة فتح الطريق أمام السير.',
    zone_id: 'zone-midan',
    zone_name_ar: 'حي الميدان',
    street_segment: 'شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر',
    landmark: 'تقاطع بلدية الميدان',
    start_date: '2026-11-06',
    end_date: '2026-11-06',
    duration_days: 1,
    status: 'planned',
    source: 'offline_parser',
    location_confidence: 1.0,
    location_review_needed: false,
    road_length_m: 420,
    road_width_m: 14,
    created_at: '2026-10-29T11:30:00Z',
    is_synthetic: true,
  },
  {
    id: 'prj-demo-003',
    code: 'PRJ-2026-003',
    authority: 'electricity',
    authority_name_ar: 'الشركة العامة لكهرباء محافظة دمشق',
    work_type: 'electricity',
    work_type_name_ar: 'تمديدات كهرباء وتوتر',
    title_ar: 'مد كابلات توتر متوسط أرضية وتغذية مركز التحويل',
    original_text: 'إشعار صيانة وتمديد: ستقوم ورشات طوارئ الكهرباء بحفر مسار كابلات توتر متوسط على جانب كورنيش الميدان مقطع جسر الميدان من 5 تشرين الثاني 2026 حتى 8 تشرين الثاني 2026.',
    zone_id: 'zone-midan',
    zone_name_ar: 'حي الميدان',
    street_segment: 'شارع كورنيش الميدان مقطع جسر الميدان',
    landmark: 'قرب جسر الميدان',
    start_date: '2026-11-05',
    end_date: '2026-11-08',
    duration_days: 4,
    status: 'planned',
    source: 'offline_parser',
    location_confidence: 1.0,
    location_review_needed: false,
    road_length_m: 300,
    road_width_m: 12,
    created_at: '2026-10-30T08:15:00Z',
    is_synthetic: true,
  },
  {
    id: 'prj-demo-004',
    code: 'PRJ-2026-004',
    authority: 'telecom',
    authority_name_ar: 'الشركة السورية للاتصالات - فرع دمشق',
    work_type: 'telecom',
    work_type_name_ar: 'اتصالات وألياف ضوئية',
    title_ar: 'تمديد أنابيب ألياف ضوئية لخدمة النطاق العريض',
    original_text: 'مذكرة رقم ت/71: تمديد تفريعات كوابل فايبر في منطقة المزة بجوار جامع الرحمن دون تحديد اسم الشارع بدقة، الموعد المقترح 15 تشرين الثاني 2026 حتى 17 تشرين الثاني 2026.',
    zone_id: 'zone-mezzeh',
    zone_name_ar: 'حي المزة',
    street_segment: 'منطقة المزة جانب جامع الرحمن (مقطع غير مؤكد)',
    landmark: 'جامع الرحمن',
    start_date: '2026-11-15',
    end_date: '2026-11-17',
    duration_days: 3,
    status: 'planned',
    source: 'offline_parser',
    location_confidence: 0.65,
    location_review_needed: true, // Marked for human review
    road_length_m: 250,
    road_width_m: 10,
    created_at: '2026-10-30T14:00:00Z',
    is_synthetic: true,
  },
  {
    id: 'prj-demo-005',
    code: 'PRJ-2026-005',
    authority: 'sanitation',
    authority_name_ar: 'مديرية الصرف الصحي بمحافظة دمشق',
    work_type: 'sanitation',
    work_type_name_ar: 'صرف صحي ومطريات',
    title_ar: 'إصلاح هبوط ريكار رئيسي ومد خط تصريف مطري',
    original_text: 'بلاغ صيانة عاجل: أعمال صيانة شبكة الصرف الصحي في أوتستراد المزة - المقطع الخدمي جانب برج الفردوس اعتباراً من 15 تشرين الثاني 2026 إلى 18 تشرين الثاني 2026.',
    zone_id: 'zone-mezzeh',
    zone_name_ar: 'حي المزة',
    street_segment: 'أوتستراد المزة - المقطع الخدمي جانب برج الفردوس',
    landmark: 'برج الفردوس',
    start_date: '2026-11-15',
    end_date: '2026-11-18',
    duration_days: 4,
    status: 'planned',
    source: 'offline_parser',
    location_confidence: 0.95,
    location_review_needed: false,
    road_length_m: 550,
    road_width_m: 16,
    created_at: '2026-10-31T09:20:00Z',
    is_synthetic: true,
  },
  {
    id: 'prj-demo-006',
    code: 'PRJ-2026-006',
    authority: 'paving',
    authority_name_ar: 'مديرية الصيانة والإنشاءات البلدية',
    work_type: 'paving',
    work_type_name_ar: 'تعبيد وتزفيت سطحي',
    title_ar: 'مشروع تزفيت المقطع الخدمي لأوتستراد المزة',
    original_text: 'خطة تعبيد المحافظة: تزفيت المقطع الخدمي لأوتستراد المزة جانب برج الفردوس بتاريخ 16 تشرين الثاني 2026 إلى 17 تشرين الثاني 2026.',
    zone_id: 'zone-mezzeh',
    zone_name_ar: 'حي المزة',
    street_segment: 'أوتستراد المزة - المقطع الخدمي جانب برج الفردوس',
    landmark: 'برج الفردوس',
    start_date: '2026-11-16',
    end_date: '2026-11-17',
    duration_days: 2,
    status: 'planned',
    source: 'offline_parser',
    location_confidence: 0.95,
    location_review_needed: false,
    road_length_m: 550,
    road_width_m: 16,
    created_at: '2026-10-31T10:00:00Z',
    is_synthetic: true,
  }
];

export const SAMPLE_WORK_ORDERS = [
  {
    id: 'order-sample-1',
    title: 'سيناريو أ: مياه الميدان (حفر 5-7 تشرين الثاني)',
    text: `الجمهورية العربية السورية
محافظة دمشق - المؤسسة العامة لمياه الشرب والصرف الصحي
أمر ملاحقة أعمال حفر طارئة رقم: م/2026/891
الجهة المنفذة: ورشات شبكات المياه
الموقع: دمشق - حي الميدان، شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر
المعلم: قرب جامع الماجد
نوع الأعمال: استبدال خط مياه رئيسي قطر 300 مم مهترئ ومعالجة التسرب
تاريخ البدء المعتمد: 5 تشرين الثاني 2026
مدة العمل التقديرية: 3 أيام عمل
المواصفات الهندسية: حفر خندق طولي بعمق 1.8 متر وإشغال نصف عرض الشارع`,
  },
  {
    id: 'order-sample-2',
    title: 'سيناريو أ: تعبيد الميدان (تزفيت 6 تشرين الثاني - تعارض مباشر)',
    text: `الجمهورية العربية السورية
محافظة دمشق - مديرية الصيانة والإنشاءات البلدية
أمر تشغيل تزفيت وتعبيد طرق رقم: ص/2026/402
الجهة المنفذة: دائرة التعبيد والخلطات الإسفلتية
الموقع: حي الميدان - شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر
نوع العمل: فرش طبقة اهتراء قميص إسفلتي ساخن وسد الحفر
تاريخ التنفيذ: 6 تشرين الثاني 2026
المدة: 1 يوم فقط
ملاحظة: يتطلب تفريغ الشارع من الآليات وإعادة فتحه أمام المرور فور الانتهاء`,
  },
  {
    id: 'order-sample-3',
    title: 'سيناريو ب: كهرباء كورنيش الميدان (مقطع مختلف - لا يوجد تعارض)',
    text: `الشركة العامة لكهرباء محافظة دمشق
إشعار تمديدات أرضية رقم ك/2026/512
الموقع: حي الميدان - شارع كورنيش الميدان مقطع جسر الميدان
المعلم: بجانب جسر الميدان
النوع: حفر وتمديد كابلات كهرباء توتر متوسط ومحطة تحويل
تاريخ البدء: 5 تشرين الثاني 2026
المدة: 4 أيام عمل حتى 8 تشرين الثاني 2026`,
  },
  {
    id: 'order-sample-4',
    title: 'سيناريو ج: اتصالات المزة (موقع غامض - يتطلب مراجعة بشرية)',
    text: `الشركة السورية للاتصالات - الإدارة الفنية
مذكرة عمل ميداني رقم: ات/2026/104
الجهة: قسم الكوابل الضوئية
الموقع المستهدف: منطقة المزة جانب جامع الرحمن
نوع الأعمال: مد شبكة فايبر ضوئية FTTH
تاريخ البدء: 15 تشرين الثاني 2026
المدة المقدرة: 3 أيام
تنبيه: مسار الحفر التفصيلي والمقطع الطرقي قيد التحديد الميداني من قبل المراقب الفني`,
  },
  {
    id: 'order-sample-5',
    title: 'أمر عمل صرف صحي بالقصاع',
    text: `محافظة دمشق - مديرية الصرف الصحي
أمر عمل طارئ رقم ص.ص/2026/331
الجهة المنفذة: ورشة الصرف الصحي
الموقع: حي القصاع - شارع الغساني من ساحة جورج خوري إلى برج الروس
المعلم: ساحة جورج خوري
نوع العمل: استبدال قساطل صرف صحي بيتونية قطر 500 مم
تاريخ البدء: 20 تشرين الثاني 2026
المدة: 5 أيام عمل`,
  }
];
<<<END FILE>>>

<<<FILE: src/utils/dateUtils.ts>>>
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
<<<END FILE>>>

<<<FILE: src/utils/arabic.ts>>>
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
<<<END FILE>>>

<<<FILE: src/utils/zoneMatcher.ts>>>
// src/utils/zoneMatcher.ts
import { Zone, ZoneMatchResult } from '../types';
import { normalizeArabic } from './arabic';

/**
 * Matches extracted text or location query against controlled canonical zones and aliases.
 * Strictly uses exact substring inclusion of normalized aliases, without fabricating fuzzy probabilities.
 */
export function matchZone(locationText: string, zones: Zone[]): ZoneMatchResult {
  if (!locationText || !zones || zones.length === 0) {
    return {
      matchedZone: null,
      confidence: 0,
      isAmbiguous: true,
      candidateZones: [],
    };
  }

  const normInput = normalizeArabic(locationText);
  const candidates: { zone: Zone; score: number; matchedAlias: string; reason: string }[] = [];

  for (const zone of zones) {
    let bestScoreForZone = 0;
    let bestAliasForZone = '';
    let matchReason = '';

    // Check exact canonical name match
    const normCanonical = normalizeArabic(zone.name_ar);
    if (normInput.includes(normCanonical) || normCanonical.includes(normInput)) {
      bestScoreForZone = 1.0;
      bestAliasForZone = zone.name_ar;
      matchReason = `تطابق تام مع الاسم الرسمي للحي: "${zone.name_ar}"`;
    }

    // Check aliases
    for (const alias of zone.aliases) {
      const normAlias = normalizeArabic(alias);
      if (normInput.includes(normAlias)) {
        // Longer alias matches are stronger
        const score = normAlias.length >= 8 ? 0.95 : 0.85;
        if (score > bestScoreForZone) {
          bestScoreForZone = score;
          bestAliasForZone = alias;
          matchReason = `تطابق مع الاسم الشائع المعتمد: "${alias}"`;
        }
      }
    }

    // Neighborhood match
    const normNeighborhood = normalizeArabic(zone.neighborhood_ar);
    if (normInput.includes(normNeighborhood)) {
      if (0.80 > bestScoreForZone) {
        bestScoreForZone = 0.80;
        bestAliasForZone = zone.neighborhood_ar;
        matchReason = `تطابق مع توصيف المنطقة: "${zone.neighborhood_ar}"`;
      }
    }

    if (bestScoreForZone > 0) {
      candidates.push({
        zone,
        score: bestScoreForZone,
        matchedAlias: bestAliasForZone,
        reason: matchReason,
      });
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return {
      matchedZone: null,
      confidence: 0,
      isAmbiguous: true,
      candidateZones: [],
    };
  }

  const top = candidates[0];

  // Ambiguity check: if there is a second candidate with a score close to the top candidate (delta <= 0.15)
  if (candidates.length > 1 && (top.score - candidates[1].score) <= 0.15) {
    return {
      matchedZone: top.zone,
      confidence: top.score,
      matchedAlias: top.matchedAlias,
      isAmbiguous: true,
      candidateZones: candidates.map((c) => ({
        zone: c.zone,
        score: c.score,
        reason: c.reason,
      })),
    };
  }

  // If score is lower than 0.80, mark as ambiguous
  const isAmbiguous = top.score < 0.80;

  return {
    matchedZone: top.zone,
    confidence: top.score,
    matchedAlias: top.matchedAlias,
    isAmbiguous,
    candidateZones: candidates.map((c) => ({
      zone: c.zone,
      score: c.score,
      reason: c.reason,
    })),
  };
}
<<<END FILE>>>
