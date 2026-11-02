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
