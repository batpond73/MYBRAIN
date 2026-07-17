export const CLINIC_INFO = {
  name: "서울나눔치과의원",
  doctorName: "박지연 원장",
  address: "서울시 강남구 테헤란로 123",
  chairCount: 6,
  staffCount: 8,
  clinicTenureYears: 3, // v0.4: REL 판정 보정용 (0=신규·1년차, 3=안정기, 7+=성숙)
};

export const EMR_MOCK = {
  PATIENT_ARRIVAL: [
    { date: "2026-05-26", time: "09:15", waitMinutes: 12, chairMinutes: 45 },
    { date: "2026-05-26", time: "10:30", waitMinutes: 28, chairMinutes: 60 },
    { date: "2026-05-27", time: "14:00", waitMinutes: 8, chairMinutes: 35 },
    { date: "2026-05-28", time: "11:00", waitMinutes: 5, chairMinutes: 50 },
    { date: "2026-05-29", time: "15:30", waitMinutes: 35, chairMinutes: 70 },
    { date: "2026-05-30", time: "09:00", waitMinutes: 15, chairMinutes: 40 },
  ],
  APPOINTMENT_RESERVED: [
    { date: "2026-05-26", dayOfWeek: "월", totalSlots: 24, filled: 18, noShow: 2 },
    { date: "2026-05-27", dayOfWeek: "화", totalSlots: 24, filled: 20, noShow: 1 },
    { date: "2026-05-28", dayOfWeek: "수", totalSlots: 24, filled: 15, noShow: 3 },
    { date: "2026-05-29", dayOfWeek: "목", totalSlots: 24, filled: 29, noShow: 0, overflow: true },
    { date: "2026-05-30", dayOfWeek: "금", totalSlots: 24, filled: 22, noShow: 1 },
  ],
  CLINICAL_CONSULT: [
    { date: "2026-05-26", type: "임플란트", consultCount: 4, successCount: 2, failReason: "비용 부담" },
    { date: "2026-05-27", type: "교정", consultCount: 3, successCount: 2, failReason: "기간 부담" },
    { date: "2026-05-28", type: "임플란트", consultCount: 5, successCount: 3, failReason: "타병원 비교" },
    { date: "2026-05-29", type: "라미네이트", consultCount: 2, successCount: 1, failReason: "비용 부담" },
    { date: "2026-05-30", type: "임플란트", consultCount: 3, successCount: 1, failReason: "비용 부담" },
  ],
  FINANCIAL_REVENUE: [
    { date: "2026-05-26", revenue: 3850000, salary: 1540000, fixedCost: 980000, netProfit: 1330000 },
    { date: "2026-05-27", revenue: 4200000, salary: 1540000, fixedCost: 980000, netProfit: 1680000 },
    { date: "2026-05-28", revenue: 2900000, salary: 1540000, fixedCost: 980000, netProfit: 380000 },
    { date: "2026-05-29", revenue: 5100000, salary: 1900000, fixedCost: 980000, netProfit: 2220000 },
    { date: "2026-05-30", revenue: 3600000, salary: 1540000, fixedCost: 980000, netProfit: 1080000 },
  ],
};

// ── HR 데이터 (period별) ─────────────────────────────────────────
// 좌측 "스마트 HR 관제" 패널. 인건비 비율·급여 vs 예산·스태프 리스트·
// 수익-인건비 막대차트. staffList/salaryRatio는 사람 단위라 기간 무관.
// 절대액(매출·급여)과 시계열 차트 데이터만 period별로 다른 값.
type StaffRow = { name: string; position: string; consecutiveDays: number; overtime: boolean; riskLevel: "normal" | "warning" | "critical" };
type PeriodBar = { label: string; revenue: number; salary: number };

export type HrPeriodData = {
  totalRevenue: number;
  salaryBudget: number;
  salaryActual: number;
  salaryRatio: number;
  staffList: StaffRow[];
  bars: PeriodBar[];
  barsCaption: string;
};

const HR_STAFF: StaffRow[] = [
  { name: "김지영 실장", position: "데스크", consecutiveDays: 6, overtime: true, riskLevel: "warning" },
  { name: "이수진 위생사", position: "위생사", consecutiveDays: 4, overtime: false, riskLevel: "normal" },
  { name: "박민준 코디", position: "상담", consecutiveDays: 3, overtime: false, riskLevel: "normal" },
  { name: "최하늘 위생사", position: "위생사", consecutiveDays: 7, overtime: true, riskLevel: "critical" },
];

export const HR_DATA_BY_PERIOD: Record<"today" | "week" | "month" | "quarter", HrPeriodData> = {
  today: {
    totalRevenue: 3_100_000,
    salaryBudget: 800_000,
    salaryActual: 930_000,
    salaryRatio: 30.0,
    staffList: HR_STAFF,
    bars: [
      { label: "09시", revenue: 420_000, salary: 155_000 },
      { label: "11시", revenue: 640_000, salary: 155_000 },
      { label: "13시", revenue: 380_000, salary: 155_000 },
      { label: "15시", revenue: 810_000, salary: 232_000 },
      { label: "17시", revenue: 850_000, salary: 233_000 },
    ],
    barsCaption: "시간대별 매출 · 인건비",
  },
  week: {
    totalRevenue: 18_600_000,
    salaryBudget: 6_000_000,
    salaryActual: 6_720_000,
    salaryRatio: 36.1,
    staffList: HR_STAFF,
    bars: [
      { label: "월", revenue: 3_400_000, salary: 1_240_000 },
      { label: "화", revenue: 4_100_000, salary: 1_260_000 },
      { label: "수", revenue: 2_900_000, salary: 1_360_000 },
      { label: "목", revenue: 4_600_000, salary: 1_420_000 },
      { label: "금", revenue: 3_600_000, salary: 1_440_000 },
    ],
    barsCaption: "요일별 매출 · 인건비",
  },
  month: {
    totalRevenue: 78_500_000,
    salaryBudget: 24_000_000,
    salaryActual: 27_800_000,
    salaryRatio: 35.4,
    staffList: HR_STAFF,
    bars: [
      { label: "1주", revenue: 18_200_000, salary: 6_200_000 },
      { label: "2주", revenue: 21_500_000, salary: 6_800_000 },
      { label: "3주", revenue: 16_800_000, salary: 7_200_000 },
      { label: "4주", revenue: 22_000_000, salary: 7_600_000 },
    ],
    barsCaption: "주차별 매출 · 인건비",
  },
  quarter: {
    totalRevenue: 218_500_000,
    salaryBudget: 72_000_000,
    salaryActual: 78_300_000,
    salaryRatio: 35.8,
    staffList: HR_STAFF,
    bars: [
      { label: "3월", revenue: 69_400_000, salary: 24_100_000 },
      { label: "4월", revenue: 70_600_000, salary: 26_400_000 },
      { label: "5월", revenue: 78_500_000, salary: 27_800_000 },
    ],
    barsCaption: "월별 매출 · 인건비",
  },
};

/** @deprecated Kept for backward compat — new code should use HR_DATA_BY_PERIOD. */
export const HR_DATA = {
  monthlyRevenue: HR_DATA_BY_PERIOD.month.totalRevenue,
  monthlySalaryBudget: HR_DATA_BY_PERIOD.month.salaryBudget,
  monthlySalaryActual: HR_DATA_BY_PERIOD.month.salaryActual,
  salaryRatio: HR_DATA_BY_PERIOD.month.salaryRatio,
  staffList: HR_DATA_BY_PERIOD.month.staffList,
  weeklyData: HR_DATA_BY_PERIOD.month.bars.map((b) => ({ week: b.label, revenue: b.revenue, salary: b.salary })),
};

// ── 재무 & 심층 분석 데이터 (period별) ────────────────────────
// 우측 "재무 & 심층 분석" 패널의 3카드 (노쇼 추이 · 상담 거절 사유 ·
// BEP 달성률) 각각 period별 mock 세트.
//
// 노쇼 추이 x축: today=시간대 / week=요일 / month=주차 / quarter=월
// 거절 사유는 표본이 커야 유의미하므로 today는 rolling 7일값을 표시
// (해설 캡션으로 밝힘).
// BEP: 기간별 목표(고정비 커버) 대비 실제 매출.
type TrendPoint = { label: string; rate: number };
type RejectionRow = { reason: string; count: number; percentage: number };
type BepBlock = { target: number; current: number; achievement: number };

