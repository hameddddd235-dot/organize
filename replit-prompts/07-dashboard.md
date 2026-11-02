# البرومبت 7 من 13: لوحة القيادة ونافذة التعديل

أكمل نسخ المشروع. هذه شاشة لوحة القيادة ونافذة تعديل المشروع.

قواعد النسخ في هذا البرومبت:
- أنشئ كل ملف محاط بالعلامتين <<<FILE: المسار>>> و<<<END FILE>>> في المسار نفسه، وبمحتواه حرفياً. العلامتان نفسهما لا تدخلان في الملف.
- لا تُعد صياغة أي نص عربي، ولا تغيّر أي class أو لون أو اسم أو رقم، ولا تحسّن الكود ولا تعيد تنظيمه.
- إذا كان ملف بهذا المسار موجوداً، فاستبدله بالكامل.
- قد لا يعمل المشروع قبل البرومبت 11 لأن بعض الملفات لم تصل بعد. لا تنشئ بدائل مؤقتة ولا تحذف أي import.
- عند الانتهاء اكتب أسماء الملفات التي أنشأتها فقط، وانتظر البرومبت التالي.

<<<FILE: src/views/DashboardView.tsx>>>
// src/views/DashboardView.tsx
import React, { useState, useEffect } from 'react';
import { Project, Conflict, WorkType, Zone } from '../types';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Search, 
  Filter, 
  PlusCircle, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  TrendingUp, 
  Edit, 
  Trash2, 
  FileCheck2,
  ShieldAlert,
  CalendarCheck2
} from 'lucide-react';
import { formatArabicDateFriendly } from '../utils/dateUtils';
import { calculateAvoidedReworkSavings } from '../utils/financial';
import { findSimilarPavingGroups, SimilarPavingGroup } from '../utils/conflictDetector';
import { EditProjectModal } from '../components/EditProjectModal';
import { SyrianEagleLogo } from '../components/SyrianEagleLogo';

