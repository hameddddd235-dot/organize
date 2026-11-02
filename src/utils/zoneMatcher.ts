// src/utils/zoneMatcher.ts
import { Zone, ZoneMatchResult } from '../types';
import { normalizeArabic } from './arabic';

/**
 * Matches extracted text or location query against controlled canonical zones and aliases.
 * Strictly uses exact substring inclusion of normalized aliases, without fabricating fuzzy probabilities.
 */
export function matchZone(locationText: string, zones: Zone[]): ZoneMatchResult {
  if (!locationText || !zones || zones.length === 0) {
    return {
      matchedZone: null,
      confidence: 0,
      isAmbiguous: true,
      candidateZones: [],
    };
  }

  const normInput = normalizeArabic(locationText);
  const candidates: { zone: Zone; score: number; matchedAlias: string; reason: string }[] = [];

  for (const zone of zones) {
    let bestScoreForZone = 0;
    let bestAliasForZone = '';
    let matchReason = '';

    // Check exact canonical name match
    const normCanonical = normalizeArabic(zone.name_ar);
    if (normInput.includes(normCanonical) || normCanonical.includes(normInput)) {
      bestScoreForZone = 1.0;
      bestAliasForZone = zone.name_ar;
      matchReason = `تطابق تام مع الاسم الرسمي للحي: "${zone.name_ar}"`;
    }

    // Check aliases
    for (const alias of zone.aliases) {
      const normAlias = normalizeArabic(alias);
      if (normInput.includes(normAlias)) {
        // Longer alias matches are stronger
        const score = normAlias.length >= 8 ? 0.95 : 0.85;
        if (score > bestScoreForZone) {
          bestScoreForZone = score;
          bestAliasForZone = alias;
          matchReason = `تطابق مع الاسم الشائع المعتمد: "${alias}"`;
        }
      }
    }

    // Neighborhood match
    const normNeighborhood = normalizeArabic(zone.neighborhood_ar);
    if (normInput.includes(normNeighborhood)) {
      if (0.80 > bestScoreForZone) {
        bestScoreForZone = 0.80;
        bestAliasForZone = zone.neighborhood_ar;
        matchReason = `تطابق مع توصيف المنطقة: "${zone.neighborhood_ar}"`;
      }
    }

    if (bestScoreForZone > 0) {
      candidates.push({
        zone,
        score: bestScoreForZone,
        matchedAlias: bestAliasForZone,
        reason: matchReason,
      });
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return {
      matchedZone: null,
      confidence: 0,
      isAmbiguous: true,
      candidateZones: [],
    };
  }

  const top = candidates[0];

  // Ambiguity check: if there is a second candidate with a score close to the top candidate (delta <= 0.15)
  if (candidates.length > 1 && (top.score - candidates[1].score) <= 0.15) {
    return {
      matchedZone: top.zone,
      confidence: top.score,
      matchedAlias: top.matchedAlias,
      isAmbiguous: true,
      candidateZones: candidates.map((c) => ({
        zone: c.zone,
        score: c.score,
        reason: c.reason,
      })),
    };
  }

  // If score is lower than 0.80, mark as ambiguous
  const isAmbiguous = top.score < 0.80;

  return {
    matchedZone: top.zone,
    confidence: top.score,
    matchedAlias: top.matchedAlias,
    isAmbiguous,
    candidateZones: candidates.map((c) => ({
      zone: c.zone,
      score: c.score,
      reason: c.reason,
    })),
  };
}
