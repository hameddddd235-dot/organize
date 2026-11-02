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