interface DashboardViewProps {
  projects: Project[];
  conflicts: Conflict[];
  zones: Zone[];
  onNavigate: (route: 'dashboard' | 'new-project' | 'conflicts' | 'coordination' | 'approved-analysis') => void;
  onSelectConflict?: (conflictId: string) => void;
  onInspectProject?: (projectId: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onScanProjects: () => { projectsChecked: number; excludedProjects: number; conflicts: Conflict[]; similarPaving: SimilarPavingGroup[] };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  conflicts,
  zones,
  onNavigate,
  onSelectConflict,
  onInspectProject,
  onUpdateProject,
  onDeleteProject,
  onScanProjects,
}) => {
  const [scanResult, setScanResult] = useState<ReturnType<DashboardViewProps['onScanProjects']> | null>(null);
  // A result describes a specific portfolio snapshot; do not show it after edits/deletions.
  useEffect(() => { setScanResult(null); }, [projects]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Active conflicts (unresolved)
  const activeConflicts = conflicts.filter((c) => c.status !== 'resolved' && c.status !== 'dismissed');
  const resolvedConflictsCount = conflicts.filter((c) => c.status === 'resolved').length;

  // Rule 4: The dashboard's conflict counter must count only unresolved confirmed paving-related blocking conflicts
  const unresolvedBlockingConflicts = activeConflicts.filter(
    (c) => c.is_blocking && c.severity === 'high'
  );
  const blockingConflictsCount = unresolvedBlockingConflicts.length;

  // Rule 4: Coordination notices and ambiguous-location reviews should have separate counters
  const utilityNotices = activeConflicts.filter(
    (c) => c.severity === 'notice' || c.conflict_type === 'utility_coordination_notice'
  );
  const utilityNoticesCount = utilityNotices.length;

  const reviewConflicts = activeConflicts.filter(
    (c) => c.severity === 'review' || c.conflict_type === 'uncertain_location_review' || c.conflict_type === 'spatial_proximity_needs_review'
  );
  const reviewConflictsCount = reviewConflicts.length;

  // Rule 6: Only calculate potential avoided road rework costs for verified paving-related conflicts without double-counting
  const financialResult = calculateAvoidedReworkSavings(unresolvedBlockingConflicts, projects);
  const formattedTotalCostAmount = financialResult.totalAvoidableCostAmountFormatted;

  // Advisory only: similar paving never changes the conflict counters above
  const similarPavingGroups = findSimilarPavingGroups(projects);
  const similarPavingIds = new Set(similarPavingGroups.flatMap((g) => g.projects.map((p) => p.id)));

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.title_ar.includes(searchTerm) ||
      p.street_segment.includes(searchTerm) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authority_name_ar.includes(searchTerm);

    const matchesWorkType = selectedWorkType === 'all' || p.work_type === selectedWorkType;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

    return matchesSearch && matchesWorkType && matchesStatus;
  });

  const getWorkTypeBadge = (wt: WorkType) => {
    switch (wt) {
      case 'water':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/90 text-blue-300 border border-blue-500/40 inline-flex items-center gap-1">
            مياه
          </span>
        );
      case 'electricity':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
            كهرباء
          </span>
        );
      case 'sanitation':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
            صرف صحي
          </span>
        );
      case 'telecom':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/90 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
            اتصالات
          </span>
        );
      case 'paving':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold syria-badge-gold inline-flex items-center gap-1">
            تعبيد وتزفيت
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Quick CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              لوحة القيادة ومتابعة المشاريع البلدية
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            متابعة مشروعات البنية التحتية، ورصد تعارضات التزفيت، وتوثيق قرارات التنسيق الهندسي
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button type="button" onClick={() => setScanResult(onScanProjects())}
            className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-sm cursor-pointer">
            فحص جميع الأعمال
          </button>
          <button
            onClick={() => onNavigate('approved-analysis')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-syria-gold font-bold text-xs sm:text-sm flex items-center gap-2 border border-syria-borderGold/60 hover:brightness-110 transition-all cursor-pointer shadow-sm"
          >
            <CalendarCheck2 className="w-4 h-4 text-syria-gold" />
            <span>تحليل الأعمال المعتمدة ({resolvedConflictsCount})</span>
          </button>

          <button
            onClick={() => onNavigate('new-project')}
            className="px-4 py-2.5 rounded-xl syria-gold-gradient text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-syria-gold/20 hover:brightness-110 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>إدخال وتحليل أمر عمل جديد</span>
          </button>
        </div>
      </div>

      {scanResult && (
        <section role="status" aria-live="polite" className="p-4 rounded-xl border border-syria-border bg-slate-900 space-y-3">
          <h3 className="font-bold">نتيجة فحص جميع الأعمال</h3>
          <p className="text-sm">تم فحص {scanResult.projectsChecked} عملاً نشطاً، بغض النظر عن فلاتر الجدول.
            {scanResult.excludedProjects > 0 && ` تم استثناء ${scanResult.excludedProjects} من الأعمال المكتملة أو المعلقة.`}</p>
          <p className="text-sm">
            تعارضات زمنية مؤكدة: {scanResult.conflicts.filter(c => c.is_blocking).length} —
            تنبيهات تنسيق وترتيب: {scanResult.conflicts.filter(c => c.severity === 'notice').length} —
            تحتاج مراجعة: {scanResult.conflicts.filter(c => c.severity === 'review').length} —
            أحياء فيها أعمال تزفيت متشابهة: {scanResult.similarPaving.length}
          </p>
          {scanResult.conflicts.length === 0 ? <p className="text-emerald-300">لا توجد تعارضات أو تنبيهات بين الأعمال الحالية.</p> : (
            <>
              <p className="text-xs text-slate-400">هذا فحص جديد للتواريخ الحالية، ويشمل الحالات المستبعدة سابقاً دون تغيير قراراتها.</p>
              <ul className="space-y-2 max-h-80 overflow-auto">
                {scanResult.conflicts.map(c => (
                  <li key={c.id} className="p-3 rounded-lg bg-slate-950 text-sm">
                    <strong className={c.is_blocking ? 'text-rose-300' : 'text-amber-200'}>{c.conflict_type_label_ar}</strong>
                    <p>{c.explanation}</p>
                    <button type="button" className="mt-2 underline text-syria-gold" onClick={() => onSelectConflict?.(c.id)}>عرض التفاصيل</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden border border-syria-border hover:border-syria-borderGold/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-300">المشاريع المسجلة في النطاق</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{projects.length}</span>
            <span className="text-xs text-blue-300 font-semibold">مشروع رسمي</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-syria-gold shrink-0" />
            <span>سجلات محفوظة بالتخزين المحلي الآمن</span>
          </div>
        </div>

        {/* Conflicts Alert */}
        <div 
          onClick={() => onNavigate('conflicts')}
          className="glass-card p-5 rounded-2xl relative overflow-hidden cursor-pointer border border-rose-500/40 hover:border-rose-400 transition-all bg-gradient-to-br from-slate-950 via-syria-card to-rose-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-rose-200">التعارضات الحرجة مع التزفيت</span>
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">{blockingConflictsCount}</span>
            <span className="text-xs text-rose-300 font-bold">
              تعارض مع التزفيت
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-300 flex items-center justify-between gap-1 border-t border-rose-500/20 pt-2 font-medium">
            <span className="text-amber-300">{utilityNoticesCount} تنبيه تنسيقي</span>
            <span className="text-slate-500">•</span>
            <span className="text-syria-gold">{reviewConflictsCount} بحاجة إلى مراجعة</span>
          </div>
        </div>

        {/* Resolved Conflicts Counter */}
        <div 
          onClick={() => onNavigate('approved-analysis')}
          className="glass-card p-5 rounded-2xl relative overflow-hidden cursor-pointer border border-emerald-500/40 hover:border-emerald-400 transition-all bg-gradient-to-br from-slate-950 via-syria-card to-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-emerald-200">التعارضات المعتمدة والمحسومة</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-300">{resolvedConflictsCount}</span>
            <span className="text-xs text-emerald-400 font-semibold">محضر معتمد</span>
          </div>
          <div className="mt-3 text-xs text-slate-300 flex items-center gap-1.5">
            <span>محاضر رسمية موثقة جاهزة للطباعة</span>
          </div>
        </div>

        {/* Avoidable Cost */}
        <div 
          onClick={() => onNavigate('coordination')}
          className="glass-card p-5 rounded-2xl relative overflow-hidden cursor-pointer border border-syria-borderGold/60 hover:border-syria-gold transition-all bg-gradient-to-br from-slate-950 via-syria-card to-syria-navy"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-syria-goldLight">كلفة التعبيد المتفادية (تقديرية)</span>
            <div className="p-2.5 rounded-xl bg-syria-gold/15 text-syria-gold border border-syria-borderGold">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-syria-goldLight">
              <bdi>{formattedTotalCostAmount}</bdi>
            </span>
            <span className="text-xs font-bold text-syria-gold">ل.س</span>
          </div>
          <div className="mt-3 text-xs text-syria-goldLight/90 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-syria-gold" />
            <span>وفر تقديري لتفادي إعادة تعبيد الإسفلت</span>
          </div>
        </div>
      </div>

      {/* Critical Conflict Banner */}
      {blockingConflictsCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-l from-rose-950/60 via-slate-950 to-slate-950 border border-rose-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl mt-0.5 border border-rose-500/40 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>يوجد {blockingConflictsCount} تعارض حرج مع التزفيت بحاجة للفض والاعتماد الرسمي</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                يوجد تعارض تزفيت مباشر في {unresolvedBlockingConflicts[0]?.zone_name_ar} ({unresolvedBlockingConflicts[0]?.street_segment}) مجدول قبل اكتمال أعمال الحفر تحت الأرض.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onSelectConflict && unresolvedBlockingConflicts[0]) {
                onSelectConflict(unresolvedBlockingConflicts[0].id);
              }
              onNavigate('conflicts');
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-2 shadow-md cursor-pointer"
          >
            <span>معاينة تعارض التزفيت</span>
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}


      {/* Similar Paving Works Alert */}
      {similarPavingGroups.length > 0 && (
        <section aria-label="أعمال تزفيت متشابهة" className="p-4 rounded-2xl border border-amber-500/50 bg-amber-950/30 space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>تنبيه: أعمال تزفيت متشابهة في نفس المنطقة</span>
          </h3>
          {similarPavingGroups.map((group) => (
            <div key={group.zone_id} className="text-xs sm:text-sm text-slate-200 space-y-1">
              <div className="font-bold">
                {group.zone_name_ar}: {group.projects.length} أعمال تزفيت نشطة
                {group.hasSameSegment && <span className="text-amber-300"> — بعضها قد يكون في نفس المقطع الطرقي</span>}
              </div>
              <ul className="list-disc pr-5 text-slate-300">
                {group.projects.map((p) => (
                  <li key={p.id}>
                    {p.code} — {p.street_segment} ({formatArabicDateFriendly(p.start_date)} إلى {formatArabicDateFriendly(p.end_date)})
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">تنبيه إرشادي لا يمنع الحفظ؛ تحقق من عدم تكرار أمر التزفيت أو ادرس دمج الأعمال.</p>
        </section>
      )}

      {/* Filterable Projects Table Section */}
      <div className="glass-card rounded-2xl border border-syria-border overflow-hidden shadow-xl">
        <div className="p-5 border-b border-syria-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-white">سجل أوامر العمل والمشاريع البلدية</h3>
            <span className="text-xs syria-badge-gold px-2.5 py-0.5 rounded-full font-mono font-bold">
              {filteredProjects.length} مشروع
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث بالرمز، الشارع، أو الجهة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/90 border border-syria-border rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-syria-gold"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-syria-border rounded-xl px-3 py-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-syria-gold" />
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900 text-white">كل القطاعات</option>
                <option value="water" className="bg-slate-900 text-white">مياه</option>
                <option value="sanitation" className="bg-slate-900 text-white">صرف صحي</option>
                <option value="electricity" className="bg-slate-900 text-white">كهرباء</option>
                <option value="telecom" className="bg-slate-900 text-white">اتصالات</option>
                <option value="paving" className="bg-slate-900 text-white">تعبيد وتزفيت</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-xs text-slate-300 font-bold border-b border-syria-border">
              <tr>
                <th className="px-4 py-3.5">رمز المشروع</th>
                <th className="px-4 py-3.5">الجهة والموضوع</th>
                <th className="px-4 py-3.5">القطاع</th>
                <th className="px-4 py-3.5">الحي والمقطع الطرقي</th>
                <th className="px-4 py-3.5">التاريخ والمدة</th>
                <th className="px-4 py-3.5">المطابقة الجغرافية</th>
                <th className="px-4 py-3.5">إدارة المشروع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                    لا توجد مشاريع مطابقة لمعايير البحث المحددة
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-syria-goldLight whitespace-nowrap">
                      {project.code}
                    </td>

                    <td className="px-4 py-3.5 min-w-[200px]">
                      <div className="font-bold text-white text-sm">{project.title_ar}</div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">{project.authority_name_ar}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getWorkTypeBadge(project.work_type)}
                      {similarPavingIds.has(project.id) && (
                        <div className="mt-1 text-[11px] font-semibold text-amber-300">تزفيت مشابه في الحي</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 min-w-[180px]">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-syria-gold shrink-0" />
                        <span className="font-bold">{project.zone_name_ar}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed" title={project.street_segment}>
                        {project.street_segment}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatArabicDateFriendly(project.start_date)}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        حتى {formatArabicDateFriendly(project.end_date)} <span className="text-slate-500 font-mono">({project.duration_days} يوم)</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {project.location_review_needed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-amber-950/90 text-amber-300 border border-amber-500/40 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>يتطلب تدقيق</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>مقطع مؤكد</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-syria-gold border border-slate-700 cursor-pointer"
                          title="تعديل بيانات المشروع وتواريخه"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`هل ترغب بحذف المشروع (${project.code}) نهائياً؟`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 cursor-pointer"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onInspectProject ? onInspectProject(project.id) : onNavigate('conflicts')}
                          className="text-xs text-syria-gold hover:text-syria-goldLight font-bold p-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>فحص</span>
                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          zones={zones}
          allProjects={projects}
          onSave={onUpdateProject}
          onDelete={onDeleteProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
};
<<<END FILE>>>

<<<FILE: src/components/EditProjectModal.tsx>>>
// src/components/EditProjectModal.tsx
import React, { useState } from 'react';
import { Project, Zone, AuthorityType, WorkType, Conflict } from '../types';
import { X, Save, Trash2, AlertTriangle, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { addDays, formatArabicDateFriendly, validateProjectDates } from '../utils/dateUtils';
import { findSimilarPavingWorks, validateProjectUpdate, ProspectiveValidationResult } from '../utils/conflictDetector';

interface EditProjectModalProps {
  project: Project;
  zones: Zone[];
  allProjects: Project[];
  onSave: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  zones,
  allProjects,
  onSave,
  onDelete,
  onClose,
}) => {
  const [titleAr, setTitleAr] = useState(project.title_ar);
  const [authority, setAuthority] = useState<AuthorityType>(project.authority);
  const [authorityNameAr, setAuthorityNameAr] = useState(project.authority_name_ar);
  const [workType, setWorkType] = useState<WorkType>(project.work_type);
  const [zoneId, setZoneId] = useState(project.zone_id);
  const [streetSegment, setStreetSegment] = useState(project.street_segment);
  const [startDate, setStartDate] = useState(project.start_date);
  const [durationDays, setDurationDays] = useState(project.duration_days);
  const [roadLengthM, setRoadLengthM] = useState(project.road_length_m);
  const [roadWidthM, setRoadWidthM] = useState(project.road_width_m);
  const [locationReviewNeeded, setLocationReviewNeeded] = useState(project.location_review_needed);

  // Pre-save prospective validation state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Project> | null>(null);
  const [validationResult, setValidationResult] = useState<ProspectiveValidationResult | null>(null);

  // Authority name mapping helper
  const handleAuthorityChange = (newAuth: AuthorityType) => {
    setAuthority(newAuth);
    switch (newAuth) {
      case 'water':
        setAuthorityNameAr('المؤسسة العامة لمياه الشرب والصرف الصحي');
        break;
      case 'electricity':
        setAuthorityNameAr('الشركة العامة لكهرباء محافظة دمشق');
        break;
      case 'sanitation':
        setAuthorityNameAr('مديرية الصرف الصحي بمحافظة دمشق');
        break;
      case 'telecom':
        setAuthorityNameAr('الشركة السورية للاتصالات - فرع دمشق');
        break;
      case 'paving':
        setAuthorityNameAr('مديرية الصيانة والإنشاءات البلدية');
        break;
      default:
        setAuthorityNameAr('الجهة المنفذة');
    }
  };

  const [saveError, setSaveError] = useState('');
  // durationDays is 0 while the field is empty; validateProjectDates rejects that on save.
  const calculatedEndDate = addDays(startDate, Math.max(1, durationDays) - 1);

  const liveValidation = validateProjectUpdate(project.id, {
    start_date: startDate, end_date: calculatedEndDate, duration_days: durationDays,
    work_type: workType, zone_id: zoneId, street_segment: streetSegment,
    location_review_needed: locationReviewNeeded,
  }, allProjects);
  const similarPaving = findSimilarPavingWorks({
    id: project.id, work_type: workType, zone_id: zoneId, street_segment: streetSegment,
    start_date: startDate, end_date: calculatedEndDate,
  }, allProjects);
  const commit = (updates: Partial<Project>) => {
    try {
      onSave(project.id, updates);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'تعذر حفظ المشروع');
      setShowWarningModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedZone = zones.find((z) => z.id === zoneId);

    const workTypeNameMap: Record<WorkType, string> = {
      water: 'مياه وشبكات ضخ',
      electricity: 'تمديدات كهرباء وتوتر',
      sanitation: 'صرف صحي ومطريات',
      telecom: 'اتصالات وألياف ضوئية',
      paving: 'تعبيد وتزفيت سطحي',
    };

    const updates: Partial<Project> = {
      title_ar: titleAr,
      authority,
      authority_name_ar: authorityNameAr,
      work_type: workType,
      work_type_name_ar: workTypeNameMap[workType] || project.work_type_name_ar,
      zone_id: zoneId,
      zone_name_ar: selectedZone ? selectedZone.name_ar : project.zone_name_ar,
      street_segment: streetSegment,
      start_date: startDate,
      end_date: calculatedEndDate,
      duration_days: durationDays,
      road_length_m: roadLengthM,
      road_width_m: roadWidthM,
      location_review_needed: locationReviewNeeded,
    };

    try { validateProjectDates({ ...project, ...updates }); }
    catch (error) { setSaveError((error as Error).message); return; }
    setSaveError('');
    // Pre-save prospective validation
    const validation = validateProjectUpdate(project.id, updates, allProjects);

    if (validation.hasBlockingConflict) {
      setPendingUpdates(updates);
      setValidationResult(validation);
      setShowWarningModal(true);
      return;
    }

    // No blocking conflict: commit immediately
    commit(updates);
  };

  const handleConfirmSaveWithConflict = () => {
    if (pendingUpdates) {
      commit(pendingUpdates);
    }
  };

  const handleReturnToEdit = () => {
    setShowWarningModal(false);
  };

  // Find the primary conflicting project for display
  const primaryConflict = validationResult?.blockingConflicts[0];
  const otherProjectId = primaryConflict
    ? primaryConflict.project_a_id === project.id
      ? primaryConflict.project_b_id
      : primaryConflict.project_a_id
    : null;
  const otherProject = otherProjectId ? allProjects.find((p) => p.id === otherProjectId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card bg-slate-900 border border-syria-borderGold/60 rounded-2xl max-w-xl w-full p-6 space-y-5 text-white max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-syria-border pb-3.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs syria-badge-gold px-2.5 py-0.5 rounded font-bold">
              {project.code}
            </span>
            <h3 className="font-bold text-base text-white">تعديل بيانات أمر العمل الميداني</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">عنوان المشروع أو أمر العمل:</label>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              required
              className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold font-medium"
            />
          </div>

          {/* Authority & Work Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">الجهة المنفذة:</label>
              <select
                value={authority}
                onChange={(e) => handleAuthorityChange(e.target.value as AuthorityType)}
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold cursor-pointer"
              >
                <option value="water">المؤسسة العامة لمياه الشرب</option>
                <option value="electricity">الشركة العامة للكهرباء</option>
                <option value="sanitation">مديرية الصرف الصحي</option>
                <option value="municipality_maintenance">الصيانة العامة</option>
                <option value="telecom">الشركة السورية للاتصالات</option>
                <option value="paving">مديرية الصيانة والتعبيد البلدية</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">نوع العمل الهندسي:</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as WorkType)}
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold cursor-pointer"
              >
                <option value="water">مياه وشبكات ضخ</option>
                <option value="electricity">تمديدات كهرباء وتوتر</option>
                <option value="sanitation">صرف صحي ومطريات</option>
                <option value="telecom">اتصالات وألياف ضوئية</option>
                <option value="paving">تعبيد وتزفيت سطحي (نهائي)</option>
              </select>
            </div>
          </div>

          {/* Zone & Street Segment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">الحي المعتمد:</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold cursor-pointer"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">المقطع الطرقي المحدد:</label>
              <input
                type="text"
                value={streetSegment}
                onChange={(e) => setStreetSegment(e.target.value)}
                required
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold font-medium"
              />
            </div>
          </div>

          {/* Start Date & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">تاريخ البدء:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">المدة (أيام):</label>
              <input
                type="number"
                min={1}
                max={120}
                value={durationDays || ''}
                onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">تاريخ الانتهاء المحسوب:</label>
              <div className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-syria-goldLight font-bold">
                {formatArabicDateFriendly(calculatedEndDate)}
              </div>
            </div>
          </div>

          {/* Road Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              {/* Zero means "not stated": work orders saved without dimensions must stay editable. */}
              <label className="block text-slate-300 font-bold mb-1.5">طول الطريق (متر):</label>
              <input
                type="number"
                min={0}
                max={5000}
                value={roadLengthM || ''}
                onChange={(e) => setRoadLengthM(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">عرض الطريق (متر):</label>
              <input
                type="number"
                min={0}
                max={60}
                value={roadWidthM || ''}
                onChange={(e) => setRoadWidthM(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-syria-gold font-mono"
              />
            </div>
          </div>

          {saveError && <p role="alert" className="text-rose-300">{saveError}</p>}
          <div role="status" aria-live="polite" className="p-3 border border-slate-600 rounded-xl">
            {liveValidation.hasBlockingConflict ? 'تحذير: التعديل ينتج تعارض تزفيت يتطلب تأكيداً عند الحفظ.' :
              liveValidation.hasReviewNotice ? 'الموقع يحتاج مراجعة هندسية قبل اعتماد الجدولة.' :
              liveValidation.hasCoordinationNotice ? 'يوجد تنبيه تنسيقي؛ يمكنك حفظ التعديل دون تأكيد تعارض زمني.' : 'لا توجد تعارضات مكتشفة للتعديل الحالي.'}
            {liveValidation.coordinationNotices.map(c => <p key={c.id} className="mt-2 text-amber-200">{c.explanation}</p>)}
            {liveValidation.reviewNotices.map(c => <p key={c.id} className="mt-2 text-amber-200">{c.explanation}</p>)}
          </div>
          {similarPaving.length > 0 && (
            <div role="status" className="p-3 border border-amber-500/50 bg-amber-950/40 rounded-xl text-amber-200 space-y-1">
              <p className="font-bold">تنبيه: توجد أعمال تزفيت مشابهة في نفس الحي</p>
              {similarPaving.map((s) => <p key={s.project.id}>{s.message}</p>)}
            </div>
          )}
          {/* Action Buttons */}
          <div className="pt-4 border-t border-syria-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm(`هل أنت متأكد من حذف أمر العمل (${project.code}) نهائياً؟`)) {
                  onDelete(project.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-500/40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المشروع</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 syria-gold-gradient text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-syria-gold/20 hover:brightness-110 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>حفظ التعديلات الميدانية</span>
              </button>
            </div>
          </div>
        </form>

        {/* Pre-Save Prospective Conflict Warning Modal */}
        {showWarningModal && primaryConflict && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-950 border-2 border-rose-500/80 rounded-2xl max-w-lg w-full p-6 space-y-4 text-white shadow-2xl">
              {/* Alert Header */}
              <div className="flex items-start gap-3 border-b border-rose-500/30 pb-3">
                <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-500/50 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h4 className="font-black text-base text-rose-200">
                    تحذير مسبق قبل الحفظ: تعارض قاطع مع التزفيت
                  </h4>
                  <p className="text-xs text-rose-300/90 mt-0.5">
                    تعديل البيانات المدخلة يولد تعارضاً زمنياً ومكانياً مباشراً مع مشروع بنية تحتية آخر
                  </p>
                </div>
              </div>

              {/* Conflicting Projects Comparison */}
              <div className="space-y-2.5 text-xs">
                {/* Project 1 (The modified project) */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-syria-gold font-mono">{project.code} (المشروع المعدل)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                      {authorityNameAr}
                    </span>
                  </div>
                  <div className="text-white font-medium">{titleAr}</div>
                  <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                    <span>الفترة المعدلة: {formatArabicDateFriendly(startDate)} إلى {formatArabicDateFriendly(calculatedEndDate)}</span>
                  </div>
                </div>

                {/* Project 2 (The conflicting project) */}
                {otherProject && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 font-mono">{otherProject.code} (المشروع المتعارض)</span>
                      <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 font-semibold text-[11px]">
                        {otherProject.authority_name_ar}
                      </span>
                    </div>
                    <div className="text-rose-100 font-medium">{otherProject.title_ar}</div>
                    <div className="text-rose-300/80 font-mono text-[11px] flex items-center gap-2">
                      <span>الفترة المجدولة: {formatArabicDateFriendly(otherProject.start_date)} إلى {formatArabicDateFriendly(otherProject.end_date)}</span>
                    </div>
                  </div>
                )}

                {/* Verified Location */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-[11px]">
                  <span className="font-bold text-syria-gold ml-1">الموقع المحدد:</span>
                  <span>{streetSegment}</span>
                </div>

                {/* Reason */}
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
                  <div className="font-bold text-rose-300 mb-1">سبب التعارض الهندسي والرقابي:</div>
                  <p>{primaryConflict.explanation}</p>
                </div>

                {/* Official Disclaimer */}
                <p className="text-[11px] text-amber-300/90 leading-normal bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30">
                  تنبيه: حفظ هذا التعديل سيؤدي إلى تسجيل تعارض رسمي قاطع وهدر مالي محتمل في سجل المنظومة. الحفظ لا يعني المصادقة على الجدول الزمني أو حل التعارض، بل يسجله في سجل التعارضات الميدانية النشطة للمتابعة الإدارية.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReturnToEdit}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  العودة للتعديل
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSaveWithConflict}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/50 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>حفظ مع تسجيل التعارض</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
<<<END FILE>>>