// ── 신규: 3섹션 재구성용 확장 필드 ───────────────────────────────
// 각 카드 데이터 (수익성·유지·리스크·현금 축).
type LtvCacBlock = { current: number; ltv: number; cac: number; payback: number };
type NetProfitBlock = { latest: number; benchmark: number; trend: TrendPoint[] };
type RetentionBlock = { returnRate: number; recallRate: number; preventiveRatio: number };
type CancelRateBlock = { current: number; trend: TrendPoint[] };
type UncollectedBucket = { label: "30일 이내" | "30~60일" | "60~90일" | "90일 초과"; amount: number; collectableRate: number };
type UncollectedBlock = { total: number; buckets: UncollectedBucket[] };
type LaborCrossBlock = { current: number; benchmark: number };  // 순이익/인건비 배수, 인당 순이익

// 통합 처방 shape — dashboard의 KpiPrescription과 정확히 일치.
export type OverallPrescription = {
  analysis: string[];
  solution: string[];
  effect: string[];
  action: string;
};

export type FinancePeriodData = {
  // ── 기존 3카드 ────────────────────────
  noShowLatest: number;
  noShowTrend: TrendPoint[];
  noShowCaption: string;
  rejectionReasons: RejectionRow[];
  rejectionSampleCaption: string;
  bep: BepBlock;
  bepCaption: string;

  // ── 신규 카드 데이터 ──────────────────
  ltvCac: LtvCacBlock;
  netProfit: NetProfitBlock;
  retention: RetentionBlock;
  cancelRate: CancelRateBlock;
  uncollected: UncollectedBlock;
  laborProfitRatio: LaborCrossBlock;  // 순이익 / 인건비 배수 (≥ 1.0 이상 안정기)
  perStaffProfit: LaborCrossBlock;    // 스태프 1인당 창출 순이익 (만 원)

  // ── 통합 진단 (mock 텍스트, 스코어는 runtime 계산) ─
  overallVerdict: string;             // 3축 판정 요약 1~2문장
  rootCauseKpiKey: string;            // upstream count 가장 많은 위기 지표 (mock 확정값)
  rootCauseReason: string;            // 왜 여기부터 손대야 하는지 (연쇄 개선 예시)

  // ── 축별 통합 인사이트 문구 ───────────
  profitabilityInsight: string;
  retentionInsight: string;
  riskInsight: string;

  // ── 통합 AI 처방 (중앙 KpiPrescription 스키마와 동일) ─
  overallPrescription: OverallPrescription;
};

