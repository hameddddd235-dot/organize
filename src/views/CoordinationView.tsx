// src/views/CoordinationView.tsx
import React, { useState, useEffect } from 'react';
import { validateProjectUpdate } from '../utils/conflictDetector';
import { Project, Conflict, CoordinationDecision } from '../types';
import { proposeGenericCoordinationSchedule, checkIfSlotCollides } from '../utils/scheduler';
import { calculatePotentialSavings, DEFAULT_FINANCIAL_BENCHMARKS } from '../utils/financial';
import { formatArabicDateFriendly, formatTimestampArabic, addDays } from '../utils/dateUtils';
import { 
  CalendarClock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  Calculator,
  UserCheck,
  Printer,
  ArrowLeftRight,
  TrendingUp,
  Layers,
  Sparkles,
  CalendarCheck2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface CoordinationViewProps {
  conflicts: Conflict[];
  projects: Project[];
  coordinations: CoordinationDecision[];
  onApproveSchedule: (
    conflictId: string,
    approvedDate: string,
    notes?: string,
    engineerName?: string,
    chosenRescheduledId?: string,
    safetyBufferDays?: number,
    roadLengthM?: number,
    roadWidthM?: number,
    costPerM2?: number
  ) => void;
  onNavigate: (route: 'dashboard' | 'new-project' | 'conflicts' | 'coordination' | 'approved-analysis') => void;
  onViewProtocol: (decision: CoordinationDecision) => void;
  selectedConflictId?: string | null;
  onSelectConflict?: (id: string | null) => void;
}

export const CoordinationView: React.FC<CoordinationViewProps> = ({
  conflicts,
  projects,
  coordinations,
  onApproveSchedule,
  onNavigate,
  onViewProtocol,
  selectedConflictId: propSelectedConflictId,
  onSelectConflict,
}) => {
  // Focus on active conflicts or initial prop
  const activeConflicts = conflicts.filter((c) => c.status !== 'resolved' && c.status !== 'dismissed');
  const targetConflict = 
    (propSelectedConflictId ? conflicts.find((c) => c.id === propSelectedConflictId) : null) ||
    activeConflicts[0] ||
    conflicts[0];

  const [selectedConflictId, setSelectedConflictId] = useState<string>(
    targetConflict ? targetConflict.id : ''
  );

  useEffect(() => {
    if (propSelectedConflictId) {
      setSelectedConflictId(propSelectedConflictId);
    }
  }, [propSelectedConflictId]);

  const activeConflict = conflicts.find((c) => c.id === selectedConflictId) || targetConflict;

  // Retrieve both projects involved in the active conflict
  const prjA = activeConflict ? projects.find((p) => p.id === activeConflict.project_a_id) : null;
  const prjB = activeConflict ? projects.find((p) => p.id === activeConflict.project_b_id) : null;

  // Track which project is chosen to be deferred/rescheduled (for same-type conflicts)
  const [chosenDeferredId, setChosenDeferredId] = useState<string>('');

  useEffect(() => {
    if (prjA && prjB) {
      // Default: if exactly one is paving, defer paving; otherwise defer the later start date
      const aPaving = prjA.work_type === 'paving';
      const bPaving = prjB.work_type === 'paving';
      if (aPaving && !bPaving) {
        setChosenDeferredId(prjA.id);
      } else if (bPaving && !aPaving) {
        setChosenDeferredId(prjB.id);
      } else if (prjB.start_date >= prjA.start_date) {
        setChosenDeferredId(prjB.id);
      } else {
        setChosenDeferredId(prjA.id);
      }
    }
  }, [activeConflict?.id, prjA?.id, prjB?.id]);

  // Safety buffer state (default: 5 days for paving)
  const isPavingConflict = Boolean(prjA?.work_type === 'paving' || prjB?.work_type === 'paving');
  const pavingPrj = prjA?.work_type === 'paving' ? prjA : prjB?.work_type === 'paving' ? prjB : null;
  const [safetyBufferDays, setSafetyBufferDays] = useState<number>(5);

  // Financial inputs state (editable with live recalculation - only for paving conflicts per Rule 6)
  const [roadLengthM, setRoadLengthM] = useState<number>(
    pavingPrj?.road_length_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_LENGTH_M
  );
  const [roadWidthM, setRoadWidthM] = useState<number>(
    pavingPrj?.road_width_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_WIDTH_M
  );
  const [costPerM2, setCostPerM2] = useState<number>(
    DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_COST_PER_M2_SYP
  );
  const [approvalError, setApprovalError] = useState('');
  const [engineerName, setEngineerName] = useState<string>('م. عمار الشريف (رئيس قسم التنسيق البلدي)');
  const [approvalNotes, setApprovalNotes] = useState<string>(
    'تم اعتماد موعد التنسيق البديل وتتابع الأعمال هندسياً وفض التعارض بموجب الأصول'
  );

  // Synchronize road dimensions when paving project changes
  useEffect(() => {
    if (pavingPrj) {
      setRoadLengthM(pavingPrj.road_length_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_LENGTH_M);
      setRoadWidthM(pavingPrj.road_width_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_WIDTH_M);
    }
  }, [pavingPrj?.id]);

  // Manual start date adjustment by engineer
  const [manualStartDate, setManualStartDate] = useState<string>('');

  // Check if existing decision exists for this conflict
  const existingDecision = activeConflict
    ? coordinations.find((c) => c.conflict_id === activeConflict.id)
    : null;
  const decisionIsValid = existingDecision?.review_status === 'approved';

  useEffect(() => {
    // Restore what was approved, so reopening a decision never overwrites it with defaults.
    // Runs after the road-dimension sync above, which it must override for a saved decision.
    setApprovalError('');
    if (existingDecision) {
      setSafetyBufferDays(existingDecision.safety_buffer_days);
      if (existingDecision.reviewed_by) setEngineerName(existingDecision.reviewed_by);
      if (existingDecision.notes) setApprovalNotes(existingDecision.notes);
      if (existingDecision.road_length_m) setRoadLengthM(existingDecision.road_length_m);
      if (existingDecision.road_width_m) setRoadWidthM(existingDecision.road_width_m);
      if (existingDecision.cost_per_m2) setCostPerM2(existingDecision.cost_per_m2);
      // An invalidated decision's date is what became unsafe; propose a fresh one instead.
      setManualStartDate(existingDecision.action_applied_to_project && decisionIsValid ? existingDecision.approved_paving_date || '' : '');
    } else {
      setSafetyBufferDays(5);
      setManualStartDate('');
    }
  }, [activeConflict?.id, existingDecision?.id, existingDecision?.review_status]);

  // Calculate live financial estimates (Rule 6: only for verified paving conflicts)
  const financialResult = isPavingConflict
    ? calculatePotentialSavings({
        roadLengthM,
        roadWidthM,
        costPerM2,
      })
    : {
        roadLengthM: 0,
        roadWidthM: 0,
        affectedAreaM2: 0,
        costPerM2: 0,
        totalAvoidableCostSYP: 0,
        totalAvoidableCostFormattedAr: '0 ل.س (غير قابل للتطبيق)',
        usdEquivalentEstimate: 0,
        assumptions: [
          'تنبيه تنسيقي بين مرافق تحت الأرض: لا يتم احتساب وفورات مالية لإعادة حفر الطرق وفقاً للمحددات.',
          'الوفورات المالية تُحتسب حصراً لتعارضات التزفيت لتفادي قشط وإعادة تعبيد الإسفلت الجديد.',
        ],
      };

  // Calculate proposed schedule using generalized coordination engine verified against all projects in the street
  const scheduleResult = prjA && prjB
    ? proposeGenericCoordinationSchedule(prjA, prjB, safetyBufferDays, chosenDeferredId, projects)
    : null;

  const effectiveStartDate = manualStartDate || scheduleResult?.proposedStartDate || '';
  const effectiveDuration = scheduleResult?.rescheduledProject.duration_days || 1;
  const effectiveEndDate = effectiveStartDate ? addDays(effectiveStartDate, effectiveDuration - 1) : '';

  // Check if effective slot collides with ANY other project in the street!
  const slotCollisions = (prjA && prjB && effectiveStartDate)
    ? checkIfSlotCollides(
        effectiveStartDate,
        effectiveEndDate,
        prjA.zone_id,
        prjA.street_segment,
        [prjA.id, prjB.id],
        projects
      )
    : [];

  const approvalValidation = isPavingConflict && scheduleResult
    ? validateProjectUpdate(scheduleResult.rescheduledProject.id,
        { start_date: effectiveStartDate, end_date: effectiveEndDate }, projects, safetyBufferDays)
    : null;
  const approvalBlocked = !effectiveStartDate || Boolean(approvalValidation?.hasBlockingConflict || approvalValidation?.hasReviewNotice || approvalValidation?.coordinationNotices.some(c => c.conflict_type === 'paving_sequence_notice'));
  const approvalBlockers = approvalValidation
    ? [...approvalValidation.blockingConflicts, ...approvalValidation.reviewNotices,
       ...approvalValidation.coordinationNotices.filter(c => c.conflict_type === 'paving_sequence_notice')]
    : [];

  const handleApprove = () => {
    if (!activeConflict || !scheduleResult || approvalBlocked) return;
    try {
    onApproveSchedule(
      activeConflict.id,
      effectiveStartDate,
      approvalNotes,
      engineerName,
      scheduleResult.rescheduledProject.id,
      safetyBufferDays,
      roadLengthM,
      roadWidthM,
      costPerM2
    );
    setApprovalError('');
    } catch (error) { setApprovalError((error as Error).message); }
  };

  const isSameType = prjA && prjB && prjA.work_type === prjB.work_type;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              الجدولة والتنسيق الهندسي والمالي
            </h2>
            <span className="syria-badge-gold text-xs font-bold px-3 py-0.5 rounded-full font-mono">
              {coordinations.filter((c) => c.review_status === 'approved').length} محاضر معتمدة
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            فض التعارضات الميدانية بجدولة تتابعية آمنة تفصل بين الورشات وتمنع تكرار الحفر في نفس الشارع والوقت
          </p>
        </div>

        {/* Top Actions: Protocol & Approved Analysis Link */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('approved-analysis')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-syria-gold font-bold text-xs border border-syria-borderGold/60 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <CalendarCheck2 className="w-4 h-4 text-syria-gold" />
            <span>سجل تحليل الأعمال المعتمدة</span>
          </button>

          {existingDecision && (
            <button
              onClick={() => onViewProtocol(existingDecision)}
              className="px-4 py-2 rounded-xl syria-gold-gradient text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>معاينة المحضر ({existingDecision.protocol_number})</span>
            </button>
          )}
        </div>
      </div>

      {!activeConflict ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-syria-border space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">لا توجد تعارضات نشطة بحاجة لإعادة جدولة حالياً</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
              جميع مشروعات البنية التحتية والتزفيت منسقة ومجدولة بأمان دون تداخل مكاني أو زماني.
            </p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            العودة للوحة القيادة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Scheduling & Timeline Column */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            {/* Conflict Selector if multiple */}
            {conflicts.length > 1 && (
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-syria-border flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs shadow-md">
                <span className="font-bold text-syria-gold shrink-0">اختر حالة التعارض للمعالجة:</span>
                <select
                  value={selectedConflictId}
                  onChange={(e) => {
                    setSelectedConflictId(e.target.value);
                    if (onSelectConflict) onSelectConflict(e.target.value);
                  }}
                  className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 flex-1 focus:outline-none focus:border-syria-gold cursor-pointer font-medium"
                >
                  {conflicts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.conflict_type_label_ar} - {c.zone_name_ar} ({c.street_segment}) {c.status === 'resolved' ? '✓ [معتمد ومحلول]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Before vs After Timeline Card */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-syria-border space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between border-b border-syria-border pb-3.5 gap-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-syria-gold" />
                  <h3 className="font-bold text-white text-base">
                    {isSameType 
                      ? 'فض تعارض ورشتين من نفس القطاع بالتتابع الزمني'
                      : 'المقارنة الزمنية (قبل التنسيق مقابل بعد التنسيق)'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {isSameType && (
                    <span className="text-xs bg-amber-950/80 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-bold">
                      عملين من نفس النوع ({prjA?.work_type_name_ar})
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-syria-border">
                    {activeConflict.street_segment}
                  </span>
                </div>
              </div>

              {/* In Non-Paving Utility Overlaps: Display Coordination Notice Banner per Rule 2 */}
              {!isPavingConflict ? (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تنبيه تنسيقي: تزامن ورشات مرافق تحت الأرض (غير حاجب)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    لا تخضع مشاريع المرافق التحتية المتزامنة لإعادة الجدولة التلقائية. يتطلب العمل المتزامن تنسيقاً ميدانياً مشتركاً والتحقق من اشتراطات السلامة بين الجهات الخدمية، مع الحفاظ على المواعيد المعتمدة رسمياً ما لم يقرر المهندس خلاف ذلك.
                  </p>
                </div>
              ) : null}

              {/* Timeline Graphic / Comparison Cards */}
              <div className="space-y-4">
                {/* Before (Conflicting) */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${isPavingConflict ? 'bg-rose-950/30 border-rose-500/40' : 'bg-amber-950/20 border-amber-500/40'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${isPavingConflict ? 'text-rose-300' : 'text-amber-300'}`}>
                      <AlertTriangle className={`w-4 h-4 ${isPavingConflict ? 'text-rose-400' : 'text-amber-400'} shrink-0`} />
                      <span>{isPavingConflict ? 'الجدول الزمني السابق (تضارب حرج مع التزفيت):' : 'المواعيد المعتمدة لأعمال المرافق (فترة التزامن المشترك):'}</span>
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isPavingConflict ? 'text-rose-300 bg-rose-950/80 border-rose-500/30' : 'text-amber-300 bg-amber-950/80 border-amber-500/30'}`}>
                      {isPavingConflict ? `تضارب مباشر (${activeConflict.temporal_overlap_days} أيام)` : `تزامن ميداني (${activeConflict.temporal_overlap_days} أيام تداخل)`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-slate-400 text-xs">{prjA?.authority_name_ar}</div>
                      <div className="font-bold text-white text-sm">{prjA?.title_ar}</div>
                      <div className="text-syria-goldLight text-xs mt-1 font-mono">
                        من {formatArabicDateFriendly(prjA?.start_date || '')} إلى {formatArabicDateFriendly(prjA?.end_date || '')}
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 ${isPavingConflict ? 'bg-rose-950/70 border-rose-500/50' : 'bg-slate-950/90 border-slate-800'}`}>
                      <div className="text-slate-400 text-xs">{prjB?.authority_name_ar}</div>
                      <div className="font-bold text-white text-sm">{prjB?.title_ar}</div>
                      <div className="text-syria-goldLight text-xs mt-1 font-mono font-bold">
                        من {formatArabicDateFriendly(prjB?.start_date || '')} إلى {formatArabicDateFriendly(prjB?.end_date || '')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* For Paving Conflict: Sequential Schedule. For Utility: Joint Safety Protocol */}
                {isPavingConflict ? (
                  scheduleResult && (
                    <div className="p-4 rounded-xl bg-syria-card border border-syria-borderGold/60 space-y-3.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-syria-goldLight flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-syria-gold shrink-0" />
                          <span>الجدول الزمني الموصى به (تأجيل التزفيت لما بعد اكتمال الحفر):</span>
                        </span>
                        <span className="text-xs text-syria-gold font-bold syria-badge-gold px-2.5 py-0.5 rounded-full">
                          تتابع آمن
                        </span>
                      </div>

                      <div className="bg-slate-950/90 p-3.5 rounded-xl border border-syria-border text-xs space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                          <span className="text-slate-300">
                            1. حفريات المرافق ({scheduleResult.fixedProject.code}):
                          </span>
                          <span className="font-bold text-white font-mono">
                            تنتهي بتاريخ {formatArabicDateFriendly(scheduleResult.fixedProject.end_date)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                          <span className="text-slate-300">
                            فترة أمان استقرار التربة ودك الردميات:
                          </span>
                          <span className="font-bold text-syria-goldLight font-mono">
                            + {scheduleResult.safetyBufferDays} أيام
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <div className="space-y-0.5">
                            <span className="font-bold text-syria-gold text-sm block">
                              2. الموعد المنسق لبدء التزفيت ({scheduleResult.rescheduledProject.code}):
                            </span>
                            <span className="text-[11px] text-slate-400">
                              حتى تاريخ {formatArabicDateFriendly(effectiveEndDate)} ({effectiveDuration} أيام)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={effectiveStartDate}
                              onChange={(e) => setManualStartDate(e.target.value)}
                              className="bg-slate-900 text-syria-goldLight font-mono font-bold px-3 py-1.5 rounded-xl border border-syria-borderGold focus:outline-none focus:ring-1 focus:ring-syria-gold text-xs cursor-pointer"
                            />
                            {manualStartDate && (
                              <button
                                type="button"
                                onClick={() => setManualStartDate('')}
                                className="text-[11px] text-syria-gold hover:underline cursor-pointer"
                                title="استعادة الموعد الآلي المحسوب"
                              >
                                استعادة المقترح
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Collision Alert / Safety Validation Badge */}
                      {slotCollisions.length > 0 ? (
                        <div className="p-3.5 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-xs text-rose-200 space-y-2 animate-in fade-in">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-white text-xs">
                                تنبيه تعارض مكاني وزماني في نفس الشارع!
                              </div>
                              <div className="text-[11px] text-rose-200 mt-1 leading-relaxed">
                                التاريخ المحدد ({formatArabicDateFriendly(effectiveStartDate)}) يتداخل مع مشروع آخر نشط في نفس المقطع:
                                <div className="font-bold text-white mt-0.5">
                                  • {slotCollisions[0].code} ({slotCollisions[0].title_ar}) المجدول من {formatArabicDateFriendly(slotCollisions[0].start_date)} إلى {formatArabicDateFriendly(slotCollisions[0].end_date)}.
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setManualStartDate(scheduleResult.proposedStartDate)}
                            className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>تطبيق أقرب موعد شاغر وغير متضارب تلقائياً ({formatArabicDateFriendly(scheduleResult.proposedStartDate)})</span>
                          </button>
                        </div>
                      ) : !approvalBlocked && (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span><strong>تدقيق الأمان:</strong> هذا الموعد شاغر تماماً ولا يتزامن مع أي ورشة أخرى في هذا المقطع الطرقي.</span>
                          </div>
                          <span className="font-mono text-[11px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200 font-bold">
                            خالٍ من التعارضات ✓
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        {scheduleResult.explanation}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>اشتراطات التنسيق الميداني والسلامة المهنية للحفر المشترك:</span>
                      </span>
                      <span className="text-xs text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                        مواعيد معتمدة محفوظة
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                      <div className="flex items-start gap-2">
                        <span className="text-syria-gold font-bold">•</span>
                        <span>فصل مسارات وأعماق التمديد تحت الأرض ومراعاة المسافات الهندسية بين أنابيب المياه وكابلات التوتر.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-syria-gold font-bold">•</span>
                        <span>تنظيم إشغال الشارع بالتنسيق مع هندسة المرور لتأمين مسرب حر لمرور الآليات والمواطنين.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-syria-gold font-bold">•</span>
                        <span>التنسيق المباشر بين ورشات الطوارئ وإشراف مهندس المنطقة طوال فترة التزامن ({activeConflict.temporal_overlap_days} أيام).</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 text-[11px] text-slate-400 border border-slate-800">
                      <strong>ملاحظة تنظيمية:</strong> مصادقة هذا المحضر لا تغير مواعيد التنفيذ المعتمدة لكلا المشروعين، وإنما تلزم الطرفين بالضوابط الفنية والسلامة الميدانية.
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Buffer Controls Slider (Only for Paving conflicts where buffer delays paving) */}
              {isPavingConflict && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-syria-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-syria-gold" />
                      <span>فترة أمان استقرار التربة قبل التزفيت:</span>
                    </label>
                    <span className="text-xs font-bold text-syria-goldLight syria-badge-gold px-2.5 py-0.5 rounded-lg font-mono">
                      {safetyBufferDays} أيام
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={21}
                    value={safetyBufferDays}
                    onChange={(e) => {
                      // A new buffer invalidates any manual date; show the recalculated proposal.
                      setSafetyBufferDays(parseInt(e.target.value, 10));
                      setManualStartDate('');
                    }}
                    className="w-full accent-syria-gold cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>1 يوم (مباشر)</span>
                    <span>5 أيام (معيار دمشق البلدي)</span>
                    <span>21 يوماً (استراتيجي)</span>
                  </div>
                </div>
              )}

              {approvalBlocked && (
                <div role="alert" className="text-amber-300 text-sm space-y-1">
                  <p>لا يمكن اعتماد هذا الموعد للأسباب التالية:</p>
                  {approvalBlockers.map((c) => <p key={c.id} className="text-xs leading-relaxed">• {c.explanation}</p>)}
                </div>
              )}
              {approvalError && <p role="alert" className="text-rose-300 text-sm">{approvalError}</p>}
              {/* Human Approval Form with Permanent Persistence */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-syria-border space-y-3.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-syria-gold" />
                  <span>المصادقة وتوثيق محضر التنسيق الحكومي:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">اسم وتوقيع المهندس المصادق:</label>
                    <input
                      type="text"
                      value={engineerName}
                      onChange={(e) => setEngineerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">ملاحظات وقرار اللجنة المشتركة:</label>
                    <input
                      type="text"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-300">
                    {existingDecision && !decisionIsValid ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>المحضر ({existingDecision.protocol_number}) يحتاج إعادة مراجعة؛ تغيّرت المواعيد بعد اعتماده</span>
                      </span>
                    ) : existingDecision ? (
                      <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>محضر معتمد رقم ({existingDecision.protocol_number}) في {formatTimestampArabic(existingDecision.reviewed_at)}</span>
                      </span>
                    ) : (
                      <span>حالة الاعتماد: بانتظار مصادقة المهندس لتثبيت القرار في السجلات الرسمية وفض التعارض</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {existingDecision && (
                      <button
                        type="button"
                        onClick={() => onViewProtocol(existingDecision)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-syria-goldLight font-bold text-xs flex items-center gap-1 border border-syria-borderGold cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-syria-gold" />
                        <span>طباعة المحضر</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={!scheduleResult || approvalBlocked}
                      className="px-5 py-2.5 rounded-xl syria-gold-gradient text-slate-950 font-bold text-xs shadow-lg shadow-syria-gold/20 flex items-center gap-2 cursor-pointer transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>
                        {existingDecision
                          ? 'تحديث الاعتماد والمحضر'
                          : isPavingConflict
                          ? 'مصادقة وحفظ المحضر الدائم (فض التعارض)'
                          : 'مصادقة وتوثيق محضر التنسيق الميداني (حفظ المواعيد)'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Model & Avoidable Cost Calculator (Scenario E!) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-syria-border space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-syria-border pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-syria-gold/15 text-syria-gold border border-syria-borderGold">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">نموذج احتساب كلفة الهدر المتفادية</h3>
                    <p className="text-xs text-slate-400">حساب مالي حي قابل للتعديل والتوثيق</p>
                  </div>
                </div>

                <span className="syria-badge-gold text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                  سيناريو هـ
                </span>
              </div>

              {/* Total Calculated Avoidable Savings Highlight */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-syria-navy via-slate-950 to-slate-950 border border-syria-borderGold/60 text-center space-y-2 shadow-lg">
                <span className="text-xs font-bold text-syria-goldLight">
                  إجمالي التكلفة التقديرية المتفادية لإعادة التعبيد (افتراضية):
                </span>
                <div className="text-2xl sm:text-3xl font-black text-syria-goldLight font-mono">
                  <bdi>{financialResult.totalAvoidableCostFormattedAr}</bdi>
                </div>
                <div className="text-xs text-syria-gold pt-1 font-semibold">
                  (محسوبة على أساس مساحة {new Intl.NumberFormat('ar-SY').format(financialResult.affectedAreaM2)} م²)
                </div>
              </div>

              {/* Editable Parameters */}
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>طول مقطع الشارع (متر):</span>
                    <span className="text-syria-goldLight font-mono font-bold">{roadLengthM} م</span>
                  </div>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    step={10}
                    value={roadLengthM}
                    onChange={(e) => setRoadLengthM(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>عرض مقطع الشارع (متر):</span>
                    <span className="text-syria-goldLight font-mono font-bold">{roadWidthM} م</span>
                  </div>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    step={1}
                    value={roadWidthM}
                    onChange={(e) => setRoadWidthM(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                    <span>كلفة المتر المربع لإعادة التأهيل والإسفلت (ل.س):</span>
                    <span className="text-syria-goldLight font-mono font-bold">
                      {new Intl.NumberFormat('ar-SY').format(costPerM2)} ل.س
                    </span>
                  </div>
                  <input
                    type="number"
                    min={10000}
                    max={2000000}
                    step={5000}
                    value={costPerM2}
                    onChange={(e) => setCostPerM2(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-mono"
                  />
                </div>
              </div>

              {/* Formula & Assumptions Breakdown */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-syria-border text-xs text-slate-300 space-y-2">
                <span className="font-bold text-syria-gold">الافتراضات والمعادلة الحسابية المعتمدة:</span>
                {financialResult.assumptions.map((assump, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-syria-gold">•</span>
                    <span>{assump}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
