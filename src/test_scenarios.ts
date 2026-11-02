// src/test_scenarios.ts
import { Project } from './types';
import { detectConflicts, evaluateSegmentMatch, findSimilarPavingGroups, findSimilarPavingWorks, validateProjectUpdate } from './utils/conflictDetector';
import { proposeGenericCoordinationSchedule, proposePavingSchedule } from './utils/scheduler';
import { calculateAvoidedReworkSavings, calculatePotentialSavings } from './utils/financial';
import { parseWorkOrderArabic } from './utils/localParser';
import { INITIAL_PROJECTS, INITIAL_ZONES, SAMPLE_WORK_ORDERS } from './data/seedData';
import { aiService, AIService } from './services/aiService';
import { repository, MunicipalDataRepository } from './services/repository';
import { addDays, dateDiffDays, formatTimestampArabic } from './utils/dateUtils';
import { parseArabicDate, parseArabicDuration } from './utils/arabic';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { analyzeWithGemini, createAnalysisServer, AnalysisError } from '../server/server';
import { NewProjectView } from './views/NewProjectView';
import { normalizeExtraction } from './utils/extraction';
import { DashboardView } from './views/DashboardView';
import { EditProjectModal } from './components/EditProjectModal';
import { OfficialProtocolModal } from './components/OfficialProtocolModal';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('Nabd Al-Hay MVP Conflict Detection & Rules Test Suite');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`, details ? details : '');
  }
}

// Base mock project factory
function createMockProject(overrides: Partial<Project>): Project {
  return {
    id: `prj-${Math.random().toString(36).substring(7)}`,
    code: 'PRJ-TEST',
    authority: 'water',
    authority_name_ar: 'المؤسسة العامة لمياه الشرب',
    work_type: 'water',
    work_type_name_ar: 'مياه',
    title_ar: 'مشروع اختباري',
    original_text: 'نص الأمر',
    zone_id: 'zone-midan',
    zone_name_ar: 'حي الميدان',
    street_segment: 'شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر',
    start_date: '2026-11-05',
    end_date: '2026-11-07',
    status: 'planned',
    source: 'offline_parser',
    location_confidence: 1.0,
    location_review_needed: false,
    road_length_m: 420,
    road_width_m: 14,
    created_at: new Date().toISOString(),
    is_synthetic: true,
    ...overrides,
    duration_days: overrides.duration_days ?? dateDiffDays(overrides.start_date || '2026-11-05', overrides.end_date || '2026-11-07'),
  };
}

// Setup mock storage for Node environment
const mockStorageData: Record<string, string> = {};
(globalThis as any).__mockStorage = {
  getItem: (key: string) => mockStorageData[key] || null,
  setItem: (key: string, val: string) => { mockStorageData[key] = val; },
  removeItem: (key: string) => { delete mockStorageData[key]; },
  clear: () => { Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]); }
};

// =========================================================================
// MANDATORY REGRESSION TEST SUITE (SCENARIOS A THROUGH L)
// =========================================================================

console.log('--- MANDATORY REGRESSION TEST A: Prospective Edit Paving to Conflict Date ---');
// A. Water Nov 5-7, paving originally Nov 10, same verified street segment.
// Edit paving to Nov 6 -> show a HIGH paving conflict before save.
const prjA_Water = createMockProject({
  id: 'prj-A-water-01',
  code: 'PRJ-A-W',
  work_type: 'water',
  authority: 'water',
  start_date: '2026-11-05',
  end_date: '2026-11-07',
  street_segment: 'شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر',
});

const prjA_Paving = createMockProject({
  id: 'prj-A-paving-01',
  code: 'PRJ-A-P',
  work_type: 'paving',
  authority: 'paving',
  start_date: '2026-11-10',
  end_date: '2026-11-10',
  street_segment: 'شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر',
});

// Run prospective validation BEFORE saving
const valA = validateProjectUpdate(prjA_Paving.id, { start_date: '2026-11-06', end_date: '2026-11-06' }, [prjA_Water, prjA_Paving]);
assert(valA.hasBlockingConflict === true, 'Regression A: Prospective edit detects HIGH blocking paving conflict');
assert(valA.blockingConflicts.length === 1, 'Regression A: Exactly 1 prospective blocking conflict found');
assert(valA.blockingConflicts[0].severity === 'high', 'Regression A: Conflict severity is high');
assert(valA.blockingConflicts[0].is_blocking === true, 'Regression A: is_blocking is true');
assert(valA.conflictingProjects[0]?.id === prjA_Water.id, 'Regression A: Identifies water project as conflicting party');

console.log('\n--- MANDATORY REGRESSION TEST B: Cancel Edit Preserves Original Dates ---');
// B. Cancel the edit -> original date remains Nov 10, with no new persisted change.
// Simulate repo with original projects
repository.resetToSeedData();
const pOriginal = repository.createProject({
  ...prjA_Paving,
  start_date: '2026-11-10',
  end_date: '2026-11-10',
});
// User cancels -> no repository.updateProject called
const fetchedAfterCancel = repository.getProjectById(pOriginal.id);
assert(fetchedAfterCancel?.start_date === '2026-11-10', 'Regression B: Canceled edit preserves original start date (Nov 10)');
assert(fetchedAfterCancel?.end_date === '2026-11-10', 'Regression B: Canceled edit preserves original end date (Nov 10)');

console.log('\n--- MANDATORY REGRESSION TEST C: Explicit Save with Conflict Persists & Alerts ---');
// C. Explicitly save the conflicting date -> update persists and conflict dashboard shows an unresolved blocking conflict.
repository.createProject(prjA_Water);
const updatedPaving = repository.updateProject(pOriginal.id, {
  start_date: '2026-11-06',
  end_date: '2026-11-06',
});
assert(updatedPaving?.start_date === '2026-11-06', 'Regression C: Conflicting date is persisted upon explicit confirmation');
const activeConflictsC = repository.getConflicts().filter(c => c.is_blocking && c.status === 'detected');
assert(activeConflictsC.some(c => c.project_b_id === pOriginal.id || c.project_a_id === pOriginal.id), 'Regression C: Conflict dashboard shows unresolved blocking conflict');

console.log('\n--- MANDATORY REGRESSION TEST D: Edit Paving to Safe Date Clears Conflict ---');
// D. Edit paving back to Nov 10 with a one-full-day safety buffer -> active conflict disappears.
// Water ends Nov 7; Nov 8 is safety buffer; Nov 9+ is safe.
const clearedPaving = repository.updateProject(pOriginal.id, {
  start_date: '2026-11-10',
  end_date: '2026-11-10',
});
assert(clearedPaving?.start_date === '2026-11-10', 'Regression D: Paving updated to Nov 10');
const activeConflictsD = repository.getConflicts().filter(
  c => c.is_blocking && c.status === 'detected' && (c.project_a_id === pOriginal.id || c.project_b_id === pOriginal.id)
);
assert(activeConflictsD.length === 0, 'Regression D: Active blocking conflict disappears upon moving to safe date');

console.log('\n--- MANDATORY REGRESSION TEST E: Symmetrical Detection (Edit Water to Overlap Paving) ---');
// E. Edit water to overlap an existing paving date -> same conflict detection must run, regardless of which project is edited.
const waterForE = createMockProject({
  id: 'prj-E-water-orig',
  code: 'PRJ-E-W',
  work_type: 'water',
  start_date: '2026-11-01',
  end_date: '2026-11-03',
  street_segment: 'شارع الجزماتية',
});
const pavingForE = createMockProject({
  id: 'prj-E-paving-orig',
  code: 'PRJ-E-P',
  work_type: 'paving',
  start_date: '2026-11-10',
  end_date: '2026-11-10',
  street_segment: 'شارع الجزماتية',
});

// Edit WATER so its completion overlaps or violates buffer of paving on Nov 10
const valE = validateProjectUpdate(waterForE.id, { start_date: '2026-11-08', end_date: '2026-11-10' }, [waterForE, pavingForE]);
assert(valE.hasBlockingConflict === true, 'Regression E: Editing water to overlap paving triggers blocking conflict');
assert(valE.blockingConflicts[0].severity === 'high', 'Regression E: Severity is high');
assert(valE.conflictingProjects[0]?.id === pavingForE.id, 'Regression E: Correctly identifies paving project as conflicting party');

console.log('\n--- MANDATORY REGRESSION TEST F: Water vs Electricity Overlapping (Utility Notice Only) ---');
// F. Water vs electricity overlapping, no paving -> coordination notice only.
const prjF_Water = createMockProject({
  id: 'prj-F-water',
  work_type: 'water',
  start_date: '2026-11-05',
  end_date: '2026-11-07',
  street_segment: 'شارع الجزماتية',
});
const prjF_Elec = createMockProject({
  id: 'prj-F-elec',
  work_type: 'electricity',
  start_date: '2026-11-06',
  end_date: '2026-11-08',
  street_segment: 'شارع الجزماتية',
});
const valF = validateProjectUpdate(prjF_Elec.id, { start_date: '2026-11-06', end_date: '2026-11-08' }, [prjF_Water, prjF_Elec]);
assert(valF.hasBlockingConflict === false, 'Regression F: No blocking conflict between underground utilities');
assert(valF.hasCoordinationNotice === true, 'Regression F: Triggers coordination notice ("تنبيه تنسيقي")');
assert(valF.coordinationNotices[0].severity === 'notice', 'Regression F: Severity is "notice"');

console.log('\n--- MANDATORY REGRESSION TEST G: Different Verified Street Segments ---');
// G. Different verified street segments -> no confirmed paving conflict.
const prjG_Water = createMockProject({
  id: 'prj-G-water',
  work_type: 'water',
  start_date: '2026-11-05',
  end_date: '2026-11-07',
  street_segment: 'شارع الجزماتية',
});
const prjG_Paving = createMockProject({
  id: 'prj-G-paving',
  work_type: 'paving',
  start_date: '2026-11-06',
  end_date: '2026-11-06',
  street_segment: 'شارع كورنيش الميدان',
});
const valG = validateProjectUpdate(prjG_Paving.id, { start_date: '2026-11-06', end_date: '2026-11-06' }, [prjG_Water, prjG_Paving]);
assert(valG.hasBlockingConflict === false, 'Regression G: Different street segments generate 0 blocking conflicts');

console.log('\n--- MANDATORY REGRESSION TEST H: Ambiguous Location Requires Human Review ---');
// H. Ambiguous location -> human review, no definitive blocking alert.
const prjH_Water = createMockProject({
  id: 'prj-H-water',
  work_type: 'water',
  start_date: '2026-11-05',
  end_date: '2026-11-07',
  street_segment: 'بجوار ساحة غير مؤكدة في الميدان',
  location_review_needed: true,
  location_confidence: 0.65,
});
const prjH_Paving = createMockProject({
  id: 'prj-H-paving',
  work_type: 'paving',
  start_date: '2026-11-06',
  end_date: '2026-11-06',
  street_segment: 'شارع الجزماتية',
});
const valH = validateProjectUpdate(prjH_Paving.id, { start_date: '2026-11-06', end_date: '2026-11-06' }, [prjH_Water, prjH_Paving]);
assert(valH.hasBlockingConflict === false, 'Regression H: Ambiguous location does NOT declare confirmed blocking conflict');
assert(valH.hasReviewNotice === true, 'Regression H: Triggers review notice ("بحاجة إلى مراجعة")');
assert(valH.reviewNotices[0].severity === 'review', 'Regression H: Severity is "review"');

console.log('\n--- MANDATORY REGRESSION TEST I: Arabic Work-Order Parsing with Arabic-Indic Numerals & Words ---');
// I. Analyze Arabic text:
// "يرجى تنفيذ صيانة خط المياه في المزة، شارع الجلاء، اعتباراً من ٥ تشرين الثاني ٢٠٢٦ ولمدة ثلاثة أيام"
// -> work_type=water, start_date=2026-11-05, end_date=2026-11-07; missing fields remain missing.
const arabicTextI = 'يرجى تنفيذ صيانة خط المياه في المزة، شارع الجلاء، اعتباراً من ٥ تشرين الثاني ٢٠٢٦ ولمدة ثلاثة أيام';
const parsedI = parseWorkOrderArabic(arabicTextI, INITIAL_ZONES);

assert(parsedI.work_type === 'water', 'Regression I: work_type is "water"');
assert(parsedI.authority === 'water', 'Regression I: authority is "water"');
assert(parsedI.start_date === '2026-11-05', 'Regression I: start_date correctly extracted from ٥ تشرين الثاني ٢٠٢٦ as 2026-11-05');
assert(parsedI.duration_days === 3, 'Regression I: duration_days correctly extracted from "ثلاثة أيام" as 3');
assert(parsedI.end_date === '2026-11-07', 'Regression I: inclusive end_date correctly calculated as 2026-11-07 (5 + 3 - 1)');
assert(parsedI.street_segment.includes('الجلاء'), 'Regression I: street_segment contains "الجلاء"');
assert(parsedI.missing_fields.includes('landmark'), 'Regression I: unmentioned landmark is listed in missing_fields');
assert(parsedI.extraction_source === 'offline_parser', 'Regression I: extraction_source is offline_parser');

console.log('\n--- MANDATORY REGRESSION TEST J: Document Without Dates Does NOT Fabricate Dates ---');
// J. Analyze a document with no dates -> do not fabricate dates.
const arabicTextJ = 'يرجى استبدال قساطل الصرف الصحي في حي القصاع شارع الغساني';
const parsedJ = parseWorkOrderArabic(arabicTextJ, INITIAL_ZONES);

assert(parsedJ.start_date === '', 'Regression J: start_date is empty string (not fabricated)');
assert(parsedJ.end_date === '', 'Regression J: end_date is empty string (not fabricated)');
assert(parsedJ.missing_fields.includes('start_date'), 'Regression J: start_date is listed in missing_fields');
assert(parsedJ.missing_fields.includes('end_date'), 'Regression J: end_date is listed in missing_fields');
assert(parsedJ.work_type === 'sanitation', 'Regression J: work_type accurately extracted as sanitation');

console.log('\n--- MANDATORY REGRESSION TEST K: AI Service Status & Unavailable Backend Fallback ---');
// K. Disconnect or simulate unavailable AI backend -> show honest error and optional explicitly labeled local fallback.
const aiStatus = aiService.getStatus();
assert(aiStatus.mode === 'LOCAL_RULES', 'Regression K: AIService reports LOCAL_RULES mode when backend URL is unset');
assert(aiStatus.isBackendConnected === false, 'Regression K: Backend is honestly reported as not connected');

// Call extractWorkOrder async
const fallbackTest = aiService.extractWorkOrder(arabicTextI, INITIAL_ZONES).then((aiRes) => {
  assert(aiRes.success === false, 'Regression K: Extraction fails gracefully when backend is unavailable');
  assert(aiRes.canFallbackToLocal === true, 'Regression K: Explicit fallback to local rules is offered');
  assert(Boolean(aiRes.error?.includes('الخادم الخلفي')), 'Regression K: Explains that backend edge function is required for API keys');
});

console.log('\n--- MANDATORY REGRESSION TEST L: Persistence Across Refreshes ---');
// L. Refresh after saved edits -> persisted projects and derived conflict state remain correct.
repository.resetToSeedData();
const pL_paving = repository.getProjects().find(p => p.work_type === 'paving');
if (pL_paving) {
  repository.updateProject(pL_paving.id, {
    title_ar: 'تعبيد محدث معتمد للتحقق من التخزين',
    start_date: '2026-11-28',
    end_date: '2026-11-28',
  });

  // Verify stored JSON has the modified date
  const storedJson = mockStorageData['nabd_projects_v1'];
  assert(Boolean(storedJson), 'Regression L: Projects saved in persistent storage');
  assert(storedJson.includes('2026-11-28'), 'Regression L: Stored JSON contains the updated date');

  // Re-read via repository
  const reloaded = new MunicipalDataRepository().getProjectById(pL_paving.id);
  assert(reloaded?.start_date === '2026-11-28', 'Regression L: Reloaded project preserves updated date');
  assert(reloaded?.title_ar === 'تعبيد محدث معتمد للتحقق من التخزين', 'Regression L: Reloaded project preserves title');
}

// =========================================================================
// FINANCIAL IMPACT & DEDUPLICATION TEST (Rule 6)
// =========================================================================
console.log('\n--- FINANCIAL IMPACT & DEDUPLICATION TEST (Rule 6) ---');
const prjFin_Paving = createMockProject({
  id: 'prj-fin-paving',
  code: 'PRJ-FIN-PAV',
  work_type: 'paving',
  start_date: '2026-11-06',
  end_date: '2026-11-06',
  street_segment: 'شارع الجزماتية',
  road_length_m: 400,
  road_width_m: 10, // Area = 4,000 m²
});

const prjFin_Water = createMockProject({
  id: 'prj-fin-water',
  code: 'PRJ-FIN-WAT',
  work_type: 'water',
  start_date: '2026-11-05',
  end_date: '2026-11-07',
  street_segment: 'شارع الجزماتية',
});

const prjFin_Elec = createMockProject({
  id: 'prj-fin-elec',
  code: 'PRJ-FIN-ELE',
  work_type: 'electricity',
  start_date: '2026-11-05',
  end_date: '2026-11-08',
  street_segment: 'شارع الجزماتية',
});

const allFinProjects = [prjFin_Paving, prjFin_Water, prjFin_Elec];
const detectedFinConflicts = detectConflicts(allFinProjects);

const finSavings = calculateAvoidedReworkSavings(detectedFinConflicts, allFinProjects, 100_000);
assert(finSavings.uniquePavingProjectsCount === 1, 'Financial: Deduplicated to 1 unique paving project');
assert(finSavings.totalPavedAreaM2 === 4000, 'Financial: Total area is 4,000 m² (not double-counted)');
assert(finSavings.totalAvoidableCostSYP === 400_000_000, 'Financial: Total savings correctly computed once (400M SYP)');

// =========================================================================
// SCENARIO 10: All Views and Navigation Integrity
// =========================================================================
console.log('\n--- SCENARIO 10: Views & Navigation Integrity ---');
const viewFiles = [
  'DashboardView.tsx',
  'ConflictsView.tsx',
  'CoordinationView.tsx',
  'ApprovedAnalysisView.tsx',
  'NewProjectView.tsx',
];

for (const file of viewFiles) {
  const filePath = path.resolve(__dirname, 'views', file);
  assert(fs.existsSync(filePath), `Scenario 10: View file ${file} exists on disk`);
  const content = fs.readFileSync(filePath, 'utf-8');
  assert(content.includes('export const') || content.includes('export function'), `Scenario 10: View ${file} contains exported component definition`);
}


function rejects(action: () => unknown, name: string) {
  let threw = false;
  try { action(); } catch { threw = true; }
  assert(threw, name);
}

console.log('\n--- AUDIT REGRESSIONS ---');
repository.resetToSeedData();
const originalConflict = repository.getConflicts().find(c => c.severity === 'high')!;
repository.approveCoordinationSchedule(originalConflict.id, '2026-11-13');
repository.updateProject(originalConflict.project_a_id, { end_date: '2026-11-14' });
assert(repository.getConflicts().find(c => c.id === originalConflict.id)?.status === 'detected', 'Reopen resolved conflict after extending underground work');
assert(new MunicipalDataRepository().getConflicts().find(c => c.id === originalConflict.id)?.status === 'detected', 'Reopened status survives repository reconstruction');
assert(repository.getCoordinationDecisionForConflict(originalConflict.id)?.review_status === 'pending', 'Obsolete approval requires review');
repository.dismissConflict(originalConflict.id, 'different field conditions');
repository.updateProject(originalConflict.project_a_id, { end_date: '2026-11-15' });
assert(repository.getConflicts().find(c => c.id === originalConflict.id)?.status === 'detected', 'Changed schedule invalidates dismissal');
repository.resetToSeedData();
const unsafe = repository.getConflicts().find(c => c.severity === 'high')!;
const beforeUnsafe = JSON.stringify(mockStorageData);
rejects(() => repository.approveCoordinationSchedule(unsafe.id, '2026-11-06'), 'Reject overlapping approval');
rejects(() => repository.approveCoordinationSchedule(unsafe.id, '2026-11-10', { safetyBufferDays: 5 }), 'Reject safety buffer violation without date overlap');
assert(JSON.stringify(mockStorageData) === beforeUnsafe, 'Rejected approval leaves projects, decisions and protocol serial unchanged');

// Isolate a real pair through public repository APIs.
for (const project of repository.getProjects()) repository.deleteProject(project.id);
const paving1 = repository.createProject(createMockProject({ work_type: 'paving', start_date: '2026-11-05', end_date: '2026-11-07' }));
const paving2 = repository.createProject(createMockProject({ work_type: 'paving', start_date: '2026-11-06', end_date: '2026-11-08' }));
const pair = repository.getConflicts()[0];
const resolvedPair = repository.quickResolveConflictByStagger(pair.id);
assert(resolvedPair.updatedProject?.id === paving2.id, 'Quick resolve updates the selected later paving project');
assert(repository.getProjectById(paving1.id)?.start_date === '2026-11-05', 'Other paving project stays unchanged');
assert(detectConflicts(repository.getProjects()).length === 0, 'Two paving projects are actually separated');

const explicitEnd = parseWorkOrderArabic('صيانة مياه في الميدان، شارع الجزماتية، من 2026-11-05 حتى 2026-11-07', INITIAL_ZONES);
assert(explicitEnd.duration_days === 3, 'Explicit inclusive date range has exactly three days');
assert(!explicitEnd.missing_fields.includes('duration_days'), 'Inferred duration no longer marked missing');
for (const [text, expected] of [['ستة أيام', 6], ['سبعة أيام', 7], ['ثمانية أيام', 8], ['تسعة أيام', 9], ['عشرة أيام', 10], ['أسبوع', 7], ['أسبوعين', 14]] as const) {
  assert(parseArabicDuration(text) === expected, `Arabic duration: ${text}`);
}
const incomplete = parseWorkOrderArabic('صيانة مياه في الميدان، شارع الجزماتية، بتاريخ 2026-11-05', INITIAL_ZONES);
assert(incomplete.end_date === '' && incomplete.duration_days === 0 && incomplete.missing_fields.includes('end_date'), 'Unknown duration stays explicitly missing');
rejects(() => repository.createProject(incomplete), 'Cannot persist an incomplete schedule');
rejects(() => repository.updateProject(paving1.id, { start_date: '2026-02-30' }), 'Reject impossible calendar date');

repository.resetToSeedData();
const customProject = repository.createProject(createMockProject({ title_ar: 'مشروع محفوظ' }));
const beforePreview = JSON.stringify(mockStorageData);
repository.applyScenario('D');
repository.applyScenario('A');
assert(repository.getProjectById('prj-demo-002')?.start_date === '2026-11-06', 'Scenario D does not mutate seed objects');
assert(JSON.stringify(mockStorageData) === beforePreview, 'Preview never overwrites persistent workspace');
assert(new MunicipalDataRepository().getProjectById(customProject.id)?.title_ar === 'مشروع محفوظ', 'Reload during preview restores saved user data');
repository.exitScenario();
assert(repository.getProjectById(customProject.id)?.title_ar === 'مشروع محفوظ', 'Leaving preview restores original workspace');


repository.resetToSeedData();
const bufferConflict = repository.getConflicts().find(c => c.severity === 'high')!;
repository.approveCoordinationSchedule(bufferConflict.id, '2026-11-13', { safetyBufferDays: 5 });
repository.updateProject(bufferConflict.project_a_id, { end_date: '2026-11-08' });
assert(repository.getConflicts().find(c => c.id === bufferConflict.id)?.status === 'detected', 'Revalidate the approved five-day buffer, not just date overlap');
const pendingDecision = repository.getCoordinationDecisionForConflict(bufferConflict.id)!;
const protocolHtml = renderToStaticMarkup(React.createElement(OfficialProtocolModal, {
  decision: pendingDecision, predecessorProjects: [], onClose: () => {},
}));
assert(protocolHtml.includes('لم يعد اعتماداً نافذاً'), 'Rendered protocol explicitly marks invalidated approval');
const editHtml = renderToStaticMarkup(React.createElement(EditProjectModal, {
  project: prjA_Paving, zones: INITIAL_ZONES,
  allProjects: [prjA_Water, { ...prjA_Paving, start_date: '2026-11-06', end_date: '2026-11-06' }],
  onSave: () => {}, onClose: () => {}, onDelete: () => {},
}));
assert(editHtml.includes('aria-live="polite"'), 'Edit form renders a live validation region');
const conflictingEditHtml = renderToStaticMarkup(React.createElement(EditProjectModal, {
  project: { ...prjA_Paving, start_date: '2026-11-06', end_date: '2026-11-06' }, zones: INITIAL_ZONES,
  allProjects: [prjA_Water, prjA_Paving], onSave: () => {}, onClose: () => {}, onDelete: () => {},
}));
assert(conflictingEditHtml.includes('التعديل ينتج تعارض تزفيت'), 'Edit form renders blocking warning from prospective dates');


console.log('\n--- DASHBOARD DATE EDIT AND FULL SCAN ---');
const dashboardRepo = new MunicipalDataRepository();
for (const project of dashboardRepo.getProjects()) dashboardRepo.deleteProject(project.id);
const dashWater = dashboardRepo.createProject(createMockProject({ work_type: 'water', start_date: '2026-11-05', end_date: '2026-11-07' }));
const dashPaving = dashboardRepo.createProject(createMockProject({ work_type: 'paving', start_date: '2026-11-10', end_date: '2026-11-10' }));
dashboardRepo.updateProject(dashPaving.id, { start_date: '2026-11-06', end_date: '2026-11-06' });
assert(dashboardRepo.scanAllProjects().conflicts.some(c => c.is_blocking), 'Dashboard: save overlapping first edit and detect it');
const laterWater = { start_date: '2026-11-15', end_date: '2026-11-17', duration_days: 3 };
const laterCheck = validateProjectUpdate(dashWater.id, laterWater, dashboardRepo.getProjects());
assert(!laterCheck.hasBlockingConflict, 'Dashboard: moving the other job after paving does not falsely block saving');
assert(laterCheck.coordinationNotices.some(c => c.conflict_type === 'paving_sequence_notice' && c.temporal_overlap_days === 0), 'Separate sequencing advice from actual date overlap');
dashboardRepo.updateProject(dashWater.id, laterWater);
assert(!dashboardRepo.scanAllProjects().conflicts.some(c => c.is_blocking), 'Full scan uses the newly saved dates, not the first conflicting edit');
const noOverlapHtml = renderToStaticMarkup(React.createElement(EditProjectModal, {
  project: dashboardRepo.getProjectById(dashWater.id)!, zones: INITIAL_ZONES,
  allProjects: dashboardRepo.getProjects(), onSave: () => {}, onClose: () => {}, onDelete: () => {},
}));
assert(!noOverlapHtml.includes('التعديل ينتج تعارض تزفيت') && noOverlapHtml.includes('لا يوجد تداخل زمني'), 'Dashboard editor explains non-overlap without a blocking warning');
const adjacentCheck = validateProjectUpdate(dashWater.id, { start_date: '2026-11-04', end_date: '2026-11-05' }, dashboardRepo.getProjects());
assert(!adjacentCheck.hasBlockingConflict && adjacentCheck.hasCoordinationNotice, 'Adjacent dates produce buffer advice only');
const boundaryCheck = validateProjectUpdate(dashWater.id, { start_date: '2026-11-04', end_date: '2026-11-06' }, dashboardRepo.getProjects());
assert(boundaryCheck.hasBlockingConflict, 'Shared end/start calendar day still counts as real overlap');
dashboardRepo.updateProject(dashWater.id, { start_date: '2026-11-01', end_date: '2026-11-03' });
assert(dashboardRepo.scanAllProjects().conflicts.length === 0, 'Full scan clears both overlap and advice once the schedule is safe');
dashboardRepo.updateProject(dashPaving.id, { start_date: '2026-11-02', end_date: '2026-11-02' });
const scanConflict = dashboardRepo.getConflicts()[0];
dashboardRepo.dismissConflict(scanConflict.id, 'test dismissal');
const beforeFullScan = JSON.stringify(mockStorageData);
assert(dashboardRepo.scanAllProjects().conflicts.some(c => c.is_blocking), 'Full scan checks even previously dismissed pairs');
assert(dashboardRepo.getConflicts()[0].status === 'dismissed' && beforeFullScan === JSON.stringify(mockStorageData), 'Full scan preserves existing engineering decisions');
dashboardRepo.updateProject(dashWater.id, { status: 'completed' });
const excludedScan = dashboardRepo.scanAllProjects();
assert(excludedScan.projectsChecked === 1 && excludedScan.excludedProjects === 1 && excludedScan.conflicts.length === 0, 'Full scan reports completed/suspended exclusions explicitly');
const dashHtml = renderToStaticMarkup(React.createElement(DashboardView, {
  projects: dashboardRepo.getProjects(), conflicts: dashboardRepo.getConflicts(), zones: INITIAL_ZONES,
  onNavigate: () => {}, onUpdateProject: () => {}, onDeleteProject: () => {},
  onScanProjects: () => dashboardRepo.scanAllProjects(),
}));
assert(dashHtml.includes('فحص جميع الأعمال'), 'Dashboard renders the full portfolio scan button');

console.log('\n--- DATE PARSING AND SCREEN-TO-SCREEN DATA ---');
assert(parseArabicDate('2026/11/05') === '2026-11-05' && parseArabicDate('2026-11-5') === '2026-11-05', 'Year-first and unpadded dates are parsed');
assert(parseArabicDate('حفر 3 آبار سنة 2026') === null && parseArabicDate('ترميم 10 ابنية عام 2026') === null, 'Words starting with آب are not read as August');
assert(parseArabicDuration('الأعمال خلال شهر تشرين الثاني') === null && parseArabicDuration('لمدة شهر') === 30, 'A named month is not a 30-day duration');
const openRange = parseWorkOrderArabic('يرجى تعبيد شارع الجزماتية في الميدان اعتباراً من 15 تشرين الثاني 2026 إلى 18 تشرين الثاني 2026', INITIAL_ZONES);
assert(openRange.start_date === '2026-11-15' && openRange.end_date === '2026-11-18' && openRange.duration_days === 4, 'Range written with إلى keeps its end date');
const yearRange = parseWorkOrderArabic('يرجى تعبيد شارع الجزماتية في الميدان من 28 كانون الأول 2026 إلى 3 كانون الثاني 2027', INITIAL_ZONES);
assert(yearRange.start_date === '2026-12-28' && yearRange.end_date === '2027-01-03' && yearRange.duration_days === 7, 'Range across new year keeps start before end');
assert(!yearRange.street_segment.includes('2026'), 'Street extraction stops before a plain date range');
const labelled = parseWorkOrderArabic('التاريخ: 28 تشرين الأول 2026\nالموقع: حي الميدان شارع الجزماتية\nنوع العمل: تزفيت\nتاريخ التنفيذ: 6 تشرين الثاني 2026\nالمدة: 1 يوم', INITIAL_ZONES);
assert(labelled.start_date === '2026-11-06' && labelled.document_date === '2026-10-28', 'تاريخ التنفيذ wins over the issue date');
const streetSpan = parseWorkOrderArabic(SAMPLE_WORK_ORDERS[0].text, INITIAL_ZONES);
assert(streetSpan.start_date === '2026-11-05' && streetSpan.end_date === '2026-11-07', 'إلى in a street span is not a date range');
assert(addDays('2026-11-05', NaN) === '2026-11-05', 'Empty duration never produces NaN dates');
assert(formatTimestampArabic('2026-11-05T21:30:00Z').length > 0 && formatTimestampArabic('bad') === '', 'Timestamp formatter tolerates bad input');

const flowRepo = new MunicipalDataRepository();
flowRepo.resetToSeedData();
const flowBase = { work_type: 'water', authority: 'water', zone_id: 'zone-midan', zone_name_ar: 'حي الميدان', street_segment: 'شارع الاختبار', start_date: '2026-12-01', end_date: '2026-12-01', duration_days: 1 };
const codeA = flowRepo.createProject(flowBase); const codeB = flowRepo.createProject(flowBase);
flowRepo.deleteProject(codeA.id);
const codeC = flowRepo.createProject(flowBase);
assert(codeC.code !== codeB.code, 'Project codes are never reused after a deletion');
assert(codeC.road_length_m === 0 && codeC.road_width_m === 0, 'Unstated road dimensions stay zero, not invented');
const zeroDimsHtml = renderToStaticMarkup(React.createElement(EditProjectModal, {
  project: codeC, zones: INITIAL_ZONES, allProjects: flowRepo.getProjects(), onSave: () => {}, onClose: () => {}, onDelete: () => {},
}));
assert(!zeroDimsHtml.includes('min="10"'), 'Edit form accepts work orders saved without dimensions');

flowRepo.resetToSeedData();
const flowConflict = flowRepo.getConflicts().find(c => c.severity === 'high')!;
const flowDecision = flowRepo.approveCoordinationSchedule(flowConflict.id, '2026-11-13').decision;
assert(flowDecision.original_start_date === '2026-11-06', 'Decision records the paving date it replaced');
const reapproved = flowRepo.approveCoordinationSchedule(flowConflict.id, '2026-11-15').decision;
assert(reapproved.original_start_date === '2026-11-06', 'Re-approval keeps the first original date');
flowRepo.updateProject(flowConflict.project_b_id, { start_date: '2026-11-20', end_date: '2026-11-20' });
assert(flowRepo.getCoordinationDecisionForConflict(flowConflict.id)?.review_status === 'pending', 'Editing an approved date invalidates its protocol');
flowRepo.resetToSeedData();
const reopenTarget = flowRepo.getConflicts().find(c => c.severity === 'high')!;
flowRepo.approveCoordinationSchedule(reopenTarget.id, '2026-11-13');
assert(flowRepo.reopenConflict(reopenTarget.id) === false, 'Reopen reports when the conflict no longer exists');
assert(flowRepo.getCoordinationDecisionForConflict(reopenTarget.id)?.review_status === 'pending', 'Reopen withdraws the approved protocol');
flowRepo.resetToSeedData();
flowRepo.updateProject('prj-demo-003', { street_segment: 'شارع الجزماتية من تقاطع البلدية إلى ساحة الأشمر' });
const utilityNotice = flowRepo.getConflicts().find(c => c.conflict_type === 'utility_coordination_notice')!;
const utilityDecision = flowRepo.approveCoordinationSchedule(utilityNotice.id, '2026-11-05', 'field note', 'eng', false).decision;
assert(Boolean(utilityDecision.rescheduled_project_id), 'Field-coordination decision keeps the second project');
const utilityProtocol = renderToStaticMarkup(React.createElement(OfficialProtocolModal, {
  decision: utilityDecision, secondProject: flowRepo.getProjectById(utilityDecision.rescheduled_project_id!),
  predecessorProjects: [], onClose: () => {},
}));
assert(utilityProtocol.includes('الإبقاء على مواعيد التنفيذ') && !utilityProtocol.includes('تقرر ترحيل'), 'Field-coordination protocol does not claim a date moved');

console.log('\n--- SIMILAR PAVING WORKS ALERT ---');
const pavingA = createMockProject({ id: 'pav-a', code: 'PAV-A', work_type: 'paving', start_date: '2026-12-01', end_date: '2026-12-02', street_segment: 'شارع الجزماتية' });
const pavingSameLater = createMockProject({ id: 'pav-b', code: 'PAV-B', work_type: 'paving', start_date: '2027-02-01', end_date: '2027-02-02', street_segment: 'شارع الجزماتية' });
const pavingOtherStreet = createMockProject({ id: 'pav-c', code: 'PAV-C', work_type: 'paving', start_date: '2026-12-10', end_date: '2026-12-10', street_segment: 'شارع كورنيش الميدان' });
const pavingOtherZone = createMockProject({ id: 'pav-d', code: 'PAV-D', work_type: 'paving', zone_id: 'zone-mezzeh', zone_name_ar: 'حي المزة', street_segment: 'شارع الجزماتية' });
const pavingDone = createMockProject({ id: 'pav-e', code: 'PAV-E', work_type: 'paving', status: 'completed', street_segment: 'شارع الجزماتية' });
const waterSameStreet = createMockProject({ id: 'wat-a', work_type: 'water', street_segment: 'شارع الجزماتية' });
const pavingPool = [pavingA, pavingSameLater, pavingOtherStreet, pavingOtherZone, pavingDone, waterSameStreet];
const similar = findSimilarPavingWorks(pavingA, pavingPool);
assert(similar.length === 2 && similar[0].project.id === 'pav-b' && similar[0].match === 'same_segment', 'Same segment on other dates is listed first');
assert(similar[1].project.id === 'pav-c' && similar[1].match === 'same_zone', 'Other street in the same neighborhood is listed');
assert(!similar.some(s => ['pav-d', 'pav-e', 'wat-a'].includes(s.project.id)), 'Other zones, completed works and non-paving are ignored');
assert(findSimilarPavingWorks(waterSameStreet, pavingPool).length === 0, 'Non-paving work gets no paving alert');
assert(findSimilarPavingGroups(INITIAL_PROJECTS).length === 0, 'Seed data has no false alert');
const groups = findSimilarPavingGroups(pavingPool);
assert(groups.length === 1 && groups[0].projects.length === 3 && groups[0].hasSameSegment, 'Groups active paving by neighborhood');
assert(detectConflicts([pavingA, pavingOtherStreet]).length === 0, 'Similar paving stays out of the conflict counters');
const similarDashHtml = renderToStaticMarkup(React.createElement(DashboardView, {
  projects: pavingPool, conflicts: [], zones: INITIAL_ZONES, onNavigate: () => {}, onUpdateProject: () => {}, onDeleteProject: () => {},
  onScanProjects: () => ({ projectsChecked: 0, excludedProjects: 0, conflicts: [], similarPaving: [] }),
}));
assert(similarDashHtml.includes('أعمال تزفيت متشابهة في نفس المنطقة'), 'Dashboard renders the similar paving alert');
const similarEditHtml = renderToStaticMarkup(React.createElement(EditProjectModal, {
  project: pavingA, zones: INITIAL_ZONES, allProjects: pavingPool, onSave: () => {}, onClose: () => {}, onDelete: () => {},
}));
assert(similarEditHtml.includes('أعمال تزفيت مشابهة في نفس الحي'), 'Edit form renders the similar paving alert');
const scanRepo = new MunicipalDataRepository();
scanRepo.resetToSeedData();
scanRepo.createProject({ ...flowBase, work_type: 'paving', authority: 'paving', street_segment: 'شارع كورنيش الميدان' });
assert(scanRepo.scanAllProjects().similarPaving.some(g => g.zone_id === 'zone-midan'), 'Full scan reports similar paving');

async function testAIBackend() {
  const originalFetch = globalThis.fetch;
  const service = new AIService('/api/analyze');
  assert(service.getStatus().isBackendConfigured && !service.getStatus().isBackendConnected, 'Configured URL is not proof of connectivity');
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ unexpected: true }), { status: 200 });
    const invalid = await service.extractWorkOrder(arabicTextI, INITIAL_ZONES);
    assert(!invalid.success && invalid.analyzerMode === 'BROKEN', 'Malformed AI response rejected');
    globalThis.fetch = async () => new Response(JSON.stringify(parsedI), { status: 200 });
    const valid = await service.extractWorkOrder(arabicTextI, INITIAL_ZONES);
    assert(valid.success && valid.data?.extraction_source === 'real_ai', 'Valid backend extraction accepted');
    assert(service.getStatus().isBackendConnected, 'Connectivity reported only after successful validated response');
    globalThis.fetch = async () => { throw new Error('offline'); };
    const failed = await service.extractWorkOrder(arabicTextI, INITIAL_ZONES);
    assert(!failed.success && !service.getStatus().isBackendConnected, 'Connection failure clears connected status');
  } finally { globalThis.fetch = originalFetch; }
}


console.log('\n--- PROFESSIONAL DOCUMENT EXTRACTION ---');
const formalText = 'رقم الكتاب: ١٢٣/م\nالتاريخ: 2026-11-01\nالموضوع: صيانة شبكة المياه\nيرجى صيانة المياه في الميدان، شارع الجزماتية اعتباراً من ٥ تشرين الثاني ٢٠٢٦ ولمدة ثلاثة أيام، بطول ١٢٠ متر وبعرض ٦ متر';
const formal = parseWorkOrderArabic(formalText, INITIAL_ZONES);
assert(formal.document_reference === '123/م' && formal.document_date === '2026-11-01', 'Administrative reference and issue date extracted separately');
assert(formal.start_date === '2026-11-05' && formal.end_date === '2026-11-07', 'Execution date takes priority over letterhead date');
assert(formal.street_segment === 'شارع الجزماتية', 'Street extraction stops before schedule clauses');
assert(formal.road_length_m === 120 && formal.road_width_m === 6, 'Road dimensions come from text');
const unknown = parseWorkOrderArabic('يرجى تنفيذ العمل في منطقة غير معروفة وفق الأصول', INITIAL_ZONES);
assert(unknown.work_type === '' && unknown.authority === '' && unknown.zone_id === '', 'Unknown work, authority and zone are not fabricated');
assert(unknown.road_length_m === 0 && unknown.road_width_m === 0, 'Missing dimensions do not become invented estimates');
const onlyIssue = parseWorkOrderArabic('التاريخ: 2026-11-01\nيرجى صيانة المياه في الميدان شارع الجزماتية', INITIAL_ZONES);
assert(onlyIssue.start_date === '', 'An issue date alone is not treated as execution start');
const badRange = parseWorkOrderArabic('صيانة مياه في الميدان شارع الجزماتية اعتباراً من 2026-11-07 حتى 2026-11-05', INITIAL_ZONES);
assert(badRange.end_date === '' && Boolean(badRange.warnings?.length), 'Reversed dates require correction rather than silent clamping');
const mixedDates = parseWorkOrderArabic('صيانة مياه في الميدان شارع الجزماتية اعتباراً من ٥ تشرين الثاني ٢٠٢٦ حتى 2026-11-07', INITIAL_ZONES);
assert(mixedDates.start_date === '2026-11-05' && mixedDates.end_date === '2026-11-07', 'Mixed date formats preserve the execution start rather than choosing the ISO end date');
const endOnly = parseWorkOrderArabic('صيانة مياه في الميدان شارع الجزماتية حتى 2026-11-07', INITIAL_ZONES);
assert(endOnly.start_date === '', 'An end date alone does not fabricate a start date');
const fixedNames = normalizeExtraction({ ...formal, work_type: 'electricity', work_type_name_ar: 'مياه', evidence: [{ field: 'start_date', quote: 'invented quote' }] }, INITIAL_ZONES, formalText);
assert(fixedNames.work_type_name_ar.includes('كهرباء') && fixedNames.evidence?.length === 0, 'Field edits update labels and invented evidence is discarded');
const analysisHtml = renderToStaticMarkup(React.createElement(NewProjectView, {
  zones: INITIAL_ZONES, demoMode: 'real_ai', onChangeMode: () => {}, onSaveProject: () => {}, onNavigate: () => {},
}));
assert(analysisHtml.includes('Gemini') && analysisHtml.includes('فحص جاهزية Gemini'), 'Analysis view exposes explicit Gemini selection and readiness check');

async function testGeminiIntegration() {
  let capturedUrl = ''; let capturedOptions: RequestInit | undefined;
  const fakeGemini: typeof fetch = async (url, options) => {
    capturedUrl = String(url); capturedOptions = options;
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(formal) }] } }] }));
  };
  const config = { apiKey: 'test-key-not-a-secret', model: 'gemini-test', fetcher: fakeGemini };
  const direct = await analyzeWithGemini(formalText, config, fakeGemini);
  assert(capturedUrl === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent', 'Gemini adapter uses the configured generateContent model');
  assert((capturedOptions?.headers as Record<string, string>)['x-goog-api-key'] === config.apiKey && !capturedUrl.includes(config.apiKey), 'Gemini key stays in server request headers');
  const providerRequest = JSON.parse(String(capturedOptions?.body));
  assert(Boolean(providerRequest.generationConfig.responseFormat.text.schema) && providerRequest.contents[0].parts[0].text === formalText, 'Provider receives schema and original text separately from system instructions');
  assert(direct.extraction_source === 'real_ai' && direct.start_date === formal.start_date, 'Validated Gemini result is returned without running the local parser');
  let malformed = false;
  try { await analyzeWithGemini(formalText, config, async () => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{}' }] } }] }))); }
  catch (error) { malformed = error instanceof AnalysisError && error.status === 502; }
  assert(malformed, 'Malformed Gemini fields rejected at backend boundary');
  let timedOut = false;
  const hanging: typeof fetch = (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('abort'))));
  try { await analyzeWithGemini(formalText, { ...config, timeoutMs: 5 }, hanging); }
  catch (error) { timedOut = error instanceof AnalysisError && error.status === 504; }
  assert(timedOut, 'Gemini timeout becomes a safe actionable error');
  const server = createAnalysisServer(config);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const health = await (await fetch(base + '/api/health')).json();
    assert(health.provider === 'gemini' && health.configured && !JSON.stringify(health).includes(config.apiKey), 'Health route reports configuration without revealing key');
    const response = await fetch(base + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: formalText }) });
    const output = await response.json();
    assert(response.status === 200 && output.extraction_source === 'real_ai' && output.document_reference === formal.document_reference, 'End-to-end HTTP adapter returns reviewed contract');
    const malformedInput = await fetch(base + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert(malformedInput.status === 400, 'Malformed request JSON rejected');
    const shortInput = await fetch(base + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hi' }) });
    assert(shortInput.status === 400, 'Too-short document rejected before provider call');
    const deniedOrigin = await fetch(base + '/api/analyze', { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: formalText }) });
    assert(deniedOrigin.status === 403, 'Unapproved browser origin rejected');
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  let missingKey = false;
  try { await analyzeWithGemini(formalText, {}, fakeGemini); }
  catch (error) { missingKey = error instanceof AnalysisError && error.status === 503; }
  assert(missingKey, 'Missing Gemini key fails honestly without mock AI success');
}

Promise.all([fallbackTest, testAIBackend()]).then(testGeminiIntegration).then(() => {
  console.log(`\nTEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  process.exitCode = passedTests === totalTests ? 0 : 1;
}).catch(error => { console.error(error); process.exitCode = 1; });