export const FINANCE_DATA_BY_PERIOD: Record<"today" | "week" | "month" | "quarter", FinancePeriodData> = {
  today: {
    noShowLatest: 5.0,
    noShowTrend: [
      { label: "09시", rate: 0 },
      { label: "11시", rate: 8.3 },
      { label: "13시", rate: 6.2 },
      { label: "15시", rate: 5.0 },
      { label: "17시", rate: 5.0 },
    ],
    noShowCaption: "오늘 시간대별 노쇼율",
    rejectionReasons: [
      { reason: "비용 부담", count: 22, percentage: 44 },
      { reason: "타병원 비교", count: 13, percentage: 26 },
      { reason: "기간 부담", count: 10, percentage: 20 },
      { reason: "기타", count: 5, percentage: 10 },
    ],
    rejectionSampleCaption: "최근 7일 rolling 표본 (당일 표본 부족)",
    bep: { target: 1_733_000, current: 3_100_000, achievement: 178.9 },
    bepCaption: "일 고정비 173만 원 대비 오늘 매출",

    ltvCac: { current: 3.5, ltv: 1_380_000, cac: 394_000, payback: 11 },
    netProfit: {
      latest: 21.4, benchmark: 22,
      trend: [
        { label: "09시", rate: 18.5 },
        { label: "11시", rate: 19.8 },
        { label: "13시", rate: 20.6 },
        { label: "15시", rate: 21.0 },
        { label: "17시", rate: 21.4 },
      ],
    },
    retention: { returnRate: 76, recallRate: 63, preventiveRatio: 7.1 },
    cancelRate: {
      current: 6.7,
      trend: [
        { label: "09시", rate: 4.2 },
        { label: "11시", rate: 5.8 },
        { label: "13시", rate: 6.2 },
        { label: "15시", rate: 6.7 },
        { label: "17시", rate: 6.7 },
      ],
    },
    uncollected: {
      total: 992_000,
      buckets: [
        { label: "30일 이내", amount: 620_000, collectableRate: 92 },
        { label: "30~60일", amount: 220_000, collectableRate: 71 },
        { label: "60~90일", amount: 108_000, collectableRate: 44 },
        { label: "90일 초과", amount: 44_000,  collectableRate: 18 },
      ],
    },
    laborProfitRatio: { current: 0.71, benchmark: 1.0 },
    perStaffProfit:   { current: 8, benchmark: 7 },

    overallVerdict:
      "오늘 하루 수익성 성숙 · 유지 정상 · 리스크 관리 진행 중\n(오늘 돈 버는 힘은 안정적이고, 환자들이 다시 오는 것도 잘 되고 있어요. 다만 예약 취소·미수금 같은 돈 새는 곳이 계속 관찰돼 오늘 안에 정리해두면 좋겠습니다.)",
    rootCauseKpiKey: "recallRate",
    rootCauseReason:
      "리콜 성공률 63%가 현재 경고·위기 상태인 환자 LTV·예방·리콜 매출 비중 2개 지표의 상류. 여기부터 손대면 이 2개가 동시에 회복.\n(정기 검진 안내를 받은 환자 10명 중 6~7명만 예약을 잡고 있어요. 이 숫자 하나가 지금 흔들리는 두 가지 문제(환자 1명이 평생 병원에 낼 돈·정기 진료로 벌어들이는 매출 비중)의 뿌리입니다. 여기만 개선해도 두 가지가 함께 좋아져요.)",

    profitabilityInsight:
      "일 매출 310만 · 순이익률 21.4% · LTV:CAC 3.5x · 인당 순이익 8만 원(하루) = 안정기 병원 인당 하루 목표 7만 원을 넘긴 상태 — 오늘 페이스 유지가 관건.\n(오늘 매출 310만 원에서 66만 원(21.4%)이 순이익으로 남았어요. 환자 한 명 유치 비용에 비해 그 환자가 병원에 낼 돈은 3.5배로 정상 구간이고요. 스태프 8명 기준 1인당 오늘 만든 순이익 8만 원은 안정된 병원의 하루 목표(7만 원, 월 200만 원 기준)를 살짝 넘긴 수준입니다. 오늘 이 페이스가 이번 달 내내 유지되어야 월 목표에 다가갈 수 있어요.)",
    retentionInsight:
      "재내원율 76%(최우수) 대비 리콜 성공률 63%(경고)로 gap 13%p. 예방 매출 비중 7.1%는 위기 임계값(12%) 아래로 절반 수준.\n(치료 마친 환자 10명 중 7~8명이 다시 오는 건 최고 수준이에요. 그런데 정기 검진 안내에 반응하는 비율은 63%뿐이라 재방문 좋은 흐름을 놓치고 있어요. 스케일링·검진 매출도 전체의 7.1%밖에 안 돼서, 정기 진료로 안정적으로 벌 수 있는 금액의 절반도 못 챙기고 있는 상태입니다.)",
    riskInsight:
      "노쇼 5.0% + 당일 취소 6.7% + 상담 거절 44% + 미수금 99만 원. 오늘 매출 누수 추정 42만 원 — 리마인드 문자 2건과 미회수 콜 1건으로 즉시 방어 가능.\n(오늘 예약해놓고 안 온 환자 5%, 당일 취소한 환자 6.7%, 상담 후 치료 안 하겠다고 한 환자가 44%, 아직 못 받은 진료비 99만 원이 있어요. 이걸 다 합치면 오늘 하루에만 약 42만 원이 그냥 새어나갔습니다. 예약 전날 문자 2건과 밀린 진료비 전화 1건만으로 대부분 방어 가능해요.)",
    overallPrescription: {
      analysis: [
        "오늘 하루 3축 스코어 — 수익성 67 / 유지 50 / 리스크 60",
        "리콜 성공률 63% 하나가 재내원율·환자 LTV·예방매출·순이익률 4개의 상류",
        "오늘 리콜 도래 환자 5명 중 3명 예약 미확정 · 방치 시 이번 주 자연 이탈",
      ],
      solution: [
        "① 오늘 15시 이전: 리콜 도래 환자 5명 전원에 예약 문자 발송",
        "② 오늘 마감 전: 미수금 99만 원 중 90일 초과 4.4만 원 전화 회수",
        "③ 내일 진료 전: 목요일 오후 초과근무 예방 위해 예약 3건 재배정",
      ],
      effect: [
        "리콜 5명 예약 확정 시 재내원율 4주 뒤 76% → 78% 유지",
        "미수금 회수 콜 1건 = 오늘 확정 매출 4.4만 원 방어",
        "초과근무 재배정 = 인건비 초과분 즉시 차단 · 배수 개선",
      ],
      action: "리콜 문자 5건 · 회수 콜 1건 · 예약 재배정 3건 오늘 즉시 실행",
    },
  },
  week: {
    noShowLatest: 7.4,
    noShowTrend: [
      { label: "월", rate: 5.5 },
      { label: "화", rate: 6.2 },
      { label: "수", rate: 7.1 },
      { label: "목", rate: 8.7 },
      { label: "금", rate: 9.4 },
    ],
    noShowCaption: "이번 주 요일별 노쇼율",
    rejectionReasons: [
      { reason: "비용 부담", count: 26, percentage: 43 },
      { reason: "타병원 비교", count: 17, percentage: 28 },
      { reason: "기간 부담", count: 12, percentage: 20 },
      { reason: "기타", count: 5, percentage: 9 },
    ],
    rejectionSampleCaption: "이번 주 상담 60건 표본",
    bep: { target: 12_133_000, current: 18_600_000, achievement: 153.3 },
    bepCaption: "주 고정비 1,213만 원 대비 이번 주 매출",

    ltvCac: { current: 3.6, ltv: 1_400_000, cac: 389_000, payback: 11 },
    netProfit: {
      latest: 19.2, benchmark: 22,
      trend: [
        { label: "월", rate: 22.4 },
        { label: "화", rate: 20.8 },
        { label: "수", rate: 18.5 },
        { label: "목", rate: 17.9 },
        { label: "금", rate: 19.2 },
      ],
    },
    retention: { returnRate: 75, recallRate: 62, preventiveRatio: 6.5 },
    cancelRate: {
      current: 7.5,
      trend: [
        { label: "월", rate: 5.8 },
        { label: "화", rate: 6.4 },
        { label: "수", rate: 7.0 },
        { label: "목", rate: 8.3 },
        { label: "금", rate: 7.5 },
      ],
    },
    uncollected: {
      total: 6_240_000,
      buckets: [
        { label: "30일 이내", amount: 3_650_000, collectableRate: 89 },
        { label: "30~60일", amount: 1_420_000, collectableRate: 68 },
        { label: "60~90일", amount: 720_000,   collectableRate: 42 },
        { label: "90일 초과", amount: 450_000, collectableRate: 17 },
      ],
    },
    laborProfitRatio: { current: 0.53, benchmark: 1.0 },
    perStaffProfit:   { current: 45, benchmark: 47 },

    overallVerdict:
      "이번 주 수익성 성숙 · 유지 균열 시작 · 리스크 확대 중\n(이번 주 돈 버는 힘은 안정적이지만, 환자들이 다시 오는 흐름이 조금씩 흔들리고 있고 예약 취소·미수금 같은 돈 새는 문제가 커지는 중이에요. 이번 주 안에 리콜 안내와 미수금 회수를 함께 돌리는 게 좋겠습니다.)",
    rootCauseKpiKey: "recallRate",
    rootCauseReason:
      "리콜 성공률 62%(경고)가 현재 흔들리는 환자 LTV·예방·리콜 매출 비중 2개 지표의 상류. 이번 주 리콜 도래 환자 38명에 예약 문자 발송 시 3~4주 뒤 이 2개 지표 동시 회복.\n(이번 주에 정기 검진 예약 안내를 받은 환자 38명 중 62%만 예약을 잡고 있어요. 이 사람들 전원에게 예약 문자를 다시 보내면, 3~4주 뒤부터 환자 1명이 평생 낼 돈·정기 진료 매출 두 가지가 함께 좋아집니다.)",

    profitabilityInsight:
      "주 매출 1,860만 · 순이익률 19.2% · LTV:CAC 3.6x = Unit Economics 정상 구간 유지 중. 인건비 대비 순이익 배수 0.53x — 안정기 목표(1.0x)의 절반이라 확장 투자는 아직 이름.\n(이번 주 매출 1,860만 원 중 순이익이 357만 원(19.2%) 남았고, 환자 유치 비용 대비 그 환자가 낼 돈은 3.6배로 좋은 구조예요. 다만 인건비 1원당 순이익이 53원 수준이라 아직 인건비만큼도 순이익을 못 만들고 있어서, 지금 확장·투자 결정은 이르고 순이익률부터 회복해야 합니다.)",
    retentionInsight:
      "재내원율 75% 대비 리콜 성공률 62% gap 13%p로 재내원 파이프에서 새는 중. 예방 매출 6.5%는 위기 임계값(12%) 아래 — NRR 축 균열 신호.\n(치료 끝난 환자 10명 중 7~8명이 다시 오는 건 좋은데, 정기 검진 안내에 반응하는 건 6명뿐이에요. 즉 다시 올 준비된 환자들 중 상당수를 놓치고 있는 셈입니다. 스케일링·검진 매출도 전체 매출의 6.5%로 위기 구간이라, 안정적으로 매달 벌 수 있는 파이프가 마르는 신호예요.)",
    riskInsight:
      "노쇼 7.4% + 당일 취소 7.5% + 상담 거절 46% + 미수금 624만 원. 이번 주 매출 누수 추정 145만 원 — 리마인드 자동화·분납 옵션·회수 콜로 이 중 90만 원 방어 가능.\n(이번 주에 예약 안 나온 환자 7.4%, 당일 취소 7.5%, 상담 후 치료 안 하겠다고 한 환자가 46%, 아직 못 받은 진료비 624만 원이 있어요. 이걸 합치면 이번 주 매출에서 약 145만 원이 그냥 새어나갔습니다. 예약 자동 문자·치료비 나눠 내기 안내·미수금 회수 전화 세 가지만 시작해도 90만 원은 바로 지킬 수 있어요.)",
    overallPrescription: {
      analysis: [
        "이번 주 3축 스코어 — 수익성 58 / 유지 45 / 리스크 55",
        "리콜 성공률 62%(경고) 방치 시 4주 뒤 재내원율 75% → 68% 하락 예상",
        "이번 주 매출 누수 145만 원 확정 · 다음 주 그대로면 누수 200만 원 초과",
      ],
      solution: [
        "① 오늘: 리콜 도래 환자 38명에 자동 예약 문자 발송 (Tsheet or SMS)",
        "② 이번 주 안: 상담 거절 사례 51건 중 '비용 부담' 26건에 분납 옵션 재제안",
        "③ 이번 주 안: 미수금 60일+ 117만 원 순차 회수 콜 (하루 5건 x 4일)",
      ],
      effect: [
        "리콜 문자 발송 → 3~4주 뒤 재내원율 유지 · 환자 LTV 방어",
        "분납 재제안 20% 성공 시 이번 주 잠재 매출 130만 원 회수",
        "미수금 90만 원 회수 = 이번 주 매출 누수의 60% 방어",
      ],
      action: "리콜 문자 자동 · 분납 재제안 · 회수 콜 병렬 시작",
    },
  },
  month: {
    noShowLatest: 8.7,
    noShowTrend: [
      { label: "1주", rate: 5.5 },
      { label: "2주", rate: 6.8 },
      { label: "3주", rate: 7.9 },
      { label: "4주", rate: 8.7 },
    ],
    noShowCaption: "이번 달 주차별 노쇼율",
    rejectionReasons: [
      { reason: "비용 부담", count: 18, percentage: 42 },
      { reason: "타병원 비교", count: 12, percentage: 28 },
      { reason: "기간 부담", count: 8, percentage: 19 },
      { reason: "기타", count: 5, percentage: 11 },
    ],
    rejectionSampleCaption: "이번 달 상담 43건 표본",
    bep: { target: 52_000_000, current: 78_500_000, achievement: 150.9 },
    bepCaption: "월 고정비 5,200만 원 대비 이번 달 매출",

    ltvCac: { current: 3.7, ltv: 1_410_000, cac: 381_000, payback: 10 },
    netProfit: {
      latest: 17.0, benchmark: 22,
      trend: [
        { label: "1월", rate: 19.2 },
        { label: "2월", rate: 18.5 },
        { label: "3월", rate: 18.1 },
        { label: "4월", rate: 17.4 },
        { label: "5월", rate: 17.0 },
      ],
    },
    retention: { returnRate: 74, recallRate: 61, preventiveRatio: 6.2 },
    cancelRate: {
      current: 8.7,
      trend: [
        { label: "1주", rate: 6.2 },
        { label: "2주", rate: 7.5 },
        { label: "3주", rate: 8.1 },
        { label: "4주", rate: 8.7 },
      ],
    },
    uncollected: {
      total: 36_890_000,
      buckets: [
        { label: "30일 이내", amount: 18_400_000, collectableRate: 88 },
        { label: "30~60일", amount: 9_800_000,  collectableRate: 65 },
        { label: "60~90일", amount: 5_890_000,  collectableRate: 40 },
        { label: "90일 초과", amount: 2_800_000, collectableRate: 15 },
      ],
    },
    laborProfitRatio: { current: 0.48, benchmark: 1.0 },
    perStaffProfit:   { current: 167, benchmark: 200 },

    overallVerdict:
      "이번 달 수익성 성숙 · 유지 균열 · 리스크 확대 (3축 불균형)\n(이번 달 돈 버는 힘은 안정적인데, 환자들이 다시 오는 흐름이 무너지고 있고 예약 취소·미수금 같은 돈 새는 문제가 커졌어요. 세 축이 균형을 잃은 상태라 지금 손보지 않으면 다음 달부터 매출도 흔들립니다.)",
    rootCauseKpiKey: "recallRate",
    rootCauseReason:
      "리콜 성공률 61%(경고)가 현재 흔들리는 환자 LTV·예방·리콜 매출 비중 2개 지표의 상류. 스케일링 리콜 캠페인 4주 집행 시 이 2개 지표 동시 회복 예상.\n(정기 검진 안내를 받은 환자 10명 중 6명만 예약을 잡고 있는데, 이 숫자 하나가 지금 흔들리는 두 가지(환자 1명이 평생 낼 돈·정기 진료로 벌어들이는 매출 비중)의 뿌리예요. 스케일링·검진 안내 문자 캠페인을 4주만 돌려도 이 두 가지가 한꺼번에 좋아집니다.)",

    profitabilityInsight:
      "월 매출 7,850만 · 순이익률 17.0%(연차 대비 -5%p) · LTV:CAC 3.7x · BEP 약 20일. Unit Economics 정상이나 순이익률 하락 추세 — 리콜/재내원 회복 없으면 다음 분기 15%대까지 후퇴 우려.\n(이번 달 매출 7,850만 원 중 순이익이 1,335만 원(17.0%) 남았어요. 안정된 병원 목표는 22%인데 5%p 낮은 상태이고, 3개월 연속 떨어지는 중입니다. 다행히 환자 유치 비용 대비 그 환자가 낼 돈은 3.7배로 좋은 구조이지만, 월 20일이 되어서야 그달 모든 비용을 커버해서 남은 10일만 순수 이익 구간이에요. 재방문·리콜 회복 없으면 다음 분기 순이익률이 15%대까지 밀릴 수 있습니다.)",
    retentionInsight:
      "재내원율 74%(최우수) 지지대 위에 리콜 성공률 61%·예방 매출 6.2%(위기) 두 축 흔들림. NRR 관점에서는 기존 환자의 재구매 파이프가 4주 안에 멈출 리스크.\n(치료 마친 환자 10명 중 7~8명이 다시 오는 건 최고 수준인데, 정기 검진 안내에 반응하는 비율은 61%뿐이고 스케일링·검진 매출도 전체의 6.2%밖에 안 됩니다. 즉 지금 재방문 흐름이 좋아도 4주 안에 새로운 흐름이 안 만들어지면 파이프가 마르기 시작해요. 기존 환자에게 정기 검진 안내를 훨씬 더 자주 보내는 게 급합니다.)",
    riskInsight:
      "노쇼 8.7% + 당일 취소 8.7% + 상담 거절 48% + 미수금 3,689만 원. 이번 달 매출 누수 720만 원 확정 — 리마인드 자동화 + 분납 옵션 + 회수 콜 세 액션으로 480만 원 즉시 방어.\n(이번 달 예약해놓고 안 온 환자 8.7%, 당일 취소도 8.7%, 상담 후 치료 안 하겠다고 한 환자가 48%, 아직 못 받은 진료비가 3,689만 원 있어요. 이걸 다 합치면 이번 달에만 720만 원이 그냥 새어나갔습니다. 예약 전날 자동 문자·치료비 나눠 내기 안내·미수금 회수 전화 세 가지만 시작해도 이 중 480만 원은 바로 지킬 수 있어요.)",
    overallPrescription: {
      analysis: [
        "이번 달 3축 스코어 — 수익성 58 / 유지 45 / 리스크 55 (유지·리스크 경고 진입)",
        "리콜 성공률 61% 원인으로 재내원율·환자 LTV·예방매출·순이익률·마케팅ROI 5개 동시 하락",
        "이번 달 매출 누수 720만 원 확정 · 방치 시 다음 달 순이익률 15%대 후퇴",
      ],
      solution: [
        "① 이번 주: 스케일링 리콜 캠페인 시작 (도래 환자 전원 자동 예약 문자)",
        "② 이번 달 안: 상담 거절 48% 중 '비용 부담' 42% 대상 분납 옵션 표준 도입",
        "③ 이번 달 안: 미수금 60~90일 589만 원 순차 회수 (하루 5건 · 4주)",
      ],
      effect: [
        "리콜 성공률 61% → 70% 회복 → 재내원율 78%·환자 LTV 165만·예방매출 8%p 상승",
        "분납 도입 20% 성공 = 이번 달 잠재 매출 420만 원 회수 · 상담 동의율 62%로 회복",
        "미수금 회수 480만 원 = 이번 달 매출 누수의 67% 방어",
      ],
      action: "리콜 캠페인 · 분납 표준화 · 회수 콜 3면 동시 실행",
    },
  },
  quarter: {
    noShowLatest: 6.7,
    noShowTrend: [
      { label: "3월", rate: 5.1 },
      { label: "4월", rate: 6.3 },
      { label: "5월", rate: 8.7 },
    ],
    noShowCaption: "이번 분기 월별 노쇼율",
    rejectionReasons: [
      { reason: "비용 부담", count: 56, percentage: 41 },
      { reason: "타병원 비교", count: 38, percentage: 28 },
      { reason: "기간 부담", count: 28, percentage: 21 },
      { reason: "기타", count: 14, percentage: 10 },
    ],
    rejectionSampleCaption: "분기 상담 136건 표본",
    bep: { target: 156_000_000, current: 218_500_000, achievement: 140.1 },
    bepCaption: "분기 고정비 1억 5,600만 원 대비 분기 매출",

    ltvCac: { current: 3.9, ltv: 1_430_000, cac: 367_000, payback: 9 },
    netProfit: {
      latest: 16.3, benchmark: 22,
      trend: [
        { label: "3월", rate: 18.1 },
        { label: "4월", rate: 17.0 },
        { label: "5월", rate: 16.3 },
      ],
    },
    retention: { returnRate: 72, recallRate: 58, preventiveRatio: 5.9 },
    cancelRate: {
      current: 7.8,
      trend: [
        { label: "3월", rate: 6.5 },
        { label: "4월", rate: 7.2 },
        { label: "5월", rate: 8.7 },
      ],
    },
    uncollected: {
      total: 102_640_000,
      buckets: [
        { label: "30일 이내", amount: 42_800_000, collectableRate: 87 },
        { label: "30~60일", amount: 31_200_000, collectableRate: 62 },
        { label: "60~90일", amount: 19_800_000, collectableRate: 38 },
        { label: "90일 초과", amount: 8_840_000,  collectableRate: 14 },
      ],
    },
    laborProfitRatio: { current: 0.46, benchmark: 1.0 },
    perStaffProfit:   { current: 445, benchmark: 600 },

    overallVerdict:
      "이번 분기 수익성 성숙 · 유지 위기 진입 · 리스크 확대 (구조 조정 필요)\n(이번 분기 돈 버는 힘은 아직 안정적이지만, 환자 재방문 흐름이 이미 위기 구간에 들어갔고 예약 취소·미수금 문제도 확대됐어요. 분기 단위로 구조를 다시 짜지 않으면 다음 분기 매출과 순이익 모두 하락합니다.)",
    rootCauseKpiKey: "recallRate",
    rootCauseReason:
      "리콜 성공률 58%(위기 진입)가 환자 LTV·예방·리콜 매출 비중 2개 지표를 동시에 끌어내리는 중. 분기 리콜 파이프라인 재설계 없이는 다음 분기 LTV·예방 매출 추가 하락 확실.\n(정기 검진 안내를 받은 환자 10명 중 5.8명만 예약을 잡고 있는데, 이 숫자 하나가 환자 1명이 평생 낼 돈과 정기 진료로 벌어들이는 매출 두 가지를 동시에 끌어내리고 있어요. 분기 단위로 정기 검진 안내 방식(문자 시점·문구·담당자 지정)을 다시 짜지 않으면 다음 분기 이 두 지표가 확정적으로 더 떨어집니다.)",

    profitabilityInsight:
      "분기 매출 2억 1,850만 · 순이익률 16.3%(3개월 연속 하락) · LTV:CAC 3.9x. 인당 분기 순이익 445만 원은 안정기 벤치마크(월 200만 원 × 3 = 600만 원) 대비 74% 수준 — 유지 축 개선이 다음 분기 수익성 유지의 유일한 지렛대.\n(분기 매출 2억 1,850만 원 중 순이익이 16.3%로 남았는데, 3개월 연속 떨어지고 있어요. 환자 유치 비용 대비 그 환자가 낼 돈은 3.9배로 여전히 좋은 구조이고, 스태프 8명 기준 1인당 분기 순이익 445만 원은 안정된 병원 목표(월 200만 × 3개월 = 600만)에 아직 못 미치는 상태입니다. 지금 구조는 좋지만 뒷심이 약해지고 있어서, 다시 오는 환자·정기 검진 파이프를 회복하는 것 외에는 순이익률을 되돌릴 방법이 없어요.)",
    retentionInsight:
      "재내원율 72%·리콜 성공률 58%(위기)·예방 매출 5.9%(위기) — NRR 3지표 중 2개가 위기. 신환 유치보다 5배 저비용인 유지 파이프가 무너지는 중이라 분기 재설계 시급.\n(치료 마친 환자 재방문율 72%, 정기 검진 예약 성공률 58%, 스케일링·검진 매출 비중 5.9%예요. 환자 유지 관련 3가지 지표 중 2가지가 이미 위기 구간이라, 새 환자를 광고로 데려오는 것보다 5배 저렴한 '기존 환자 유지' 파이프가 무너지는 중입니다. 분기 안에 정기 검진 안내 시스템 자체를 다시 설계해야 해요.)",
    riskInsight:
      "노쇼 6.7%(개선) + 당일 취소 7.8% + 상담 거절 49% + 미수금 1억 264만 원. 90일 초과 미수금 884만 원은 회수 확률 14%로 사실상 손실 확정 — 이번 분기 안에 회수 아니면 대손 처리 검토.\n(이번 분기 예약해놓고 안 온 환자 비율은 6.7%로 조금 좋아졌지만, 당일 취소 7.8%·상담 거절 49%는 여전하고 아직 못 받은 진료비가 무려 1억 264만 원 쌓였어요. 그중 90일 넘게 방치된 884만 원은 회수 확률이 14%라 사실상 못 받는 돈이 됐습니다. 분기 마감 전에 못 받으면 회계상 '못 받는 돈'으로 정리(대손)해서 재무제표를 깨끗이 하는 걸 검토해야 해요.)",
    overallPrescription: {
      analysis: [
        "이번 분기 3축 스코어 — 수익성 58 / 유지 35 / 리스크 55 (유지 위기 진입)",
        "리콜 성공률 58%(위기) 3개월 연속 하락 · 재내원율·예방매출 동반 감소",
        "분기 매출 2억 1,850만 유지하고 있으나 순이익률 16.3%로 3개월 연속 하락 추세",
      ],
      solution: [
        "① 이번 주: 분기 리콜 파이프라인 전면 재설계 (담당 지정 · KPI 주간 리뷰)",
        "② 다음 달: 예방 패키지 상품 정식 도입 (스케일링+X-ray+구강검사 세트)",
        "③ 분기 안: 90일 초과 미수금 884만 원 회수/대손 결단 · 재무 클린업",
      ],
      effect: [
        "리콜 재설계 시 다음 분기 재내원율 72% → 76% · 순이익률 반등 예상",
        "예방 패키지 도입 시 예방 매출 비중 5.9% → 12% 4주 안에 진입",
        "미수금 대손 처리 시 재무제표 정리 · 신규 미수 방지 정책 병행",
      ],
      action: "리콜 재설계 · 예방 패키지 · 미수 정리 3면 착수",
    },
  },
};

