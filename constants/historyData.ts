/**
 * historyData.ts — v0.4 스키마 (higherIsBetter 폐기)
 * judgeType: ABS / REL / DERIVED
 * benefitDirection: "higher" | "lower" | "stable"  ← history.tsx 화살표 표시용
 *
 * 설계 의도 명시 (근본 · 우회·쌓기 전수조사 항목 ⑫):
 *   각 entry의 status는 hand-crafted mock story · lib/kpiEngine.ts의
 *   evaluateKpiStatus 재판정으로 재현되지 않는 케이스가 있음. 이는 실 데이터
 *   연동 전 데모 목적의 서사 데이터라 의도적으로 story-driven하게 배치됨:
 *     - 위기 → 개선 사례 · 6개월 동안 실장님 액션 도입 결과
 *     - 만성 지표 · 3개월 연속 위기
 *     - 안정 관리 · 정상 밴드 내에서 소폭 변동
 *   실 데이터 연동 시 status는 각 값에서 kpiEngine으로 재계산되도록 이관 필요.
 *   그때까지는 이 파일이 story-driven mock의 진실원.
 */

export type KpiStatus = "crisis" | "warning" | "normal" | "best";
export type TrendResult = "improved" | "worsened" | "stable";
export type JudgeType = "ABS" | "REL" | "DERIVED";
export type BenefitDirection = "higher" | "lower" | "stable";

export interface HistoryEntry {
  month: string;
  value: number;
  status: KpiStatus;
  action?: string;
  result?: TrendResult;
}

export interface KpiHistoryData {
  key: string;
  name: string;
  unit: string;
  benchmark: string;
  benchmarkDesc: string;
  judgeType: JudgeType;
  benefitDirection: BenefitDirection;
  optimalRange?: { min: number; max: number };
  thresholds?: { crisis: number; warning: number };
  isResultMetric: boolean;
  upstreamKpiKeys?: string[];
  entries: HistoryEntry[];
}

// months: 25.12 → 26.05 (6 months)
// result = compared to PREVIOUS month (first month has no result)

