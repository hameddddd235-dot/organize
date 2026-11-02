# البرومبت 9 من 13: مصفوفة التعارضات

أكمل نسخ المشروع. هذه شاشة مصفوفة التعارضات.

قواعد النسخ في هذا البرومبت:
- أنشئ كل ملف محاط بالعلامتين <<<FILE: المسار>>> و<<<END FILE>>> في المسار نفسه، وبمحتواه حرفياً. العلامتان نفسهما لا تدخلان في الملف.
- لا تُعد صياغة أي نص عربي، ولا تغيّر أي class أو لون أو اسم أو رقم، ولا تحسّن الكود ولا تعيد تنظيمه.
- إذا كان ملف بهذا المسار موجوداً، فاستبدله بالكامل.
- قد لا يعمل المشروع قبل البرومبت 11 لأن بعض الملفات لم تصل بعد. لا تنشئ بدائل مؤقتة ولا تحذف أي import.
- عند الانتهاء اكتب أسماء الملفات التي أنشأتها فقط، وانتظر البرومبت التالي.

<<<FILE: src/views/ConflictsView.tsx>>>
// src/views/ConflictsView.tsx
import React, { useState } from 'react';
import { Conflict, Project, ConflictSeverity, CoordinationDecision } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  FileText,
  FileCheck2,
  Undo2,
  Edit3,
  Printer
} from 'lucide-react';
import { formatArabicDateFriendly } from '../utils/dateUtils';

interface ConflictsViewProps {
  conflicts: Conflict[];
  projects: Project[];
  coordinations: CoordinationDecision[];
  onNavigate: (route: 'dashboard' | 'new-project' | 'conflicts' | 'coordination' | 'approved-analysis') => void;
  onDismissConflict: (conflictId: string, reason: string) => void;
  onReopenConflict: (conflictId: string) => void;
  onUpdateSegment: (projectId: string, newSegment: string) => void;
  onViewProtocol: (decision: CoordinationDecision) => void;
  selectedConflictId?: string | null;
  onSelectConflict?: (conflictId: string | null) => void;
  onQuickResolveConflict?: (conflictId: string) => void;
  focusedProjectId?: string | null;
  onClearProjectFocus?: () => void;
}

