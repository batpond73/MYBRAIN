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

export const HR_DATA = {
  monthlyRevenue: 78500000,
  monthlySalaryBudget: 24000000,
  monthlySalaryActual: 27800000,
  salaryRatio: 35.4,
  staffList: [
    { name: "김지영 실장", position: "데스크", consecutiveDays: 6, overtime: true, riskLevel: "warning" as const },
    { name: "이수진 위생사", position: "위생사", consecutiveDays: 4, overtime: false, riskLevel: "normal" as const },
    { name: "박민준 코디", position: "상담", consecutiveDays: 3, overtime: false, riskLevel: "normal" as const },
    { name: "최하늘 위생사", position: "위생사", consecutiveDays: 7, overtime: true, riskLevel: "critical" as const },
  ],
  weeklyData: [
    { week: "1주", revenue: 18200000, salary: 6200000 },
    { week: "2주", revenue: 21500000, salary: 6800000 },
    { week: "3주", revenue: 16800000, salary: 7200000 },
    { week: "4주", revenue: 22000000, salary: 7600000 },
  ],
};

export const FINANCE_DATA = {
  noShowTrend: [
    { month: "1월", rate: 4.2 },
    { month: "2월", rate: 3.8 },
    { month: "3월", rate: 5.1 },
    { month: "4월", rate: 6.3 },
    { month: "5월", rate: 8.7 },
  ],
  consultFailRate: [
    { month: "1월", rate: 32 },
    { month: "2월", rate: 28 },
    { month: "3월", rate: 35 },
    { month: "4월", rate: 42 },
    { month: "5월", rate: 48 },
  ],
  rejectionReasons: [
    { reason: "비용 부담", count: 18, percentage: 42 },
    { reason: "타병원 비교", count: 12, percentage: 28 },
    { reason: "기간 부담", count: 8, percentage: 19 },
    { reason: "기타", count: 5, percentage: 11 },
  ],
  bep: { monthly: 52000000, current: 78500000, achievement: 150.9 },
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
      id: 1, key: "monthlyRevenue", name: "월 매출", unit: "만원",
      benchmark: "연차·체어수 대비 추세", current: "7,850만원", status: "normal" as const,
      judgeType: "REL" as const, relBasis: "tenure" as const, isResultMetric: false,
      upstreamKpiKeys: ["chairUtil", "appointmentRate", "cancelRate"],
    },
    {
      id: 2, key: "patientLtv", name: "환자 LTV", unit: "만원",
      benchmark: "추세 판정 (DERIVED)", current: "141만원", status: "warning" as const,
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
      id: 13, key: "staffProductivity", name: "스태프 생산성", unit: "만원/인",
      benchmark: "인당 매출, 의원 규모 대비", current: "981만원/인", status: "normal" as const,
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
      id: 17, key: "hourlyProd", name: "시간당 생산성", unit: "만원/h",
      benchmark: "시간당 생산성 ÷ 시간당 고정비 ≥ 2배", current: "31.2만원/h", status: "crisis" as const,
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
