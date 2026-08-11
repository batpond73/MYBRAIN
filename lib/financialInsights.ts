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
 *
 * 필터 규약 (근본 픽스):
 *  - 하류(downstream)가 crisis/warning일 때만 카운트 대상
 *  - 상류(upstream) 자신도 crisis/warning이어야 후보 (best인데 하류에 문제라면
 *    그 상류는 진짜 원인이 아니라 다른 요인이 있는 것)
 *  - keyMap에서 못 찾은 상류 key는 후보 배제 (999로 밀어넣던 우회 제거)
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
  // key → id 역인덱스 (매 후보마다 keyMap 전탐색 방지 · id=999 fallback도 제거)
  const idByKey = new Map<string, number>();
  for (const [idStr, key] of Object.entries(keyMap)) idByKey.set(key, Number(idStr));

  // 상류 → 하류 count 집계 (하류가 unhealthy일 때만 카운트)
  const upstreamCount = new Map<string, string[]>();
  for (const kpi of canonicalAll20) {
    if (!isUnhealthy(kpi.id)) continue;
    if (!kpi.upstreamKpiKeys || kpi.upstreamKpiKeys.length === 0) continue;
    for (const upKey of kpi.upstreamKpiKeys) {
      const list = upstreamCount.get(upKey) ?? [];
      list.push(kpi.key);
      upstreamCount.set(upKey, list);
    }
  }

  // 후보 필터 · 정렬
  let best: { key: string; downs: string[]; id: number } | null = null;
  for (const [key, downs] of upstreamCount.entries()) {
    const id = idByKey.get(key);
    if (id === undefined) continue;       // keyMap 미등록 상류 배제 (id=999 우회 제거)
    if (!isUnhealthy(id)) continue;       // 상류 자신이 healthy면 진짜 원인이 아님
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

// KPI 한글 이름 매핑 (rootCause 이유 텍스트 자동 생성용).
// dashboard의 KPI_BENCHMARKS.all20에서 조회 가능하지만, 상류 지표는 all20이 아닌
// 것도 있어(예: laborCost) 별도 fallback 사전을 둔다.
const KPI_KOR_NAME: Record<string, string> = {
  monthlyRevenue: "월 매출", patientLtv: "환자 LTV", ltvCac: "LTV:CAC",
  chairUtil: "체어 가동률", appointmentRate: "예약 충족률", cancelRate: "당일 취소율",
  uncollected: "미수금", newPatients: "신환 수", returnRate: "재내원율",
  recallRate: "리콜 성공률", treatComplete: "진료 완료율", staffTurnover: "스태프 이직률",
  staffProductivity: "스태프 생산성", materialCost: "재료비", labFee: "기공료",
  netProfit: "순이익률", hourlyProd: "시간당 생산성", nps: "환자 NPS",
  marketingROI: "마케팅 ROI", preventiveRecall: "예방·리콜 매출 비중",
  laborCost: "인건비", caseAcceptance: "상담 동의율", noShow: "노쇼율",
  waitTime: "대기시간", fixedCost: "고정비",
};

const STATUS_KOR: Record<Kpi20Snapshot["status"], string> = {
  crisis: "위기", warning: "경고", normal: "정상", best: "우수",
};

/**
 * rootCause 이유 텍스트 자동 생성 · 계산 결과와 항상 정합.
 * 하드코딩 mockData.rootCauseReason 대신 이 함수를 쓴다.
 */
export function generateRootCauseReason(
  rootCause: RootCause,
  rootSnap: { current: string; status: Kpi20Snapshot["status"] },
): string {
  const name = KPI_KOR_NAME[rootCause.kpiKey] ?? rootCause.kpiKey;
  const st = STATUS_KOR[rootSnap.status];
  const downNames = rootCause.downstreamKeys
    .map((k) => KPI_KOR_NAME[k] ?? k)
    .slice(0, 4);
  const listStr = downNames.join(" · ");
  const more = rootCause.downstreamKeys.length > downNames.length
    ? ` 외 ${rootCause.downstreamKeys.length - downNames.length}건`
    : "";
  return (
    `${name} ${rootSnap.current}(${st}) 상태가 지금 위기·경고인 ${rootCause.downstreamCount}개 지표(${listStr}${more})의 상류. ` +
    `여기부터 손대면 이 지표들이 동시에 회복됩니다.\n` +
    `(이 하나만 개선해도 아래 ${rootCause.downstreamCount}개가 함께 좋아진다는 뜻이에요.)`
  );
}
