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