/** @deprecated Kept for backward compat — new code should use FINANCE_DATA_BY_PERIOD. */
export const FINANCE_DATA = {
  noShowTrend: FINANCE_DATA_BY_PERIOD.month.noShowTrend.map((p) => ({ month: p.label, rate: p.rate })),
  consultFailRate: [
    { month: "1월", rate: 32 },
    { month: "2월", rate: 28 },
    { month: "3월", rate: 35 },
    { month: "4월", rate: 42 },
    { month: "5월", rate: 48 },
  ],
  rejectionReasons: FINANCE_DATA_BY_PERIOD.month.rejectionReasons,
  bep: {
    monthly: FINANCE_DATA_BY_PERIOD.month.bep.target,
    current: FINANCE_DATA_BY_PERIOD.month.bep.current,
    achievement: FINANCE_DATA_BY_PERIOD.month.bep.achievement,
  },
};

export const PRESCRIPTIONS: Record<string, {
  status: "normal" | "warning" | "critical";
  conclusion: string;
  tags: string[];
  briefing: string;
  chartData: { time: string; waitMin: number; consultRate: number }[];
  simulation: { chairRate: { before: number; after: number }; defense: number; staffRisk: string };
}> = {
  today: {
    status: "warning",
    conclusion: "목요일 오후 예약을 수요일 오전으로 분산하면 이번 달 420만 원이 방어됩니다.",
    tags: ["목요일 피로도 최대", "체어 과포화 120%", "예상 누수 420만 원"],
    briefing: "오늘 목요일 오후 시간대에 체어 가동률이 120%를 초과하며 스태프 피로도가 임계치에 도달했습니다. 평균 환자 대기시간이 35분으로 상담 동의율이 18% 하락할 위험이 있습니다. 수요일 오전 슬롯으로 6명을 분산하면 피로도와 매출을 동시에 방어할 수 있습니다.",
    chartData: [
      { time: "09:00", waitMin: 8, consultRate: 72 },
      { time: "11:00", waitMin: 12, consultRate: 68 },
      { time: "13:00", waitMin: 15, consultRate: 65 },
      { time: "15:00", waitMin: 28, consultRate: 54 },
      { time: "17:00", waitMin: 35, consultRate: 48 },
    ],
    simulation: { chairRate: { before: 55, after: 80 }, defense: 4200000, staffRisk: "안정" },
  },
  week: {
    status: "warning",
    conclusion: "이번 주 노쇼율이 8.7%로 급등, 목요일 리마인드 문자 자동 발송 시 주 210만 원 회수 가능합니다.",
    tags: ["노쇼율 급등 +4.5%", "목요일 위험", "회수 가능 210만 원"],
    briefing: "이번 주 노쇼율이 전월 대비 4.5% 상승하며 급등세를 보이고 있습니다. 특히 목요일 오후 슬롯의 노쇼가 집중되어 있습니다. 예약 24시간 전 자동 리마인드 문자 발송 시스템을 활성화하면 노쇼율을 3% 이하로 낮출 수 있습니다.",
    chartData: [
      { time: "월", waitMin: 10, consultRate: 68 },
      { time: "화", waitMin: 14, consultRate: 65 },
      { time: "수", waitMin: 9, consultRate: 72 },
      { time: "목", waitMin: 32, consultRate: 48 },
      { time: "금", waitMin: 18, consultRate: 62 },
    ],
    simulation: { chairRate: { before: 62, after: 82 }, defense: 2100000, staffRisk: "주의" },
  },
  month: {
    status: "warning",
    conclusion: "이번 달 인건비가 예산 대비 15.8% 초과, 스케줄 최적화로 78만 원 즉시 절감 가능합니다.",
    tags: ["인건비 초과 15.8%", "초과근무 위험 3명", "절감 가능 78만 원"],
    briefing: "5월 총 인건비가 2,780만 원으로 예산 2,400만 원 대비 380만 원을 초과했습니다. 초과근무가 집중된 목요일 스케줄을 분산하면 연장근로 수당을 78만 원 절감할 수 있습니다. 추가로 최하늘 위생사의 연속 7일 근무로 번아웃 위험이 임박했습니다.",
    chartData: [
      { time: "1주", waitMin: 12, consultRate: 70 },
      { time: "2주", waitMin: 15, consultRate: 66 },
      { time: "3주", waitMin: 22, consultRate: 58 },
      { time: "4주", waitMin: 28, consultRate: 52 },
    ],
    simulation: { chairRate: { before: 58, after: 78 }, defense: 780000, staffRisk: "안정" },
  },
  quarter: {
    status: "critical",
    conclusion: "2분기 임플란트 상담 성공률 52%, 대기시간 단축 시 분기 2,100만 원 추가 매출 창출 가능합니다.",
    tags: ["상담성공률 52%↓", "대기시간 임계치 초과", "잠재 매출 2,100만 원"],
    briefing: "2분기 비급여 상담 성공률이 52%로 목표 70% 대비 크게 낮습니다. 분석 결과 환자 대기시간 15분 초과 시 상담 동의율이 22% 하락하는 강한 상관관계가 확인됐습니다. 체어 배분 최적화를 통해 평균 대기시간을 12분 이하로 줄이면 분기 2,100만 원의 추가 매출이 가능합니다.",
    chartData: [
      { time: "4월 1주", waitMin: 18, consultRate: 64 },
      { time: "4월 3주", waitMin: 22, consultRate: 58 },
      { time: "5월 1주", waitMin: 28, consultRate: 52 },
      { time: "5월 3주", waitMin: 35, consultRate: 45 },
    ],
    simulation: { chairRate: { before: 48, after: 75 }, defense: 21000000, staffRisk: "안정" },
  },
};

