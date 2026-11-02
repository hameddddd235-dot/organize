// src/views/ApprovedAnalysisView.tsx
import React, { useState } from 'react';
import { Project, CoordinationDecision, Conflict, Zone, WorkType } from '../types';
import { formatArabicDateFriendly, formatTimestampArabic } from '../utils/dateUtils';
import { SyrianEagleLogo } from '../components/SyrianEagleLogo';
import { 
  CheckCircle2, 
  Printer, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowRight,
  Clock, 
  Coins, 
  Eye, 
  AlertCircle,
  Building2,
  CalendarCheck2,
  Sparkles
} from 'lucide-react';

interface ApprovedAnalysisViewProps {
  coordinations: CoordinationDecision[];
  projects: Project[];
  conflicts: Conflict[];
  zones: Zone[];
  onViewProtocol: (decision: CoordinationDecision) => void;
  onNavigate: (route: 'dashboard' | 'new-project' | 'conflicts' | 'coordination' | 'approved-analysis') => void;
}

export const ApprovedAnalysisView: React.FC<ApprovedAnalysisViewProps> = ({
  coordinations,
  projects,
  conflicts,
  zones,
  onViewProtocol,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('all');
  const [timelineStreetFilter, setTimelineStreetFilter] = useState<string>('all');

  // Calculate total savings across all approved decisions without double-counting the same paving project
  const approvedDecisions = coordinations.filter(c => c.review_status === 'approved');
  const seenPavingIds = new Set<string>();
  let totalApprovedSavingsSYP = 0;
  for (const c of approvedDecisions) {
    const pavId = c.paving_project_id;
    if (pavId && !seenPavingIds.has(pavId)) {
      seenPavingIds.add(pavId);
      totalApprovedSavingsSYP += (c.estimated_avoidable_cost || 0);
    } else if (!pavId) {
      totalApprovedSavingsSYP += (c.estimated_avoidable_cost || 0);
    }
  }
  const formattedSavings = new Intl.NumberFormat('ar-SY').format(totalApprovedSavingsSYP) + ' ل.س';

  // Find all projects that have been rescheduled or coordinated
  const coordinatedProjectIds = new Set(
    approvedDecisions.filter((c) => c.action_applied_to_project).map((c) => c.rescheduled_project_id || c.paving_project_id).filter(Boolean)
  );

  // Share of active projects with no open conflict, instead of a fixed 100%.
  const activeProjects = projects.filter((p) => p.status !== 'completed' && p.status !== 'suspended');
  const openConflicts = conflicts.filter((c) => c.status !== 'resolved' && c.status !== 'dismissed');
  const projectsInConflict = new Set(openConflicts.flatMap((c) => [c.project_a_id, c.project_b_id]));
  const conflictFreeCount = activeProjects.filter((p) => !projectsInConflict.has(p.id)).length;
  const conflictFreeRatio = activeProjects.length ? Math.round((conflictFreeCount / activeProjects.length) * 100) : 100;

  // Street cards claim safety only when no open conflict touches that street's projects.
  const hasOpenConflict = (streetProjects: Project[]) => streetProjects.some((p) => projectsInConflict.has(p.id));

  // Filtered decisions list
  const filteredDecisions = coordinations.filter((decision) => {
    const prj = projects.find((p) => p.id === (decision.rescheduled_project_id || decision.paving_project_id));
    const predecessor = decision.predecessor_project_ids?.[0]
      ? projects.find((p) => p.id === decision.predecessor_project_ids[0])
      : null;

    const matchesSearch =
      searchTerm === '' ||
      decision.protocol_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (decision.reviewed_by ? decision.reviewed_by.includes(searchTerm) : false) ||
      (prj && (
        prj.title_ar.includes(searchTerm) ||
        prj.street_segment.includes(searchTerm) ||
        prj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prj.authority_name_ar.includes(searchTerm)
      )) ||
      (predecessor && predecessor.title_ar.includes(searchTerm));

    const matchesZone =
      selectedZone === 'all' ||
      (prj && prj.zone_id === selectedZone) ||
      (predecessor && predecessor.zone_id === selectedZone);

    const matchesWorkType =
      selectedWorkType === 'all' ||
      (prj && prj.work_type === selectedWorkType);

    return matchesSearch && matchesZone && matchesWorkType;
  });

  // Extract unique streets with multiple projects to visualize sequential timelines
  const streetSegmentsMap: Record<string, { zoneName: string; projects: Project[] }> = {};
  for (const p of projects) {
    if (!p.street_segment) continue;
    if (!streetSegmentsMap[p.street_segment]) {
      streetSegmentsMap[p.street_segment] = {
        zoneName: p.zone_name_ar,
        projects: [],
      };
    }
    streetSegmentsMap[p.street_segment].projects.push(p);
  }

  const uniqueStreets = Object.keys(streetSegmentsMap);

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
      {/* Official Header with National Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-syria-border pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <CalendarCheck2 className="w-6 h-6 text-syria-gold" />
              <span>تحليل ومتابعة الأعمال والمحاضر المعتمدة</span>
            </h2>
            <span className="syria-badge-gold text-xs font-bold px-3 py-0.5 rounded-full font-mono">
              {approvedDecisions.length} قرارات نافذة
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            تدقيق الجداول الزمنية المنسقة، ومقارنة التواريخ قبل وبعد التعديل، وضمان عدم تكرار التضارب الميداني في نفس الموقع والزمان
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('coordination')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-syria-gold font-bold text-xs border border-syria-borderGold/60 cursor-pointer flex items-center gap-1.5"
          >
            <span>إدارة الجدولة والتنسيق</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-4 border border-syria-border bg-gradient-to-br from-slate-900 to-syria-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المحاضر المعتمدة النافذة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {approvedDecisions.length}
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>محاضر هندسية ملزمة وموقعة</span>
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-4 border border-syria-borderGold/40 bg-gradient-to-br from-slate-900 to-syria-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-syria-gold">إجمالي الوفر المالي المتفادي</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 text-syria-gold flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-syria-goldLight font-mono mt-2 truncate">
            {formattedSavings}
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            حماية المال العام من إعادة الهدم والحفر
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-4 border border-syria-border bg-gradient-to-br from-slate-900 to-syria-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نسبة خلو المشروعات من التضارب</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {conflictFreeRatio}%
          </div>
          <p className={`text-[11px] flex items-center gap-1 mt-1 font-medium ${openConflicts.length ? 'text-amber-300' : 'text-emerald-400'}`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>{conflictFreeCount} من {activeProjects.length} عملاً نشطاً دون تعارض مفتوح</span>
          </p>
        </div>

        {/* Card 4 */}
        <div className="glass-card rounded-2xl p-4 border border-syria-border bg-gradient-to-br from-slate-900 to-syria-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الأعمال المنسقة بالتتابع</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {coordinatedProjectIds.size}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            مشروعات تم ترحيلها بفاصل أمان
          </p>
        </div>
      </div>

      {/* Visual Sequence & Timeline per Street (مخطط التتابع الزمني الذكي للشارع) */}
      <div className="glass-card rounded-2xl p-5 border border-syria-border space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-syria-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-syria-gold" />
            <div>
              <h3 className="font-bold text-white text-base">مخطط التتابع الزمني الذكي للشوارع (Sequence Gantt)</h3>
              <p className="text-xs text-slate-400">
                رؤية بصرية حية توضح كيف تُنجز الورشات بالتتابع دون أي تداخل في نفس المكان والزمان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">تصفية حسب الشارع:</span>
            <select
              value={timelineStreetFilter}
              onChange={(e) => setTimelineStreetFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-syria-gold"
            >
              <option value="all">كافة الشوارع المنسقة</option>
              {uniqueStreets.map((st) => (
                <option key={st} value={st}>
                  {streetSegmentsMap[st].zoneName}: {st} ({streetSegmentsMap[st].projects.length} مشاريع)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="space-y-4 pt-1">
          {uniqueStreets
            .filter((st) => timelineStreetFilter === 'all' || timelineStreetFilter === st)
            .map((street) => {
              const info = streetSegmentsMap[street];
              // Sort projects by start_date
              const sortedProjects = [...info.projects].sort((a, b) => a.start_date.localeCompare(b.start_date));

              return (
                <div key={street} className="p-4 rounded-xl bg-slate-950/80 border border-syria-border space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-syria-gold shrink-0" />
                      <span className="font-bold text-white text-xs sm:text-sm">{street}</span>
                      <span className="text-[11px] syria-badge-gold px-2 py-0.5 rounded-md font-medium">
                        {info.zoneName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      {hasOpenConflict(info.projects) ? (
                        <span className="text-amber-300 font-bold flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/30">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>يوجد تعارض أو تنبيه مفتوح</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>لا تعارضات مفتوحة</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Project Step Flow */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 text-xs">
                    {sortedProjects.map((p, idx) => {
                      const isCoordinated = coordinatedProjectIds.has(p.id);

                      return (
                        <div
                          key={p.id}
                          className={`p-3.5 rounded-xl border relative transition-all ${
                            isCoordinated
                              ? 'bg-gradient-to-l from-emerald-950/30 to-slate-900 border-emerald-500/50 shadow-sm'
                              : 'bg-slate-900/90 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono font-bold text-syria-goldLight text-[11px]">
                              المرحلة {idx + 1}: {p.code}
                            </span>
                            {getWorkTypeBadge(p.work_type)}
                          </div>

                          <div className="font-bold text-white text-xs truncate" title={p.title_ar}>
                            {p.title_ar}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {p.authority_name_ar}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-slate-300 font-mono">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatArabicDateFriendly(p.start_date)}</span>
                            </div>
                            <span className="text-slate-500 font-mono">→</span>
                            <div className="font-mono text-white font-bold">
                              {formatArabicDateFriendly(p.end_date)}
                            </div>
                          </div>

                          {isCoordinated && (
                            <div className="mt-2 text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>تمت الجدولة بالتنسيق لمنع التضارب</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Filter and Search Bar for Decisions Table */}
      <div className="glass-card rounded-2xl border border-syria-border overflow-hidden shadow-xl">
        <div className="p-5 border-b border-syria-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-white">سجل المحاضر والقرارات المعتمدة التفصيلي</h3>
            <span className="text-xs syria-badge-gold px-2.5 py-0.5 rounded-full font-mono font-bold">
              {filteredDecisions.length} محضر
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث برقم المحضر، المشروع، الشارع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-syria-border rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-syria-gold"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-syria-border rounded-xl px-3 py-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-syria-gold" />
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900 text-white">كافة القطاعات</option>
                <option value="water" className="bg-slate-900 text-white">مياه</option>
                <option value="sanitation" className="bg-slate-900 text-white">صرف صحي</option>
                <option value="electricity" className="bg-slate-900 text-white">كهرباء</option>
                <option value="telecom" className="bg-slate-900 text-white">اتصالات</option>
                <option value="paving" className="bg-slate-900 text-white">تعبيد وتزفيت</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-syria-border rounded-xl px-3 py-2 text-xs">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900 text-white">كافة الأحياء</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id} className="bg-slate-900 text-white">
                    {z.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-950/90 text-xs text-slate-300 font-bold border-b border-syria-border">
              <tr>
                <th className="px-4 py-3.5">رقم المحضر</th>
                <th className="px-4 py-3.5">المشروع المنسق بالتتابع</th>
                <th className="px-4 py-3.5">الموقع والشارع</th>
                <th className="px-4 py-3.5">المقارنة الزمنية (قبل وبعد)</th>
                <th className="px-4 py-3.5">الفاصل والأمان</th>
                <th className="px-4 py-3.5">الوفر المالي</th>
                <th className="px-4 py-3.5">المهندس والمحضر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                    لا توجد محاضر معتمدة مطابقة لمعايير التصفية المحددة
                  </td>
                </tr>
              ) : (
                filteredDecisions.map((decision) => {
                  const targetProjectId = decision.rescheduled_project_id || decision.paving_project_id;
                  const prj = projects.find((p) => p.id === targetProjectId);
                  const predecessor = decision.predecessor_project_ids?.[0]
                    ? projects.find((p) => p.id === decision.predecessor_project_ids[0])
                    : null;

                  const costFormatted = new Intl.NumberFormat('ar-SY').format(decision.estimated_avoidable_cost || 0) + ' ل.س';

                  return (
                    <tr key={decision.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Protocol Badge */}
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                        <span className="font-bold text-syria-gold px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 inline-flex items-center gap-1">
                          <FileText className="w-3 h-3 text-syria-gold" />
                          <span>{decision.protocol_number}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {decision.review_status === 'approved' ? 'معتمد' : 'يحتاج إعادة مراجعة'} — {formatTimestampArabic(decision.reviewed_at)}
                        </div>
                      </td>

                      {/* Coordinated Project */}
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-white text-xs">{prj?.code || '—'}</span>
                          {prj && getWorkTypeBadge(prj.work_type)}
                        </div>
                        <div className="font-bold text-white text-xs sm:text-sm">{prj?.title_ar || 'المشروع المنسق'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{prj?.authority_name_ar}</div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 min-w-[170px]">
                        <div className="flex items-center gap-1.5 text-xs text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-syria-gold shrink-0" />
                          <span className="font-bold">{prj?.zone_name_ar || 'دمشق'}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {prj?.street_segment || decision.conflict_id}
                        </div>
                      </td>

                      {/* Date Comparison (Before vs After) */}
                      <td className="px-4 py-3.5 min-w-[220px]">
                        <div className="space-y-1.5">
                          {decision.action_applied_to_project ? (
                            <>
                              {/* Old Conflicting Date (older decisions did not record it) */}
                              {decision.original_start_date && (
                                <div className="flex items-center gap-1.5 text-xs text-rose-400 line-through">
                                  <span className="text-[10px] text-slate-500 font-sans">الموعد القديم:</span>
                                  <span className="font-mono">{formatArabicDateFriendly(decision.original_start_date)}</span>
                                </div>
                              )}

                              {/* New Approved Date */}
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                                  {formatArabicDateFriendly(decision.approved_paving_date || decision.proposed_paving_date)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-amber-300 font-bold">تنسيق ميداني دون تغيير المواعيد</div>
                          )}

                          {predecessor && (
                            <div className="text-[10px] text-slate-400 pt-0.5">
                              بعد اكتمال: <strong>{predecessor.code}</strong> ({formatArabicDateFriendly(predecessor.end_date)})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Safety Buffer & Type */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-syria-goldLight text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-syria-border inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-syria-gold" />
                          <span>{decision.safety_buffer_days} أيام أمان</span>
                        </span>
                        <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>مفصول زمنياً بالكامل</span>
                        </div>
                      </td>

                      {/* Financial Avoided Cost */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-syria-goldLight text-xs sm:text-sm">
                        {costFormatted}
                      </td>

                      {/* Engineer & Protocol Print */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-semibold text-white truncate max-w-[150px]">
                          {decision.reviewed_by}
                        </div>
                        <div className="mt-1.5">
                          <button
                            onClick={() => onViewProtocol(decision)}
                            className="px-3 py-1.5 rounded-xl syria-gold-gradient text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-950" />
                            <span>معاينة المحضر</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
