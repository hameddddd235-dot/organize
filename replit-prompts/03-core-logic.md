# البرومبت 3 من 13: كشف التعارضات والجدولة والحساب المالي

أكمل نسخ المشروع. هذه الملفات هي منطق النظام الأساسي، وأي تعديل صغير فيها يغيّر نتائج التعارضات.

قواعد النسخ في هذا البرومبت:
- أنشئ كل ملف محاط بالعلامتين <<<FILE: المسار>>> و<<<END FILE>>> في المسار نفسه، وبمحتواه حرفياً. العلامتان نفسهما لا تدخلان في الملف.
- لا تُعد صياغة أي نص عربي، ولا تغيّر أي class أو لون أو اسم أو رقم، ولا تحسّن الكود ولا تعيد تنظيمه.
- إذا كان ملف بهذا المسار موجوداً، فاستبدله بالكامل.
- قد لا يعمل المشروع قبل البرومبت 11 لأن بعض الملفات لم تصل بعد. لا تنشئ بدائل مؤقتة ولا تحذف أي import.
- عند الانتهاء اكتب أسماء الملفات التي أنشأتها فقط، وانتظر البرومبت التالي.

<<<FILE: src/utils/conflictDetector.ts>>>
// src/utils/conflictDetector.ts
import { Project, Conflict, ConflictSeverity, ConflictType } from '../types';
import { datesOverlap, getOverlapDays, formatArabicDateFriendly, addDays } from './dateUtils';
import { normalizeArabic } from './arabic';

/**
 * Checks whether two street segment descriptions represent the same segment,
 * verified different segments, or an uncertain location.
 */
export function evaluateSegmentMatch(
  segA: string,
  segB: string
): { isMatch: boolean; isDefinitelyDifferent: boolean; isUncertain: boolean; reason: string } {
  if (!segA || !segB) {
    return {
      isMatch: false,
      isDefinitelyDifferent: false,
      isUncertain: true,
      reason: 'أحد المشروعين لا يحدد مقطع الشارع بدقة',
    };
  }

  const normA = normalizeArabic(segA);
  const normB = normalizeArabic(segB);

  // Check for explicit uncertainty indicators in segment text
  const uncertaintyKeywords = ['غير مؤكد', 'غير محدد', 'بجوار', 'قيد التحديد', 'تقريبي'];
  const hasUncertainty = uncertaintyKeywords.some((k) => normA.includes(k) || normB.includes(k));

  if (hasUncertainty) {
    return {
      isMatch: false,
      isDefinitelyDifferent: false,
      isUncertain: true,
      reason: 'وصف أحد المقاطع تقريبي أو غير مؤكد هندسياً',
    };
  }

  // Check key road landmarks and names across Damascus
  const knownStreets = [
    { key: 'جزماتيه', label: 'شارع الجزماتية' },
    { key: 'كورنيش الميدان', label: 'كورنيش الميدان' },
    { key: 'اوتستراد المزه', label: 'أوتستراد المزة' },
    { key: 'فيلات غربيه', label: 'المزة فيلات غربية' },
    { key: 'فيلات شرقيه', label: 'المزة فيلات شرقية' },
    { key: 'غساني', label: 'شارع الغساني' },
    { key: 'بغداد', label: 'شارع بغداد' },
    { key: 'ثوره', label: 'شارع الثورة' },
    { key: 'اسد الدين', label: 'شارع أسد الدين' },
    { key: 'خالد بن الوليد', label: 'شارع خالد بن الوليد' },
    { key: 'النصر', label: 'شارع النصر' },
    { key: 'الحمراء', label: 'شارع الحمراء' },
    { key: 'الصالحيه', label: 'شارع الصالحية' },
    { key: 'اللوان', label: 'شارع اللوان' },
    { key: 'شمدين', label: 'ساحة شمدين' },
    { key: 'جورج خوري', label: 'ساحة جورج خوري' },
    { key: 'برج الروس', label: 'برج الروس' },
  ];

  let streetA: string | null = null;
  let streetB: string | null = null;

  for (const item of knownStreets) {
    if (normA.includes(item.key)) streetA = item.key;
    if (normB.includes(item.key)) streetB = item.key;
  }

  // If both identified known streets and they differ -> verified different segments!
  if (streetA && streetB && streetA !== streetB) {
    return {
      isMatch: false,
      isDefinitelyDifferent: true,
      isUncertain: false,
      reason: `مقاطع شوارع مختلفة وموثقة في نفس الحي (${streetA} مقابل ${streetB})`,
    };
  }

  // If exact or very high substring match
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return {
      isMatch: true,
      isDefinitelyDifferent: false,
      isUncertain: false,
      reason: 'تطابق كامل في المقطع الطرقي المحدد',
    };
  }

  // If same identified street (e.g. both on الجزماتية)
  if (streetA && streetB && streetA === streetB) {
    return {
      isMatch: true,
      isDefinitelyDifferent: false,
      isUncertain: false,
      reason: `اشتراك في نفس المحور الطرقي الرئيسي (${streetA})`,
    };
  }

  // If both contain distinct street naming tokens with no overlap
  const cleanTokensA = normA.split(' ').filter(w => w.length > 3 && !['شارع', 'طريق', 'مقطع', 'جانب', 'قرب', 'امام'].includes(w));
  const cleanTokensB = normB.split(' ').filter(w => w.length > 3 && !['شارع', 'طريق', 'مقطع', 'جانب', 'قرب', 'امام'].includes(w));
  const hasSharedToken = cleanTokensA.some(t => cleanTokensB.includes(t));

  if (!hasSharedToken && cleanTokensA.length >= 2 && cleanTokensB.length >= 2) {
    return {
      isMatch: false,
      isDefinitelyDifferent: true,
      isUncertain: false,
      reason: 'مقاطع طرقية مختلفة تماماً بدون تقاطع في المسار',
    };
  }

  return {
    isMatch: false,
    isDefinitelyDifferent: false,
    isUncertain: true,
    reason: 'تشابه جزئي غير كافٍ للجزم دون مراجعة هندسية',
  };
}

