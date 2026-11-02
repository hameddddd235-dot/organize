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