export const KPI_BENCHMARKS = {
  source: "건강보험심사평가원 「의료자원통계핸드북」2025 · 대한치과의사협회 「치과의료통계연보」2024 · 국민건강보험공단 「진료비 통계」2024 · ADA Health Policy Institute「The Dental Practice Report」2024 · Levin Group「2024 Dental Practice Benchmark Study」",
  top3: [
    {
      rank: 1, id: "laborCost", name: "인건비 비율", unit: "%",
      current: 35.4, benchmark: 25, direction: "lower" as const,
      benchmarkLabel: "≤ 25%", impact: "이달 초과 인건비 380만 원 확정 손실 — 지금 차단 가능",
    },
    {
      rank: 2, id: "noShow", name: "노쇼율", unit: "%",
      current: 8.7, benchmark: 4, direction: "lower" as const,
      benchmarkLabel: "≤ 4%", impact: "이달 노쇼 누적 손실 840만 원 — 리마인드 문자로 즉시 차단",
    },
    {
      rank: 3, id: "caseAcceptance", name: "상담 동의율", unit: "%",
      current: 52, benchmark: 70, direction: "higher" as const,
      benchmarkLabel: "≥ 70%", impact: "분기 잠재 매출 2,100만 원 묶여 있음 — 분납 옵션으로 즉시 전환",
    },
  ],
  // 방법론 (v0.4 정정): Unit Economics · Lean Healthcare/TPS · Value-Based Care · Theory of Constraints · 유지 경제학
  // judgeType: ABS(절대 임계값) · REL(연차/규모 대비 추세) · DERIVED(파생 지표 — 원인 KPI로 안내 우선)
  all20: [
    {
      id: 1, key: "monthlyRevenue", name: "월 매출", unit: "만 원",
      benchmark: "연차·체어수 대비 추세", current: "7,850만 원", status: "normal" as const,
      judgeType: "REL" as const, relBasis: "tenure" as const, isResultMetric: false,
      upstreamKpiKeys: ["chairUtil", "appointmentRate", "cancelRate"],
    },
    {
      id: 2, key: "patientLtv", name: "환자 LTV", unit: "만 원",
      benchmark: "추세 판정 (DERIVED)", current: "141만 원", status: "warning" as const,
      judgeType: "DERIVED" as const, isResultMetric: true,
      upstreamKpiKeys: ["returnRate", "recallRate", "treatComplete"],
      formula: "객단가 × 연 내원수 × 유지연수",
    },
    {
      id: 3, key: "ltvCac", name: "LTV:CAC 비율", unit: "x",
      benchmark: "3~5x 정상 / <2x 위기 / >5x 점검", current: "3.7x", status: "normal" as const,
      judgeType: "DERIVED" as const, isResultMetric: true,
      optimalRange: { min: 3, max: 5 },
      upstreamKpiKeys: ["patientLtv", "recallRate"],
      formula: "LTV / CAC",
    },
    {
      id: 4, key: "chairUtil", name: "체어 가동률", unit: "%",
      benchmark: "70~85% 최적 / >90% 과부하 경고", current: "78%", status: "normal" as const,
      judgeType: "REL" as const, optimalRange: { min: 70, max: 85 }, isResultMetric: false,
    },
    {
      id: 5, key: "appointmentRate", name: "예약 충족률", unit: "%",
      benchmark: "의원 목표 회전 대비 추세", current: "88%", status: "warning" as const,
      judgeType: "REL" as const, isResultMetric: false,
    },
    {
      id: 6, key: "cancelRate", name: "당일 취소율", unit: "%",
      benchmark: "≤3% 우수 / 3~5% 경고 / >5% 위기", current: "8.7%", status: "crisis" as const,
      judgeType: "ABS" as const, thresholds: { crisis: 5, warning: 3, lowerIsBetter: true }, isResultMetric: false,
    },
    {
      id: 7, key: "uncollected", name: "미수금 비율", unit: "%",
      benchmark: "<1.5% 우수 / 1.5~3% 경고 / >3% 위기", current: "4.7%", status: "crisis" as const,
      judgeType: "ABS" as const, thresholds: { crisis: 3, warning: 1.5, lowerIsBetter: true }, isResultMetric: false,
    },
    {
      id: 8, key: "newPatients", name: "신환 내원", unit: "명/월",
      benchmark: "신환 비중 15~25% + 재내원 동반상승", current: "22명 (12%)", status: "warning" as const,
      judgeType: "REL" as const, optimalRange: { min: 15, max: 25 }, isResultMetric: false,
    },
    {
      id: 9, key: "returnRate", name: "재내원율", unit: "%",
      benchmark: "<40% 위기 / 55~70% 정상 / >70% 우수", current: "74%", status: "best" as const,
      judgeType: "REL" as const, optimalRange: { min: 55, max: 100 }, isResultMetric: false,
      upstreamKpiKeys: ["recallRate", "treatComplete"],
    },
    {
      id: 10, key: "recallRate", name: "리콜 성공률", unit: "%",
      benchmark: "도래 환자 중 재방문율, 추세 판정", current: "61%", status: "warning" as const,
      judgeType: "REL" as const, isResultMetric: false,
    },
    {
      id: 11, key: "treatComplete", name: "진료 완료율", unit: "%",
      benchmark: ">75% 정상 / <60% 위기", current: "74%", status: "warning" as const,
      judgeType: "ABS" as const, thresholds: { crisis: 60, warning: 75, lowerIsBetter: false }, isResultMetric: false,
    },
    {
      id: 12, key: "staffTurnover", name: "스태프 이직률", unit: "%/년",
      benchmark: ">15% 경고 / >25% 위기 (소규모 절대 건수 보조)", current: "12%", status: "normal" as const,
      judgeType: "REL" as const, isResultMetric: false,
    },
    {
      id: 13, key: "staffProductivity", name: "스태프 생산성", unit: "만 원/인",
      benchmark: "인당 매출, 의원 규모 대비", current: "981만 원/인", status: "normal" as const,
      judgeType: "REL" as const, relBasis: "staff" as const, isResultMetric: false,
    },
    {
      id: 14, key: "materialCost", name: "재료비 비율", unit: "%",
      benchmark: "<20% 정상 / >25% 위기 (믹스 반영)", current: "2.7%", status: "best" as const,
      judgeType: "ABS" as const, thresholds: { crisis: 25, warning: 20, lowerIsBetter: true }, isResultMetric: false,
    },
    {
      id: 15, key: "labFee", name: "기공료 비율", unit: "%",
      benchmark: "<12% 정상 / >15% 경고 (보철매출 대비)", current: "2.1%", status: "best" as const,
      judgeType: "ABS" as const, thresholds: { crisis: 15, warning: 12, lowerIsBetter: true }, isResultMetric: false,
    },
    {
      id: 16, key: "netProfit", name: "월 순이익률", unit: "%",
      benchmark: "연차 구간 대비 (신규 10% / 안정기 20~25%)", current: "17.0%", status: "warning" as const,
      judgeType: "REL" as const, relBasis: "tenure" as const, isResultMetric: false,
    },
    {
      id: 17, key: "hourlyProd", name: "시간당 생산성", unit: "만 원/h",
      benchmark: "시간당 생산성 ÷ 시간당 고정비 ≥ 2배", current: "31.2만 원/h", status: "crisis" as const,
      judgeType: "REL" as const, isResultMetric: false,
    },
    {
      id: 18, key: "nps", name: "환자 NPS", unit: "점",
      benchmark: "추세·분포 판정 / 하락 시 경고 트리거", current: "51점 (추세↑)", status: "warning" as const,
      judgeType: "REL" as const, relBasis: "trend" as const, isResultMetric: false,
    },
    {
      id: 19, key: "marketingROI", name: "마케팅 ROI", unit: "%",
      benchmark: "LTV:CAC와 동일 산식 (ID 3 일치)", current: "540%", status: "normal" as const,
      judgeType: "DERIVED" as const, isResultMetric: true,
      upstreamKpiKeys: ["patientLtv", "recallRate"],
      formula: "마케팅 채널 LTV / 채널 CAC",
    },
    {
      id: 20, key: "preventiveRecall", name: "예방·리콜 매출 비중", unit: "%",
      benchmark: "<12% 위기 / ≥18~20% 건강", current: "6.2%", status: "crisis" as const,
      judgeType: "REL" as const, isResultMetric: false,
      upstreamKpiKeys: ["recallRate", "returnRate"],
    },
  ],
};

