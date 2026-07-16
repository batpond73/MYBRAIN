/**
 * kpiEngine.ts — v0.4 KPI 상태 판정 순수 함수
 * judgeType(ABS/REL/DERIVED)에 따라 status를 계산.
 * 기준이 바뀌어도 이 파일 한 곳만 수정하면 됩니다.
 */

export type JudgeType = "ABS" | "REL" | "DERIVED";
export type KpiStatus = "crisis" | "warning" | "normal" | "best";

interface AbsThresholds {
  crisis: number;
  warning: number;
  best?: number;
  lowerIsBetter: boolean;
}

interface OptimalRange {
  min: number;
  max: number;
}

interface EvaluateInput {
  value: number;
  judgeType: JudgeType;
  thresholds?: AbsThresholds;
  optimalRange?: OptimalRange;
  trendValues?: number[];
  lowerIsBetter?: boolean;
}

/**
 * 단일 KPI 값 → KpiStatus 판정
 */
export function evaluateKpiStatus(input: EvaluateInput): KpiStatus {
  const { value, judgeType, thresholds, optimalRange, trendValues } = input;

  // ─── ABS: 고정 임계값 판정 ─────────────────────────────────────────────
  if (judgeType === "ABS") {
    if (!thresholds) return "normal";
    const { crisis, warning, best, lowerIsBetter } = thresholds;
    if (lowerIsBetter) {
      if (value > crisis) return "crisis";
      if (value > warning) return "warning";
      if (best !== undefined && value <= best) return "best";
      return "normal";
    } else {
      if (value < crisis) return "crisis";
      if (value < warning) return "warning";
      if (best !== undefined && value >= best) return "best";
      return "normal";
    }
  }

  // ─── REL: 최적 구간 또는 추세 판정 ────────────────────────────────────
  if (judgeType === "REL") {
    if (optimalRange) {
      const { min, max } = optimalRange;
      if (value < min * 0.85) return "crisis";
      if (value < min) return "warning";
      if (value > max * 1.1) return "warning"; // 과부하 경고
      if (value > max) return "warning";
      if (value >= min && value <= max) return "normal";
      return "normal";
    }
    if (trendValues && trendValues.length >= 2) {
      const last = trendValues[trendValues.length - 1];
      const prev = trendValues[trendValues.length - 2];
      if (prev === 0) return "normal";
      const change = (last - prev) / Math.abs(prev);
      if (change < -0.1) return "crisis";
      if (change < -0.03) return "warning";
      return "normal";
    }
    return "normal";
  }

  // ─── DERIVED: 파생 지표 (원인 지표로 안내 우선) ──────────────────────
  if (judgeType === "DERIVED") {
    if (optimalRange) {
      const { min, max } = optimalRange;
      if (value < min * 0.7) return "crisis";
      if (value < min) return "warning";
      if (value > max) return "warning"; // 점검
      return "normal";
    }
    return "normal";
  }

  return "normal";
}

// ─── v0.4 확정 ABS 임계값 ──────────────────────────────────────────────────
export const KPI_THRESHOLDS: Record<string, AbsThresholds> = {
  cancelRate:   { crisis: 5,  warning: 3,   lowerIsBetter: true  },
  uncollected:  { crisis: 3,  warning: 1.5, lowerIsBetter: true  },
  treatComplete:{ crisis: 60, warning: 75,  lowerIsBetter: false },
  materialCost: { crisis: 25, warning: 20,  lowerIsBetter: true  },
  labFee:       { crisis: 15, warning: 12,  lowerIsBetter: true  },
};

// ─── v0.4 확정 REL 최적 구간 ──────────────────────────────────────────────
export const KPI_OPTIMAL_RANGES: Record<string, OptimalRange> = {
  chairUtil:    { min: 70, max: 85  }, // >90% 과부하 경고 (1.1× buffer)
  newPatients:  { min: 15, max: 25  }, // 신환 비중 15~25%
  returnRate:   { min: 55, max: 100 }, // >55% 정상, >70% 우수 (상한 없음)
};

// ─── v0.4 확정 DERIVED 최적 구간 ─────────────────────────────────────────
export const DERIVED_OPTIMAL_RANGES: Record<string, OptimalRange> = {
  ltvCac: { min: 3, max: 5 }, // <2x 위기, 2~3x 경고, 3~5x 정상, >5x 점검
};
