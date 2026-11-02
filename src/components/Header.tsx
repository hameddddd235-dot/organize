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