// ── 20개 KPI 스냅샷 (period별) ─────────────────────────────────
// KPI_BENCHMARKS.all20 / top3는 canonical 참조 세트 (이번 달 값 기준).
// 설정·도움말 페이지의 지표 사전은 canonical을 그대로 사용한다.
// 대시보드는 아래 스냅샷을 period로 lookup해 current/status만 덮어써
// 4개 기간 뷰를 만든다. 스냅샷 id는 KPI_BENCHMARKS.all20의 id와 매칭.
type KpiStatus = "crisis" | "warning" | "normal" | "best";
type PeriodKey = "today" | "week" | "month" | "quarter";
export type Kpi20Snapshot = { id: number; current: string; status: KpiStatus };
export type KpiTop3Snapshot = { id: string; current: number };

// 위기 카드에 등장하는 EXTRA_CRISIS_KPIS (당일 취소율·미수금)의
// 수치만 period로 갈아끼우는 룩업. all20 스냅샷의 id 6/7과 값이
// 동일하지만 numeric으로 필요해 별도 dict.
export const KPI_EXTRA_CRISIS_BY_PERIOD: Record<PeriodKey, Record<string, number>> = {
  today:   { cancelRate: 6.7, uncollected: 3.2 },
  week:    { cancelRate: 7.5, uncollected: 4.1 },
  month:   { cancelRate: 8.7, uncollected: 4.7 },
  quarter: { cancelRate: 7.8, uncollected: 4.3 },
};

