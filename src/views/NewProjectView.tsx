// src/views/NewProjectView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Zone, ExtractedWorkOrder, AuthorityType, WorkType, Project } from '../types';
import { SAMPLE_WORK_ORDERS } from '../data/seedData';
import { parseWorkOrderArabic } from '../utils/localParser';
import { aiService } from '../services/aiService';
import { FIELD_LABELS, REQUIRED_EXTRACTION_FIELDS, normalizeExtraction } from '../utils/extraction';
import { 
  FileText, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Copy, 
  MapPin, 
  Calendar,
  Building2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { addDays, dateDiffDays, formatArabicDateFriendly, parseLocalYMD, validateProjectDates } from '../utils/dateUtils';
import { findSimilarPavingWorks } from '../utils/conflictDetector';

interface NewProjectViewProps {
  zones: Zone[];
  projects?: Project[];
  demoMode: 'offline_rules' | 'real_ai';
  onChangeMode: (mode: 'offline_rules' | 'real_ai') => void;
  onSaveProject: (data: any) => void;
  onNavigate: (route: 'dashboard' | 'new-project' | 'conflicts' | 'coordination' | 'approved-analysis') => void;
}

export const NewProjectView: React.FC<NewProjectViewProps> = ({
  zones,
  projects = [],
  demoMode,
  onChangeMode,
  onSaveProject,
  onNavigate,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_WORK_ORDERS[0].text);
  const [extractedData, setExtractedData] = useState<ExtractedWorkOrder | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userConfirmedLocation, setUserConfirmedLocation] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_WORK_ORDERS[0].id);
  const [aiError, setAiError] = useState<string | null>(null);

  const [reviewedFields, setReviewedFields] = useState(false);
  const [backendMessage, setBackendMessage] = useState('');
  const [checkingBackend, setCheckingBackend] = useState(false);
  const missingRequired = extractedData ? REQUIRED_EXTRACTION_FIELDS.filter(field => !extractedData[field]) : [];
  const similarPaving = extractedData ? findSimilarPavingWorks({ ...extractedData, id: '', work_type: extractedData.work_type as WorkType }, projects) : [];
  const analysisVersion = useRef(0);
  const invalidateAnalysis = () => {
    analysisVersion.current++;
    setReviewedFields(false);
    setExtractedData(null);
    setUserConfirmedLocation(false);
    setAiError(null);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    invalidateAnalysis();
    return () => { analysisVersion.current++; };
  }, [demoMode]);

  // Handle template selection
  const handleSelectSample = (sampleId: string) => {
    invalidateAnalysis();
    setSelectedSampleId(sampleId);
    const sample = SAMPLE_WORK_ORDERS.find((s) => s.id === sampleId);
    if (sample) {
      setInputText(sample.text);
      setReviewedFields(false);
    setExtractedData(null);
      setAiError(null);
      setUserConfirmedLocation(false);
    }
  };

  // Run analysis (AI or local deterministic)
  const handleAnalyze = async () => {
    const version = ++analysisVersion.current;
    setReviewedFields(false);
    setExtractedData(null);
    setUserConfirmedLocation(false);
    setIsAnalyzing(true);
    setAiError(null);

    // If AI mode is requested
    if (demoMode === 'real_ai') {
      const status = aiService.getStatus();
      if (!status.isBackendConfigured) {
        setIsAnalyzing(false);
        setAiError(
          'تعذر الاتصال بمزود الذكاء الاصطناعي: خادم Gemini غير مهيأ. يمكنك اختيار المحلّل المحلي أو إعداد خدمة التحليل أولاً.'
        );
        return;
      }

      // If backend was configured
      const aiResult = await aiService.extractWorkOrder(inputText, zones);
      if (version !== analysisVersion.current) return;
      setIsAnalyzing(false);
      if (aiResult.success && aiResult.data) {
        setExtractedData(aiResult.data);
        setUserConfirmedLocation(!aiResult.data.location_review_needed);
      } else {
        setAiError(aiResult.error || 'فشل الاتصال بالذكاء الاصطناعي');
      }
      return;
    }

    // Local deterministic parsing (offline rules)
    setTimeout(() => {
      if (version !== analysisVersion.current) return;
      const result = parseWorkOrderArabic(inputText, zones, {
        mode: 'offline_rules',
      });
      setExtractedData(result);
      setUserConfirmedLocation(!result.location_review_needed);
      setIsAnalyzing(false);
    }, 250);
  };

  // Fallback intentionally to local rules parser
  const handleFallbackToLocal = () => {
    const version = ++analysisVersion.current;
    setReviewedFields(false);
    setExtractedData(null);
    setAiError(null);
    setIsAnalyzing(true);
    setTimeout(() => {
      if (version !== analysisVersion.current) return;
      const result = parseWorkOrderArabic(inputText, zones, {
        mode: 'offline_rules',
      });
      setExtractedData(result);
      setUserConfirmedLocation(!result.location_review_needed);
      setIsAnalyzing(false);
    }, 200);
  };

  // Handle form field edits
  const handleFieldChange = (field: keyof ExtractedWorkOrder, value: any) => {
    if (!extractedData) return;
    const updated = { ...extractedData, [field]: value };
    setReviewedFields(false);

    // Recompute end date if start date or duration changes
    if (field === 'start_date' || field === 'duration_days') {
      const duration = field === 'duration_days' ? Number(value) : updated.duration_days;
      const start = field === 'start_date' ? String(value) : updated.start_date;
      if (start && duration > 0) {
        updated.end_date = addDays(start, Math.max(1, duration) - 1);
      } else if (field === 'start_date' && start && parseLocalYMD(updated.end_date) && updated.end_date >= start) {
        // The memo stated only an end date: keep it and derive the duration.
        updated.duration_days = dateDiffDays(start, updated.end_date);
      } else { updated.end_date = ''; }
    }

    // Recompute zone name if zone_id changes
    if (field === 'zone_id') {
      const z = zones.find((item) => item.id === value);
      if (z) {
        updated.zone_name_ar = z.name_ar;
        updated.location_review_needed = true;
        setUserConfirmedLocation(false);
      }
    }

    if (field === 'street_segment') { updated.location_review_needed = true; setUserConfirmedLocation(false); }
    setExtractedData(normalizeExtraction(updated, zones, inputText));
  };

  // Save the analyzed project
  const handleSave = () => {
    if (!extractedData) return;
    if (!reviewedFields || missingRequired.length) { setAiError('استكمل الحقول المطلوبة وأكد مراجعتها أولاً'); return; }

    if (!extractedData.start_date) {
      alert('يرجى تحديد تاريخ البدء المعتمد أولاً لعدم وروده في المذكرة الرسمية');
      return;
    }

    if (!extractedData.street_segment) {
      alert('يرجى إدخال المقطع الطرقي المحدد أولاً');
      return;
    }

    if (extractedData.location_review_needed && !userConfirmedLocation) {
      alert('يرجى تأكيد مطابقة الموقع الجغرافي أو اختيار الحي الصحيح يدوياً قبل الحفظ');
      return;
    }

    try {
      validateProjectDates(extractedData);
      onSaveProject({
      document_reference: extractedData.document_reference,
      document_date: extractedData.document_date,
      analysis_warnings: extractedData.warnings,
      analysis_evidence: extractedData.evidence,
      title_ar: extractedData.title_ar,
      authority: extractedData.authority,
      authority_name_ar: extractedData.authority_name_ar,
      work_type: extractedData.work_type,
      work_type_name_ar: extractedData.work_type_name_ar,
      zone_id: extractedData.zone_id,
      zone_name_ar: extractedData.zone_name_ar,
      street_segment: extractedData.street_segment,
      landmark: extractedData.landmark,
      start_date: extractedData.start_date,
      end_date: extractedData.end_date,
      duration_days: extractedData.duration_days,
      road_length_m: extractedData.road_length_m,
      road_width_m: extractedData.road_width_m,
      location_review_needed: !userConfirmedLocation,
      location_confidence: userConfirmedLocation ? 1 : extractedData.location_confidence,
      original_text: inputText,
      source: extractedData.extraction_source,
      status: 'planned',
    });
      // The view stays mounted across routes, so clear the saved order to prevent a double save.
      invalidateAnalysis();
    } catch (error) { setAiError((error as Error).message); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              تحليل أمر عمل رسمي واستخراج البيانات
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            استخراج بيانات مذكرات الحفر والتزفيت الصادرة عن المؤسسات الخدمية لمطابقتها مكانياً وزمانياً
          </p>
        </div>

        {/* Source Mode Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-syria-border text-xs shrink-0 shadow-sm">
          {demoMode === 'offline_rules' ? (
            <>
              <Cpu className="w-4 h-4 text-syria-gold shrink-0" />
              <span className="text-slate-200 font-semibold">المحلل: تحليل محلي تجريبي (قواعد حتمية)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-200 font-semibold">المحلل: Gemini عبر الخادم</span>
            </>
          )}
        </div>
      </div>

      <section className="grid sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-syria-border bg-slate-950">
        <div><label className="block text-sm font-bold mb-2">طريقة تحليل النص</label>
          <select aria-label="طريقة تحليل النص" value={demoMode} onChange={e => onChangeMode(e.target.value as 'offline_rules' | 'real_ai')}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm">
            <option value="offline_rules">محلّل محلي — دون اتصال</option>
            <option value="real_ai">Gemini — ذكاء اصطناعي</option>
          </select>
        </div>
        <div className="sm:col-span-2 text-sm text-slate-300 space-y-2">
          <p>{demoMode === 'real_ai' ? 'يُرسل النص إلى Gemini عند بدء التحليل. راجع النتيجة قبل اعتمادها؛ لا ينتقل النظام إلى التحليل المحلي تلقائياً.' : 'استخراج بالقواعد المحلية. المعلومات غير المذكورة تبقى فارغة لتستكملها بنفسك.'}</p>
          <button type="button" disabled={checkingBackend} className="text-syria-gold underline disabled:opacity-50" onClick={async () => {
            setCheckingBackend(true); setBackendMessage(await aiService.checkBackend()); setCheckingBackend(false);
          }}>{checkingBackend ? 'جارٍ الفحص…' : 'فحص جاهزية Gemini'}</button>
          {backendMessage && <p role="status">{backendMessage}</p>}
        </div>
      </section>
      <ol className="flex flex-wrap gap-4 text-sm text-slate-300" aria-label="مراحل التحليل">
        <li>١. إدخال النص</li><li>٢. استخراج البيانات</li><li>٣. المراجعة والاستكمال</li><li>٤. الحفظ وفحص التعارضات</li>
      </ol>

      {/* Sample Quick Selector */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-syria-border flex flex-col md:flex-row md:items-center gap-3 shadow-md">
        <span className="text-xs font-bold text-syria-gold flex items-center gap-1.5 shrink-0">
          <Copy className="w-3.5 h-3.5 text-syria-gold" />
          <span>نماذج أوامر عمل رسمية جاهزة للتجربة:</span>
        </span>
        <div className="flex flex-wrap gap-2 flex-1">
          {SAMPLE_WORK_ORDERS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample.id)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-semibold cursor-pointer ${
                selectedSampleId === sample.id
                  ? 'syria-badge-gold font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Input & Raw text) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-syria-border space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-syria-gold" />
                <span>نص أمر العمل الرسمي (بالعربية)</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {inputText.length} / 20000 حرف
              </span>
            </div>

            <textarea
              rows={12}
              maxLength={20000}
              value={inputText}
              onChange={(e) => { invalidateAnalysis(); setInputText(e.target.value); }}
              placeholder="الصق نص المذكرة أو إشعار الحفر هنا..."
              className="w-full bg-slate-950 border border-syria-border rounded-xl p-3.5 text-xs text-slate-100 leading-relaxed font-sans focus:outline-none focus:border-syria-gold resize-none"
            />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || inputText.trim().length < 10 || inputText.length > 20000}
              className="w-full py-3 rounded-xl syria-gold-gradient hover:brightness-110 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-syria-gold/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحليل واستخراج الكيانات والمطابقة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>تحليل المذكرة ومطابقة المواقع (Analyze)</span>
                </>
              )}
            </button>

            {/* AI Error / Backend Unavailable Box */}
            {aiError && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5 text-rose-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-200">تنبيه اتصال الذكاء الاصطناعي:</div>
                    <p className="text-[11px] text-rose-300/90 font-normal leading-relaxed mt-1">
                      {aiError}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFallbackToLocal}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-syria-goldLight border border-syria-borderGold text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  التبديل إلى التحليل المحلي التجريبي (قواعد محلية حتمية)
                </button>
              </div>
            )}

            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-syria-border text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <div className="font-bold text-syria-gold">مبدأ الاستخراج والمطابقة المكانية:</div>
              <p>
                ضع أمر عمل واحداً في كل تحليل. يتم فصل تاريخ الكتاب عن تاريخ التنفيذ، وتمييز الحقول الناقصة والغموض المكاني. نتائج Gemini تحتاج مراجعة بشرية، وفحص التعارضات يجري بعد حفظ المشروع.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Extracted Fields & Confirmation) */}
        <div className="lg:col-span-7">
          {extractedData ? (
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-syria-border space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between border-b border-syria-border pb-3.5 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-syria-gold/15 text-syria-gold border border-syria-borderGold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">البيانات المستخرجة (المطابقة والتدقيق)</h3>
                    <p className="text-xs text-slate-400">يرجى مراجعة الحقول وتأكيد المطابقة المكانية قبل الحفظ</p>
                  </div>
                </div>

                {/* Accurate Indicator */}
                <span className="text-xs px-3 py-1 rounded-full syria-badge-gold font-mono font-bold">
                  المؤشر: {extractedData.extraction_source === 'real_ai' ? 'تحليل بالذكاء الاصطناعي' : 'تحليل محلي تجريبي'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm" role="status">
                {missingRequired.length ? `بقي ${missingRequired.length} حقول مطلوبة قبل الحفظ` : 'الحقول الأساسية مكتملة — راجعها وأكد صحتها أدناه'}
              </div>
              {Boolean(extractedData.warnings?.length) && <div className="p-3 rounded-xl bg-amber-950/50 text-amber-200 text-sm">
                <strong>ملاحظات تحتاج انتباهك</strong><ul className="list-disc pr-5">{extractedData.warnings?.map((warning, i) => <li key={i}>{warning}</li>)}</ul>
              </div>}
              {Boolean(extractedData.evidence?.length) && <details className="p-3 rounded-xl border border-slate-700 text-sm">
                <summary className="cursor-pointer font-bold text-syria-gold">شواهد من النص الأصلي</summary>
                {extractedData.evidence?.map((item, i) => <blockquote key={i} className="mt-3 border-r-2 border-syria-gold pr-3">
                  <strong>{FIELD_LABELS[item.field] || item.field}:</strong> {item.quote}
                </blockquote>)}
              </details>}
              {/* Missing Fields Warning Banner */}
              {extractedData.missing_fields && extractedData.missing_fields.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>حقول غير مكتملة (المعلم ورقم الكتاب والأبعاد اختيارية):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {extractedData.missing_fields.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-100 text-[11px] font-mono border border-amber-500/30">
                        {FIELD_LABELS[f] || f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs mb-2">رقم الكتاب / أمر العمل</label>
                  <input value={extractedData.document_reference || ''} onChange={e => handleFieldChange('document_reference', e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg" /></div>
                <div><label className="block text-xs mb-2">تاريخ إصدار الكتاب (ليس بداية التنفيذ)</label>
                  <input type="date" value={extractedData.document_date || ''} onChange={e => handleFieldChange('document_date', e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg" /></div>
                {/* Authority */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الجهة المنفذة</label>
                  <select
                    value={extractedData.authority}
                    onChange={(e) => handleFieldChange('authority', e.target.value as AuthorityType)}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold cursor-pointer"
                  >
                    <option value="">اختر القيمة بعد المراجعة</option>
                    <option value="water">المؤسسة العامة لمياه الشرب</option>
                    <option value="electricity">الشركة العامة للكهرباء</option>
                    <option value="sanitation">مديرية الصرف الصحي</option>
                    <option value="municipality_maintenance">الصيانة العامة</option>
                    <option value="telecom">الشركة السورية للاتصالات</option>
                    <option value="paving">مديرية الصيانة والتعبيد البلدية</option>
                  </select>
                </div>

                {/* Work Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع العمل الهندسي</label>
                  <select
                    value={extractedData.work_type}
                    onChange={(e) => handleFieldChange('work_type', e.target.value as WorkType)}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold cursor-pointer"
                  >
                    <option value="">اختر القيمة بعد المراجعة</option>
                    <option value="water">مياه وشبكات ضخ</option>
                    <option value="electricity">تمديدات كهرباء وتوتر</option>
                    <option value="sanitation">صرف صحي ومطريات</option>
                    <option value="telecom">اتصالات وألياف ضوئية</option>
                    <option value="paving">تعبيد وتزفيت سطحي (نهائي)</option>
                  </select>
                </div>

                {/* Project Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان أمر العمل</label>
                  <input
                    type="text"
                    value={extractedData.title_ar}
                    onChange={(e) => handleFieldChange('title_ar', e.target.value)}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-medium"
                  />
                </div>

                {/* Canonical Zone Resolution with Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">الحي المعتمد</label>
                    <span className="text-xs text-syria-goldLight font-mono font-bold">
                      مؤشر مطابقة الموقع: {Math.round(extractedData.location_confidence * 100)}%
                    </span>
                  </div>
                  <select
                    value={extractedData.zone_id}
                    onChange={(e) => handleFieldChange('zone_id', e.target.value)}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold cursor-pointer"
                  >
                    <option value="">اختر الحي المعتمد</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name_ar} ({z.neighborhood_ar})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Street Segment */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">المقطع الطرقي المحدد</label>
                  <input
                    type="text"
                    value={extractedData.street_segment}
                    onChange={(e) => handleFieldChange('street_segment', e.target.value)}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold"
                  />
                </div>

                {/* Landmark */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">أقرب معلم مميز</label>
                  <input
                    type="text"
                    value={extractedData.landmark || ''}
                    placeholder="مثال: جامع الماجد / مشفى الهلال"
                    onChange={(e) => handleFieldChange('landmark', e.target.value)}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">تاريخ البدء المعتمد</label>
                  <input
                    type="date"
                    value={extractedData.start_date || ''}
                    onChange={(e) => handleFieldChange('start_date', e.target.value)}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-mono"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">مدة العمل (بالأيام)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={extractedData.duration_days || ''}
                    onChange={(e) => handleFieldChange('duration_days', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-mono"
                  />
                </div>

                {/* End Date (Auto-calculated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">تاريخ الانتهاء التقديري (محسوب حتمياً)</label>
                  <div className="w-full bg-slate-950/60 border border-syria-border rounded-xl px-3 py-2 text-xs text-syria-goldLight font-bold">
                    {extractedData.end_date ? formatArabicDateFriendly(extractedData.end_date) : 'غير محدد'}
                  </div>
                </div>

                {/* Paving Dimensions if applicable */}
                {extractedData.work_type === 'paving' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">طول الشارع (متر)</label>
                      <input
                        type="number"
                        min={10}
                        max={5000}
                        value={extractedData.road_length_m || ''}
                        onChange={(e) => handleFieldChange('road_length_m', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">عرض الشارع (متر)</label>
                      <input
                        type="number"
                        min={2}
                        max={60}
                        value={extractedData.road_width_m || ''}
                        onChange={(e) => handleFieldChange('road_width_m', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-syria-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-syria-gold font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Human-in-the-Loop Location Confirmation Alert */}
              {extractedData.location_review_needed ? (
                <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>الموقع المستخرج بحاجة إلى مراجعة وتدقيق بشري:</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    لم يرد اسم المقطع الطرقي بشكل قطعي في قاعدة المطابقة الرسمية. يرجى تدقيق الحي والمقطع أعلاه ثم النقر أدناه للمصادقة:
                  </p>
                  <label className="flex items-center gap-2 text-xs text-white font-bold cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={userConfirmedLocation}
                      onChange={(e) => setUserConfirmedLocation(e.target.checked)}
                      className="rounded accent-syria-gold w-4 h-4"
                    />
                    <span>أصادق كمهندس مسؤول على صحة هذا الموقع والمقطع الطرقي المحدد</span>
                  </label>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم اقتراح الحي والمقطع؛ يرجى التأكد من صحتهما قبل الحفظ</span>
                </div>
              )}

              {similarPaving.length > 0 && (
                <div role="status" className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-xs text-amber-200 space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تنبيه: توجد {similarPaving.length} أعمال تزفيت مشابهة في {extractedData.zone_name_ar}</span>
                  </div>
                  {similarPaving.map((s) => <p key={s.project.id} className="leading-relaxed">{s.message}</p>)}
                  <p className="text-slate-400">تنبيه إرشادي لا يمنع الحفظ.</p>
                </div>
              )}

              <label className="flex gap-2 items-start p-3 border border-syria-borderGold rounded-xl text-sm">
                <input type="checkbox" checked={reviewedFields} onChange={e => setReviewedFields(e.target.checked)} />
                راجعت الجهة ونوع العمل والموقع والتواريخ، وصححت الحقول الناقصة والتحذيرات قبل الحفظ.
              </label>
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-syria-border">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  إلغاء والعودة
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!reviewedFields || missingRequired.length > 0 || (extractedData.location_review_needed && !userConfirmedLocation)}
                  className="px-6 py-2.5 rounded-xl syria-gold-gradient text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-syria-gold/20 flex items-center gap-2 cursor-pointer hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>اعتماد أمر العمل وفحص التعارضات فورياً</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center border border-syria-border space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-syria-borderGold/40 text-syria-gold mx-auto flex items-center justify-center shadow-md">
                <MapPin className="w-8 h-8 text-syria-gold" />
              </div>
              <h3 className="text-base font-bold text-white">بانتظار إجراء التحليل</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                انقر على زر "تحليل المذكرة ومطابقة المواقع" لاستخراج الحقول، ثم راجعها واحفظ المشروع لإجراء فحص التعارضات.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