export const ConflictsView: React.FC<ConflictsViewProps> = ({
  conflicts,
  projects,
  coordinations,
  onNavigate,
  onDismissConflict,
  onReopenConflict,
  onUpdateSegment,
  onViewProtocol,
  selectedConflictId: initialSelectedId,
  onSelectConflict,
  onQuickResolveConflict,
  focusedProjectId,
  onClearProjectFocus,
}) => {
  const focusedProject = focusedProjectId ? projects.find((p) => p.id === focusedProjectId) : null;
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'resolved' | 'dismissed'>('active');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  
  // Active inspection modal state
  const [activeModalConflict, setActiveModalConflict] = useState<Conflict | null>(() => {
    if (initialSelectedId) {
      return conflicts.find((c) => c.id === initialSelectedId) || null;
    }
    return null;
  });

  // React to a new selection only: depending on `conflicts` would reopen the modal after every save.
  React.useEffect(() => {
    if (initialSelectedId) {
      const found = conflicts.find((c) => c.id === initialSelectedId);
      if (found) {
        setActiveModalConflict(found);
      }
    }
  }, [initialSelectedId]);

  const closeInspection = () => {
    setActiveModalConflict(null);
    onSelectConflict?.(null);
  };

  // Dismiss modal state
  const [dismissingConflictId, setDismissingConflictId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState<string>('');

  // Edit segment modal state
  const [editingSegmentProjectId, setEditingSegmentProjectId] = useState<string | null>(null);
  const [newSegmentText, setNewSegmentText] = useState<string>('');

  // Counts
  const activeCount = conflicts.filter((c) => c.status === 'detected' || c.status === 'reviewed').length;
  const resolvedCount = conflicts.filter((c) => c.status === 'resolved').length;
  const dismissedCount = conflicts.filter((c) => c.status === 'dismissed').length;

  // Filter conflicts
  const filteredConflicts = conflicts.filter((c) => {
    // A project opened from the dashboard shows its whole history, whatever the status tab
    if (focusedProjectId) return c.project_a_id === focusedProjectId || c.project_b_id === focusedProjectId;

    // Status filter
    if (selectedStatus === 'active') {
      if (c.status === 'resolved' || c.status === 'dismissed') return false;
    } else if (selectedStatus === 'resolved') {
      if (c.status !== 'resolved') return false;
    } else if (selectedStatus === 'dismissed') {
      if (c.status !== 'dismissed') return false;
    }

    // Severity filter
    if (selectedSeverity !== 'all' && c.severity !== selectedSeverity) {
      return false;
    }

    return true;
  });

  const getSeverityBadge = (severity: ConflictSeverity) => {
    switch (severity) {
      case 'high':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>تعارض مع التزفيت</span>
          </span>
        );
      case 'notice':
      case 'medium':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>تنبيه تنسيقي</span>
          </span>
        );
      case 'review':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold syria-badge-gold flex items-center gap-1.5 shadow-sm">
            <HelpCircle className="w-3.5 h-3.5 text-syria-gold shrink-0" />
            <span>بحاجة إلى مراجعة</span>
          </span>
        );
    }
  };

  const handleConfirmDismiss = () => {
    if (!dismissingConflictId || !dismissReason.trim()) return;
    onDismissConflict(dismissingConflictId, dismissReason.trim());
    setDismissingConflictId(null);
    setDismissReason('');
    if (activeModalConflict?.id === dismissingConflictId) {
      closeInspection();
    }
  };

  const handleConfirmUpdateSegment = () => {
    if (!editingSegmentProjectId || !newSegmentText.trim()) return;
    onUpdateSegment(editingSegmentProjectId, newSegmentText.trim());
    setEditingSegmentProjectId(null);
    setNewSegmentText('');
    closeInspection();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              مصفوفة إدارة وفض التعارضات الميدانية
            </h2>
            <span className="syria-badge-gold text-xs font-bold px-3 py-0.5 rounded-full font-mono">
              {activeCount} نشط | {resolvedCount} معتمد
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            سجل حتمي دائم لعمليات التنسيق، وتوثيق المحاضر، وتعديل المواعيد لحماية الإسفلت
          </p>
        </div>

        {/* Primary Status Filter */}
        <div className="flex items-center bg-slate-950 border border-syria-border rounded-xl p-1 text-xs shadow-inner">
          <button
            onClick={() => setSelectedStatus('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
              selectedStatus === 'active'
                ? 'bg-rose-950 text-rose-200 border border-rose-500/50 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>النشطة القائمة</span>
            <span className="bg-rose-900/60 px-2 py-0.5 rounded-full text-[10px] font-mono">{activeCount}</span>
          </button>
          <button
            onClick={() => setSelectedStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
              selectedStatus === 'resolved'
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/50 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>المحلولة والمعتمدة</span>
            <span className="bg-emerald-900/60 px-2 py-0.5 rounded-full text-[10px] font-mono">{resolvedCount}</span>
          </button>
          <button
            onClick={() => setSelectedStatus('dismissed')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
              selectedStatus === 'dismissed'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>المستبعدة</span>
            <span className="bg-slate-900 px-2 py-0.5 rounded-full text-[10px] font-mono">{dismissedCount}</span>
          </button>
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-bold cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-syria-card text-syria-goldLight border border-syria-borderGold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            الكل ({conflicts.length})
          </button>
        </div>
      </div>

      {focusedProject && (
        <div role="status" className="p-3 rounded-xl border border-syria-borderGold/60 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>تعرض هذه القائمة سجلات المشروع {focusedProject.code} فقط: {focusedProject.title_ar}</span>
          <button type="button" onClick={onClearProjectFocus} className="underline text-syria-gold cursor-pointer">عرض جميع التعارضات</button>
        </div>
      )}

      {/* Conflicts Cards List */}
      <div className="space-y-4">
        {filteredConflicts.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-syria-border">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">لا توجد سجلات تعارض ضمن هذا التبويب</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
              {focusedProject
                ? 'لا توجد تعارضات أو تنبيهات مسجلة لهذا المشروع.'
                : selectedStatus === 'active'
                ? 'تهانينا! تم فض وتنسيق جميع التعارضات الميدانية بنجاح ولا يوجد أي تضارب حالي.'
                : 'لا توجد عناصر مسجلة ضمن التصفية المحددة حالياً.'}
            </p>
          </div>
        ) : (
          filteredConflicts.map((conflict) => {
            const prjA = projects.find((p) => p.id === conflict.project_a_id);
            const prjB = projects.find((p) => p.id === conflict.project_b_id);
            const isResolved = conflict.status === 'resolved';
            const isDismissed = conflict.status === 'dismissed';

            return (
              <div
                key={conflict.id}
                className={`glass-card rounded-2xl p-5 border transition-all ${
                  isResolved
                    ? 'border-emerald-500/50 bg-gradient-to-l from-emerald-950/30 via-syria-card to-slate-950'
                    : isDismissed
                    ? 'border-slate-800 bg-slate-950/60 opacity-80'
                    : conflict.severity === 'high'
                    ? 'border-rose-500/50 hover:border-rose-400 bg-gradient-to-l from-rose-950/30 via-syria-card to-slate-950'
                    : 'border-syria-borderGold/60 hover:border-syria-gold bg-gradient-to-l from-syria-card via-slate-950 to-slate-950'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Top Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {isResolved ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>تم فض التعارض والاعتماد رسمياً</span>
                        </span>
                      ) : isDismissed ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 shadow-sm">
                          <Undo2 className="w-3.5 h-3.5 shrink-0" />
                          <span>مستبعد بتعليل هندسي</span>
                        </span>
                      ) : (
                        getSeverityBadge(conflict.severity)
                      )}

                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-syria-gold shrink-0" />
                        <span>{conflict.zone_name_ar}</span>
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-300 font-semibold" title={conflict.street_segment}>
                        {conflict.street_segment}
                      </span>

                      {prjA && prjB && prjA.work_type === prjB.work_type && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40">
                          عملين من نفس القطاع ({prjA.work_type_name_ar})
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white pt-1">
                      {conflict.conflict_type_label_ar}
                    </h3>

                    {/* Explanatory Evidence or Resolution Badge */}
                    {isResolved ? (
                      <div className="p-3.5 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-xs space-y-1.5 shadow-inner">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>المحضر الرسمي: {conflict.protocol_number || 'محضر محافظة دمشق'}</span>
                          </span>
                          <span className="font-mono text-xs text-syria-goldLight">
                            الوفر المتفادي: {conflict.avoided_cost_syp ? new Intl.NumberFormat('ar-SY').format(conflict.avoided_cost_syp) + ' ل.س' : 'محتسب'}
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          {conflict.resolution_notes} (بواسطة: {conflict.resolved_by})
                        </p>
                      </div>
                    ) : isDismissed ? (
                      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-400">
                        <div className="font-bold text-slate-200">تعليل الاستبعاد الهندسي:</div>
                        <p className="text-xs leading-relaxed">{conflict.resolution_notes} ({conflict.resolved_by})</p>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-syria-border">
                        {conflict.explanation}
                      </p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-2.5 shrink-0">
                    {isResolved ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const dec = coordinations.find((c) => c.conflict_id === conflict.id);
                            if (dec) {
                              onViewProtocol(dec);
                            } else {
                              alert('محضر التنسيق مسجل ومحفوظ في الأرشيف');
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl syria-gold-gradient text-slate-950 font-bold text-xs shadow-md shadow-syria-gold/20 flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-950" />
                          <span>معاينة وطباعة المحضر</span>
                        </button>
                        <button
                          onClick={() => onReopenConflict(conflict.id)}
                          title="إعادة فتح التعارض كحالة نشطة"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isDismissed ? (
                      <button
                        onClick={() => onReopenConflict(conflict.id)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>إلغاء الاستبعاد وإعادة الفحص</span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap lg:flex-col items-stretch sm:items-center lg:items-end gap-2 w-full lg:w-auto">
                        {conflict.is_blocking ? (
                          <>
                            <button
                              onClick={() => {
                                if (onQuickResolveConflict) {
                                  onQuickResolveConflict(conflict.id);
                                }
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:brightness-110 transition-all"
                              title="فض تعارض التزفيت فورياً بتأجيل التعبيد لما بعد انتهاء الحفر وفترة الأمان"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>فض تعارض التزفيت فورياً</span>
                            </button>

                            <button
                              onClick={() => {
                                if (onSelectConflict) {
                                  onSelectConflict(conflict.id);
                                }
                                onNavigate('coordination');
                              }}
                              className="px-4 py-2 rounded-xl syria-gold-gradient text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-syria-gold/20 hover:brightness-110"
                            >
                              <span>جدولة وتنسيق التزفيت</span>
                              <ArrowLeft className="w-3.5 h-3.5 text-slate-950" />
                            </button>
                          </>
                        ) : conflict.severity === 'review' ? (
                          <>
                            <button
                              onClick={() => setActiveModalConflict(conflict)}
                              className="px-4 py-2 rounded-xl syria-badge-gold text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:brightness-110"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-slate-950" />
                              <span>تدقيق وتصحيح المقطع الطرقي</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="text-[11px] text-amber-300 font-semibold bg-amber-950/50 px-3 py-1 rounded-xl border border-amber-500/30 text-center">
                              تنبيه تنسيقي (غير حاجب)
                            </div>
                            <button
                              onClick={() => setActiveModalConflict(conflict)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                            >
                              <span>فحص تفاصيل التنسيق والسلامة</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setActiveModalConflict(conflict)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-syria-border hover:border-syria-borderGold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-syria-gold" />
                          <span>الأدلة وتدقيق الموقع</span>
                        </button>

                        <button
                          onClick={() => {
                            setDismissingConflictId(conflict.id);
                            setDismissReason('تم التحقق الميداني: مسارات الورشات منفصلة ولا يوجد تقاطع في طبقة الإسفلت');
                          }}
                          className="text-xs text-slate-400 hover:text-rose-300 underline pt-0.5 cursor-pointer text-center"
                        >
                          استبعاد بتعليل هندسي...
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side by side projects preview */}
                {prjA && prjB && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-syria-border space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-syria-goldLight font-mono text-xs">{prjA.code}</span>
                        <span className="text-slate-400 text-xs font-semibold">{prjA.work_type_name_ar}</span>
                      </div>
                      <div className="font-bold text-white text-sm truncate">{prjA.title_ar}</div>
                      <div className="text-slate-400 text-xs leading-relaxed">{prjA.authority_name_ar}</div>
                      <div className="text-slate-200 text-xs pt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>من {formatArabicDateFriendly(prjA.start_date)} إلى {formatArabicDateFriendly(prjA.end_date)}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-rose-950/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-400 font-mono text-xs">{prjB.code}</span>
                        <span className="text-slate-400 text-xs font-semibold">{prjB.work_type_name_ar}</span>
                      </div>
                      <div className="font-bold text-white text-sm truncate">{prjB.title_ar}</div>
                      <div className="text-slate-400 text-xs leading-relaxed">{prjB.authority_name_ar}</div>
                      <div className="text-slate-200 text-xs pt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        <span>من {formatArabicDateFriendly(prjB.start_date)} إلى {formatArabicDateFriendly(prjB.end_date)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Deep-Dive Inspection & Spatial Correction Modal */}
      {activeModalConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card bg-slate-900 rounded-2xl max-w-2xl w-full border border-syria-borderGold/60 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-syria-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(activeModalConflict.severity)}
                  <span className="text-xs text-slate-400 font-mono">
                    معرف الحالة: {activeModalConflict.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">
                  تفاصيل الأدلة الهندسية وتدقيق المقطع الطرقي
                </h3>
              </div>
              <button
                onClick={closeInspection}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation */}
            <div className="p-4 bg-slate-950 rounded-xl border border-syria-border space-y-2">
              <span className="text-xs font-bold text-syria-gold">الدليل والتعليل الحتمي:</span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {activeModalConflict.explanation}
              </p>
            </div>

            {/* Interactive Spatial Override option */}
            <div className="p-4 rounded-xl bg-slate-950 border border-syria-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-syria-gold" />
                  <span>تصحيح المقطع الطرقي ميدانياً إذا كان المسار مختلفاً:</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                إذا بيّن الكشف الميداني أن أحد المشروعين ينفذ في مسار منفصل أو رصيف مغاير، يمكنك تعديل مقطع الشارع فوراً لفض الاشتباه:
              </p>

              {/* Projects buttons to edit segment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {(() => {
                  const pA = projects.find((p) => p.id === activeModalConflict.project_a_id);
                  const pB = projects.find((p) => p.id === activeModalConflict.project_b_id);
                  return (
                    <>
                      {pA && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSegmentProjectId(pA.id);
                            setNewSegmentText(pA.street_segment);
                          }}
                          className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-right cursor-pointer"
                        >
                          <div className="font-bold text-white text-xs">{pA.title_ar}</div>
                          <div className="text-[11px] text-syria-gold mt-1">المقطع الحالي: {pA.street_segment}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Edit3 className="w-3 h-3 text-slate-400" />
                            <span>انقر لتعديل مسار المشروع</span>
                          </div>
                        </button>
                      )}
                      {pB && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSegmentProjectId(pB.id);
                            setNewSegmentText(pB.street_segment);
                          }}
                          className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-right cursor-pointer"
                        >
                          <div className="font-bold text-white text-xs">{pB.title_ar}</div>
                          <div className="text-[11px] text-syria-gold mt-1">المقطع الحالي: {pB.street_segment}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Edit3 className="w-3 h-3 text-slate-400" />
                            <span>انقر لتعديل مسار المشروع</span>
                          </div>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Edit Segment Input Form */}
              {editingSegmentProjectId && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-200">
                    أدخل التسمية الدقيقة الجديدة للمقطع الطرقي:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSegmentText}
                      onChange={(e) => setNewSegmentText(e.target.value)}
                      placeholder="مثال: الرصيف الشرقي، جانب حديقة زكي الأرسوزي..."
                      className="flex-1 bg-slate-900 border border-syria-gold rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmUpdateSegment}
                      className="px-4 py-2 syria-gold-gradient text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      تحديث وفض التضارب
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSegmentProjectId(null)}
                      className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-syria-border">
              <button
                onClick={() => {
                  setDismissingConflictId(activeModalConflict.id);
                  setDismissReason('تم التحقق الميداني: مسارات الورشات منفصلة ولا يوجد تقاطع في طبقة الإسفلت');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                استبعاد التعارض بتعليل رسمي
              </button>

              <button
                onClick={() => {
                  // Carry the inspected conflict; coordination otherwise opens the first active one.
                  onSelectConflict?.(activeModalConflict.id);
                  setActiveModalConflict(null);
                  onNavigate('coordination');
                }}
                className="px-4 py-2 syria-gold-gradient text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>الانتقال لشاشة الجدولة والتنسيق</span>
                <ArrowLeft className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Justification Modal */}
      {dismissingConflictId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>توثيق تعليل استبعاد التعارض الهندسي</span>
              </h3>
              <button
                onClick={() => setDismissingConflictId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              وفقاً لقواعد التنسيق البلدي في محافظة دمشق، يتطلب استبعاد أي تعارض مكتشف تقديم تعليل هندسي موثق في السجلات الدائمة:
            </p>

            <textarea
              rows={4}
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="اكتب التعليل الهندسي الصريح (مثال: المسارات متجاورة على رصيفين متقابلين، تم التنسيق المسبق مع ورشة الصرف)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-syria-gold leading-relaxed"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDismissingConflictId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!dismissReason.trim()}
                onClick={handleConfirmDismiss}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                اعتماد الاستبعاد وتوثيقه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
<<<END FILE>>>