export const KPI_TOP3_BY_PERIOD: Record<PeriodKey, KpiTop3Snapshot[]> = {
  today: [
    { id: "laborCost",      current: 30.0 },
    { id: "noShow",         current: 5.0 },
    { id: "caseAcceptance", current: 56 },
  ],
  week: [
    { id: "laborCost",      current: 36.1 },
    { id: "noShow",         current: 7.4 },
    { id: "caseAcceptance", current: 54 },
  ],
  month: [
    { id: "laborCost",      current: 35.4 },
    { id: "noShow",         current: 8.7 },
    { id: "caseAcceptance", current: 52 },
  ],
  quarter: [
    { id: "laborCost",      current: 35.8 },
    { id: "noShow",         current: 6.7 },
    { id: "caseAcceptance", current: 51 },
  ],
};

// 값 근거: 비율 지표는 period가 짧을수록 표본 노이즈 큼 (오늘 값이 극단).
// 절대 지표(매출·인당생산성 등)는 기간 길이에 스케일. status는 canonical
// 판정 로직 재적용 결과 — 임계값 통과 여부에 따라 today/quarter에서 몇
// 개 지표의 등급이 실제로 바뀐다 (예: 미수금 today=warning, 나머지=crisis;
// 리콜 quarter=crisis, 나머지=warning; 순이익률 today=normal, 나머지=warning;
// 진료 완료율 today=normal, 나머지=warning).
export const KPI_ALL20_BY_PERIOD: Record<PeriodKey, Kpi20Snapshot[]> = {
  today: [
    { id: 1,  current: "310만 원",       status: "normal" },
    { id: 2,  current: "138만 원",       status: "warning" },
    { id: 3,  current: "3.5x",          status: "normal" },
    { id: 4,  current: "82%",           status: "normal" },
    { id: 5,  current: "92%",           status: "warning" },
    { id: 6,  current: "6.7%",          status: "crisis" },
    { id: 7,  current: "3.2%",          status: "warning" },
    { id: 8,  current: "2명 (13%)",     status: "warning" },
    { id: 9,  current: "76%",           status: "best" },
    { id: 10, current: "63%",           status: "warning" },
    { id: 11, current: "78%",           status: "normal" },
    { id: 12, current: "12%",           status: "normal" },
    { id: 13, current: "39만 원/인",     status: "normal" },
    { id: 14, current: "2.5%",          status: "best" },
    { id: 15, current: "1.9%",          status: "best" },
    { id: 16, current: "21.4%",         status: "normal" },
    { id: 17, current: "34.8만 원/h",    status: "crisis" },
    { id: 18, current: "53점 (추세↑)",  status: "warning" },
    { id: 19, current: "570%",          status: "normal" },
    { id: 20, current: "7.1%",          status: "crisis" },
  ],
  week: [
    { id: 1,  current: "1,860만 원",     status: "normal" },
    { id: 2,  current: "140만 원",       status: "warning" },
    { id: 3,  current: "3.6x",          status: "normal" },
    { id: 4,  current: "79%",           status: "normal" },
    { id: 5,  current: "90%",           status: "warning" },
    { id: 6,  current: "7.5%",          status: "crisis" },
    { id: 7,  current: "4.1%",          status: "crisis" },
    { id: 8,  current: "8명 (11%)",     status: "warning" },
    { id: 9,  current: "75%",           status: "best" },
    { id: 10, current: "62%",           status: "warning" },
    { id: 11, current: "76%",           status: "warning" },
    { id: 12, current: "12%",           status: "normal" },
    { id: 13, current: "233만 원/인",    status: "normal" },
    { id: 14, current: "2.6%",          status: "best" },
    { id: 15, current: "2.0%",          status: "best" },
    { id: 16, current: "19.2%",         status: "warning" },
    { id: 17, current: "32.1만 원/h",    status: "crisis" },
    { id: 18, current: "52점 (추세↑)",  status: "warning" },
    { id: 19, current: "550%",          status: "normal" },
    { id: 20, current: "6.5%",          status: "crisis" },
  ],
  month: [
    { id: 1,  current: "7,850만 원",     status: "normal" },
    { id: 2,  current: "141만 원",       status: "warning" },
    { id: 3,  current: "3.7x",          status: "normal" },
    { id: 4,  current: "78%",           status: "normal" },
    { id: 5,  current: "88%",           status: "warning" },
    { id: 6,  current: "8.7%",          status: "crisis" },
    { id: 7,  current: "4.7%",          status: "crisis" },
    { id: 8,  current: "22명 (12%)",    status: "warning" },
    { id: 9,  current: "74%",           status: "best" },
    { id: 10, current: "61%",           status: "warning" },
    { id: 11, current: "74%",           status: "warning" },
    { id: 12, current: "12%",           status: "normal" },
    { id: 13, current: "981만 원/인",    status: "normal" },
    { id: 14, current: "2.7%",          status: "best" },
    { id: 15, current: "2.1%",          status: "best" },
    { id: 16, current: "17.0%",         status: "warning" },
    { id: 17, current: "31.2만 원/h",    status: "crisis" },
    { id: 18, current: "51점 (추세↑)",  status: "warning" },
    { id: 19, current: "540%",          status: "normal" },
    { id: 20, current: "6.2%",          status: "crisis" },
  ],
  quarter: [
    { id: 1,  current: "2억 1,850만 원", status: "normal" },
    { id: 2,  current: "143만 원",       status: "warning" },
    { id: 3,  current: "3.9x",          status: "normal" },
    { id: 4,  current: "76%",           status: "normal" },
    { id: 5,  current: "87%",           status: "warning" },
    { id: 6,  current: "7.8%",          status: "crisis" },
    { id: 7,  current: "4.3%",          status: "crisis" },
    { id: 8,  current: "61명 (12%)",    status: "warning" },
    { id: 9,  current: "72%",           status: "best" },
    { id: 10, current: "58%",           status: "crisis" },
    { id: 11, current: "73%",           status: "warning" },
    { id: 12, current: "12%",           status: "normal" },
    { id: 13, current: "2,731만 원/인",  status: "normal" },
    { id: 14, current: "2.8%",          status: "best" },
    { id: 15, current: "2.3%",          status: "best" },
    { id: 16, current: "16.3%",         status: "warning" },
    { id: 17, current: "29.5만 원/h",    status: "crisis" },
    { id: 18, current: "49점 (추세↑)",  status: "warning" },
    { id: 19, current: "520%",          status: "normal" },
    { id: 20, current: "5.9%",          status: "crisis" },
  ],
};

