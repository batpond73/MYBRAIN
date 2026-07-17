/**
 * financialInsights.ts — 재무 심층분석 패널의 통합분석 순수 함수.
 *
 * 20개 KPI 스냅샷(현 period의 current/status)을 입력받아
 *   (1) 3축(수익성·유지·리스크) 헬스 스코어 0~100
 *   (2) upstreamKpiKeys DAG를 이용한 원인 지표 자동 선정
 * 를 계산.
 *
 * 스코어는 mockData에 하드코딩하지 않는다 — 20개 지표 status를 실제로
 * 집계해 나오는 값이어야 "20개 지표 통합분석 결과"가 유의미해진다.
 */

import type { Kpi20Snapshot } from "@/constants/mockData";

// ── 축 매핑 ────────────────────────────────────────────
// 20개 KPI를 3개 축으로 분류. Tier B(진료완료율·NPS·체어가동률)는
// 재무 심층에서 제외하기로 결정했으나, 스코어 계산에서는 축에 계속
// 포함해 진단 정확도를 유지한다 (UI 노출과 판정 로직은 분리).
export type Axis = "profitability" | "retention" | "risk";

const AXIS_OF_ID: Record<number, Axis> = {
  1:  "profitability", // 월 매출
  2:  "profitability", // 환자 LTV
  3:  "profitability", // LTV:CAC
  4:  "risk",          // 체어 가동률 (병목 → 매출 리스크)
  5:  "risk",          // 예약 충족률
  6:  "risk",          // 당일 취소율
  7:  "risk",          // 미수금 비율
  8:  "risk",          // 신환 내원 (유입 리스크)
  9:  "retention",     // 재내원율
  10: "retention",     // 리콜 성공률
  11: "retention",     // 진료 완료율
  12: "risk",          // 스태프 이직률
  13: "profitability", // 스태프 생산성
  14: "risk",          // 재료비 비율 (원가 리스크)
  15: "risk",          // 기공료 비율
  16: "profitability", // 월 순이익률
  17: "profitability", // 시간당 생산성
  18: "retention",     // 환자 NPS (재방문 의향의 upstream)
  19: "profitability", // 마케팅 ROI
  20: "retention",     // 예방·리콜 매출 비중
};

// Tier S — 레퍼런스 분석에서 2회 이상 등장하는 핵심 지표는 가중치 2배.
// 이 리스트가 3축 스코어의 상대 중요도를 결정한다.
const TIER_S_IDS = new Set<number>([3, 9, 10, 16, 20]);

// KpiStatus → 헬스 점수 (0~100).
const STATUS_HEALTH: Record<Kpi20Snapshot["status"], number> = {
  crisis:  0,
  warning: 40,
  normal:  80,
  best:    100,
};

export type AxisScores = { profitability: number; retention: number; risk: number };

/**
 * 20개 KPI 스냅샷 → 3축 헬스 스코어 (0~100).
 * Tier S 지표는 2배 가중.
 */
export function computeAxisScores(snapshots: Kpi20Snapshot[]): AxisScores {
  const acc: Record<Axis, { sum: number; weight: number }> = {
    profitability: { sum: 0, weight: 0 },
    retention:     { sum: 0, weight: 0 },
    risk:          { sum: 0, weight: 0 },
  };

  for (const snap of snapshots) {
    const axis = AXIS_OF_ID[snap.id];
    if (!axis) continue;
    const weight = TIER_S_IDS.has(snap.id) ? 2 : 1;
    acc[axis].sum += STATUS_HEALTH[snap.status] * weight;
    acc[axis].weight += weight;
  }

  return {
    profitability: acc.profitability.weight > 0 ? Math.round(acc.profitability.sum / acc.profitability.weight) : 0,
    retention:     acc.retention.weight > 0     ? Math.round(acc.retention.sum / acc.retention.weight)         : 0,
    risk:          acc.risk.weight > 0          ? Math.round(acc.risk.sum / acc.risk.weight)                  : 0,
  };
}

/**
 * 스코어를 4단계 라벨로 변환. 종합 헤더에 색·아이콘 매핑 근거.
 */
export type ScoreBand = "critical" | "risk" | "healthy" | "excellent";

export function bandOf(score: number): ScoreBand {
  if (score < 40) return "critical";
  if (score < 60) return "risk";
  if (score < 85) return "healthy";
  return "excellent";
}

// ── Root cause 자동 선정 ─────────────────────────────
// upstreamKpiKeys DAG를 이용해 "지금 위기·경고 상태인 KPI들의 상류에
// 가장 많이 등장하는 KPI"를 찾는다. 상류 지표를 먼저 개선하면 하류
// 여러 지표가 동시에 회복되기 때문에 처방 우선순위 결정에 쓴다.
export type RootCause = {
  kpiKey: string;                 // ALL20_KEY_MAP 값 (예: "recallRate")
  kpiId: number;
  downstreamCount: number;        // 몇 개 지표의 상류인가
  downstreamKeys: string[];       // 그 지표 키 목록
};

/**
 * @param snapshots         현 period의 20개 KPI 스냅샷 (status 필요)
 * @param canonicalAll20    KPI_BENCHMARKS.all20 (upstreamKpiKeys 참조)
 * @param keyMap            id → key 매핑 (dashboard의 ALL20_KEY_MAP)
 */
export function pickRootCause(
  snapshots: Kpi20Snapshot[],
  canonicalAll20: ReadonlyArray<{ id: number; key: string; upstreamKpiKeys?: string[] }>,
  keyMap: Record<number, string>,
): RootCause | null {
  const statusById = new Map(snapshots.map((s) => [s.id, s.status]));
  const isUnhealthy = (id: number) => {
    const st = statusById.get(id);
    return st === "crisis" || st === "warning";
  };

  // 상류 → 하류 count 집계 (하류가 unhealthy일 때만 카운트)
  const upstreamCount = new Map<string, string[]>(); // key: upstream key, val: downstream keys
  for (const kpi of canonicalAll20) {
    if (!isUnhealthy(kpi.id)) continue;
    if (!kpi.upstreamKpiKeys || kpi.upstreamKpiKeys.length === 0) continue;
    const downstreamKey = kpi.key;
    for (const upKey of kpi.upstreamKpiKeys) {
      const list = upstreamCount.get(upKey) ?? [];
      list.push(downstreamKey);
      upstreamCount.set(upKey, list);
    }
  }

  // count 가장 큰 상류 지표 선정 (동점 시 id 낮은 것)
  let best: { key: string; downs: string[]; id: number } | null = null;
  for (const [key, downs] of upstreamCount.entries()) {
    const id = Number(Object.entries(keyMap).find(([, v]) => v === key)?.[0] ?? 999);
    if (
      !best ||
      downs.length > best.downs.length ||
      (downs.length === best.downs.length && id < best.id)
    ) {
      best = { key, downs, id };
    }
  }

  if (!best) return null;
  return {
    kpiKey: best.key,
    kpiId: best.id,
    downstreamCount: best.downs.length,
    downstreamKeys: best.downs,
  };
}
