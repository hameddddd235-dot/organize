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
