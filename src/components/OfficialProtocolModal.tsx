// src/components/OfficialProtocolModal.tsx
import React from 'react';
import { CoordinationDecision, Project } from '../types';
import { formatArabicDateFriendly, formatTimestampArabic } from '../utils/dateUtils';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SyrianEagleLogo } from './SyrianEagleLogo';

interface OfficialProtocolModalProps {
  decision: CoordinationDecision;
  pavingProject?: Project;
  secondProject?: Project;
  predecessorProjects: Project[];
  onClose: () => void;
}

export const OfficialProtocolModal: React.FC<OfficialProtocolModalProps> = ({
  decision,
  pavingProject,
  secondProject,
  predecessorProjects,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const laterProject = pavingProject || secondProject;
  // Field-coordination protocols keep both schedules; they must not claim a date was moved.
  const isFieldCoordination = decision.coordination_type === 'utility_coordination' || !decision.action_applied_to_project;

  const formattedCost = new Intl.NumberFormat('ar-SY').format(decision.estimated_avoidable_cost) + ' ل.س';
  const formattedArea = new Intl.NumberFormat('ar-SY').format(decision.road_length_m * decision.road_width_m) + ' م²';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-syria-borderGold/60 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Top Action Bar (hidden in print) */}
        <div className="p-4 border-b border-syria-border flex items-center justify-between bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-2.5 text-syria-gold font-bold text-sm">
            <SyrianEagleLogo size="sm" />
            <span>محضر تنسيق بلدي رسمي معتمد - الجمهورية العربية السورية</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 syria-gold-gradient text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer hover:brightness-110 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>طباعة المحضر الرسمي (Print Protocol)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Document Container */}
        <div className="p-8 sm:p-12 space-y-6 text-slate-900 bg-white font-sans relative overflow-hidden" dir="rtl">
          {/* Subtle National Eagle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none">
            <div className="w-[500px] h-[500px]">
              <SyrianEagleLogo size="xl" />
            </div>
          </div>

          {/* Official Letterhead - New Syrian Visual Identity */}
          <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between relative z-10">
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm text-slate-950">الجمهورية العربية السورية</div>
              <div className="font-semibold text-slate-700">وزارة الإدارة المحلية والبيئة</div>
              <div className="font-bold text-slate-900">محافظة دمشق - الأمانة العامة</div>
              <div className="text-slate-600 font-medium">لجنة التنسيق الفني المشترك للبنى التحتية</div>
            </div>

            <div className="text-center space-y-1">
              <div className="mx-auto flex items-center justify-center">
                <SyrianEagleLogo size="lg" />
              </div>
              <div className="text-[11px] font-bold text-slate-900 tracking-wider">
                الهوية البصرية الرسمية
              </div>
              <div className="text-[10px] font-semibold text-amber-800">
                منظومة نبض الحي
              </div>
            </div>

            <div className="text-left text-xs space-y-1 text-slate-700 font-mono">
              <div><strong>الرقم:</strong> {decision.protocol_number}</div>
              <div><strong>التاريخ:</strong> {formatTimestampArabic(decision.reviewed_at)}</div>
              <div><strong>الحالة:</strong> {decision.review_status === 'approved' ? 'معتمد' : 'يحتاج إعادة مراجعة؛ لم يعد اعتماداً نافذاً للجدول الحالي'}</div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1 py-2 relative z-10">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 underline decoration-amber-600 underline-offset-8">
              محضر اجتماع وتنسيق هندسي ملزم (رقم {decision.protocol_number})
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 pt-2 font-medium">
              {decision.coordination_type === 'same_work_stagger'
                ? 'بشأن فض التضارب المكاني والزمني بين مشروعات متشابهة النوع وفصل مواعيد التنفيذ في محافظة دمشق'
                : decision.coordination_type === 'utility_coordination'
                ? 'بشأن التنسيق الميداني واشتراطات السلامة المهنية لأعمال شبكات المرافق التحتية المتزامنة'
                : 'بشأن فض التضارب بين أعمال حفريات الشبكات التحتية وإعادة تأهيل الطبقة الإسفلتية في محافظة دمشق'}
            </p>
          </div>

          {/* Body Paragraph */}
          <div className="text-xs sm:text-sm leading-relaxed text-slate-800 space-y-3 relative z-10">
            <p>
              بناءً على الصلاحيات المخولة للجنة المشتركة لتنسيق مشروعات البنية التحتية بمحافظة دمشق، واستناداً إلى نتائج الفحص الاستباقي الصادرة عن منظومة "نبض الحي"، تقرر تثبيت المحضر الهندسي للقطاع الميداني المبيّن أدناه:
            </p>

            {/* Target Location Table */}
            <table className="w-full text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-bold">
                <tr>
                  <th className="p-2.5 border border-slate-300 text-right">الحي / المنطقة</th>
                  <th className="p-2.5 border border-slate-300 text-right">المقطع الطرقي المحدد</th>
                  <th className="p-2.5 border border-slate-300 text-right">أبعاد المقطع</th>
                  <th className="p-2.5 border border-slate-300 text-right">المساحة المعرضة للتلف أو الإغلاق المتفادية</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{laterProject?.zone_name_ar || predecessorProjects[0]?.zone_name_ar || 'دمشق'}</td>
                  <td className="p-2.5 border border-slate-300">{laterProject?.street_segment || predecessorProjects[0]?.street_segment || decision.conflict_id}</td>
                  <td className="p-2.5 border border-slate-300 font-mono">{decision.road_length_m} م × {decision.road_width_m} م</td>
                  <td className="p-2.5 border border-slate-300 font-mono font-bold text-amber-900">{formattedArea}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Parties Involved */}
          <div className="space-y-2 relative z-10">
            <h3 className="text-xs sm:text-sm font-bold text-slate-950">أولاً: المشروعات والجهات المعنية بالتنسيق:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Predecessors */}
              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">1. المشروع / الأعمال المسبقة بالتنفيذ:</div>
                {predecessorProjects.map((p) => (
                  <div key={p.id} className="text-slate-700 text-xs leading-relaxed">
                    • <strong>{p.authority_name_ar}:</strong> {p.title_ar} ({p.code})
                    <div className="text-slate-600 font-mono text-[11px] pt-0.5">
                      فترة الإنجاز المقررة: من {formatArabicDateFriendly(p.start_date)} حتى {formatArabicDateFriendly(p.end_date)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Second / Rescheduled project */}
              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900">
                  {pavingProject ? '2. أعمال التعبيد والتزفيت السطحي:' : isFieldCoordination ? '2. المشروع المتزامن:' : '2. المشروع اللاحق (المُزاح بالتتابع الزمني):'}
                </div>
                <div className="text-slate-700 text-xs leading-relaxed">
                  • <strong>{laterProject?.authority_name_ar || 'الجهة المنفذة للمشروع اللاحق'}:</strong> {laterProject?.title_ar || 'المشروع المنفذ'} ({laterProject?.code || '—'})
                  {isFieldCoordination ? (
                    laterProject && (
                      <div className="text-slate-600 font-mono text-[11px] pt-0.5">
                        فترة التنفيذ المعتمدة: من {formatArabicDateFriendly(laterProject.start_date)} حتى {formatArabicDateFriendly(laterProject.end_date)}
                      </div>
                    )
                  ) : decision.original_start_date && (
                    <div className="text-rose-700 font-bold text-[11px] pt-0.5">
                      الموعد السابق (المتضارب): {formatArabicDateFriendly(decision.original_start_date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resolutions & Binding Decision */}
          <div className="p-4 bg-amber-50 border-2 border-amber-600 rounded-xl space-y-2 relative z-10">
            <h3 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>ثانياً: القرار الهندسي الملزم والتعديل المعتمد:</span>
            </h3>
            <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
              {isFieldCoordination ? (
                <>تقرر الإبقاء على مواعيد التنفيذ المعتمدة لكلا المشروعين، مع إلزام الجهتين بالتنسيق الميداني المشترك واشتراطات السلامة المهنية طوال فترة التزامن.</>
              ) : pavingProject ? (
                <>تقرر تأجيل موعد بدء أعمال التعبيد والتزفيت وتحديد تاريخ <strong>({formatArabicDateFriendly(decision.approved_paving_date || decision.proposed_paving_date)})</strong> كموعد نهائي ملزم للشروع بالقميص الإسفلتي، وذلك بعد انقضاء حفريات الشبكات تحت الأرض وإضافة فترة الأمان الهندسية المقدرة بـ <strong>({decision.safety_buffer_days} أيام)</strong> لضمان استقرار التربة ودك الردميات نظامياً.</>
              ) : (
                <>تقرر ترحيل موعد انطلاق المشروع اللاحق ليصبح بتاريخ <strong>({formatArabicDateFriendly(decision.approved_paving_date || decision.proposed_paving_date)})</strong> كموعد نهائي ملزم، وذلك لضمان انتهاء كافة أعمال المشروع الأول بالكامل مع فاصل زمني آمن مدته <strong>({decision.safety_buffer_days} أيام)</strong> منعاً لازدحام الورشات وتفادياً لإغلاق الشريان المروري في آن واحد.</>
              )}
            </p>
            {decision.notes && (
              <p className="text-xs text-amber-900 italic pt-1 border-t border-amber-200">
                ملاحظات المهندس المشرف: "{decision.notes}"
              </p>
            )}
          </div>

          {/* Avoided Financial Rework */}
          <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between text-xs sm:text-sm relative z-10">
            <span className="font-bold text-slate-900">الوفر المالي التقديري المتفادي من إعادة الحفر:</span>
            <span className="font-mono font-black text-sm text-amber-900">{formattedCost}</span>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs text-slate-900 relative z-10">
            <div className="space-y-8">
              <div className="font-bold">مندوب مؤسسة المياه / المرافق</div>
              <div className="text-slate-400 text-[11px]">التوقيع: .....................</div>
            </div>

            <div className="space-y-8">
              <div className="font-bold">رئيس دائرة التعبيد والصيانة</div>
              <div className="text-slate-400 text-[11px]">التوقيع: .....................</div>
            </div>

            <div className="space-y-8">
              <div className="font-bold">المهندس المنسق العام للمحافظة</div>
              <div className="font-bold text-amber-900">{decision.reviewed_by}</div>
              <div className="text-slate-400 text-[11px]">التوقيع والخاتم الرسمي المعتمد</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
