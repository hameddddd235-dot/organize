// src/utils/financial.ts
import { Conflict, Project } from '../types';

export interface FinancialCalculationParams {
  roadLengthM: number;
  roadWidthM: number;
  costPerM2: number; // in Syrian Pounds (ل.س)
}

export interface FinancialCalculationResult {
  roadLengthM: number;
  roadWidthM: number;
  affectedAreaM2: number;
  costPerM2: number;
  totalAvoidableCostSYP: number;
  totalAvoidableCostFormattedAr: string;
  totalAvoidableCostAmountFormatted: string;
  assumptions: string[];
}

// Default benchmark values for municipal road paving rework in Damascus
export const DEFAULT_FINANCIAL_BENCHMARKS = {
  DEFAULT_LENGTH_M: 420,
  DEFAULT_WIDTH_M: 14,
  DEFAULT_COST_PER_M2_SYP: 185_000, // 185,000 SYP per square meter for full-depth trench asphalt restoration
};

/**
 * Calculates the potential avoidable rework cost if a freshly paved road is re-excavated.
 * Formula: Area (m²) = Length * Width
 * Avoidable Rework Cost = Area * Cost per m²
 */
export function calculatePotentialSavings(
  params: Partial<FinancialCalculationParams>
): FinancialCalculationResult {
  const roadLengthM = Math.max(0, params.roadLengthM ?? DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_LENGTH_M);
  const roadWidthM = Math.max(0, params.roadWidthM ?? DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_WIDTH_M);
  const costPerM2 = Math.max(0, params.costPerM2 ?? DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_COST_PER_M2_SYP);

  const affectedAreaM2 = Math.round(roadLengthM * roadWidthM);
  const totalAvoidableCostSYP = Math.round(affectedAreaM2 * costPerM2);

  const amountFormatted = new Intl.NumberFormat('ar-SY').format(totalAvoidableCostSYP);
  const formattedAr = `${amountFormatted} ل.س`;

  return {
    roadLengthM,
    roadWidthM,
    affectedAreaM2,
    costPerM2,
    totalAvoidableCostSYP,
    totalAvoidableCostFormattedAr: formattedAr,
    totalAvoidableCostAmountFormatted: amountFormatted,
    assumptions: [
      `المساحة المتأثرة = الطول (${roadLengthM} م) × العرض (${roadWidthM} م) = ${new Intl.NumberFormat('ar-SY').format(affectedAreaM2)} م²`,
      `كلفة المتر المربع التقديرية = ${new Intl.NumberFormat('ar-SY').format(costPerM2)} ل.س (قشط وإعادة مد قميص إسفلتي)`,
      'التقديرات المالية استرشادية وافتراضية لأغراض المحاكاة والتخطيط البلدي.',
    ],
  };
}


/**
 * Calculates the total potential avoided road rework costs ONLY for verified paving-related conflicts.
 * - Non-blocking utility notices and uncertain location reviews contribute 0 SYP.
 * - Avoids double-counting the same paving area when multiple underground projects affect the same segment.
 */
export function calculateAvoidedReworkSavings(
  conflicts: Conflict[],
  projects: Project[],
  costPerM2: number = DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_COST_PER_M2_SYP
): {
  totalAvoidableCostSYP: number;
  totalAvoidableCostFormattedAr: string;
  totalAvoidableCostAmountFormatted: string;
  uniquePavingProjectsCount: number;
  totalPavedAreaM2: number;
} {
  // Filter ONLY for confirmed blocking paving conflicts
  const blockingPavingConflicts = conflicts.filter(
    (c) => c.is_blocking && c.severity === 'high'
  );

  // Identify unique paving project IDs to prevent double counting
  const countedPavingProjectIds = new Set<string>();
  let totalPavedAreaM2 = 0;

  for (const conflict of blockingPavingConflicts) {
    const prjA = projects.find((p) => p.id === conflict.project_a_id);
    const prjB = projects.find((p) => p.id === conflict.project_b_id);

    const pavingProjectsInConflict = [prjA, prjB].filter(
      (p): p is Project => !!p && p.work_type === 'paving'
    );

    for (const pavingPrj of pavingProjectsInConflict) {
      if (!countedPavingProjectIds.has(pavingPrj.id)) {
        countedPavingProjectIds.add(pavingPrj.id);
        const length = Math.max(0, pavingPrj.road_length_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_LENGTH_M);
        const width = Math.max(0, pavingPrj.road_width_m || DEFAULT_FINANCIAL_BENCHMARKS.DEFAULT_WIDTH_M);
        totalPavedAreaM2 += Math.round(length * width);
      }
    }
  }

  const totalAvoidableCostSYP = Math.round(totalPavedAreaM2 * costPerM2);
  const amountFormatted = new Intl.NumberFormat('ar-SY').format(totalAvoidableCostSYP);
  const totalAvoidableCostFormattedAr = `${amountFormatted} ل.س`;

  return {
    totalAvoidableCostSYP,
    totalAvoidableCostFormattedAr,
    totalAvoidableCostAmountFormatted: amountFormatted,
    uniquePavingProjectsCount: countedPavingProjectIds.size,
    totalPavedAreaM2,
  };
}

