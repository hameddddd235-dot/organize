// src/App.tsx
import React, { useState, useEffect } from 'react';
import { repository } from './services/repository';
import { Project, Zone, Conflict, CoordinationDecision } from './types';
import { Header } from './components/Header';
import { Sidebar, ActiveRoute } from './components/Sidebar';
import { DemoDisclaimerBanner } from './components/DemoDisclaimerBanner';
import { ToastContainer, ToastMessage } from './components/Toast';
import { OfficialProtocolModal } from './components/OfficialProtocolModal';
import { DashboardView } from './views/DashboardView';
import { NewProjectView } from './views/NewProjectView';
import { ConflictsView } from './views/ConflictsView';
import { CoordinationView } from './views/CoordinationView';
import { ApprovedAnalysisView } from './views/ApprovedAnalysisView';
import { findSimilarPavingWorks } from './utils/conflictDetector';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<ActiveRoute>('dashboard');
  const [demoMode, setDemoMode] = useState<'offline_rules' | 'real_ai'>('offline_rules');
  const [activeScenario, setActiveScenario] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [selectedProtocolDecision, setSelectedProtocolDecision] = useState<CoordinationDecision | null>(null);

  // Repository data states
  const [zones, setZones] = useState<Zone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [coordinations, setCoordinations] = useState<CoordinationDecision[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshData = () => {
    setZones(repository.getZones());
    setProjects(repository.getProjects());
    setConflicts(repository.getConflicts());
    setCoordinations(repository.getCoordinationDecisions());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle Scenario selection
  const handleSelectScenario = (scenario: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setSelectedConflictId(null);
    setFocusedProjectId(null);
    setSelectedProtocolDecision(null);
    setActiveScenario(scenario);
    repository.applyScenario(scenario);
    refreshData();

    switch (scenario) {
      case 'A':
        addToast(
          'warning',
          'سيناريو أ: تعارض مياه وتزفيت نشط',
          'أمر مياه (5-7 تشرين الثاني) وتزفيت (6 تشرين الثاني) في نفس المقطع -> تم اكتشاف تعارض حرج حتمي.'
        );
        setCurrentRoute('conflicts');
        break;
      case 'B':
        addToast(
          'success',
          'سيناريو ب: مقطعان مختلفان (لا تعارض)',
          'مشروعان في حي الميدان ولكن بمقطعين طرقيين مختلفين موثقين -> لا يوجد تعارض رغم تشارك الحي.'
        );
        setCurrentRoute('conflicts');
        break;
      case 'C':
        addToast(
          'info',
          'سيناريو ج: موقع غير مؤكد (مراجعة مكانية)',
          'أمر عمل اتصالات بموقع تقريبي -> النظام يطلب تدقيقاً بشرياً ولا يجزم بتعارض قاطع.'
        );
        setCurrentRoute('conflicts');
        break;
      case 'D':
        addToast(
          'success',
          'سيناريو د: جدولة منسقة بعد انتهاء الحفر والأمان',
          'تم تأجيل التزفيت لما بعد انتهاء الحفر وفترة أمان 5 أيام -> اختفاء التعارض والجدولة سليمة.'
        );
        setCurrentRoute('coordination');
        break;
      case 'E':
        addToast(
          'info',
          'سيناريو هـ: الحساب المالي والوفورات التقديرية',
          'جرب تعديل طول الشارع وعرضه وكلفة المتر لترى إعادة الحساب الفورية للوفورات المتفادية.'
        );
        setCurrentRoute('coordination');
        break;
    }
  };

  // Reset to seed data
  const handleResetData = () => {
    if (!window.confirm('إعادة الضبط تحذف المشاريع والقرارات الحالية. هل تريد المتابعة؟')) return;
    // Leave any preview first; otherwise the reset is discarded when the preview ends.
    repository.exitScenario();
    repository.resetToSeedData();
    setActiveScenario(null);
    setSelectedConflictId(null);
    setFocusedProjectId(null);
    refreshData();
    addToast('info', 'تمت إعادة ضبط البيانات الافتراضية بنجاح', 'استعادة جميع سجلات دمشق الخمسة الأساسية');
  };

  // Toggle offline vs simulated AI
  const handleToggleDemoMode = () => {
    const nextMode = demoMode === 'offline_rules' ? 'real_ai' : 'offline_rules';
    setDemoMode(nextMode);
    addToast(
      'info',
      nextMode === 'offline_rules'
        ? 'تم التحويل إلى التحليل المحلي التجريبي (قواعد حتمية)'
        : 'تم تفعيل خيار التحليل بالذكاء الاصطناعي (يتطلب خادماً خلفياً متصلاً)'
    );
  };

  // Save project
  const handleSaveProject = (data: any) => {
    const created = repository.createProject(data);
    refreshData();
    const newConflicts = repository.getConflicts().filter(
      (c) => c.project_a_id === created.id || c.project_b_id === created.id
    );
    const similarPaving = findSimilarPavingWorks(created, repository.getProjects());
    addToast(
      newConflicts.length > 0 ? 'warning' : 'success',
      `تم حفظ أمر العمل بنجاح (${created.code})`,
      newConflicts.length > 0
        ? `تم اكتشاف ${newConflicts.length} تعارض أو تنبيه مرتبط بهذا العمل؛ راجع مصفوفة التعارضات`
        : 'لا توجد تعارضات مرتبطة بهذا العمل'
    );
    if (similarPaving.length > 0) {
      addToast('warning', `يوجد ${similarPaving.length} عمل تزفيت مشابه في ${created.zone_name_ar}`, similarPaving[0].message);
    }
    setCurrentRoute('dashboard');
  };

  // Open the conflicts register narrowed to one project
  const handleInspectProject = (projectId: string) => {
    setSelectedConflictId(null);
    setFocusedProjectId(projectId);
    setCurrentRoute('conflicts');
  };

  // Sidebar and header links show the full register, not a stale project filter
  const handleRouteChange = (route: ActiveRoute) => {
    setFocusedProjectId(null);
    setCurrentRoute(route);
  };

  // Update project
  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    const updated = repository.updateProject(id, updates);
    if (updated) {
      refreshData();
      addToast('success', `تم تحديث المشروع (${updated.code}) بنجاح`, 'تم تحديث التواريخ والمقاطع وإعادة تقييم التعارضات');
    }
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    const success = repository.deleteProject(id);
    if (success) {
      refreshData();
      addToast('info', 'تم حذف المشروع بنجاح', 'تمت إزالة المشروع من السجلات وتحديث مؤشرات التعارض');
    }
  };

  // Approve schedule and resolve conflict
  const handleApproveSchedule = (
    conflictId: string,
    approvedDate: string,
    notes?: string,
    engineerName?: string,
    chosenRescheduledId?: string,
    safetyBufferDays?: number,
    roadLengthM?: number,
    roadWidthM?: number,
    costPerM2?: number
  ) => {
    const { decision } = repository.approveCoordinationSchedule(
      conflictId,
      approvedDate,
      {
        notes,
        engineerName: engineerName || 'م. عمار الشريف (رئيس قسم التنسيق البلدي)',
        applyDateToProject: true,
        chosenRescheduledProjectId: chosenRescheduledId,
        safetyBufferDays,
        roadLengthM,
        roadWidthM,
        costPerM2,
      }
    );
    refreshData();
    addToast(
      'success',
      `تمت المصادقة واعتماد المحضر الرسمي (${decision.protocol_number})`,
      `تم اعتماد قرار التنسيق الميداني وفض التعارض بنجاح`
    );
    setSelectedProtocolDecision(decision);
  };

  // Quick resolve any conflict by staggering (Scenario / Same type solver)
  const handleQuickResolveConflict = (conflictId: string) => {
    try {
      const { decision, updatedProject } = repository.quickResolveConflictByStagger(conflictId);
      refreshData();
      addToast(
        'success',
        `تم فض التعارض بالتتابع الزمني فورياً (${decision.protocol_number})`,
        `تم تأجيل موعد المشروع (${updatedProject?.code || ''}) وتوثيق المحضر الرسمي في السجلات الدائمة`
      );
      setSelectedProtocolDecision(decision);
    } catch (e: any) {
      addToast('warning', 'تعذر فض التعارض', e.message);
    }
  };

  // Dismiss conflict with official justification
  const handleDismissConflict = (conflictId: string, reason: string) => {
    const res = repository.dismissConflict(conflictId, reason);
    if (res) {
      refreshData();
      addToast(
        'info',
        `تم استبعاد التعارض (${res.protocol_number})`,
        'تم تسجيل التعليل الهندسي في سجل العمليات الدائم'
      );
    }
  };

  // Reopen conflict
  const handleReopenConflict = (conflictId: string) => {
    const stillActive = repository.reopenConflict(conflictId);
    refreshData();
    addToast(
      'info',
      stillActive ? 'تمت إعادة فتح التعارض كحالة نشطة' : 'أُلغي القرار السابق ولم يعد هناك تعارض قائم',
      stillActive
        ? 'عادت الحالة إلى قائمة المتابعة الميدانية'
        : 'المواعيد الحالية لا تنتج هذا التعارض؛ بقي المحضر في السجل بحالة «يحتاج إعادة مراجعة»'
    );
  };

  // Update street segment
  const handleUpdateStreetSegment = (projectId: string, newSegment: string) => {
    const updated = repository.updateStreetSegment(projectId, newSegment);
    if (updated) {
      refreshData();
      addToast(
        'success',
        `تم تعديل مقطع الشارع للمشروع (${updated.code})`,
        'تم تحديث المسار الميداني وإعادة فحص التعارضات فورياً'
      );
    }
  };

  // Rule 4: Dashboard & primary conflict counter must count only unresolved confirmed paving-related blocking conflicts
  const unresolvedBlockingConflictsCount = conflicts.filter(
    (c) => c.status !== 'resolved' && c.status !== 'dismissed' && c.is_blocking && c.severity === 'high'
  ).length;
  const pendingReviewCount = conflicts.filter((c) => c.severity === 'review' && c.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-syria-dark text-slate-100 flex flex-col font-tajawal selection:bg-syria-gold selection:text-slate-950">
      {/* Disclaimer Banner */}
      <DemoDisclaimerBanner />

      {repository.isScenarioPreview() && (
        <div className="p-3 bg-amber-950 text-amber-100 text-center">
          معاينة سيناريو معزولة؛ التغييرات هنا مؤقتة وبياناتك المحفوظة لم تتغير.
          <button className="mr-4 underline" onClick={() => {
            repository.exitScenario(); setActiveScenario(null); setSelectedConflictId(null); setFocusedProjectId(null);
            setSelectedProtocolDecision(null); refreshData(); setCurrentRoute('dashboard');
          }}>العودة إلى بياناتي</button>
        </div>
      )}
      {/* Main Header with fast scenario pills */}
      <Header
        demoMode={demoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onSelectScenario={handleSelectScenario}
        onResetData={handleResetData}
        activeScenario={activeScenario}
      />

      {/* Main App Layout - Laptop Screen Optimized Width */}
      <div className="flex-1 max-w-[1720px] 2xl:max-w-[1840px] w-full mx-auto flex flex-col md:flex-row px-2 sm:px-4 lg:px-6">
        {/* Right Sidebar (RTL) */}
        <Sidebar
          currentRoute={currentRoute}
          onRouteChange={(route) => {
            // A menu click starts fresh; a kept selection would reopen its inspection modal.
            setSelectedConflictId(null);
            handleRouteChange(route);
          }}
          conflictCount={unresolvedBlockingConflictsCount}
          reviewCount={pendingReviewCount}
          approvedCount={coordinations.filter(c => c.review_status === 'approved').length}
        />

        {/* Center Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {currentRoute === 'dashboard' && (
            <DashboardView
              projects={projects}
              conflicts={conflicts}
              zones={zones}
              onNavigate={handleRouteChange}
              onSelectConflict={(id) => {
                setSelectedConflictId(id);
                setCurrentRoute('conflicts');
              }}
              onInspectProject={handleInspectProject}
              onScanProjects={() => repository.scanAllProjects()}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {/* Stays mounted so an unsaved analysis survives moving between screens */}
          <div className={currentRoute === 'new-project' ? '' : 'hidden'}>
            <NewProjectView
              zones={zones}
              projects={projects}
              demoMode={demoMode}
              onChangeMode={setDemoMode}
              onSaveProject={handleSaveProject}
              onNavigate={handleRouteChange}
            />
          </div>

          {currentRoute === 'conflicts' && (
            <ConflictsView
              conflicts={conflicts}
              projects={projects}
              coordinations={coordinations}
              onNavigate={setCurrentRoute}
              focusedProjectId={focusedProjectId}
              onClearProjectFocus={() => setFocusedProjectId(null)}
              onDismissConflict={handleDismissConflict}
              onReopenConflict={handleReopenConflict}
              onUpdateSegment={handleUpdateStreetSegment}
              onViewProtocol={(dec) => setSelectedProtocolDecision(dec)}
              selectedConflictId={selectedConflictId}
              onSelectConflict={setSelectedConflictId}
              onQuickResolveConflict={handleQuickResolveConflict}
            />
          )}

          {currentRoute === 'coordination' && (
            <CoordinationView
              conflicts={conflicts}
              projects={projects}
              coordinations={coordinations}
              onApproveSchedule={handleApproveSchedule}
              onNavigate={setCurrentRoute}
              onViewProtocol={(dec) => setSelectedProtocolDecision(dec)}
              selectedConflictId={selectedConflictId}
              onSelectConflict={setSelectedConflictId}
            />
          )}

          {currentRoute === 'approved-analysis' && (
            <ApprovedAnalysisView
              coordinations={coordinations}
              projects={projects}
              conflicts={conflicts}
              zones={zones}
              onViewProtocol={(dec) => setSelectedProtocolDecision(dec)}
              onNavigate={setCurrentRoute}
            />
          )}
        </main>
      </div>

      {/* Official Government SaaS Footer - Laptop Screen Optimized */}
      <footer className="border-t border-syria-border bg-slate-950/90 py-4 px-6 text-xs text-slate-400">
        <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2">
            <span className="font-bold text-syria-gold">الجمهورية العربية السورية</span>
            <span>•</span>
            <span>محافظة دمشق - الأمانة العامة</span>
            <span>•</span>
            <span className="text-slate-300">منظومة نبض الحي (Nabd Al-Hay)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            مديرية الصيانة وهندسة المرافق | منظومة التنسيق الفني المشترك
          </div>
        </div>
      </footer>

      {/* Official Municipal Protocol Modal */}
      {selectedProtocolDecision && (
        <OfficialProtocolModal
          decision={selectedProtocolDecision}
          pavingProject={projects.find((p) => p.id === selectedProtocolDecision.paving_project_id)}
          secondProject={projects.find((p) => p.id === selectedProtocolDecision.rescheduled_project_id)}
          predecessorProjects={projects.filter((p) =>
            selectedProtocolDecision.predecessor_project_ids.includes(p.id)
          )}
          onClose={() => setSelectedProtocolDecision(null)}
        />
      )}

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