export const TREATMENT_MIX = {
  month: "2026-05",
  total: 78500000,
  items: [
    { category: "임플란트", code: "IMP", revenue: 32000000, ratio: 40.8, cases: 18 },
    { category: "교정", code: "ORT", revenue: 18500000, ratio: 23.6, cases: 9 },
    { category: "보철 (크라운·브릿지)", code: "PRO", revenue: 12800000, ratio: 16.3, cases: 34 },
    { category: "보존 (충치·근관)", code: "CON", revenue: 8200000, ratio: 10.4, cases: 62 },
    { category: "예방·스케일링", code: "PRE", revenue: 4100000, ratio: 5.2, cases: 48 },
    { category: "기타", code: "ETC", revenue: 2900000, ratio: 3.7, cases: 21 },
  ],
};

export const UNCOLLECTED_DATA = {
  month: "2026-05",
  totalBilled: 78500000,
  totalCollected: 74800000,
  uncollectedAmount: 3700000,
  uncollectedRatio: 4.7,
  items: [
    { patientId: "P0312", amount: 1200000, daysPending: 42, reason: "분납 약정" },
    { patientId: "P0455", amount: 800000, daysPending: 28, reason: "카드 오류" },
    { patientId: "P0501", amount: 950000, daysPending: 15, reason: "보험 청구 대기" },
    { patientId: "P0622", amount: 750000, daysPending: 7, reason: "분납 약정" },
  ],
};

export const MARKETING_DATA = {
  month: "2026-05",
  totalSpend: 1720000,
  channels: [
    { channel: "네이버 플레이스 광고", spend: 800000, newPatients: 14, revenue: 5600000, roi: 600 },
    { channel: "인스타그램·메타", spend: 500000, newPatients: 6, revenue: 2400000, roi: 380 },
    { channel: "블로그 포스팅", spend: 300000, newPatients: 5, revenue: 1800000, roi: 500 },
    { channel: "카카오 알림톡", spend: 120000, newPatients: 3, revenue: 1200000, roi: 900 },
  ],
  totalNewPatientsFromMarketing: 28,
  totalRevenueFromMarketing: 11000000,
  overallRoi: 540,
};

export const ONLINE_REVIEWS = {
  naver: { score: 4.7, reviewCount: 312, recentTrend: "상승", keywords: ["친절", "깨끗", "빠른 진료", "설명 자세"] },
  google: { score: 4.5, reviewCount: 89, recentTrend: "유지", keywords: ["professional", "clean", "friendly"] },
  monthlyNewReviews: 18,
  sentimentPositive: 82,
  sentimentNeutral: 13,
  sentimentNegative: 5,
};

export const NPS_DATA = {
  month: "2026-05",
  surveySent: 145,
  surveyResponded: 62,
  responseRate: 42.8,
  promoters: 38,
  passives: 17,
  detractors: 7,
  npsScore: 50,
  trend: [
    { month: "1월", score: 42 },
    { month: "2월", score: 45 },
    { month: "3월", score: 41 },
    { month: "4월", score: 48 },
    { month: "5월", score: 50 },
  ],
};

export const FIXED_COST_DETAIL = {
  month: "2026-05",
  items: [
    { category: "임대료+관리비", amount: 5430000 },
    { category: "감가상각 (장비·인테리어)", amount: 1200000 },
    { category: "의료기기 리스료", amount: 980000 },
    { category: "전기·수도·가스", amount: 680000 },
    { category: "건물 보험료", amount: 320000 },
    { category: "통신·인터넷", amount: 190000 },
    { category: "소프트웨어 구독", amount: 150000 },
    { category: "기타 고정비", amount: 250000 },
  ],
  total: 9200000,
  revenueRatio: 11.7,
};

export const VOICE_PARSE_EXAMPLES = [
  {
    input: "오늘 데스크 김 실장 수고해서 보너스 현금으로 10만 원 줬고, 세탁비로 3만 5천 원 지출했어.",
    output: {
      transactions: [
        { category: "HR_EXPENSE", target_staff: "김 실장", account_title: "BONUS_CASH", amount: 100000, note: "수고비 보너스" },
        { category: "CLINIC_OPERATION", target_staff: null, account_title: "LAUNDRY_EXPENSE", amount: 35000, note: "세탁비" },
      ],
    },
  },
  {
    input: "오늘 기공소 납품비 85만 원 지출하고, 마케팅 블로그 포스팅 비용 20만 원 결제했어.",
    output: {
      transactions: [
        { category: "CLINIC_OPERATION", target_staff: null, account_title: "LAB_FEE", amount: 850000, note: "기공소 납품비" },
        { category: "MARKETING", target_staff: null, account_title: "BLOG_MARKETING", amount: 200000, note: "블로그 포스팅" },
      ],
    },
  },
];