export const KPI_HISTORY: KpiHistoryData[] = [
  // ───────────────────────────────────────────────────────────────
  // 위기 → 개선 그룹
  // ───────────────────────────────────────────────────────────────
  {
    key: "cancelRate",
    name: "당일 취소율",
    unit: "%",
    benchmark: "≤3% 우수 / >5% 위기",
    benchmarkDesc: "Lean Healthcare (ABS)",
    judgeType: "ABS",
    benefitDirection: "lower",
    thresholds: { crisis: 5, warning: 3 },
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 9.2, status: "crisis" },
      { month: "26.01", value: 8.4, status: "crisis",  action: "취소 문자 알림 강화·2일 전 리마인드 콜", result: "improved" },
      { month: "26.02", value: 6.1, status: "crisis",  action: "노쇼 위약금 정책 도입(1만 원)",          result: "improved" },
      { month: "26.03", value: 4.3, status: "warning", action: "예약 확인 자동화 시스템 연동",          result: "improved" },
      { month: "26.04", value: 3.8, status: "warning",                                                   result: "improved" },
      { month: "26.05", value: 2.7, status: "normal",                                                    result: "improved" },
    ],
  },
  {
    key: "uncollected",
    name: "미수금 비율",
    unit: "%",
    benchmark: "<1.5% 우수 / >3% 위기",
    benchmarkDesc: "Cash Flow Optimization (ABS)",
    judgeType: "ABS",
    benefitDirection: "lower",
    thresholds: { crisis: 3, warning: 1.5 },
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 4.8, status: "crisis" },
      { month: "26.01", value: 4.2, status: "crisis",  action: "미수금 전담 데스크 운영 시작",  result: "improved" },
      { month: "26.02", value: 3.1, status: "crisis",  action: "치료비 분할 납부제 도입",       result: "improved" },
      { month: "26.03", value: 2.3, status: "warning",                                          result: "improved" },
      { month: "26.04", value: 1.8, status: "warning", action: "자동 문자 청구 시스템 도입",   result: "improved" },
      { month: "26.05", value: 1.2, status: "normal",                                           result: "improved" },
    ],
  },
  {
    key: "recallRate",
    name: "리콜 성공률",
    unit: "%",
    benchmark: "도래 환자 중 재방문율, 추세 판정",
    benchmarkDesc: "유지 경제학 (REL · 상류 지표)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 28, status: "crisis" },
      { month: "26.01", value: 31, status: "crisis",  action: "리콜 전담 코디 1명 배치",              result: "improved" },
      { month: "26.02", value: 38, status: "crisis",  action: "카카오 알림톡 리콜 자동발송",          result: "improved" },
      { month: "26.03", value: 46, status: "warning",                                                  result: "improved" },
      { month: "26.04", value: 53, status: "warning", action: "6개월 무료 스케일링 패키지 출시",      result: "improved" },
      { month: "26.05", value: 61, status: "normal",                                                   result: "improved" },
    ],
  },
  {
    key: "newPatients",
    name: "신환 내원",
    unit: "명/월",
    benchmark: "신환 비중 15~25% + 재내원 동반상승",
    benchmarkDesc: "Unit Economics (REL · 최적 구간)",
    judgeType: "REL",
    benefitDirection: "higher",
    optimalRange: { min: 15, max: 25 },
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 14, status: "crisis" },
      { month: "26.01", value: 17, status: "crisis",  action: "네이버 블로그·인스타그램 광고 집행",              result: "improved" },
      { month: "26.02", value: 22, status: "crisis",  action: "지역 맘카페 체험 이벤트 (임플란트 CT 무료)",     result: "improved" },
      { month: "26.03", value: 28, status: "warning",                                                             result: "improved" },
      { month: "26.04", value: 33, status: "warning", action: "지인 소개 인센티브 프로그램 론칭",               result: "improved" },
      { month: "26.05", value: 38, status: "normal",                                                              result: "improved" },
    ],
  },
  {
    key: "chairUtil",
    name: "체어 가동률",
    unit: "%",
    benchmark: "70~85% 최적 / >90% 과부하 경고",
    benchmarkDesc: "Theory of Constraints (REL · 최적 구간)",
    judgeType: "REL",
    benefitDirection: "stable",
    optimalRange: { min: 70, max: 85 },
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 54, status: "crisis" },
      { month: "26.01", value: 57, status: "crisis",  action: "빈 슬롯 당일 예약 오픈 운영",         result: "improved" },
      { month: "26.02", value: 63, status: "warning", action: "체어 2대 추가 운영 (오후 5~8시)",     result: "improved" },
      { month: "26.03", value: 69, status: "warning",                                                 result: "improved" },
      { month: "26.04", value: 74, status: "normal",  action: "예약 간격 재조정 (10분→8분)",         result: "improved" },
      { month: "26.05", value: 79, status: "normal",                                                  result: "improved" },
    ],
  },

  // ───────────────────────────────────────────────────────────────
  // 정상 → 악화 그룹
  // ───────────────────────────────────────────────────────────────
  {
    key: "staffTurnover",
    name: "스태프 이직률",
    unit: "%/년",
    benchmark: ">15% 경고 / >25% 위기 (소규모 절대 건수 보조)",
    benchmarkDesc: "Lean Healthcare / People Ops (REL)",
    judgeType: "REL",
    benefitDirection: "lower",
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 8,  status: "best" },
      { month: "26.01", value: 10, status: "normal",  result: "worsened" },
      { month: "26.02", value: 13, status: "normal",  action: "급여 테이블 재검토 착수",                         result: "worsened" },
      { month: "26.03", value: 18, status: "warning",                                                             result: "worsened" },
      { month: "26.04", value: 21, status: "warning", action: "직원 만족도 설문 + 복지 패키지 개선",             result: "worsened" },
      { month: "26.05", value: 19, status: "warning",                                                             result: "improved" },
    ],
  },
  {
    key: "nps",
    name: "환자 NPS",
    unit: "점",
    benchmark: "추세·분포 판정 / 하락 시 경고 트리거",
    benchmarkDesc: "유지 경제학 (REL · 추세 판정)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 62, status: "normal" },
      { month: "26.01", value: 58, status: "warning", result: "worsened" },
      { month: "26.02", value: 54, status: "warning", action: "대기시간 단축 TF 구성",                result: "worsened" },
      { month: "26.03", value: 49, status: "crisis",                                                   result: "worsened" },
      { month: "26.04", value: 47, status: "crisis",  action: "원장 직접 사후 전화 상담 도입",        result: "worsened" },
      { month: "26.05", value: 51, status: "warning",                                                  result: "improved" },
    ],
  },
  {
    key: "netProfit",
    name: "월 순이익률",
    unit: "%",
    benchmark: "연차 구간 대비 (신규 10% / 안정기 20~25%)",
    benchmarkDesc: "Unit Economics (REL · 연차 보정)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 22, status: "normal" },
      { month: "26.01", value: 20, status: "normal",  result: "stable" },
      { month: "26.02", value: 17, status: "warning",                                                  result: "worsened" },
      { month: "26.03", value: 14, status: "warning", action: "고정비 재검토: 임차료 협상 착수",      result: "worsened" },
      { month: "26.04", value: 11, status: "crisis",                                                   result: "worsened" },
      { month: "26.05", value: 13, status: "warning", action: "비보험 진료 비중 확대 전략 수립",      result: "improved" },
    ],
  },
  {
    key: "hourlyProd",
    name: "시간당 생산성",
    unit: "만 원/h",
    benchmark: "시간당 생산성 ÷ 시간당 고정비 ≥ 2배",
    benchmarkDesc: "ToC / Operations (REL)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 36, status: "normal" },
      { month: "26.01", value: 34, status: "warning",                                                    result: "worsened" },
      { month: "26.02", value: 31, status: "warning",                                                    result: "worsened" },
      { month: "26.03", value: 28, status: "crisis",  action: "임플란트·교정 진료 비중 확대",           result: "worsened" },
      { month: "26.04", value: 27, status: "crisis",                                                     result: "stable" },
      { month: "26.05", value: 29, status: "crisis",                                                     result: "improved" },
    ],
  },
  {
    key: "marketingROI",
    name: "마케팅 ROI",
    unit: "%",
    benchmark: "LTV:CAC와 동일 산식 (ID 3 일치)",
    benchmarkDesc: "Unit Economics (DERIVED)",
    judgeType: "DERIVED",
    benefitDirection: "higher",
    isResultMetric: true,
    upstreamKpiKeys: ["patientLtv", "recallRate"],
    entries: [
      { month: "25.12", value: 520, status: "normal" },
      { month: "26.01", value: 480, status: "normal",  result: "worsened" },
      { month: "26.02", value: 410, status: "normal",  result: "worsened" },
      { month: "26.03", value: 360, status: "warning",                                           result: "worsened" },
      { month: "26.04", value: 290, status: "warning", action: "광고 채널 전환: SNS→검색광고",  result: "worsened" },
      { month: "26.05", value: 320, status: "warning",                                           result: "improved" },
    ],
  },

  // ───────────────────────────────────────────────────────────────
  // 위기 지속 그룹
  // ───────────────────────────────────────────────────────────────
  {
    key: "preventiveRecall",
    name: "예방·리콜 매출 비중",
    unit: "%",
    benchmark: "<12% 위기 / ≥18~20% 건강",
    benchmarkDesc: "유지 경제학 (REL · 상류 지표)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    upstreamKpiKeys: ["recallRate", "returnRate"],
    entries: [
      { month: "25.12", value: 7,  status: "crisis" },
      { month: "26.01", value: 8,  status: "crisis",  action: "스케일링 패키지 상품화",            result: "improved" },
      { month: "26.02", value: 9,  status: "crisis",                                               result: "improved" },
      { month: "26.03", value: 10, status: "crisis",  action: "불소·실런트 예방 패키지 도입",      result: "improved" },
      { month: "26.04", value: 11, status: "crisis",                                               result: "improved" },
      { month: "26.05", value: 13, status: "warning",                                              result: "improved" },
    ],
  },
  {
    key: "ltvCac",
    name: "LTV:CAC 비율",
    unit: "x",
    benchmark: "3~5x 정상 / <2x 위기 / >5x 점검",
    benchmarkDesc: "Unit Economics (DERIVED · a16z 기준)",
    judgeType: "DERIVED",
    benefitDirection: "stable",
    optimalRange: { min: 3, max: 5 },
    isResultMetric: true,
    upstreamKpiKeys: ["patientLtv", "recallRate"],
    entries: [
      { month: "25.12", value: 2.8, status: "warning" },
      { month: "26.01", value: 2.6, status: "warning", result: "worsened" },
      { month: "26.02", value: 2.9, status: "warning", action: "마케팅 비용 효율화 검토",          result: "improved" },
      { month: "26.03", value: 3.1, status: "normal",                                               result: "improved" },
      { month: "26.04", value: 3.4, status: "normal",  action: "LTV 제고: 보철·교정 업셀 강화",   result: "improved" },
      { month: "26.05", value: 3.7, status: "normal",                                               result: "improved" },
    ],
  },

  // ───────────────────────────────────────────────────────────────
  // 안정 그룹
  // ───────────────────────────────────────────────────────────────
  {
    key: "returnRate",
    name: "재내원율",
    unit: "%",
    benchmark: "<40% 위기 / 55~70% 정상 / >70% 우수",
    benchmarkDesc: "유지 경제학 (REL · 상류 지표)",
    judgeType: "REL",
    benefitDirection: "higher",
    optimalRange: { min: 55, max: 100 },
    isResultMetric: false,
    upstreamKpiKeys: ["recallRate", "treatComplete"],
    entries: [
      { month: "25.12", value: 71, status: "best" },
      { month: "26.01", value: 70, status: "best",   result: "stable" },
      { month: "26.02", value: 72, status: "best",   result: "improved" },
      { month: "26.03", value: 69, status: "normal", result: "worsened" },
      { month: "26.04", value: 73, status: "best",   result: "improved" },
      { month: "26.05", value: 74, status: "best",   result: "improved" },
    ],
  },
  {
    key: "treatComplete",
    name: "진료 완료율",
    unit: "%",
    benchmark: ">75% 정상 / <60% 위기",
    benchmarkDesc: "Value-Based Care (ABS)",
    judgeType: "ABS",
    benefitDirection: "higher",
    thresholds: { crisis: 60, warning: 75 },
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 82, status: "normal" },
      { month: "26.01", value: 80, status: "normal",  result: "stable" },
      { month: "26.02", value: 78, status: "normal",  result: "worsened" },
      { month: "26.03", value: 81, status: "normal",  action: "미완료 환자 추적 전화 시스템 도입", result: "improved" },
      { month: "26.04", value: 83, status: "normal",                                                result: "improved" },
      { month: "26.05", value: 84, status: "normal",                                                result: "improved" },
    ],
  },
  {
    key: "materialCost",
    name: "재료비 비율",
    unit: "%",
    benchmark: "<20% 정상 / >25% 위기 (믹스 반영)",
    benchmarkDesc: "Lean Healthcare / TPS (ABS)",
    judgeType: "ABS",
    benefitDirection: "lower",
    thresholds: { crisis: 25, warning: 20 },
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 7.8, status: "best" },
      { month: "26.01", value: 8.1, status: "best",                                                      result: "worsened" },
      { month: "26.02", value: 8.4, status: "best",                                                      result: "worsened" },
      { month: "26.03", value: 7.9, status: "best", action: "공급업체 재협상 단가 3% 절감",              result: "improved" },
      { month: "26.04", value: 7.6, status: "best",                                                      result: "improved" },
      { month: "26.05", value: 7.4, status: "best",                                                      result: "improved" },
    ],
  },
  {
    key: "labFee",
    name: "기공료 비율",
    unit: "%",
    benchmark: "<12% 정상 / >15% 경고 (보철매출 대비)",
    benchmarkDesc: "Lean Healthcare / TPS (ABS)",
    judgeType: "ABS",
    benefitDirection: "lower",
    thresholds: { crisis: 15, warning: 12 },
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 11.2, status: "normal" },
      { month: "26.01", value: 11.8, status: "normal",                                                       result: "worsened" },
      { month: "26.02", value: 12.3, status: "warning",                                                      result: "worsened" },
      { month: "26.03", value: 12.8, status: "warning", action: "국내 기공소 2곳 추가 비교 견적",           result: "worsened" },
      { month: "26.04", value: 11.5, status: "normal",                                                       result: "improved" },
      { month: "26.05", value: 11.1, status: "normal",                                                       result: "improved" },
    ],
  },

  // ───────────────────────────────────────────────────────────────
  // 혼조 그룹
  // ───────────────────────────────────────────────────────────────
  {
    key: "monthlyRevenue",
    name: "월 매출",
    unit: "만 원",
    benchmark: "연차·체어수 대비 추세",
    benchmarkDesc: "Unit Economics (REL · 연차 보정)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    upstreamKpiKeys: ["chairUtil", "appointmentRate", "cancelRate"],
    entries: [
      { month: "25.12", value: 7200, status: "warning" },
      { month: "26.01", value: 6400, status: "crisis",  action: "연초 비수기 특화 이벤트 기획",              result: "worsened" },
      { month: "26.02", value: 6900, status: "crisis",                                                        result: "improved" },
      { month: "26.03", value: 7500, status: "warning", action: "학기 초 학생 교정 상담 무료 이벤트",        result: "improved" },
      { month: "26.04", value: 7800, status: "warning",                                                       result: "improved" },
      { month: "26.05", value: 8100, status: "normal",                                                        result: "improved" },
    ],
  },
  {
    key: "patientLtv",
    name: "환자 LTV",
    unit: "만 원",
    benchmark: "추세 판정 (DERIVED)",
    benchmarkDesc: "Unit Economics (DERIVED · 결과 지표)",
    judgeType: "DERIVED",
    benefitDirection: "higher",
    isResultMetric: true,
    upstreamKpiKeys: ["returnRate", "recallRate", "treatComplete"],
    entries: [
      { month: "25.12", value: 210, status: "warning" },
      { month: "26.01", value: 205, status: "warning",                                                             result: "worsened" },
      { month: "26.02", value: 218, status: "warning", action: "고가 진료(임플란트) 상담 전환율 제고 교육",       result: "improved" },
      { month: "26.03", value: 235, status: "warning",                                                             result: "improved" },
      { month: "26.04", value: 252, status: "warning", action: "VIP 환자 케어 프로그램 론칭",                     result: "improved" },
      { month: "26.05", value: 268, status: "warning",                                                             result: "improved" },
    ],
  },
  {
    key: "appointmentRate",
    name: "예약 충족률",
    unit: "%",
    benchmark: "의원 목표 회전 대비 추세",
    benchmarkDesc: "Lean Healthcare (REL)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 88, status: "warning" },
      { month: "26.01", value: 83, status: "crisis",  result: "worsened" },
      { month: "26.02", value: 85, status: "warning", action: "당일 예약 오픈 슬롯 자동화", result: "improved" },
      { month: "26.03", value: 89, status: "warning",                                        result: "improved" },
      { month: "26.04", value: 91, status: "warning",                                        result: "improved" },
      { month: "26.05", value: 93, status: "normal",                                         result: "improved" },
    ],
  },
  {
    key: "staffProductivity",
    name: "스태프 생산성",
    unit: "만 원/인",
    benchmark: "인당 매출, 의원 규모 대비",
    benchmarkDesc: "Operations (REL · 규모 보정)",
    judgeType: "REL",
    benefitDirection: "higher",
    isResultMetric: false,
    entries: [
      { month: "25.12", value: 760, status: "warning" },
      { month: "26.01", value: 720, status: "crisis",  result: "worsened" },
      { month: "26.02", value: 700, status: "crisis",  action: "업무 프로세스 재설계 TF 발족", result: "worsened" },
      { month: "26.03", value: 730, status: "crisis",                                          result: "improved" },
      { month: "26.04", value: 770, status: "warning",                                         result: "improved" },
      { month: "26.05", value: 810, status: "normal",                                          result: "improved" },
    ],
  },
];
