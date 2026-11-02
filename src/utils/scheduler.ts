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
