# البرومبت 6 من 13: المكونات المشتركة

أكمل نسخ المشروع. هذه مكونات الهوية والترويسة والقائمة الجانبية والإشعارات والمحضر الرسمي القابل للطباعة.

قواعد النسخ في هذا البرومبت:
- أنشئ كل ملف محاط بالعلامتين <<<FILE: المسار>>> و<<<END FILE>>> في المسار نفسه، وبمحتواه حرفياً. العلامتان نفسهما لا تدخلان في الملف.
- لا تُعد صياغة أي نص عربي، ولا تغيّر أي class أو لون أو اسم أو رقم، ولا تحسّن الكود ولا تعيد تنظيمه.
- إذا كان ملف بهذا المسار موجوداً، فاستبدله بالكامل.
- قد لا يعمل المشروع قبل البرومبت 11 لأن بعض الملفات لم تصل بعد. لا تنشئ بدائل مؤقتة ولا تحذف أي import.
- عند الانتهاء اكتب أسماء الملفات التي أنشأتها فقط، وانتظر البرومبت التالي.

<<<FILE: src/components/SyrianEagleLogo.tsx>>>
// src/components/SyrianEagleLogo.tsx
import React from 'react';

interface SyrianEagleLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const SyrianEagleLogo: React.FC<SyrianEagleLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size]} shrink-0 relative flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-syria-card via-syria-navy to-slate-950 border border-syria-borderGold shadow-lg shadow-syria-gold/10`}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_4px_rgba(197,160,89,0.35)]"
        >
          <defs>
            {/* Syrian Sovereign Gold Gradient */}
            <linearGradient id="syriaGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCEFC7" />
              <stop offset="35%" stopColor="#DFBA55" />
              <stop offset="70%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#8F6E26" />
            </linearGradient>

            {/* Dark Accent Gradient */}
            <linearGradient id="syriaGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#5E4716" />
            </linearGradient>

            {/* Star Glow */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Three Stars in an Arch - Representing the National Revolution & Sovereign Stars */}
          <g filter="url(#goldGlow)">
            {/* Center Star */}
            <polygon
              points="60,8 62.5,14 69,14 63.5,18 65.5,24 60,20.5 54.5,24 56.5,18 51,14 57.5,14"
              fill="url(#syriaGold)"
            />
            {/* Left Star */}
            <polygon
              points="40,14 42,19.5 48,19 43.5,23 45,28.5 40,25.5 35,28.5 36.5,23 32,19 38,19.5"
              fill="url(#syriaGold)"
            />
            {/* Right Star */}
            <polygon
              points="80,14 82,19.5 88,19 83.5,23 85,28.5 80,25.5 75,28.5 76.5,23 72,19 78,19.5"
              fill="url(#syriaGold)"
            />
          </g>

          {/* Golden Eagle Body & Head - Modern Minimalist Geometric Style */}
          <g>
            {/* Eagle Head & Beak facing left */}
            <path
              d="M60 25 C58 25 53 26 49 28 C45 30 42 34 40 37 C37 38 34 38 31 39 C33 41 36 41 38 42 C38 44 40 47 43 49 C46 51 52 52 60 52 C68 52 74 51 77 49 C80 47 82 44 82 42 C84 41 87 41 89 39 C86 38 83 38 80 37 C78 34 75 30 71 28 C67 26 62 25 60 25 Z"
              fill="url(#syriaGold)"
            />

            {/* Left Wing (7 primary feathers representing governorates) */}
            <path
              d="M48 40 L28 22 C26 27 27 34 30 38 L16 31 C15 36 17 43 21 47 L10 44 C10 50 13 56 18 60 L8 59 C9 65 13 71 19 75 L12 76 C14 82 19 87 26 89 L38 78 L46 62 Z"
              fill="url(#syriaGold)"
            />

            {/* Right Wing (7 primary feathers representing governorates - Total 14 feathers) */}
            <path
              d="M72 40 L92 22 C94 27 93 34 90 38 L104 31 C105 36 103 43 99 47 L110 44 C110 50 107 56 102 60 L112 59 C111 65 107 71 101 75 L108 76 C106 82 101 87 94 89 L82 78 L74 62 Z"
              fill="url(#syriaGold)"
            />

            {/* Central Chest & Shield Emblem */}
            <path
              d="M60 48 C51 48 46 54 46 66 C46 80 54 94 60 100 C66 94 74 80 74 66 C74 54 69 48 60 48 Z"
              fill="url(#syriaGoldDark)"
              stroke="url(#syriaGold)"
              strokeWidth="2"
            />

            {/* Shield Core Line */}
            <path
              d="M60 52 L60 95"
              stroke="url(#syriaGold)"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Tail - 5 distinct geometric feathers representing the 5 Syrian geographical regions */}
            <g fill="url(#syriaGold)">
              {/* Central tail feather */}
              <polygon points="60,98 56,114 60,117 64,114" />
              {/* Inner Left feather */}
              <polygon points="54,97 49,112 53,114 56,99" />
              {/* Inner Right feather */}
              <polygon points="66,97 71,112 67,114 64,99" />
              {/* Outer Left feather */}
              <polygon points="49,94 43,108 47,110 51,96" />
              {/* Outer Right feather */}
              <polygon points="71,94 77,108 73,110 69,96" />
            </g>

            {/* Eye of the Eagle */}
            <circle cx="44" cy="35" r="1.5" fill="#070C15" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold tracking-wider text-syria-gold uppercase">
            الجمهورية العربية السورية
          </span>
          <span className="text-xs font-semibold text-slate-300">
            الهوية البصرية الرسمية المعتمدة
          </span>
        </div>
      )}
    </div>
  );
};
<<<END FILE>>>

<<<FILE: src/components/DemoDisclaimerBanner.tsx>>>
// src/components/DemoDisclaimerBanner.tsx
import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const DemoDisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-amber-950/50 via-slate-950/80 to-amber-950/50 border-b border-syria-borderGold/40 px-4 py-2.5 text-xs text-amber-200/95 shadow-sm">
      <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-syria-gold shrink-0" />
          <p className="leading-relaxed">
            <strong className="font-bold text-syria-goldLight">بيئة افتراضية تجريبية (Synthetic Demo):</strong>{' '}
            جميع البيانات والمشاريع المعروضة هي سجلات محاكاة لأغراض التدقيق البرمجي وتقييم خوارزميات التنسيق الحتمية.
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-300 shrink-0 text-[11px] bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>المصادقة البشرية ملزمة: لا يُعتمد أي موعد تزفيت نهائي دون توقيع المهندس المشرف</span>
        </div>
      </div>
    </div>
  );
};
<<<END FILE>>>

<<<FILE: src/components/Header.tsx>>>
// src/components/Header.tsx
import React from 'react';
import { 
  RotateCcw, 
  Cpu, 
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { SyrianEagleLogo } from './SyrianEagleLogo';

interface HeaderProps {
  demoMode: 'offline_rules' | 'real_ai';
  onToggleDemoMode: () => void;
  onSelectScenario: (scenario: 'A' | 'B' | 'C' | 'D' | 'E') => void;
  onResetData: () => void;
  activeScenario?: 'A' | 'B' | 'C' | 'D' | 'E' | null;
}

export const Header: React.FC<HeaderProps> = ({
  demoMode,
  onToggleDemoMode,
  onSelectScenario,
  onResetData,
  activeScenario,
}) => {
  return (
    <header className="bg-syria-navy/95 border-b border-syria-border sticky top-0 z-40 backdrop-blur-md shadow-md shadow-black/40">
      <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto px-4 py-3 sm:px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Brand & Syrian National Identity */}
        <div className="flex items-center gap-3.5">
          <SyrianEagleLogo size="md" />

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-syria-gold tracking-wide">
                الجمهورية العربية السورية
              </span>
              <span className="text-slate-500 text-xs">|</span>
              <span className="text-[11px] font-semibold text-slate-300">
                محافظة دمشق
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                منظومة نبض الحي
              </h1>
              <span className="text-xs text-syria-gold font-mono tracking-wider font-semibold">
                Nabd Al-Hay
              </span>
            </div>

            <p className="text-xs text-slate-400 hidden md:block">
              منظومة التنسيق الفني لمشروعات البنية التحتية وأعمال التعبيد
            </p>
          </div>
        </div>

        {/* Controls: Mode Switcher & Scenarios */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Engine Mode Toggle */}
          <button
            onClick={onToggleDemoMode}
            title="التبديل بين التحليل المحلي التجريبي والتحليل بالذكاء الاصطناعي"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-sm ${
              demoMode === 'offline_rules'
                ? 'bg-slate-900/90 text-syria-goldLight border-syria-borderGold hover:bg-slate-800'
                : 'bg-indigo-950/80 text-indigo-200 border-indigo-500/50 hover:bg-indigo-900'
            }`}
          >
            {demoMode === 'offline_rules' ? (
              <>
                <Cpu className="w-3.5 h-3.5 text-syria-gold shrink-0" />
                <span>المحلل: تحليل محلي تجريبي</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>المحلل: Gemini عبر الخادم</span>
              </>
            )}
          </button>

          {/* Quick Scenario Pills */}
          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-syria-border text-xs shadow-inner">
            <span className="px-2 text-slate-400 flex items-center gap-1 text-[11px] font-medium shrink-0">
              <Layers className="w-3 h-3 text-syria-gold" />
              السيناريوهات:
            </span>
            <button
              onClick={() => onSelectScenario('A')}
              className={`px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeScenario === 'A'
                  ? 'bg-rose-950 text-rose-200 font-bold border border-rose-500/50 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="سيناريو أ: تعارض مياه وتزفيت في نفس المقطع (الميدان 5-7 و 6 تشرين الثاني)"
            >
              أ (تعارض)
            </button>
            <button
              onClick={() => onSelectScenario('B')}
              className={`px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeScenario === 'B'
                  ? 'bg-emerald-950 text-emerald-200 font-bold border border-emerald-500/50 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="سيناريو ب: مقطعان مختلفان موثقان في نفس الحي (لا يوجد تعارض)"
            >
              ب (سليم)
            </button>
            <button
              onClick={() => onSelectScenario('C')}
              className={`px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeScenario === 'C'
                  ? 'bg-amber-950 text-amber-200 font-bold border border-amber-500/50 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="سيناريو ج: موقع غير مؤكد يتطلب مراجعة بشرية"
            >
              ج (مراجعة)
            </button>
            <button
              onClick={() => onSelectScenario('D')}
              className={`px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeScenario === 'D'
                  ? 'bg-syria-card text-syria-goldLight font-bold border border-syria-borderGold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="سيناريو د: جدولة منسقة بعد انقضاء الحفر وفترة الأمان"
            >
              د (منسق)
            </button>
            <button
              onClick={() => onSelectScenario('E')}
              className={`px-2 py-1 rounded-lg transition-colors font-semibold ${
                activeScenario === 'E'
                  ? 'bg-blue-950 text-blue-200 font-bold border border-blue-500/50 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="سيناريو هـ: الحساب المالي والوفورات التقديرية"
            >
              هـ (مالي)
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={onResetData}
            title="إعادة ضبط سجلات التجربة الافتراضية"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-syria-goldLight border border-syria-border transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
<<<END FILE>>>

<<<FILE: src/components/Sidebar.tsx>>>
// src/components/Sidebar.tsx
import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus2, 
  AlertOctagon, 
  CalendarClock, 
  MapPin,
  ShieldAlert,
  HelpCircle,
  CalendarCheck2
} from 'lucide-react';
import { SyrianEagleLogo } from './SyrianEagleLogo';

export type ActiveRoute = 'dashboard' | 'new-project' | 'conflicts' | 'coordination' | 'approved-analysis';

interface SidebarProps {
  currentRoute: ActiveRoute;
  onRouteChange: (route: ActiveRoute) => void;
  conflictCount: number;
  reviewCount: number;
  approvedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  conflictCount,
  reviewCount,
  approvedCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveRoute,
      label: 'لوحة القيادة والمشاريع',
      description: 'نظرة عامة على المشروعات والمؤشرات',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'conflicts' as ActiveRoute,
      label: 'مصفوفة التعارضات',
      description: 'كشف التضارب المكاني والزماني بين المشروعات',
      icon: AlertOctagon,
      badge: conflictCount > 0 ? `${conflictCount} تعارض` : null,
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-500/50 font-bold',
    },
    {
      id: 'coordination' as ActiveRoute,
      label: 'الجدولة والتنسيق الهندسي',
      description: 'المواعيد المقترحة وحساب الوفورات',
      icon: CalendarClock,
      badge: reviewCount > 0 ? `${reviewCount} للاعتماد` : null,
      badgeColor: 'bg-amber-950 text-amber-300 border border-amber-500/50 font-bold',
    },
    {
      id: 'approved-analysis' as ActiveRoute,
      label: 'تحليل الأعمال والمحاضر المعتمدة',
      description: 'فحص التتابع الزمني والمحاضر الصادرة',
      icon: CalendarCheck2,
      badge: approvedCount > 0 ? `${approvedCount} معتمد` : null,
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold',
    },
    {
      id: 'new-project' as ActiveRoute,
      label: 'تحليل أمر عمل جديد',
      description: 'استخراج تلقائي للنصوص ومطابقة المواقع',
      icon: FilePlus2,
      badge: '+ جديد',
      badgeColor: 'syria-badge-gold font-bold',
    },
  ];

  return (
    <aside className="w-full md:w-72 bg-syria-card/95 border-s border-syria-border flex flex-col justify-between shrink-0 p-4 shadow-xl">
      <div className="space-y-5">
        {/* Municipality Context Tag with Syrian Identity */}
        <div className="p-3.5 bg-gradient-to-br from-slate-950 to-syria-navy rounded-2xl border border-syria-borderGold/30 flex items-center gap-3 shadow-md">
          <SyrianEagleLogo size="sm" />
          <div className="overflow-hidden min-w-0">
            <div className="text-[11px] font-bold text-syria-gold uppercase tracking-wider truncate">
              محافظة دمشق
            </div>
            <h2 className="text-xs font-bold text-slate-100 truncate mt-0.5">
              مديرية الصيانة وهندسة المرافق
            </h2>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-syria-gold shrink-0" />
              <span className="truncate">نطاق عمل مدينة دمشق القديمة والأحياء</span>
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onRouteChange(item.id)}
                className={`w-full text-right p-3.5 rounded-2xl transition-all flex items-start gap-3 relative border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-l from-slate-900 to-syria-cardHover border-syria-borderGold text-white shadow-lg shadow-black/40 ring-1 ring-syria-gold/20'
                    : 'border-transparent text-slate-300 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 transition-colors ${
                    isActive
                      ? 'bg-syria-gold/20 text-syria-goldLight border border-syria-gold/30'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-100">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Info card at bottom */}
      <div className="mt-6 pt-4 border-t border-syria-border">
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-syria-border text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-syria-gold font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-syria-gold" />
            <span>ضوابط التنسيق الهندسي</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            لا يُعتمد موعد التزفيت إلا بعد اكتمال حفريات البنى التحتية وانقضاء فترة الأمان المعتمدة، بمصادقة المهندس المشرف.
          </p>
        </div>
      </div>
    </aside>
  );
};
<<<END FILE>>>

<<<FILE: src/components/Toast.tsx>>>
// src/components/Toast.tsx
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none" dir="rtl">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-syria-gold shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borders = {
    success: 'border-syria-borderGold/80 bg-slate-950/95 text-white shadow-syria-gold/20',
    warning: 'border-amber-500/60 bg-slate-950/95 text-white shadow-amber-950/40',
    info: 'border-blue-500/60 bg-slate-950/95 text-white shadow-blue-950/40',
  };

  return (
    <div
      className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-white">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
<<<END FILE>>>

<<<FILE: src/components/OfficialProtocolModal.tsx>>>
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
<<<END FILE>>>