/**
 * Deterministically detects spatial and temporal conflicts among work orders based on the Nabd Al-Hay MVP rules:
 * 1. PAVING VS UNDERGROUND WORK: Blocking HIGH severity conflict ("تعارض مع التزفيت") if underground work
 *    overlaps paving dates. Non-overlapping order/buffer violations are non-blocking notices.
 * 2. UNDERGROUND VS UNDERGROUND: Non-blocking yellow COORDINATION NOTICE ("تنبيه تنسيقي") without automatic rescheduling.
 *    Does NOT count as a blocking conflict.
 * 3. LOCATION VALIDATION:
 *    - Verified matching street segment -> confirmed conflict / notice.
 *    - Ambiguous street match -> "بحاجة إلى مراجعة" (NEEDS_REVIEW, non-blocking).
 *    - Verified different segments -> no conflict ("لا يوجد تعارض").
 */
export function detectConflicts(projects: Project[], safetyBufferDays: number = 1): Conflict[] {
  const conflicts: Conflict[] = [];
  const activeProjects = projects.filter((p) => p.status !== 'completed' && p.status !== 'suspended');

  for (let i = 0; i < activeProjects.length; i++) {
    for (let j = i + 1; j < activeProjects.length; j++) {
      const pA = activeProjects[i];
      const pB = activeProjects[j];

      // Spatial check 1: Must share canonical zone
      if (pA.zone_id !== pB.zone_id) {
        continue; // Different zones -> no conflict
      }

      // Evaluate street segment match
      const segmentEval = evaluateSegmentMatch(pA.street_segment, pB.street_segment);

      // Rule 3: Different verified street segments do NOT conflict even if they share a neighborhood!
      if (segmentEval.isDefinitelyDifferent) {
        continue;
      }

      // Check temporal overlap (inclusive dates)
      const hasTemporalOverlap = datesOverlap(pA.start_date, pA.end_date, pB.start_date, pB.end_date);
      const overlapDays = hasTemporalOverlap ? getOverlapDays(pA.start_date, pA.end_date, pB.start_date, pB.end_date) : 0;

      // Work types classification
      const isAPaving = pA.work_type === 'paving';
      const isBPaving = pB.work_type === 'paving';
      const hasPaving = isAPaving || isBPaving;
      const pavingPrj = isAPaving ? pA : isBPaving ? pB : null;
      const otherPrj = isAPaving ? pB : isBPaving ? pA : null;

      // Check for Location Uncertainty / Needs Review
      const isLocationUncertain = 
        pA.location_review_needed || 
        pB.location_review_needed || 
        pA.location_confidence < 0.8 || 
        pB.location_confidence < 0.8 || 
        segmentEval.isUncertain;

      // RULE 1: PAVING VS UNDERGROUND UTILITY WORK
      if (pavingPrj && otherPrj && otherPrj.work_type !== 'paving') {
        // Paving conflict condition:
        // Underground work is scheduled to overlap the paving or finish after paving starts,
        // or paving starts before underground completes + configured safety buffer.
        const earliestSafePavingStart = addDays(otherPrj.end_date, safetyBufferDays + 1);
        const undergroundFinishesAfterPavingStarts = otherPrj.end_date >= pavingPrj.start_date;
        const pavingStartsBeforeBufferElapsed = pavingPrj.start_date < earliestSafePavingStart;
        const pavingIsPremature = hasTemporalOverlap || undergroundFinishesAfterPavingStarts || pavingStartsBeforeBufferElapsed;

        // Separate real date overlap from sequencing/buffer advice. Non-overlapping
        // work may be saved without a blocking overlap confirmation.
        if (pavingIsPremature && !hasTemporalOverlap) {
          const reason = otherPrj.start_date > pavingPrj.end_date
            ? `أعمال الحفر (${otherPrj.code}) تبدأ بعد انتهاء التزفيت (${pavingPrj.code})؛ راجع ترتيب التنفيذ لتجنب إعادة الحفر.`
            : `الفاصل قبل التزفيت (${pavingPrj.code}) أقل من فترة الأمان (${safetyBufferDays} أيام كاملة) بعد الحفر (${otherPrj.code}). أقرب موعد موصى به: ${formatArabicDateFriendly(earliestSafePavingStart)}.`;
          conflicts.push({
            id: `cnf-${pA.id}-${pB.id}`,
            project_a_id: otherPrj.id, project_b_id: pavingPrj.id,
            conflict_type: isLocationUncertain ? 'spatial_proximity_needs_review' : 'paving_sequence_notice',
            conflict_type_label_ar: isLocationUncertain ? 'مراجعة الموقع وترتيب التنفيذ' : 'تنبيه ترتيب التنفيذ وفترة الأمان',
            severity: isLocationUncertain ? 'review' : 'notice', is_blocking: false,
            explanation: `لا يوجد تداخل زمني بين العملين. ${reason}`,
            zone_id: pA.zone_id, zone_name_ar: pA.zone_name_ar,
            street_segment: pavingPrj.street_segment, temporal_overlap_days: 0,
            status: 'detected', created_at: new Date().toISOString(),
          });
          continue;
        }

        if (pavingIsPremature) {
          if (isLocationUncertain) {
            // Rule 3: If matching location is ambiguous -> mark NEEDS_REVIEW ("بحاجة إلى مراجعة"), NOT high severity!
            conflicts.push({
              id: `cnf-${pA.id}-${pB.id}`,
              project_a_id: otherPrj.id,
              project_b_id: pavingPrj.id,
              conflict_type: 'spatial_proximity_needs_review',
              conflict_type_label_ar: 'بحاجة إلى مراجعة',
              severity: 'review',
              is_blocking: false,
              explanation: `بحاجة إلى مراجعة: تقارب مكاني وزماني بين أمر تعبيد (${pavingPrj.code}) وحفريات مرافق (${otherPrj.code}) في ${pA.zone_name_ar}، ولكن الموقع المذكور (${otherPrj.street_segment}) يتطلب تدقيقاً بشرياً للتأكد من انطباق المسار.`,
              zone_id: pA.zone_id,
              zone_name_ar: pA.zone_name_ar,
              street_segment: pavingPrj.street_segment,
              temporal_overlap_days: overlapDays,
              status: 'detected',
              created_at: new Date().toISOString(),
            });
          } else if (segmentEval.isMatch) {
            // Confirmed blocking conflict with paving ("تعارض مع التزفيت")
            const explanation = `تعارض مع التزفيت: أمر التعبيد والتزفيت (${pavingPrj.code} التابع لـ ${pavingPrj.authority_name_ar}) مجدول بتاريخ (${formatArabicDateFriendly(pavingPrj.start_date)}) قبل اكتمال أعمال الحفر والتمديد تحت الأرض (${otherPrj.code} التابع لـ ${otherPrj.authority_name_ar} والمقرر حتى ${formatArabicDateFriendly(otherPrj.end_date)}) في نفس المقطع: "${pavingPrj.street_segment}". التزفيت الآن سيؤدي حتماً إلى إعادة حفر الطريق وهدر الأموال العامة.`;

            conflicts.push({
              id: `cnf-${pA.id}-${pB.id}`,
              project_a_id: otherPrj.id,
              project_b_id: pavingPrj.id,
              conflict_type: 'paving_conflict',
              conflict_type_label_ar: 'تعارض مع التزفيت',
              severity: 'high',
              is_blocking: true,
              explanation,
              zone_id: pA.zone_id,
              zone_name_ar: pA.zone_name_ar,
              street_segment: pavingPrj.street_segment,
              temporal_overlap_days: overlapDays,
              status: 'detected',
              created_at: new Date().toISOString(),
            });
          }
        }
      } else if (!hasPaving) {
        // RULE 2: UNDERGROUND VS UNDERGROUND (Utility projects overlapping in location and time)
        // Do NOT create a blocking conflict and do NOT automatically reschedule them.
        // Instead, display a non-blocking yellow COORDINATION NOTICE ("تنبيه تنسيقي").
        if (hasTemporalOverlap) {
          if (isLocationUncertain) {
            conflicts.push({
              id: `cnf-${pA.id}-${pB.id}`,
              project_a_id: pA.id,
              project_b_id: pB.id,
              conflict_type: 'spatial_proximity_needs_review',
              conflict_type_label_ar: 'بحاجة إلى مراجعة',
              severity: 'review',
              is_blocking: false,
              explanation: `بحاجة إلى مراجعة: مشروعان للمرافق التحتية (${pA.code} و ${pB.code}) في حي ${pA.zone_name_ar} متزامنان زمنياً مع عدم يقين في المقطع الطرقي، يرجى مراجعة نقطة الالتقاء الميدانية.`,
              zone_id: pA.zone_id,
              zone_name_ar: pA.zone_name_ar,
              street_segment: pA.street_segment,
              temporal_overlap_days: overlapDays,
              status: 'detected',
              created_at: new Date().toISOString(),
            });
          } else if (segmentEval.isMatch) {
            conflicts.push({
              id: `cnf-${pA.id}-${pB.id}`,
              project_a_id: pA.id,
              project_b_id: pB.id,
              conflict_type: 'utility_coordination_notice',
              conflict_type_label_ar: 'تنبيه تنسيقي',
              severity: 'notice',
              is_blocking: false,
              explanation: `تنبيه تنسيقي: تزامن أعمال حفريات تحت الأرض بين (${pA.code} - ${pA.authority_name_ar}) و (${pB.code} - ${pB.authority_name_ar}) في نفس المقطع "${pA.street_segment}" خلال الفترة من ${formatArabicDateFriendly(pA.start_date > pB.start_date ? pA.start_date : pB.start_date)} إلى ${formatArabicDateFriendly(pA.end_date < pB.end_date ? pA.end_date : pB.end_date)} (${overlapDays} أيام تداخل). يتطلب العمل المتزامن تنسيقاً ميدانياً مشتركاً والتحقق من اشتراطات السلامة دون جدولة تلقائية.`,
              zone_id: pA.zone_id,
              zone_name_ar: pA.zone_name_ar,
              street_segment: pA.street_segment,
              temporal_overlap_days: overlapDays,
              status: 'detected',
              created_at: new Date().toISOString(),
            });
          }
        }
      } else if (isAPaving && isBPaving && hasTemporalOverlap) {
        // Two paving projects overlapping on same street
        if (isLocationUncertain) {
          conflicts.push({
            id: `cnf-${pA.id}-${pB.id}`,
            project_a_id: pA.id,
            project_b_id: pB.id,
            conflict_type: 'spatial_proximity_needs_review',
            conflict_type_label_ar: 'بحاجة إلى مراجعة',
            severity: 'review',
            is_blocking: false,
            explanation: `بحاجة إلى مراجعة: تضارب أمرين لتعبيد وتزفيت في حي ${pA.zone_name_ar} في نفس الفترة مع عدم يقين في المقطع الطرقي، يلزم تدقيق المسار هندسياً.`,
            zone_id: pA.zone_id,
            zone_name_ar: pA.zone_name_ar,
            street_segment: pA.street_segment,
            temporal_overlap_days: overlapDays,
            status: 'detected',
            created_at: new Date().toISOString(),
          });
        } else if (segmentEval.isMatch) {
          conflicts.push({
            id: `cnf-${pA.id}-${pB.id}`,
            project_a_id: pA.id,
            project_b_id: pB.id,
            conflict_type: 'paving_conflict',
            conflict_type_label_ar: 'تعارض مع التزفيت',
            severity: 'high',
            is_blocking: true,
            explanation: `تعارض مع التزفيت: تضارب أمرين لتزفيت وتعبيد نفس المقطع الطرقي (${pA.code} و ${pB.code}) في نفس الفترة.`,
            zone_id: pA.zone_id,
            zone_name_ar: pA.zone_name_ar,
            street_segment: pA.street_segment,
            temporal_overlap_days: overlapDays,
            status: 'detected',
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  return conflicts;
}

export type SimilarPavingMatch = 'same_segment' | 'possible_same_segment' | 'same_zone';

export interface SimilarPavingWork {
  project: Project;
  match: SimilarPavingMatch;
  overlapDays: number;
  message: string;
}

/**
 * Finds other active paving works in the same neighborhood, whatever their dates.
 * This is advisory only: it is never persisted as a conflict and never blocks saving,
 * because two paving jobs on different streets are legitimate. Confirmed overlaps on
 * the same segment remain blocking conflicts in detectConflicts.
 */
export function findSimilarPavingWorks(
  target: Pick<Project, 'id' | 'work_type' | 'zone_id' | 'street_segment' | 'start_date' | 'end_date'>,
  allProjects: Project[]
): SimilarPavingWork[] {
  if (target.work_type !== 'paving' || !target.zone_id) return [];

  const rank: Record<SimilarPavingMatch, number> = { same_segment: 0, possible_same_segment: 1, same_zone: 2 };
  return allProjects
    .filter((p) => p.id !== target.id && p.work_type === 'paving' && p.zone_id === target.zone_id &&
      p.status !== 'completed' && p.status !== 'suspended')
    .map((project) => {
      const segment = evaluateSegmentMatch(target.street_segment, project.street_segment);
      const match: SimilarPavingMatch = segment.isMatch ? 'same_segment' : segment.isDefinitelyDifferent ? 'same_zone' : 'possible_same_segment';
      const overlapDays = target.start_date && target.end_date
        ? getOverlapDays(target.start_date, target.end_date, project.start_date, project.end_date) : 0;
      const where = match === 'same_segment' ? 'في نفس المقطع الطرقي؛ تحقق من عدم تكرار أمر التزفيت'
        : match === 'possible_same_segment' ? 'وقد يكون في نفس المقطع الطرقي؛ تلزم مراجعة الموقع'
        : 'في مقطع آخر من نفس الحي؛ يمكن دراسة تنفيذ العملين معاً';
      const period = `${formatArabicDateFriendly(project.start_date)} إلى ${formatArabicDateFriendly(project.end_date)}`;
      const timing = overlapDays > 0 ? ` مع تداخل زمني ${overlapDays} يوم` : '';
      return {
        project, match, overlapDays,
        message: `${project.code}: «${project.street_segment}» (${period}) ${where}${timing}.`,
      };
    })
    .sort((a, b) => rank[a.match] - rank[b.match] || a.project.start_date.localeCompare(b.project.start_date));
}

export interface SimilarPavingGroup {
  zone_id: string;
  zone_name_ar: string;
  projects: Project[];
  hasSameSegment: boolean;
}

/** Groups active paving works by neighborhood; only neighborhoods with two or more are returned. */
export function findSimilarPavingGroups(allProjects: Project[]): SimilarPavingGroup[] {
  const groups = new Map<string, SimilarPavingGroup>();
  for (const project of allProjects) {
    if (project.work_type !== 'paving' || project.status === 'completed' || project.status === 'suspended') continue;
    const group = groups.get(project.zone_id);
    if (group) group.projects.push(project);
    else groups.set(project.zone_id, { zone_id: project.zone_id, zone_name_ar: project.zone_name_ar, projects: [project], hasSameSegment: false });
  }
  const result = [...groups.values()].filter((g) => g.projects.length > 1);
  for (const group of result) {
    group.hasSameSegment = group.projects.some((p) => findSimilarPavingWorks(p, group.projects).some((s) => s.match !== 'same_zone'));
  }
  return result;
}

export interface ProspectiveValidationResult {
  hasBlockingConflict: boolean;
  blockingConflicts: Conflict[];
  hasCoordinationNotice: boolean;
  coordinationNotices: Conflict[];
  hasReviewNotice: boolean;
  reviewNotices: Conflict[];
  conflictingProjects: Project[];
  prospectiveProject?: Project;
}

/**
 * Validates a prospective project modification BEFORE saving to storage.
 * Simulates the updated project within the full project registry, excluding self-comparison.
 * Detects whether the edit introduces or resolves blocking paving conflicts, utility coordination notices, or review items.
 */
export function validateProjectUpdate(
  existingProjectId: string,
  updates: Partial<Project>,
  allProjects: Project[],
  safetyBufferDays: number = 1
): ProspectiveValidationResult {
  const currentProject = allProjects.find((p) => p.id === existingProjectId);
  if (!currentProject) {
    return {
      hasBlockingConflict: false,
      blockingConflicts: [],
      hasCoordinationNotice: false,
      coordinationNotices: [],
      hasReviewNotice: false,
      reviewNotices: [],
      conflictingProjects: [],
    };
  }

  // Prospective project with simulated changes
  const prospectiveProject: Project = {
    ...currentProject,
    ...updates,
  };

  // Replace this project in the simulated array (excludes self-comparison by ID)
  const simulatedProjects = allProjects.map((p) =>
    p.id === existingProjectId ? prospectiveProject : p
  );

  // Run full conflict detection on the prospective portfolio
  const allDetected = detectConflicts(simulatedProjects, safetyBufferDays);

  // Filter only conflicts directly involving the modified project
  const relevantConflicts = allDetected.filter(
    (c) => c.project_a_id === existingProjectId || c.project_b_id === existingProjectId
  );

  const blockingConflicts = relevantConflicts.filter(
    (c) => c.is_blocking && c.severity === 'high'
  );

  const coordinationNotices = relevantConflicts.filter(
    (c) => c.severity === 'notice' || c.conflict_type === 'utility_coordination_notice'
  );

  const reviewNotices = relevantConflicts.filter(
    (c) => c.severity === 'review' || c.conflict_type === 'spatial_proximity_needs_review'
  );

  // Identify all other projects that conflict with the prospective project
  const conflictingProjectIds = new Set<string>();
  for (const c of relevantConflicts) {
    if (c.project_a_id !== existingProjectId) conflictingProjectIds.add(c.project_a_id);
    if (c.project_b_id !== existingProjectId) conflictingProjectIds.add(c.project_b_id);
  }

  const conflictingProjects = allProjects.filter((p) => conflictingProjectIds.has(p.id));

  return {
    hasBlockingConflict: blockingConflicts.length > 0,
    blockingConflicts,
    hasCoordinationNotice: coordinationNotices.length > 0,
    coordinationNotices,
    hasReviewNotice: reviewNotices.length > 0,
    reviewNotices,
    conflictingProjects,
    prospectiveProject,
  };
}
<<<END FILE>>>

<<<FILE: src/utils/scheduler.ts>>>
// src/utils/scheduler.ts
import { Project } from '../types';
import { addDays, datesOverlap, formatArabicDateFriendly } from './dateUtils';
import { evaluateSegmentMatch } from './conflictDetector';

export interface ProposedScheduleResult {
  pavingProjectId: string;
  originalStartDate: string;
  originalEndDate: string;
  maxPredecessorEndDate: string;
  safetyBufferDays: number;
  proposedStartDate: string;
  proposedEndDate: string;
  predecessorProjects: {
    id: string;
    code: string;
    authorityName: string;
    workTypeName: string;
    endDate: string;
  }[];
  explanation: string;
}

/**
 * Deterministically computes the earliest safe paving start date
 * based on the latest completion date of all underground predecessor works
 * plus an engineering safety buffer (default: 5 days) for soil compaction & inspection.
 */
export function proposePavingSchedule(
  pavingProject: Project,
  predecessorProjects: Project[],
  safetyBufferDays: number = 5
): ProposedScheduleResult {
  if (predecessorProjects.length === 0) {
    return {
      pavingProjectId: pavingProject.id,
      originalStartDate: pavingProject.start_date,
      originalEndDate: pavingProject.end_date,
      maxPredecessorEndDate: pavingProject.start_date,
      safetyBufferDays,
      proposedStartDate: pavingProject.start_date,
      proposedEndDate: pavingProject.end_date,
      predecessorProjects: [],
      explanation: 'لا توجد أعمال حفريات سابقة نشطة مسجلة في هذا المقطع، الموعد الحالي آمن للتنفيذ.',
    };
  }

  // Find max end date among predecessors
  let maxEndDate = predecessorProjects[0].end_date;
  for (const prj of predecessorProjects) {
    if (prj.end_date > maxEndDate) {
      maxEndDate = prj.end_date;
    }
  }

  // Add engineering safety buffer days (for compaction, hydraulic testing, and settling)
  // If underground finishes on maxEndDate, with safetyBufferDays buffer, earliest safe start is addDays(maxEndDate, safetyBufferDays + 1)
  const proposedStartDate = addDays(maxEndDate, safetyBufferDays + 1);
  const duration = Math.max(1, pavingProject.duration_days || 1);
  const proposedEndDate = addDays(proposedStartDate, duration - 1);

  const predecessorList = predecessorProjects.map((p) => ({
    id: p.id,
    code: p.code,
    authorityName: p.authority_name_ar,
    workTypeName: p.work_type_name_ar,
    endDate: p.end_date,
  }));

  const explanation = `بناءً على موعد اكتمال آخر أعمال الحفريات والتمديدات الجوفية (${formatArabicDateFriendly(maxEndDate)}) وإضافة فترة أمان هندسية قدرها (${safetyBufferDays} أيام) لاستقرار التربة واختبارات الضغط، يوصى ببدء أعمال التعبيد والتزفيت بتاريخ (${formatArabicDateFriendly(proposedStartDate)}) وحتى (${formatArabicDateFriendly(proposedEndDate)}).`;

  return {
    pavingProjectId: pavingProject.id,
    originalStartDate: pavingProject.start_date,
    originalEndDate: pavingProject.end_date,
    maxPredecessorEndDate: maxEndDate,
    safetyBufferDays,
    proposedStartDate,
    proposedEndDate,
    predecessorProjects: predecessorList,
    explanation,
  };
}

export interface GenericScheduleResult {
  isPavingVsExcavation: boolean;
  isSameWorkType: boolean;
  fixedProject: Project;
  rescheduledProject: Project;
  originalStartDate: string;
  originalEndDate: string;
  maxPredecessorEndDate: string;
  safetyBufferDays: number;
  proposedStartDate: string;
  proposedEndDate: string;
  explanation: string;
  collidedWithOtherProjects?: Project[];
}

/**
 * Checks if a proposed date interval [startDate, endDate] collides with ANY existing active project
 * in the same zone and same street segment.
 */
export function checkIfSlotCollides(
  startDate: string,
  endDate: string,
  zoneId: string,
  streetSegment: string,
  excludeProjectIds: string[],
  allProjects: Project[]
): Project[] {
  return allProjects.filter((p) => {
    if (excludeProjectIds.includes(p.id)) return false;
    if (p.status === 'completed' || p.status === 'suspended') return false;
    if (p.zone_id !== zoneId) return false;
    const segEval = evaluateSegmentMatch(p.street_segment, streetSegment);
    if (segEval.isDefinitelyDifferent) return false;
    if (!segEval.isMatch) return false;
    return datesOverlap(startDate, endDate, p.start_date, p.end_date);
  });
}

/**
 * Deterministically finds the earliest conflict-free date interval across ALL projects in the street.
 */
export function findCollisionFreeSlot(
  candidateStart: string,
  durationDays: number,
  safetyBufferDays: number,
  zoneId: string,
  streetSegment: string,
  excludeProjectIds: string[],
  allProjects: Project[]
): { startDate: string; endDate: string; collidedWithProjects: Project[] } {
  let curStart = candidateStart;
  const duration = Math.max(1, durationDays);
  let curEnd = addDays(curStart, duration - 1);
  const collidedWith: Project[] = [];

  let loopCount = 0;
  while (loopCount <= allProjects.length) {
    loopCount++;
    const collisions = checkIfSlotCollides(curStart, curEnd, zoneId, streetSegment, excludeProjectIds, allProjects);

    if (collisions.length === 0) {
      break;
    }

    // Record collided projects
    for (const c of collisions) {
      if (!collidedWith.some((p) => p.id === c.id)) {
        collidedWith.push(c);
      }
    }

    // Find latest end date among collisions
    let maxCollisionEnd = collisions[0].end_date;
    for (const c of collisions) {
      if (c.end_date > maxCollisionEnd) {
        maxCollisionEnd = c.end_date;
      }
    }

    // Advance curStart after collision + buffer
    curStart = addDays(maxCollisionEnd, Math.max(1, safetyBufferDays) + 1);
    curEnd = addDays(curStart, duration - 1);
  }

  return { startDate: curStart, endDate: curEnd, collidedWithProjects: collidedWith };
}

/**
 * Deterministically computes a coordinated schedule for ANY two conflicting projects,
 * guaranteed to NOT collide with ANY existing work in the same street segment.
 */
export function proposeGenericCoordinationSchedule(
  projectA: Project,
  projectB: Project,
  safetyBufferDays: number = 3,
  forcedRescheduledProjectId?: string,
  allProjects?: Project[]
): GenericScheduleResult {
  const isAPaving = projectA.work_type === 'paving';
  const isBPaving = projectB.work_type === 'paving';
  const isPavingVsExcavation = (isAPaving && !isBPaving) || (!isAPaving && isBPaving);
  const isSameWorkType = projectA.work_type === projectB.work_type;

  let fixedProject: Project;
  let rescheduledProject: Project;

  if (forcedRescheduledProjectId) {
    if (forcedRescheduledProjectId === projectA.id) {
      rescheduledProject = projectA;
      fixedProject = projectB;
    } else {
      rescheduledProject = projectB;
      fixedProject = projectA;
    }
  } else if (isPavingVsExcavation) {
    // The paving side always yields to the excavation.
    if (isAPaving) {
      rescheduledProject = projectA;
      fixedProject = projectB;
    } else {
      rescheduledProject = projectB;
      fixedProject = projectA;
    }
  } else {
    // For same work type or multiple digs, earlier project goes first, later is rescheduled
    if (projectA.start_date <= projectB.start_date) {
      fixedProject = projectA;
      rescheduledProject = projectB;
    } else {
      fixedProject = projectB;
      rescheduledProject = projectA;
    }
  }

  const reschedulesPaving = rescheduledProject.work_type === 'paving';
  const buffer = Math.max(1, safetyBufferDays);
  
  // Find latest end date among all underground works if rescheduling a paving project
  let maxPredecessorEnd = fixedProject.end_date;
  if (reschedulesPaving && allProjects && allProjects.length > 0) {
    const segmentUndergrounds = allProjects.filter(
      (p) =>
        p.id !== rescheduledProject.id &&
        p.status !== 'completed' &&
        p.status !== 'suspended' &&
        p.work_type !== 'paving' &&
        p.zone_id === rescheduledProject.zone_id &&
        evaluateSegmentMatch(p.street_segment, rescheduledProject.street_segment).isMatch
    );
    for (const u of segmentUndergrounds) {
      if (u.end_date > maxPredecessorEnd) {
        maxPredecessorEnd = u.end_date;
      }
    }
  }

  // Automatic rescheduling is applied exclusively to paving projects per MVP rules.
  // Paving starts after all underground works complete + safety buffer.
  const initialCandidateStart = reschedulesPaving 
    ? addDays(maxPredecessorEnd, buffer + 1)
    : rescheduledProject.start_date; // Underground works preserve original dates by default (no auto-reschedule)

  const duration = Math.max(1, rescheduledProject.duration_days || 1);

  // If allProjects is provided and it's a paving project, verify slot
  let proposedStartDate = initialCandidateStart;
  let proposedEndDate = addDays(proposedStartDate, duration - 1);
  let collidedWithOtherProjects: Project[] = [];

  if (reschedulesPaving && allProjects && allProjects.length > 0) {
    const slot = findCollisionFreeSlot(
      initialCandidateStart,
      duration,
      buffer,
      fixedProject.zone_id,
      fixedProject.street_segment,
      [rescheduledProject.id, fixedProject.id],
      allProjects
    );
    proposedStartDate = slot.startDate;
    proposedEndDate = slot.endDate;
    collidedWithOtherProjects = slot.collidedWithProjects;
  }

  let explanation = '';
  if (reschedulesPaving) {
    explanation = `بناءً على اكتمال جميع أعمال الحفريات والتمديدات للمشاريع التحتية في هذا المقطع بحلول (${formatArabicDateFriendly(maxPredecessorEnd)}) وإضافة فاصل أمان هندسي قدره (${buffer} أيام) لضمان استقرار التربة ودك الردميات، تقرر بدء أعمال التزفيت للمشروع (${rescheduledProject.code}) بتاريخ (${formatArabicDateFriendly(proposedStartDate)}) وحتى (${formatArabicDateFriendly(proposedEndDate)}).`;
  } else {
    explanation = `تنبيه تنسيقي: تزامن ورشات حفر تحت الأرض (${fixedProject.work_type_name_ar} و ${rescheduledProject.work_type_name_ar}). لا يتم تطبيق جدولة تلقائية على مشاريع المرافق التحتية؛ يلزم التنسيق الميداني المباشر والتحقق من السلامة الفنية دون تأجيل قسري. المواعيد المقترحة الحالية تحفظ المواعيد المعتمدة وتتطلب موافقة بشرية.`;
  }

  if (collidedWithOtherProjects.length > 0) {
    const codes = collidedWithOtherProjects.map((p) => `${p.code} (${p.title_ar})`).join('، ');
    explanation += ` كما روعي ترحيل الموعد لعدم التقاطع مع أعمال أخرى في نفس الشارع: [${codes}].`;
  }

  return {
    isPavingVsExcavation,
    isSameWorkType,
    fixedProject,
    rescheduledProject,
    originalStartDate: rescheduledProject.start_date,
    originalEndDate: rescheduledProject.end_date,
    maxPredecessorEndDate: maxPredecessorEnd,
    safetyBufferDays: buffer,
    proposedStartDate,
    proposedEndDate,
    explanation,
    collidedWithOtherProjects,
  };
}
<<<END FILE>>>

<<<FILE: src/utils/financial.ts>>>
// src/utils/financial.ts
import { Conflict, Project } from '../types';

export interface FinancialCalculationParams {
  roadLengthM: number;
  roadWidthM: number;
  costPerM2: number; // in Syrian Pounds (ل.س)
}

export interface FinancialCalculationResult {
  roadLengthM: number;
  roadWidthM: number;
  affectedAreaM2: number;
  costPerM2: number;
  totalAvoidableCostSYP: number;
  totalAvoidableCostFormattedAr: string;
  totalAvoidableCostAmountFormatted: string;
  assumptions: string[];
}

// Default benchmark values for municipal road paving rework in Damascus
export const DEFAULT_FINANCIAL_BENCHMARKS = {
  DEFAULT_LENGTH_M: 420,
  DEFAULT_WIDTH_M: 14,
  DEFAULT_COST_PER_M2_SYP: 185_000, // 185,000 SYP per square meter for full-depth trench asphalt restoration
};

/**
 * Calculates the potential avoidable rework cost if a freshly paved road is re-excavated.
 * Formula: Area (m²) = Length * Width
 * Avoidable Rework Cost = Area * Cost per m²
 */
export function calculatePotentialSavings(
  params: Partial<FinancialCalculationParams>
): FinancialCalculationResult {
  const roadLengthM = Math.max(0, params.roadLengthM ?? DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_LENGTH_M);
  const roadWidthM = Math.max(0, params.roadWidthM ?? DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_WIDTH_M);
  const costPerM2 = Math.max(0, params.costPerM2 ?? DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_COST_PER_M2_SYP);

  const affectedAreaM2 = Math.round(roadLengthM * roadWidthM);
  const totalAvoidableCostSYP = Math.round(affectedAreaM2 * costPerM2);

  const amountFormatted = new Intl.NumberFormat('ar-SY').format(totalAvoidableCostSYP);
  const formattedAr = `${amountFormatted} ل.س`;

  return {
    roadLengthM,
    roadWidthM,
    affectedAreaM2,
    costPerM2,
    totalAvoidableCostSYP,
    totalAvoidableCostFormattedAr: formattedAr,
    totalAvoidableCostAmountFormatted: amountFormatted,
    assumptions: [
      `المساحة المتأثرة = الطول (${roadLengthM} م) × العرض (${roadWidthM} م) = ${new Intl.NumberFormat('ar-SY').format(affectedAreaM2)} م²`,
      `كلفة المتر المربع التقديرية = ${new Intl.NumberFormat('ar-SY').format(costPerM2)} ل.س (قشط وإعادة مد قميص إسفلتي)`,
      'التقديرات المالية استرشادية وافتراضية لأغراض المحاكاة والتخطيط البلدي.',
    ],
  };
}


/**
 * Calculates the total potential avoided road rework costs ONLY for verified paving-related conflicts.
 * - Non-blocking utility notices and uncertain location reviews contribute 0 SYP.
 * - Avoids double-counting the same paving area when multiple underground projects affect the same segment.
 */
export function calculateAvoidedReworkSavings(
  conflicts: Conflict[],
  projects: Project[],
  costPerM2: number = DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_COST_PER_M2_SYP
): {
  totalAvoidableCostSYP: number;
  totalAvoidableCostFormattedAr: string;
  totalAvoidableCostAmountFormatted: string;
  uniquePavingProjectsCount: number;
  totalPavedAreaM2: number;
} {
  // Filter ONLY for confirmed blocking paving conflicts
  const blockingPavingConflicts = conflicts.filter(
    (c) => c.is_blocking && c.severity === 'high'
  );

  // Identify unique paving project IDs to prevent double counting
  const countedPavingProjectIds = new Set<string>();
  let totalPavedAreaM2 = 0;

  for (const conflict of blockingPavingConflicts) {
    const prjA = projects.find((p) => p.id === conflict.project_a_id);
    const prjB = projects.find((p) => p.id === conflict.project_b_id);

    const pavingProjectsInConflict = [prjA, prjB].filter(
      (p): p is Project => !!p && p.work_type === 'paving'
    );

    for (const pavingPrj of pavingProjectsInConflict) {
      if (!countedPavingProjectIds.has(pavingPrj.id)) {
        countedPavingProjectIds.add(pavingPrj.id);
        const length = Math.max(0, pavingPrj.road_length_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_LENGTH_M);
        const width = Math.max(0, pavingPrj.road_width_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_WIDTH_M);
        totalPavedAreaM2 += Math.round(length * width);
      }
    }
  }

  const totalAvoidableCostSYP = Math.round(totalPavedAreaM2 * costPerM2);
  const amountFormatted = new Intl.NumberFormat('ar-SY').format(totalAvoidableCostSYP);
  const totalAvoidableCostFormattedAr = `${amountFormatted} ل.س`;

  return {
    totalAvoidableCostSYP,
    totalAvoidableCostFormattedAr,
    totalAvoidableCostAmountFormatted: amountFormatted,
    uniquePavingProjectsCount: countedPavingProjectIds.size,
    totalPavedAreaM2,
  };
}

<<<END FILE>>>
