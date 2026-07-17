import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";
import {
  FINANCE_DATA_BY_PERIOD,
  FinancePeriodData,
  HR_DATA_BY_PERIOD,
  HrPeriodData,
  KPI_ALL20_BY_PERIOD,
  KPI_BENCHMARKS,
  KPI_EXTRA_CRISIS_BY_PERIOD,
  KPI_TOP3_BY_PERIOD,
  PRESCRIPTIONS,
  VOICE_PARSE_EXAMPLES,
} from "@/constants/mockData";
import { AxisTrendLine } from "@/components/dashboard/AxisTrendLine";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { LaborCrossCard } from "@/components/dashboard/LaborCrossCard";
import { LtvCacGauge } from "@/components/dashboard/LtvCacGauge";
import { OverallVerdictHeader } from "@/components/dashboard/OverallVerdictHeader";
import { RetentionTrio } from "@/components/dashboard/RetentionTrio";
import { ScoreExplainerModal } from "@/components/dashboard/ScoreExplainerModal";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { UncollectedFunnel } from "@/components/dashboard/UncollectedFunnel";
import { computeAxisScores, pickRootCause } from "@/lib/financialInsights";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STATUS_COLORS = { normal: "#33A6FF", warning: "#FFB300", critical: "#FF3B30" };
const STATUS_LABELS = { normal: "✓ 정상", warning: "⚠ 황색 경고", critical: "🚨 위기" };
const STATUS_BG = { normal: "#EBF5FF", warning: "#FFF8E7", critical: "#FFF0EE" };
const STATUS_BORDER = { normal: "#C0DEFF", warning: "#FFE0A0", critical: "#FFB8B2" };

type Period = "today" | "week" | "month" | "quarter";
const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
  { key: "quarter", label: "분기" },
];

const PERIOD_PREFIX: Record<Period, string> = {
  today: "오늘의",
  week: "이주의",
  month: "이달의",
  quarter: "이분기의",
};

type KpiPrescription = {
  analysis: string[];
  solution: string[];
  effect: string[];
  action: string;
  judgeType?: "ABS" | "REL" | "DERIVED";
  isResultMetric?: boolean;
  upstreamKpiKeys?: string[];
};

const EXTRA_CRISIS_KPIS = [
  {
    id: "cancelRate",
    name: "당일 취소율",
    unit: "%",
    current: 8.7,
    benchmark: 3,
    direction: "lower" as const,
    benchmarkLabel: "≤ 3%",
    impact: "이달 방치 시 손실 약 180만 원 — Lean 기준 초과 5.7%p",
  },
  {
    id: "uncollected",
    name: "미수금 비율",
    unit: "%",
    current: 4.7,
    benchmark: 1.5,
    direction: "lower" as const,
    benchmarkLabel: "≤ 1.5%",
    impact: "미회수 3,700만 원 묶여 있음 — 지금 바로 회수 가능",
  },
];

const KPI_PRESCRIPTIONS: Record<string, KpiPrescription> = {
  laborCost: {
    analysis: [
      "이달 실제 인건비 2,780만 원 — 예산 대비 380만 원 초과",
      "목요일 오후 초과근무 집중 → 최하늘 위생사 연속 7일 근무",
      "방치 시 이달 손실 확정 380만 원 + 번아웃 이직 리스크",
      "(이번 달 스태프 급여로 나갈 돈이 예산보다 380만 원 더 나갔어요. 원인은 목요일 오후에 예약이 몰려서 최하늘 위생사가 7일 연속으로 초과 근무 중인 것. 이대로 두면 이번 달 380만 원은 그냥 손실 확정이고, 스태프가 지쳐서 그만두면 새로 뽑는 데 다시 300~500만 원이 들어요.)",
    ],
    solution: [
      "① 오늘: 목요일 오후 예약 3건 → 수요일 오전으로 이동",
      "② 이번 주: 최하늘 위생사 내일 하루 휴무 즉시 배정",
      "③ 다음 주: 초과근무 발생 시 파트 위생사 자동 호출 기준 설정",
    ],
    effect: [
      "이달 초과근무 수당 78만 원 즉시 절감",
      "인건비 비율 33%대로 개선 — 이달 안에 확인 가능",
      "번아웃 이직 방지 = 채용 비용 300~500만 원 절감",
    ],
    action: "목요일 예약 분산 지금 실행",
  },
  noShow: {
    analysis: [
      "5월 노쇼율 8.7% — 1월(4.2%) 대비 4.5%p 급등 중",
      "노쇼 1건 = 체어 50분 공백 + 평균 23만 원 손실",
      "이번 달 노쇼 누적 손실 약 840만 원 — 지금 차단해야 함",
      "(예약해놓고 연락 없이 안 오는 환자가 지난 5개월 동안 두 배로 늘었어요. 안 온 환자 한 명당 진료실이 50분 비고 평균 23만 원이 그냥 없어지는데, 이번 달만 840만 원이 이미 그렇게 사라졌습니다. 지금 손 안 대면 다음 달에는 액수가 더 커져요.)",
    ],
    solution: [
      "① 오늘: 내일 예약자 전원에 카카오 리마인드 문자 발송",
      "② 이번 주: 2회 이상 노쇼 환자 3명 → 원장 직접 확인 전화",
      "③ 다음 달부터: 3회 노쇼 기록 환자 → 예약 시 선결제 안내",
    ],
    effect: [
      "리마인드 문자 적용 즉시 노쇼율 -3~4%p 감소 확인됨",
      "이달 잔여 기간 손실 200만 원 추가 방어 가능",
      "4%대 복귀 시 연간 방어액 약 6,000만 원",
    ],
    action: "내일 예약자 리마인드 지금 발송",
  },
  caseAcceptance: {
    analysis: [
      "5월 상담 동의율 52% — 비용 부담 거절이 전체의 42%",
      "대기 22분 초과 시 동의율 22% 하락 — 지금 22분 대기 중",
      "분기 잠재 손실 2,100만 원 — 가장 큰 성장 레버",
      "(상담 받은 환자 10명 중 5명만 실제로 치료를 시작하고 있어요. 거절한 사람의 42%는 '치료비가 부담된다'는 이유였고, 상담 전에 22분 넘게 기다린 환자는 그렇지 않은 환자보다 22% 더 많이 거절합니다. 이 두 가지만 개선해도 이번 분기에 2,100만 원 매출을 더 만들 수 있어요.)",
    ],
    solution: [
      "① 오늘: 임플란트 상담 전 X-ray·비교 사례 출력물 준비",
      "② 이번 주: 비용 거절 환자에게 24개월 무이자 분납 옵션 제시",
      "③ 다음 달: 상담 전 대기시간 12분 이하로 스케줄 재조정",
    ],
    effect: [
      "분납 옵션 제시만으로 비용 거절 환자 30~40% 전환됨",
      "상담 동의율 60%대 복귀 시 이달 추가 매출 약 700만 원",
      "70% 달성 시 분기 2,100만 원 — 가장 빠른 매출 성장 경로",
    ],
    action: "분납 옵션 상담 오늘부터 적용",
  },
  cancelRate: {
    analysis: [
      "이달 당일 취소 8.7% — Lean 무결점 기준(≤3%) 대비 5.7%p 초과",
      "당일 취소 1건 = 90분 공백 + 평균 13만 원 손실",
      "이달 방치 시 추가 손실 약 180만 원 확정",
      "(이번 달 예약 100건 중 8~9건이 당일에 취소돼요. 업계에서 잘하는 병원은 3건 이하로 관리합니다. 취소된 자리 하나당 진료실이 90분 비고 평균 13만 원이 없어지는데, 지금 페이스로 두면 이번 달 안에 180만 원이 더 사라져요.)",
    ],
    solution: [
      "① 오늘: 당일 취소 환자 즉시 대기자 리스트로 채우기",
      "② 이번 주: 당일 취소 2회 이상 환자 3명 별도 관리 태그",
      "③ 다음 달: 이 3명 예약 시 72시간 전 추가 확인 문자 자동 발송",
    ],
    effect: [
      "대기자 채우기 즉시 적용 시 이달 손실 70만 원 회수 가능",
      "당일 취소율 5%대 복귀 시 월 120만 원 안정 확보",
      "체어 가동률 78% → 83% 개선 연동",
    ],
    action: "지금 대기자 리스트 채우기 실행",
  },
  uncollected: {
    analysis: [
      "미수금 총 3,700만 원 — Cash Flow Optimization 기준(≤1.5%) 대비 3.2%p 초과",
      "이 중 회수 가능액 약 2,500만 원 (67%) — 지금 즉시 청구 필요",
      "방치 60일 초과 시 회수율 급락 — 지금이 마지막 골든타임",
      "(진료를 마쳤는데 아직 못 받은 돈이 3,700만 원 쌓여 있어요. 그중 60일 안 지난 2,500만 원은 지금 청구하면 대부분 받을 수 있지만, 60일 넘어가면 받을 확률이 뚝 떨어집니다. 이번 주가 사실상 마지막 기회예요.)",
    ],
    solution: [
      "① 오늘: 30일 이상 미수금 환자 목록 출력 → 문자 발송",
      "② 이번 주: 분납 가능 환자에게 3개월 분납 제안 전화",
      "③ 다음 달: 15일·30일·45일 자동 청구 문자 시스템 설정",
    ],
    effect: [
      "오늘 문자 발송만으로 1주일 내 500~800만 원 회수 가능",
      "자동 청구 적용 시 회수율 68% 향상 — 업계 검증 수치",
      "운전자본 2,100만 원 확보 → BEP 달성일 8일로 단축",
    ],
    action: "미수금 환자 지금 바로 문자 발송",
  },
};

// v0.4 정정 매핑: id → prescription key
const ALL20_KEY_MAP: Record<number, string> = {
  1: "monthlyRevenue", 2: "patientLtv",      3: "ltvCac",
  4: "chairUtil",      5: "appointmentRate", 6: "cancelRate",
  7: "uncollected",    8: "newPatients",     9: "returnRate",
  10: "recallRate",    11: "treatComplete",  12: "staffTurnover",
  13: "staffProductivity", 14: "materialCost", 15: "labFee",
  16: "netProfit",     17: "hourlyProd",     18: "nps",
  19: "marketingROI",  20: "preventiveRecall",
};

// 방법론: Unit Economics(a16z 2024) · Lean Healthcare/TPS · Value-Based Care(Porter) · Theory of Constraints · NRR
const ALL20_PRESCRIPTIONS: Record<string, KpiPrescription> = {
  fixedCost: {
    analysis: [
      "현재 11.7% — Lean 비용 구조 기준(≤50%) 대비 38.3%p 여유",
      "TOC 제약이론: 비용이 병목이 아님 — 확장 투자 여력 최대",
      "고정비 여유 38%p = 매출 급감 시 최장 3.8개월 완충 버퍼",
      "(매출 대비 임대료·감가상각 같은 매달 고정으로 나가는 비용의 비율이 11.7%예요. 안전선이 50%인데 훨씬 아래라 여유가 크죠. 이건 매출이 갑자기 30~40% 줄어도 3~4개월은 버틸 수 있다는 뜻이고, 반대로 지금은 신규 체어·인력 투자를 진지하게 검토해도 되는 시점이라는 신호입니다.)",
    ],
    solution: [
      "① 오늘: 현 고정비 구조 유지 — 추가 고정비 발생 전 ROI 계산 필수",
      "② 이번 달: 신규 체어 증설 시나리오 Unit Economics 시뮬레이션",
      "③ 분기: 고정비 50% 이내 유지하며 확장 투자 실행",
    ],
    effect: [
      "고정비 최저 수준 = 클리닉 재무 안전성 업계 최상위",
      "확장 투자 시 LTV:CAC 비율 개선 여력 충분",
      "불황 저항력 최강 — 매출 급감 자동 안전망 확보",
    ],
    action: "확장 투자 시나리오 분석",
  },
  netProfit: {
    analysis: [
      "현재 17.0% — 개원 3년차 안정기 목표(20~25%) 대비 -3%p (REL 연차 판정)",
      "3%p 부족 = 월 235만 원이 연차 구간 목표치에 미치지 못함",
      "인건비 초과·체어 미달이 복합 원인 — 동시 해결 시 즉시 20%+ 가능",
      "(이번 달 매출 중 최종 순이익으로 남는 비율이 17%예요. 원장님처럼 3년차 안정기 병원은 보통 20~25%를 목표로 하는데, 그보다 3%p 낮은 상태입니다. 이 3%p 차이는 이번 달에만 235만 원이 통장에 덜 남았다는 뜻이고요. 주된 원인은 인건비가 예산보다 많이 나갔고 체어(진료실 의자) 회전이 목표에 못 미친 것 두 가지가 겹친 결과예요.)",
    ],
    solution: [
      "① 오늘: 인건비 초과분 78만 원 절감 — 목요일 스케줄 즉시 조정",
      "② 이번 주: 체어 가동률 88% 달성으로 매출 기반 동시 강화",
      "③ 이번 달: 상담 동의율 70%로 개선 → 매출 700만 원 추가",
    ],
    effect: [
      "인건비 해결 즉시 순이익률 19.5% — 목표 0.5%p 이내",
      "체어+상담 동시 개선 시 22%+ — Unit Economics 기준 충족",
      "순이익률 20% = 확장 투자 신호 — 다음 성장 단계 진입",
    ],
    action: "순이익률 20% 달성 즉시 실행",
  },
  chairUtil: {
    analysis: [
      "현재 78% — ToC 기준(70~85% 최적 구간) 내 위치 (v0.4 정정: 단방향 기준 폐기)",
      "Theory of Constraints: 체어 = 이 클리닉의 핵심 병목 자원",
      "당일 취소 8.7%가 주요 공백 원인 → 취소 차단이 최우선",
      "(진료실 의자(체어)가 열려있는 시간 중 실제로 환자가 앉아 있던 시간이 78%예요. 70~85% 구간이 최적입니다 — 이보다 낮으면 매출 손실이고, 90% 넘으면 스태프가 지치기 시작해요. 지금은 안전 구간에 있지만 당일 취소가 8.7%라 취소만 잡으면 85% 상단까지 갈 수 있습니다. 여기가 원장님 병원의 매출 상한을 결정하는 핵심 병목입니다.)",
    ],
    solution: [
      "① 오늘: 당일 취소 발생 즉시 대기자 리스트 자동 알림 가동",
      "② 이번 주: 목요일 과포화 예약 → 화·수 오전으로 즉시 분산",
      "③ 이번 달: 30분 단위 체어 가동 현황 일일 리포트 자동화",
    ],
    effect: [
      "88% 달성 시 월 780만 원 기회비용 전액 회수",
      "Lean 흐름 개선 → 스태프 피로도 감소 · 이직률 동반 개선",
      "연간 9,360만 원 추가 매출 창출 — 가장 빠른 레버",
    ],
    action: "체어 병목 즉시 해소",
  },
  newPatients: {
    analysis: [
      "현재 22명(신환 비중 12%) — REL 최적 구간(15~25%) 하단 미달",
      "신환 1명 LTV 141만 원 × 8명 = 월 1,128만 원 잠재 손실",
      "LTV:CAC 3.7x 정상 — 마케팅 예산 증액 즉시 양의 ROI 확보 가능",
      "(이번 달 처음 온 환자가 22명, 전체 환자 중 12% 비중입니다. 안정된 병원은 신환 비중 15~25%가 이상적이라 조금 부족한 상태예요. 환자 유치 비용 대비 그 환자가 낼 돈이 3.7배로 좋은 구조라서, 지금 상태에서는 광고비를 늘리면 늘린 만큼 매출이 따라옵니다. 다만 신환에만 의존하지 말고 재방문·리콜도 함께 개선하는 게 안정적이에요.)",
    ],
    solution: [
      "① 오늘: LTV:CAC 3.7x 활용 — 마케팅 예산 즉시 20% 증액",
      "② 이번 주: 기존 환자 소개 프로그램 인센티브 재설계",
      "③ 이번 달: 네이버 플레이스 · 카카오맵 검색 최적화",
    ],
    effect: [
      "예산 20% 증액 시 신환 4~6명 추가 유입 예측",
      "30명 달성 시 LTV 기준 월 매출 +423만 원",
      "신환 증가 → 유지 경제학 복리 효과 3년 후 2.1배",
    ],
    action: "신환 유입 캠페인 즉시 증액",
  },
  recallRate: {
    analysis: [
      "현재 61% — 유지 경제학 추세 판정 중 (60% 이상 = 정상 복귀 구간)",
      "유지 경제학 (재방문 가치): 리콜율 = 기존 환자 유지 지표 (NRR 개념 차용)",
      "재내원 누락 14%p = 월 예방 수익 손실 약 336만 원",
      "(정기 검진 시기가 된 환자에게 안내를 보냈을 때 실제로 예약을 잡는 비율이 61%예요. 목표는 75%인데 14%p 부족한 상태입니다. 이 14%p 차이 때문에 이번 달에 스케일링·정기 검진으로 벌 수 있었던 336만 원을 놓치고 있어요. 리콜은 광고 없이 벌 수 있는 가장 저렴한 매출이라 여기 새는 게 아깝습니다.)",
    ],
    solution: [
      "① 오늘: 6개월+ 미내원 환자 목록 추출 → 문자 즉시 발송",
      "② 이번 주: 치료 완료 시 6개월 리콜 자동 예약 시스템 구축",
      "③ 이번 달: 예방 검진 패키지(스케일링+구강 검사) 상품화",
    ],
    effect: [
      "자동 리콜 적용 시 이탈 환자 40% 복귀 (업계 검증)",
      "75% 달성 시 월 예방 수익 +336만 원 즉시 확보",
      "LTV 141만 → 190만 원으로 35% 향상 자동 연동",
    ],
    action: "자동 리콜 예약 시스템 즉시 설정",
  },
  revenuePerPt: {
    analysis: [
      "환자 LTV 141만 원 — Unit Economics 기준(≥280만 원) 대비 절반",
      "LTV 계산: 385,000원 × 연 2.4회 × 재내원율 61% × 2.5년 = 141만 원",
      "LTV 부족 = CAC 회수 기간 과다 — 신환 유치 효율 저하",
      "(환자 한 명이 원장님 병원을 다니는 동안 지불하는 총액이 141만 원이에요. 안정된 병원은 이 값이 280만 원 이상 나오는 걸 목표로 합니다 — 지금은 그 절반 수준이라 광고비 회수 기간이 길어지고 신규 환자 유치 효율이 떨어져요. 이 숫자를 늘리려면 재방문 횟수(연 2.4회)를 3회로, 재내원율(61%)을 75%로 올리는 게 지름길입니다.)",
    ],
    solution: [
      "① 오늘: 재내원율 61% → 75% 리콜 시스템 즉시 설정",
      "② 이번 주: 치료 계획 완성도 높여 연 방문 2.4 → 3.0회 증가",
      "③ 이번 달: 1인당 매출 385k → 420k 케이스 믹스 개선",
    ],
    effect: [
      "재내원율 75% + 방문 3회 달성 시 LTV 210만 원 (49% 향상)",
      "LTV 280만 원 달성 시 클리닉 기업가치 2.1배 상승",
      "Unit Economics 완전 충족 = 확장 투자·투자 유치 근거 확보",
    ],
    action: "환자 LTV 개선 로드맵 실행",
  },
  waitTime: {
    analysis: [
      "현재 22분 — Lean Healthcare 기준(≤10분) 대비 12분 초과",
      "Lean 7대 낭비 중 '대기(Waiting)' — 즉각 제거 대상 Muda",
      "대기 22분 초과 시 상담 동의율 22% 하락 (내부 데이터)",
      "(환자가 병원에 도착해서 실제 진료가 시작될 때까지 평균 22분을 기다리고 있어요. 이상적으로는 10분 이내인데 두 배가 넘습니다. 대기가 20분 넘어가면 그 환자의 상담 동의율이 22%나 떨어지는 게 통계로 나와서, 대기시간을 단축하면 매출이 즉시 회복돼요. 접수·체어 배정 순서를 조정하는 것만으로도 10분 이상 줄일 수 있습니다.)",
    ],
    solution: [
      "① 오늘: 체어 배정 프로세스 맵 — 대기 발생 구간 즉시 파악",
      "② 이번 주: 접수~진료 준비 SOP(표준 운영 절차) 작성",
      "③ 이번 달: 예약 간격 최적화로 평균 대기 15분 이하 달성",
    ],
    effect: [
      "대기 15분 이하 시 상담 동의율 +8%p 즉시 회복",
      "10분 달성 시 동의율 +15%p → 분기 매출 +2,100만 원",
      "Lean 흐름 개선 → NPS +10점 자동 연동",
    ],
    action: "대기시간 단축 프로세스 즉시 개선",
  },
  materialCost: {
    analysis: [
      "현재 2.7% — 재료비 안전 기준(≤20% 경고선) 대비 17.3%p 여유, 안정 병원 벤치(5~8%) 도 통과 · 최상위",
      "재료비 최저 수준 = Lean 원가 구조 완성 상태",
      "단가 절감보다 재료 품질 유지 여부 분기별 점검 필요",
      "(매출에서 임플란트 픽스처·크라운·소모품 같은 진료 재료로 나가는 비용의 비율이 2.7%예요. 위험선은 20%지만 안정된 병원 벤치도 5~8%인데 그보다도 훨씬 낮은 최상위 수준입니다. 원장님 병원의 재료 조달·공급망이 잘 짜여 있다는 뜻이고요. 다만 재료비를 계속 낮추기보다 지금 수준을 유지하면서 재료 품질이 환자 만족도에 미치는 영향을 분기별로 점검하는 게 안전합니다.)",
    ],
    solution: [
      "① 현 재료 조달·단가 협상 구조 유지",
      "② 분기마다 재료비 vs 환자 만족도·치료 완료율 연계 분석",
      "③ 임플란트 등 고가 재료 공동구매 협약 추가 검토",
    ],
    effect: [
      "현 수준 유지 시 연간 재료비 절감 약 1,700만 원 (6% 기준 대비)",
      "품질 유지 확인 시 순이익률 직접 기여 최대 레버",
      "Lean 원가 구조 = 클리닉 지속 경쟁력 핵심",
    ],
    action: "재료비-품질 연계 분석 실행",
  },
  labFee: {
    analysis: [
      "현재 2.1% — 기공료 안전 기준(≤12% 경고선) 대비 9.9%p 여유, 안정 병원 벤치(3~7%) 도 통과 · 최상위",
      "디지털 덴티스트리 효과 반영 — 기공 효율 최대화 상태",
      "보철 케이스 확대 계획 시 기공료 선제적 예산 증액 필요",
    ],
    solution: [
      "① 현 디지털 기공 파트너십 유지",
      "② 보철 케이스 확대 계획 시 기공료 예산 선제 증액",
      "③ 기공료 9% 이내 유지하며 보철 매출 비중 35% 목표",
    ],
    effect: [
      "보철 35% 달성 시 월 추가 매출 약 480만 원",
      "기공료 9% 이내 유지 시 보철 순이익률 31% 확보",
      "매출 포트폴리오 다양화 → 임플란트 집중 리스크 분산",
    ],
    action: "보철 케이스 확장 전략 실행",
  },
  hourlyProd: {
    analysis: [
      "현재 31.2만 원/h — ToC 기준(시간당 고정비 대비 ≥2배) 미달 위기",
      "월 고정비 약 3,700만 원 ÷ 200 운영시간 = 18.5만 원/h → 목표 ≥37만 원/h",
      "체어 가동률·케이스 믹스 개선 시 시간당 생산성 자동 향상 연동",
    ],
    solution: [
      "① 오늘: 체어 공백 시간대 상담·예방 시술로 즉시 채우기",
      "② 이번 주: 고부가 시술(임플란트·교정) 오전 슬롯 집중 배치",
      "③ 이번 달: 30분 단위 생산성 분석 → 저생산 시간대 원인 파악",
    ],
    effect: [
      "케이스 믹스 개선 시 37만 원/h 목표 달성 가능",
      "고정비 대비 2배 달성 시 월 추가 순이익 약 300만 원",
      "ToC 병목 해소 = 고정비 레버리지 최대화",
    ],
    action: "시간당 생산성 최적화 실행",
    judgeType: "REL",
    isResultMetric: false,
  },
  newPtConvert: {
    analysis: [
      "현재 58% — Funnel Optimization 기준(≥70%) 대비 -12%p",
      "초진 방문 12%p 이탈 = 월 2.6명이 치료 없이 이탈",
      "이탈 원인: 비용 부담 42%, 타병원 비교 28%",
    ],
    solution: [
      "① 오늘: 비용 거절 환자 → 24개월 무이자 분납 즉시 제안",
      "② 이번 주: 치료 전후 사례 비교 자료 상담 표준화",
      "③ 이번 달: 초진 후 48시간 내 팔로업 문자 자동화",
    ],
    effect: [
      "분납 제안만으로 비용 거절 환자 30~40% 당일 전환",
      "70% 달성 시 월 케이스 +3건 → 매출 +115만 원",
      "Funnel 개선 = LTV:CAC 비율 자동 향상 연동",
    ],
    action: "분납 상담 스크립트 오늘 적용",
  },
  staffTurnover: {
    analysis: [
      "현재 12% — Lean Healthcare 기준(>15% 경고, >25% 위기) 정상 구간 · 여유 있음",
      "v0.4 정정: ≤10% 일괄 기준 폐기 — 소규모 의원 왜곡 방지, 규모별 보조 판정",
      "다만 최하늘 위생사 연속 7일 근무 = 개별 번아웃 리스크는 별개 관리",
      "이직 1명 비용 = 채용+교육+생산성 손실 합산 약 500만 원 — 미리 방지 목적",
    ],
    solution: [
      "① 오늘: 최하늘 위생사 연속 7일 근무 → 내일 즉시 휴무 배정",
      "② 이번 주: 전 스태프 번아웃 리스크 점검 (연속 근무일 확인)",
      "③ 이번 달: 분기별 1:1 면담 · 만족도 조사 정례화",
    ],
    effect: [
      "스케줄 균형화 즉시 적용 시 이직 위험 50% 감소",
      "이직률 10% 달성 시 연간 채용 비용 약 500만 원 절감",
      "스태프 안정 = 환자 만족도 NPS +5~8점 자동 연동",
    ],
    action: "스태프 번아웃 점검 지금 실행",
  },
  treatComplete: {
    analysis: [
      "현재 74% — 안전 기준(≥75%) 대비 -1%p (경고 진입 근처) · 최상위 벤치(85%)까지 -11%p",
      "치료 미완료 11% = 월 약 35명이 치료 중단 이탈",
      "중단 원인: 비용 부담 · 시간 부족 · 통증 우려 순",
    ],
    solution: [
      "① 오늘: 3회 이상 미내원 치료 중인 환자 목록 확인 · 연락",
      "② 이번 주: 치료 단계별 완료 현황 자동 추적 시스템 설정",
      "③ 이번 달: 중단 환자에게 분납 · 야간 예약 옵션 제안",
    ],
    effect: [
      "자동 추적 적용 시 완료율 10%p 즉시 향상 (업계 검증)",
      "85% 달성 시 월 완료 케이스 +35건 → 매출 +135만 원",
      "치료 완료율 개선 = NPS · 리뷰 · 소개 환자 연동 상승",
    ],
    action: "치료 미완료 환자 지금 연락",
  },
  marketingROI: {
    analysis: [
      "현재 540% — 채널별 LTV/CAC 응용 기준(≥300% 정상 · ≥500% 우수) 우수 구간",
      "LTV:CAC 3.7x가 상류에서 뒷받침 — 원 지표는 채널별 (환자 LTV × 유입수)/광고비",
      "결과 지표: 자체 개선 추구 말고 상류 원인(리콜·재내원)에 집중",
    ],
    solution: [
      "① 오늘: CAC 유지하며 LTV 개선에 집중 — 재내원율 우선 해결",
      "② 이번 달: LTV 210만 원 목표 달성 후 마케팅 예산 검토",
      "③ 분기: LTV 280만 원 달성 → 마케팅 예산 2배 증액 실행",
    ],
    effect: [
      "LTV 210만 원 달성 시 LTV:CAC = 8.1x (최우수 수준 진입)",
      "LTV 280만 원 시 예산 2배 증액해도 ROI 양수 확보",
      "Unit Economics 최적화 = 투자 유치·확장의 가장 강력한 근거",
    ],
    action: "LTV 개선 → CAC 확장 순서 실행",
  },
  onlineReview: {
    analysis: [
      "현재 4.7점 — Leading Indicator 기준(≥4.7/5.0) 정확히 경계선",
      "4.8점 이상: 네이버 플레이스 자연 노출 알고리즘 가산점 구간",
      "리뷰 모수 부족 시 4.7점도 하락 위험 — 모수 확보 시급",
    ],
    solution: [
      "① 오늘: 치료 완료 환자 자동 리뷰 요청 문자 템플릿 작성",
      "② 이번 주: 네이버·카카오 리뷰 48시간 내 전문적 답변 시스템",
      "③ 이번 달: 4.8점 달성 후 신환 자연 유입 증가 효과 측정",
    ],
    effect: [
      "4.8점 달성 시 네이버 플레이스 노출 +20~30%",
      "자연 유입 신환 +3~5명/월 = 마케팅 비용 0원 추가",
      "Leading Indicator 개선 = 6개월 후 신환 증가 선행 신호",
    ],
    action: "리뷰 자동 요청 시스템 오늘 설정",
  },
  revenueMix: {
    analysis: [
      "예방·리콜 매출 6.2% — Recurring Revenue 기준(≥20%) 대비 -13.8%p",
      "임플란트 41% 편중 = 1회성 고단가 의존 — 경기 민감 리스크 최고",
      "예방 수익 = 구독형 정기 수익 — 월 고정 캐시플로우 핵심",
    ],
    solution: [
      "① 오늘: 예방 패키지(스케일링+X-ray+구강 검사) 상품 즉시 설계",
      "② 이번 주: 기존 환자 전원 대상 연 2회 예방 예약 자동 등록",
      "③ 이번 달: 예방 수익 월 300만 원 목표 설정 및 추적",
    ],
    effect: [
      "예방 20% 달성 시 월 정기 수익 1,570만 원 확보",
      "임플란트 의존도 감소 → 경기 하락 시 매출 변동성 60% 감소",
      "Recurring Revenue 확보 = 클리닉 기업가치·매각가 대폭 상승",
    ],
    action: "예방 패키지 상품 오늘 설계",
  },
  nps: {
    analysis: [
      "현재 NPS 51 — 최근 5개월 추세 42→45→41→48→50 · 4개월 연속 반등",
      "v0.4 정정: 절대값 ≥60 기준 폐기 — 추세·분포 기반으로 정정",
      "NPS 60 이상 = 입소문 성장 임계점 — 소개 환자 급증 구간",
    ],
    solution: [
      "① 오늘: NPS 낮은 환자(7점 이하) 원장 직접 팔로업 전화",
      "② 이번 주: 대기시간 단축 · 상담 품질 개선으로 경험 즉시 향상",
      "③ 이번 달: 치료 완료 후 만족도 조사 자동화 · 원인 분석",
    ],
    effect: [
      "NPS 60 달성 시 소개 환자 월 +3~5명 (비용 0원)",
      "소개 환자 LTV = 일반 신환 LTV의 1.6배 (신뢰 기반 관계)",
      "NPS 70+ = 자연 성장 엔진 가동 — 마케팅 비용 절감 시작",
    ],
    action: "환자 경험 개선 우선 실행",
  },
  bepDay: {
    analysis: [
      "현재 BEP 약 20일 — 월 고정비 5,200만 원 ÷ 일평균 매출 262만 원",
      "월 20일에 BEP = 이후 10일이 순수 이익 창출 기간",
      "노쇼·당일 취소 해결 시 BEP 15일대까지 단축 가능",
      "(이번 달 매출로 병원의 모든 고정비(임대·인건비·재료비 등)를 커버하는 데 약 20일이 걸려요. 즉 매달 21일째부터 30일까지 남은 10일이 원장님 순이익으로 쌓이는 기간입니다. 노쇼·당일 취소만 잡아도 이 BEP 시점을 15일 근처로 당길 수 있어서, 순이익 기간이 10일에서 15일로 늘어납니다.)",
    ],
    solution: [
      "① 월초 예약 밀도 강화로 BEP 시점 앞당기기",
      "② 노쇼·당일 취소 감소로 BEP 15일대 목표 설정",
      "③ 분기마다 BEP 달성일 추이 모니터링",
    ],
    effect: [
      "BEP 15일 달성 시 순이익 창출 기간 15일 확보 (현재 10일)",
      "연간 순이익 +1,200만 원 추가 창출 가능",
      "Unit Economics Payback 기준(≤12일) 근접 = 확장 투자 검토 가능",
    ],
    action: "BEP 15일 목표 달성 계획",
  },
  monthlyRevenue: {
    analysis: [
      "현재 7,850만 원 — 연차 3년·체어 6대 기준 대비 추세 확인 필요",
      "REL 판정: 절대값 목표 강요 폐기 — 개원 연차·규모 대비 추세 판정",
      "주요 상류 지표: 체어 가동률·예약 충족률·당일 취소율이 직접 연결",
    ],
    solution: [
      "① 오늘: 체어 가동률 78% → 85% 개선으로 직접 매출 증대",
      "② 이번 주: 당일 취소 8.7% 차단으로 월 180만 원 즉시 회수",
      "③ 이번 달: 예방 리콜 매출 비중 확대로 정기 수익 기반 강화",
    ],
    effect: [
      "체어 가동률 85% 달성 시 월 매출 +550만 원",
      "취소율 3% 이하 달성 시 연간 방어액 2,160만 원",
      "REL 추세 개선 = 3개월 연속 상승 시 '정상' 확정",
    ],
    action: "매출 상류 지표 즉시 개선",
    judgeType: "REL",
    isResultMetric: false,
    upstreamKpiKeys: ["chairUtil", "appointmentRate", "cancelRate"],
  },
  patientLtv: {
    analysis: [
      "현재 141만 원 (= 38.5만 객단가 × 2.4회/년 × 61% 리콜 × 2.5년 유지)",
      "결과 지표: 단독 목표 추구 말고 원인 지표 3개를 먼저 해결",
      "리콜 성공률·재내원율·진료 완료율이 LTV의 직접 상류 원인",
    ],
    solution: [
      "① 오늘: 리콜 성공률 61% → 75% 달성 우선 — LTV 직접 상승",
      "② 이번 주: 치료 완료율 74% → 80% 개선 — 중단 환자 즉시 연락",
      "③ 이번 달: 재내원율 유지하며 객단가 케이스 믹스 개선",
    ],
    effect: [
      "리콜 75% + 유지 3년 달성 시 LTV 210만 원 (49% 향상)",
      "LTV 200만 원 → LTV:CAC 5.3x (정상 구간 내 최상)",
      "LTV 개선 = 마케팅 ROI 자동 연동 상승",
    ],
    action: "리콜·재내원 상류 지표 우선 해결",
    judgeType: "DERIVED",
    isResultMetric: true,
    upstreamKpiKeys: ["returnRate", "recallRate", "treatComplete"],
  },
  ltvCac: {
    analysis: [
      "현재 3.7x — 3~5x 정상 구간 내 위치 (v0.4 정정 기준)",
      "결과 지표: 자체 비율 개선 대신 상류 LTV·리콜 지표에 집중",
      "3~5x 구간 유지하며 >5x 점검 — 과도한 마케팅 투자 경고",
      "(환자 한 명이 병원을 다니는 동안 지불하는 총액이 그 환자를 데려오는 데 든 비용의 3.7배예요. 3배 이하면 광고비 대비 손해, 5배 넘으면 오히려 마케팅을 더 태워도 되는 구간인데, 지금 3.7배로 딱 좋은 자리에 있어요. 지금 여기서 억지로 비율을 더 올리려 하기보다는 환자가 병원에 더 오래 다니게 만드는 리콜·재내원 쪽을 손대는 게 효율적입니다.)",
    ],
    solution: [
      "① 오늘: LTV 개선(리콜·재내원)에 집중 — CAC 증가보다 효율적",
      "② 이번 달: LTV 200만 원 달성 후 마케팅 예산 점진 증액",
      "③ 분기: 5x 이하 유지하며 CAC 채널 효율 모니터링",
    ],
    effect: [
      "LTV 200만 원 달성 시 LTV:CAC = 5.3x (정상 상단)",
      "3~5x 안정 유지 = Unit Economics 건강 신호",
      "과도한 마케팅 비용 방지 → 순이익률 개선 연동",
    ],
    action: "LTV 상류 지표 개선 집중",
    judgeType: "DERIVED",
    isResultMetric: true,
    upstreamKpiKeys: ["patientLtv", "recallRate"],
  },
  appointmentRate: {
    analysis: [
      "현재 88% — 의원 목표 대비 추세 확인 필요 (REL 판정)",
      "예약 슬롯 대비 실제 충족률 88% = 12%의 빈 슬롯 발생",
      "당일 취소율 8.7%가 주요 원인 — 취소 차단이 최우선",
    ],
    solution: [
      "① 오늘: 당일 취소 발생 즉시 대기자 리스트로 빈 슬롯 채우기",
      "② 이번 주: 예약 24시간 전 자동 리마인드 시스템 가동",
      "③ 이번 달: 90% 이상 목표 설정 + 주간 충족률 모니터링",
    ],
    effect: [
      "취소율 3% 달성 시 예약 충족률 자동 93~95% 회복",
      "충족률 95% = 월 매출 약 400만 원 추가 확보",
      "Lean 공백 낭비(Muda) 최소화 = 스태프 피로도 동시 감소",
    ],
    action: "당일 취소 차단 즉시 실행",
    judgeType: "REL",
    isResultMetric: false,
  },
  returnRate: {
    analysis: [
      "현재 74% — 유지 경제학 기준 >70% 우수 단계 (v0.4 정정)",
      "55~70% 정상 구간을 넘어 우수 단계 유지 중 — 강점 확인",
      "상류 지표: 리콜 성공률·진료 완료율이 재내원율을 결정",
      "(치료가 끝난 환자 10명 중 7~8명이 다시 병원을 찾고 있어요. 이건 원장님 병원에서 가장 잘하고 있는 부분이고, 광고 없이 벌 수 있는 매출의 근간이 됩니다. 다만 이 숫자는 리콜 성공률과 진료 완료율이 나빠지면 곧바로 함께 내려가는 특성이 있어서, 지금 좋다고 안심하지 말고 두 상류 지표를 관리해야 유지돼요.)",
    ],
    solution: [
      "① 현 수준 유지: 리콜 자동화 시스템 그대로 운영",
      "② 이번 달: 재내원율 75%+ 상향 목표 — 예방 패키지 활성화",
      "③ 분기: 재내원율·LTV 동시 추세 추적 대시보드 활용",
    ],
    effect: [
      "74% 유지 시 환자 LTV 안정적 확보 — 신환 의존도 감소",
      "75%+ 달성 시 LTV 190만 원으로 상승 연동",
      "유지 경제학 강점 = 마케팅 효율 자동 향상",
    ],
    action: "재내원 강점 유지 및 LTV 연동 확인",
    judgeType: "REL",
    isResultMetric: false,
    upstreamKpiKeys: ["recallRate", "treatComplete"],
  },
  staffProductivity: {
    analysis: [
      "현재 981만 원/인 — 8명 기준, 의원 규모 대비 추세 확인",
      "인당 매출 981만 원 = 월 매출 7,850만 원 ÷ 8명 스태프",
      "스태프 이직률 19% 경고 → 핵심 인력 이탈 시 생산성 즉시 하락",
    ],
    solution: [
      "① 오늘: 스태프 이직률 경고 우선 해결 — 번아웃 즉시 점검",
      "② 이번 주: 고부가 진료 시간대 스태프 배치 최적화",
      "③ 이번 달: 인당 생산성 1,000만 원 목표 설정 + 월간 추적",
    ],
    effect: [
      "이직률 안정 시 생산성 손실 방지 — 채용 비용 500만 원 절감",
      "인당 1,000만 원 달성 시 월 매출 +152만 원 (8명 기준)",
      "스태프 안정 = NPS·환자 만족도 자동 연동 향상",
    ],
    action: "스태프 안정화 우선 실행",
    judgeType: "REL",
    isResultMetric: false,
  },
  preventiveRecall: {
    analysis: [
      "현재 6.2% — 유지 경제학 기준 <12% 위기 단계",
      "임플란트 41% 편중 = 1회성 고단가 의존 — 경기 민감 리스크 최고",
      "상류 지표: 리콜 성공률·재내원율이 예방 매출을 직접 결정",
      "(전체 매출 중 스케일링·정기 검진 같은 예방·리콜 진료의 비중이 6.2%밖에 안 돼요. 이 숫자가 12% 밑이면 위기 구간입니다. 지금 임플란트 같은 큰 진료가 매출의 41%를 차지하고 있어서, 경기가 흔들리거나 임플란트 환자가 잠깐만 안 와도 매출이 크게 흔들려요. 예방·리콜 진료 비중을 키우는 게 병원을 튼튼하게 만드는 지름길입니다.)",
    ],
    solution: [
      "① 오늘: 예방 패키지(스케일링+X-ray+구강 검사) 상품 즉시 설계",
      "② 이번 주: 기존 환자 전원 대상 연 2회 예방 예약 자동 등록",
      "③ 이번 달: 예방 수익 월 300만 원 목표 설정 및 추적",
    ],
    effect: [
      "예방 12% 달성 시 월 정기 수익 942만 원 확보",
      "18% 달성 시 월 1,413만 원 — 임플란트 의존도 60% 감소",
      "정기 수익 확보 = 불황 저항력 강화 + 클리닉 기업가치 상승",
    ],
    action: "예방 패키지 상품 오늘 설계",
    judgeType: "REL",
    isResultMetric: false,
    upstreamKpiKeys: ["recallRate", "returnRate"],
  },
  // HR × 재무 크로스 지표 — 인건비 자체는 HR 패널에서 관리하되,
  // 인건비가 실제로 얼마의 순이익을 창출하는지는 재무 심층에서 판정.
  laborProfitRatio: {
    analysis: [
      "현재 0.48x — 인건비 1원당 순이익 48원 창출 (안정기 목표 ≥ 1.0x 대비 절반)",
      "인건비 비율 자체(35.4%)는 경고 수준이지만 순이익 창출 배수는 더 심각",
      "원인: 순이익률 하락(17.0%, 5%p↓) + 인건비 초과분 380만 원 동반 발생",
      "(스태프에게 인건비 100원 나갈 때 순이익은 48원만 남아요. 안정된 병원은 인건비만큼 순이익이 남아야(1.0배) 스태프 1명을 추가 채용해도 병원이 손해 안 봅니다. 지금 절반 수준이라 확장·채용은 이른 시점이에요. 원인은 인건비 자체보다 순이익률이 3개월째 하락 중이라는 점이라, 리콜·재내원 회복이 배수 개선의 핵심입니다.)",
    ],
    solution: [
      "① 오늘: 인건비 초과분 380만 원 원인 = 목요일 오후 초과근무 3건 즉시 재배정",
      "② 이번 주: 리콜/예방 매출 축 강화로 순이익률 회복 (인건비 조정 없이 배수 개선)",
      "③ 다음 달: 배수 0.6x 목표 (인건비 유지 + 순이익 300만 회복)",
    ],
    effect: [
      "배수 0.6x 달성 시 인당 순이익 250만 원 회복",
      "배수 1.0x = 안정기 진입 · 스태프 1인 추가 채용 시 순이익 방어 가능",
      "장기: 배수 1.5x 이상 = 확장 투자·분원 검토 근거",
    ],
    action: "초과근무 재배정 · 리콜 캠페인 병행",
    judgeType: "REL",
    isResultMetric: true,
    upstreamKpiKeys: ["netProfit", "laborCost"],
  },
  perStaffProfit: {
    analysis: [
      "이번 달 인당 순이익 167만 원 (스태프 8명 기준)",
      "안정기 병원 벤치마크(월 200만 원/인) 대비 -33만 원 · 3개월 연속 하락",
      "체어 6대 · 스태프 8명 구조에서 신규 채용 여력 없음 — 생산성 개선이 유일 지렛대",
      "(스태프 8명 각자가 이번 달에 원장님 통장에 들어올 순이익을 167만 원씩 만든 셈이에요. 다른 안정된 병원은 인당 200만 원을 목표로 하는데, 지금 33만 원 부족합니다. 이 숫자가 3개월째 떨어지고 있어서, 스태프를 더 뽑기 전에 지금 팀의 생산성을 먼저 회복해야 해요. 체어 회전을 높이고 환자 대기시간을 줄이면 인건비 그대로 놔둔 채 인당 순이익만 끌어올릴 수 있습니다.)",
    ],
    solution: [
      "① 이번 주: 대기시간 22분 → 12분 단축 (Lean 낭비 제거)",
      "② 이번 달: 체어 회전 55% → 80% (TOC 병목 해소)",
      "③ 분기: 인당 순이익 200만/인 목표",
    ],
    effect: [
      "체어 회전 25%p 개선 시 월 순이익 320만 추가 → 인당 순이익 +40만/인 → 약 207만 원",
      "대기시간 단축 시 NPS 동반 상승 → 재내원율 유지",
      "인당 순이익 250만 원/인 = 스태프 1명 추가 채용 손익분기 확보",
    ],
    action: "체어 회전율 개선 즉시 시작",
    judgeType: "REL",
    isResultMetric: true,
    upstreamKpiKeys: ["chairUtil", "hourlyProd"],
  },
};

// ─────────────────────────────────────────────
// 원장 동기화 → KPI 기준값 자동 조정
// ─────────────────────────────────────────────
type DoctorProfileInput = {
  speedSlider: number;
  communicationSlider: number;
  chairSlider: number;
  managementType: "A" | "B" | null;
};

function getAdjustedBenchmarks(p: DoctorProfileInput) {
  const { speedSlider, communicationSlider, chairSlider, managementType } = p;

  // 인건비 비율 기준
  // A(공격적 확장): 성장 위해 인건비 27%까지 허용
  // B(고정비 절감): 22%로 엄격 관리
  const laborCost =
    managementType === "A" ? 27 :
    managementType === "B" ? 22 : 25;

  // 노쇼율 기준
  // chairSlider 낮음(다수체어 동시): 공백 타격 크므로 3%로 엄격
  // chairSlider 높음(소수 집중): 5%까지 허용
  const noShow =
    chairSlider < 0.35 ? 3 :
    chairSlider > 0.65 ? 5 : 4;

  // 상담 동의율 기준
  // communicationSlider 높음(정서교감 긴 상담): 75% 목표 (충분히 소통하므로)
  // communicationSlider 낮음(핵심 간결): 65%
  const caseAcceptance =
    communicationSlider > 0.65 ? 75 :
    communicationSlider < 0.35 ? 65 : 70;

  // 당일 취소율 기준 — Lean 무결점 기준 적용 (기본 ≤3%)
  // chairSlider 낮음(다수체어): 빈 체어 리스크 크므로 2%로 엄격
  // chairSlider 높음(소수집중): 4%까지 허용
  const cancelRate =
    chairSlider < 0.35 ? 2 :
    chairSlider > 0.65 ? 4 : 3;

  // 미수금 비율 기준 — Cash Flow Optimization 기준 적용 (기본 ≤1.5%)
  // B(고정비 절감 · 내실 중심): 1.0%로 엄격
  // A(공격적 확장): 2.0%까지 허용
  const uncollected =
    managementType === "B" ? 1.0 :
    managementType === "A" ? 2.0 : 1.5;

  // 체어 가동률 기준 — Lean Healthcare TPS 기준 적용 (기본 ≥88%)
  // speedSlider 낮음(신속): 90% 목표
  // speedSlider 높음(꼼꼼): 85%
  const chairUtil =
    speedSlider < 0.35 ? 90 :
    speedSlider > 0.65 ? 85 : 88;

  // 대기시간 기준 — Lean 7대 낭비 기준 적용 (기본 ≤10분)
  // speedSlider 낮음(신속): 8분
  // speedSlider 높음(꼼꼼): 15분 허용
  const waitTime =
    speedSlider < 0.35 ? 8 :
    speedSlider > 0.65 ? 15 : 10;

  // 재내원율 기준 — NRR 방법론 적용 (기본 ≥75%)
  // B(내실 리콜 중심): 78%로 엄격
  // A(마케팅형): 68%
  const recallRate =
    managementType === "B" ? 78 :
    managementType === "A" ? 68 : 75;

  // 신환 수 최소 기준 — Growth Accounting 적용 (기본 ≥30명)
  // A(공격적 확장): 35명
  // B(내실): 25명
  const newPatientsMin =
    managementType === "A" ? 35 :
    managementType === "B" ? 25 : 30;

  return { laborCost, noShow, caseAcceptance, cancelRate, uncollected, chairUtil, waitTime, recallRate, newPatientsMin };
}

function isProfileCustomized(p: DoctorProfileInput) {
  return p.managementType !== null || p.speedSlider !== 0.5 || p.communicationSlider !== 0.5 || p.chairSlider !== 0.5;
}

function profileLabel(p: DoctorProfileInput): string {
  const parts: string[] = [];
  if (p.managementType === "A") parts.push("A타입·공격적 확장");
  if (p.managementType === "B") parts.push("B타입·고정비 절감");
  if (p.speedSlider < 0.35) parts.push("신속 진료");
  if (p.speedSlider > 0.65) parts.push("꼼꼼 안정");
  if (p.chairSlider < 0.35) parts.push("다수체어");
  if (p.chairSlider > 0.65) parts.push("소수집중");
  if (p.communicationSlider > 0.65) parts.push("정서교감");
  return parts.length ? parts.join(" · ") : "";
}

function formatKRW(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.round(n / 10000)}만 원`;
  return `${n.toLocaleString()}원`;
}

function HRBarChart({ data }: { data: HrPeriodData["bars"] }) {
  const maxVal = Math.max(...data.map((d) => d.revenue));
  const chartW = SCREEN_WIDTH - 80;
  const chartH = 100;
  const barW = (chartW / data.length) * 0.35;
  const gap = chartW / data.length;
  return (
    <Svg width={chartW} height={chartH + 24} viewBox={`0 0 ${chartW} ${chartH + 24}`} style={{ width: chartW, height: chartH + 24 }}>
      {data.map((d, i) => {
        const revH = (d.revenue / maxVal) * chartH;
        const salH = (d.salary / maxVal) * chartH;
        const x = i * gap + gap * 0.1;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={chartH - revH} width={barW} height={revH} fill="#33A6FF66" rx={3} />
            <Rect x={x + barW + 4} y={chartH - salH} width={barW} height={salH} fill="#FFB30099" rx={3} />
            <SvgText x={x + barW} y={chartH + 16} fontSize={9} fill="#94A3B8" textAnchor="middle">{d.label}</SvgText>
          </React.Fragment>
        );
      })}
      <Line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#E8EDF5" strokeWidth={1} />
    </Svg>
  );
}

function NoShowChart({ data }: { data: FinancePeriodData["noShowTrend"] }) {
  const chartW = SCREEN_WIDTH - 80;
  const chartH = 80;
  const maxVal = Math.max(...data.map((d) => d.rate), 1);
  const points = data.map((d, i) => ({ x: (i / Math.max(data.length - 1, 1)) * chartW, y: chartH - (d.rate / maxVal) * chartH }));
  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`), "");
  return (
    <Svg width={chartW} height={chartH + 20} viewBox={`0 0 ${chartW} ${chartH + 20}`} style={{ width: chartW, height: chartH + 20 }}>
      <Path d={pathD} stroke="#FF3B30" strokeWidth={2} fill="none" />
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Rect x={p.x - 3} y={p.y - 3} width={6} height={6} rx={3} fill="#FF3B30" />
          <SvgText x={i * (chartW / Math.max(data.length - 1, 1))} y={chartH + 16} fontSize={9} fill="#94A3B8" textAnchor="middle">{data[i].label}</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

function DualAxisChart({ chartData }: { chartData: { time: string; waitMin: number; consultRate: number }[] }) {
  const chartW = SCREEN_WIDTH - 100;
  const chartH = 120;
  const maxWait = Math.max(...chartData.map((d) => d.waitMin));
  const gap = chartW / (chartData.length - 1 || 1);
  const ratePoints = chartData.map((d, i) => ({ x: i * gap, y: chartH - (d.consultRate / 100) * chartH }));
  const ratePath = ratePoints.reduce((acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`), "");
  return (
    <Svg width={chartW} height={chartH + 20} viewBox={`0 0 ${chartW} ${chartH + 20}`} style={{ width: chartW, height: chartH + 20 }}>
      {chartData.map((d, i) => {
        const barH = (d.waitMin / maxWait) * chartH;
        const barW = Math.max(14, gap * 0.4);
        return <Rect key={i} x={i * gap - barW / 2} y={chartH - barH} width={barW} height={barH} fill="#33A6FF44" rx={3} />;
      })}
      <Path d={ratePath} stroke="#FFB300" strokeWidth={2} fill="none" />
      {ratePoints.map((p, i) => (
        <React.Fragment key={i}>
          <Rect x={p.x - 3} y={p.y - 3} width={6} height={6} rx={3} fill="#FFB300" />
          <SvgText x={i * gap} y={chartH + 16} fontSize={9} fill="#94A3B8" textAnchor="middle">{chartData[i].time}</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { period, setPeriod, clinicName, logout, isAuthenticated, hasSeenIntro, doctorProfile } = useAppContext();

  // 원장 동기화 데이터 → KPI 기준값 자동 조정
  const adj = getAdjustedBenchmarks(doctorProfile);
  const profileCustomized = isProfileCustomized(doctorProfile);

  // period-scoped top3 currents overlay on the canonical benchmark row
  const top3Snapshot = new Map(KPI_TOP3_BY_PERIOD[period].map((s) => [s.id, s.current]));
  const adjustedTop3 = KPI_BENCHMARKS.top3.map(kpi => {
    const scopedCurrent = top3Snapshot.get(kpi.id) ?? kpi.current;
    const base = { ...kpi, current: scopedCurrent };
    if (kpi.id === "laborCost") return { ...base, benchmark: adj.laborCost, benchmarkLabel: `≤ ${adj.laborCost}%` };
    if (kpi.id === "noShow") return { ...base, benchmark: adj.noShow, benchmarkLabel: `≤ ${adj.noShow}%` };
    if (kpi.id === "caseAcceptance") return { ...base, benchmark: adj.caseAcceptance, benchmarkLabel: `≥ ${adj.caseAcceptance}%` };
    return base;
  });

  // period-scoped snapshot merged over canonical 20-KPI rows for the
  // evidence modal — canonical stays untouched for settings/help pages.
  const all20Snapshot = new Map(KPI_ALL20_BY_PERIOD[period].map((s) => [s.id, s]));
  const all20ForPeriod = KPI_BENCHMARKS.all20.map((k) => {
    const snap = all20Snapshot.get(k.id);
    return snap ? { ...k, current: snap.current, status: snap.status } : k;
  });

  const extraByPeriod = KPI_EXTRA_CRISIS_BY_PERIOD[period];
  const adjustedExtraKpis = EXTRA_CRISIS_KPIS.map(kpi => {
    const scopedCurrent = extraByPeriod[kpi.id] ?? kpi.current;
    const base = { ...kpi, current: scopedCurrent };
    if (kpi.id === "cancelRate") return { ...base, benchmark: adj.cancelRate, benchmarkLabel: `≤ ${adj.cancelRate}%` };
    if (kpi.id === "uncollected") return { ...base, benchmark: adj.uncollected, benchmarkLabel: `≤ ${adj.uncollected}%` };
    return base;
  });

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!hasSeenIntro || !isAuthenticated) {
      router.replace("/intro");
    }
  }, [hasSeenIntro, isAuthenticated]);

  // Period-scoped mock data — swaps in real time when the user taps
  // 오늘/이번 주/이번 달/분기 in the top filter row.
  const hr = HR_DATA_BY_PERIOD[period];
  const finance = FINANCE_DATA_BY_PERIOD[period];

  // ── 20개 지표 통합분석 결과 (재무 심층 상단) ─────
  const all20Snap = KPI_ALL20_BY_PERIOD[period];
  const axisScores = computeAxisScores(all20Snap);
  const rootCause = pickRootCause(all20Snap, KPI_BENCHMARKS.all20, ALL20_KEY_MAP);
  const rootCauseCanonical = rootCause
    ? KPI_BENCHMARKS.all20.find((k) => k.id === rootCause.kpiId) ?? null
    : null;
  const rootCauseSnap = rootCause ? all20Snap.find((s) => s.id === rootCause.kpiId) ?? null : null;

  // 재무 심층 카드가 처방 modal에 넘길 kpi 메타. modal은 numeric
  // current 및 benchmark를 요구하므로 finance 데이터를 numeric shape로 변환.
  const FINANCE_KPIS: { id: string; name: string; unit: string; current: number; benchmark: number; direction: "lower" | "higher"; benchmarkLabel: string }[] = [
    { id: "ltvCac",       name: "LTV:CAC 비율",       unit: "x",     current: finance.ltvCac.current,          benchmark: 3,   direction: "higher", benchmarkLabel: "≥ 3x" },
    { id: "netProfit",    name: "월 순이익률",        unit: "%",     current: finance.netProfit.latest,        benchmark: finance.netProfit.benchmark, direction: "higher", benchmarkLabel: `≥ ${finance.netProfit.benchmark}%` },
    { id: "returnRate",   name: "재내원율",           unit: "%",     current: finance.retention.returnRate,    benchmark: 70,  direction: "higher", benchmarkLabel: "≥ 70%" },
    { id: "recallRate",   name: "리콜 성공률",        unit: "%",     current: finance.retention.recallRate,    benchmark: 70,  direction: "higher", benchmarkLabel: "≥ 70%" },
    { id: "preventiveRecall", name: "예방·리콜 매출 비중", unit: "%", current: finance.retention.preventiveRatio, benchmark: 18, direction: "higher", benchmarkLabel: "≥ 18%" },
    { id: "cancelRate",   name: "당일 취소율",        unit: "%",     current: finance.cancelRate.current,      benchmark: 3,   direction: "lower",  benchmarkLabel: "≤ 3%" },
    { id: "uncollected",  name: "미수금 비율",        unit: "만 원",  current: Math.round(finance.uncollected.total / 10_000), benchmark: 0, direction: "lower", benchmarkLabel: `≤ 총 매출의 1.5%` },
    { id: "laborProfitRatio", name: "인건비 대비 순이익 배수", unit: "x", current: finance.laborProfitRatio.current, benchmark: finance.laborProfitRatio.benchmark, direction: "higher", benchmarkLabel: `≥ ${finance.laborProfitRatio.benchmark.toFixed(1)}x` },
    { id: "perStaffProfit",   name: "인당 창출 순이익",    unit: "만 원", current: finance.perStaffProfit.current,  benchmark: finance.perStaffProfit.benchmark, direction: "higher", benchmarkLabel: `≥ ${finance.perStaffProfit.benchmark}만 원` },
    // 기존 3카드 재활용
    { id: "noShow",       name: "노쇼율",             unit: "%",     current: finance.noShowLatest,            benchmark: 4,   direction: "lower",  benchmarkLabel: "≤ 4%" },
    { id: "bepDay",       name: "BEP 달성률",         unit: "%",     current: finance.bep.achievement,         benchmark: 100, direction: "higher", benchmarkLabel: "≥ 100%" },
    // caseAcceptance는 adjustedTop3에 이미 period-scoped current가 있음.
    // 여기 항목은 lookup fallback이 아예 안 걸릴 때의 안전값.
    { id: "caseAcceptance", name: "상담 동의율",       unit: "%",     current: KPI_TOP3_BY_PERIOD[period].find(t => t.id === "caseAcceptance")?.current ?? 52, benchmark: 70, direction: "higher", benchmarkLabel: "≥ 70%" },
  ];

  const [activePanel, setActivePanel] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [scoreExplainerOpen, setScoreExplainerOpen] = useState(false);
  const [expandedCrisis, setExpandedCrisis] = useState<Set<string>>(new Set());
  const [prescriptionKpi, setPrescriptionKpi] = useState<string | null>(null);
  const prescriptionAnim = useRef(new Animated.Value(0)).current;

  const openKpiPrescription = (id: string) => {
    setPrescriptionKpi(id);
    Animated.spring(prescriptionAnim, { toValue: 1, useNativeDriver: Platform.OS !== "web", tension: 65, friction: 11 }).start();
  };
  const closeKpiPrescription = () => {
    Animated.timing(prescriptionAnim, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== "web" }).start(() => setPrescriptionKpi(null));
  };
  const [prescription, setPrescription] = useState(PRESCRIPTIONS[period]);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationDone, setSimulationDone] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceParsed, setVoiceParsed] = useState<null | { transactions: { category: string; target_staff: string | null; account_title: string; amount: number; note: string }[] }>(null);

  const evidenceAnim = useRef(new Animated.Value(0)).current;
  const simAnim = useRef(new Animated.Value(0)).current;
  const voiceAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false }), 100); }, []);
  useEffect(() => { loadPrescription(period); }, [period]);

  const loadPrescription = async (p: Period) => {
    setAiLoading(true);
    setSimulationDone(false);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error("no domain");
      const res = await fetch(`https://${domain}/api/ai/prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: p,
          clinicData: { name: clinicName, appointments: [{ noShowRate: 8.7, overflowDays: ["목요일"] }], finance: { monthlyRevenue: 78500000, salaryCost: 27800000, fixedCost: 9800000 }, staff: { totalCount: 8, overtimeCount: 2, burnoutRisk: true } },
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.conclusion) setPrescription({ ...PRESCRIPTIONS[p], ...data });
      else setPrescription(PRESCRIPTIONS[p]);
    } catch { setPrescription(PRESCRIPTIONS[p]); }
    finally { setAiLoading(false); }
  };

  const openEvidence = () => {
    setShowEvidence(true);
    Animated.spring(evidenceAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const closeEvidence = () => Animated.timing(evidenceAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setShowEvidence(false));

  const openSimulation = () => {
    setShowSimulation(true);
    Animated.spring(simAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const closeSimulation = () => Animated.timing(simAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setShowSimulation(false));

  const executeAction = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSimulationDone(true);
  };

  const startVoice = () => {
    setVoiceRecording(true);
    setVoiceParsed(null);
    setShowVoice(true);
    Animated.spring(voiceAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(waveAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ])).start();
  };

  const stopVoice = async () => {
    setVoiceRecording(false);
    waveAnim.stopAnimation();
    const example = VOICE_PARSE_EXAMPLES[0];
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error();
      const res = await fetch(`https://${domain}/api/ai/voice-parse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: example.input }) });
      if (!res.ok) throw new Error();
      setVoiceParsed(await res.json());
    } catch { setVoiceParsed(example.output as any); }
  };

  const closeVoice = () => {
    Animated.timing(voiceAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => { setShowVoice(false); setVoiceParsed(null); setVoiceRecording(false); });
  };

  const p = prescription;
  const statusColor = STATUS_COLORS[p?.status ?? "warning"];
  const sim = p?.simulation;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Image source={require("@/assets/images/logo.png")} style={styles.headerLogo} contentFit="contain" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>{clinicName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push("/daily-receipt")} style={styles.headerBtn}>
            <Feather name="file-plus" size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/settings" as any)} style={styles.headerBtn}>
            <Feather name="settings" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Period Filter */}
      <View style={styles.periodRow}>
        {PERIOD_LABELS.map(({ key, label }) => (
          <TouchableOpacity key={key} style={[styles.periodBtn, period === key && styles.periodBtnActive]} onPress={() => { setPeriod(key); Haptics.selectionAsync(); }} activeOpacity={0.75}>
            <Text style={[styles.periodLabel, period === key && styles.periodLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Panel Dots */}
      <View style={styles.panelDots}>
        {[0, 1, 2].map((i) => (
          <TouchableOpacity key={i} onPress={() => scrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true })}>
            <View style={[styles.dot, activePanel === i && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* 3 Panels */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          // Web has no momentum-end event on mouse/trackpad scroll, so drive
          // the dot indicator off every scroll frame; the guard keeps native
          // rerenders bounded.
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (idx !== activePanel && idx >= 0 && idx <= 2) setActivePanel(idx);
        }}
        onMomentumScrollEnd={(e) => setActivePanel(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        style={styles.panelScroll}
      >
        {/* LEFT: HR */}
        <View style={[styles.panel, { width: SCREEN_WIDTH }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Feather name="users" size={18} color="#33A6FF" />
              <Text style={styles.panelTitle}>스마트 HR 관제</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardLabel}>{PERIOD_PREFIX[period]} 인건비 집행율</Text>
                  <Text style={[styles.cardBigNum, { color: hr.salaryRatio > 30 ? "#FFB300" : "#33A6FF" }]}>{hr.salaryRatio}%</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardLabel}>실지출</Text>
                  <Text style={styles.cardMidNum}>{formatKRW(hr.salaryActual)}</Text>
                  <Text style={styles.cardSubNum}>예산 {formatKRW(hr.salaryBudget)}</Text>
                </View>
              </View>
              <View style={styles.barWrap}>
                <View style={[styles.barFill, { width: `${Math.min(hr.salaryRatio, 100)}%` as any, backgroundColor: hr.salaryRatio > 30 ? "#FFB300" : "#33A6FF" }]} />
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#33A6FF66" }]} /><Text style={styles.legendText}>매출</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#FFB30099" }]} /><Text style={styles.legendText}>인건비</Text></View>
              </View>
              <HRBarChart data={hr.bars} />
              <Text style={styles.chartCaption}>{hr.barsCaption}</Text>
            </View>
            <Text style={styles.sectionTitle}>근태 리스크 알림</Text>
            {hr.staffList.map((s, i) => (
              <View key={i} style={[styles.staffCard, s.riskLevel === "critical" && styles.staffCardCritical, s.riskLevel === "warning" && styles.staffCardWarning]}>
                <View style={[styles.riskDot, { backgroundColor: s.riskLevel === "critical" ? "#FF3B30" : s.riskLevel === "warning" ? "#FFB300" : "#00C853" }]} />
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{s.name}</Text>
                  <Text style={styles.staffPos}>{s.position} · 연속 {s.consecutiveDays}일 근무</Text>
                </View>
                {s.overtime && <View style={styles.overtimeBadge}><Text style={styles.overtimeText}>초과근무</Text></View>}
              </View>
            ))}
            <TouchableOpacity style={styles.voiceInputBtn} onPress={startVoice} activeOpacity={0.8}>
              <Feather name="mic" size={18} color="#33A6FF" />
              <Text style={styles.voiceInputText}>음성으로 지출 등록</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* CENTER: 위기 경보 관제탑 */}
        <View style={[styles.panel, { width: SCREEN_WIDTH }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
            {aiLoading ? (
              <View style={styles.loadingBlock}>
                <View style={styles.aiSpinner}><Feather name="cpu" size={28} color="#33A6FF" /></View>
                <Text style={styles.loadingText}>AI 위기 분석 중...</Text>
                <Text style={styles.loadingSubtext}>20대 KPI 벤치마크 실시간 연산 중</Text>
              </View>
            ) : (() => {
              const isCrisis = (kpi: { current: number; benchmark: number; direction: string }) => {
                const ok = kpi.direction === "lower" ? kpi.current <= kpi.benchmark : kpi.current >= kpi.benchmark;
                const mild = kpi.direction === "lower" ? kpi.current <= kpi.benchmark * 1.3 : kpi.current >= kpi.benchmark * 0.8;
                return !ok && !mild;
              };

              // Priority: 1=가장 급함+효과 큼, 숫자 낮을수록 위
              const CRISIS_PRIORITY: Record<string, number> = {
                laborCost: 1, caseAcceptance: 2, noShow: 3, cancelRate: 4, uncollected: 5,
              };
              const allCrisisKpis = [
                ...adjustedTop3.filter(isCrisis),
                ...adjustedExtraKpis.filter(isCrisis),
              ].sort((a, b) => (CRISIS_PRIORITY[a.id] ?? 99) - (CRISIS_PRIORITY[b.id] ?? 99));

              return (
                <>
                  {/* 위기 경보 헤더 */}
                  <View style={styles.crisisBanner}>
                    <View style={styles.crisisBannerLeft}>
                      <Text style={styles.crisisBannerIcon}>🚨</Text>
                      <View>
                        <Text style={styles.crisisBannerTitle}>{PERIOD_PREFIX[period]} 위기 {allCrisisKpis.length}건</Text>
                        {profileCustomized && (
                          <Text style={styles.crisisBannerSub}>
                            ⚙ 원장 맞춤 기준 · {profileLabel(doctorProfile)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.crisisBannerCount}>
                      <Text style={styles.crisisBannerNum}>{allCrisisKpis.length}</Text>
                    </View>
                  </View>

                  {/* 위기 KPI 카드 — 접기/펼치기 */}
                  {allCrisisKpis.map((kpi) => {
                    const gap = kpi.direction === "lower"
                      ? `+${(kpi.current - kpi.benchmark).toFixed(1)}${kpi.unit} 초과`
                      : `-${(kpi.benchmark - kpi.current).toFixed(0)}${kpi.unit} 부족`;
                    const isExpanded = expandedCrisis.has(kpi.id);
                    const toggleExpand = () => setExpandedCrisis(prev => {
                      const next = new Set(prev);
                      next.has(kpi.id) ? next.delete(kpi.id) : next.add(kpi.id);
                      return next;
                    });
                    return (
                      <TouchableOpacity key={kpi.id} style={styles.crisisCard} onPress={toggleExpand} activeOpacity={0.92}>
                        <View style={styles.crisisCardTop}>
                          <View style={styles.crisisCardLeft}>
                            <View style={styles.crisisBadge}>
                              <Text style={styles.crisisBadgeText}>🚨 위기</Text>
                            </View>
                            <Text style={styles.crisisKpiName}>{kpi.name}</Text>
                          </View>
                          <View style={styles.crisisCardRight}>
                            <Text style={styles.crisisValue}>{kpi.current}{kpi.unit}</Text>
                            <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#FF3B30" />
                          </View>
                        </View>
                        {isExpanded && (
                          <>
                            <Text style={styles.crisisGap}>{gap} · 기준 {kpi.benchmarkLabel}</Text>
                            <View style={[styles.crisisBarWrap, { marginTop: 10 }]}>
                              <View style={[styles.crisisBarFill, {
                                width: `${Math.min(kpi.direction === "lower" ? (kpi.current / (kpi.benchmark * 1.5)) : (kpi.current / (kpi.benchmark * 1.2)), 1) * 100}%` as any
                              }]} />
                            </View>
                            <Text style={styles.crisisImpact}>📌 {kpi.impact}</Text>
                            <TouchableOpacity style={styles.crisisActionBtn} onPress={() => openKpiPrescription(kpi.id)} activeOpacity={0.85}>
                              <Feather name="file-text" size={16} color="#fff" />
                              <Text style={styles.crisisActionText}>처방전 보기</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* 매출 · 순수익 카드 */}
                  <View style={styles.revenueRow}>
                    <View style={styles.revenueCard}>
                      <Text style={styles.revenueLabel}>{PERIOD_PREFIX[period]} 매출</Text>
                      <Text style={styles.revenueValue}>{formatKRW(hr.totalRevenue)}</Text>
                      <Text style={styles.revenueSub}>전 {PERIOD_PREFIX[period].replace("의", "")} 대비 +3.2%</Text>
                    </View>
                    <View style={[styles.revenueCard, { borderColor: "#00C853" }]}>
                      <Text style={styles.revenueLabel}>순수익</Text>
                      <Text style={[styles.revenueValue, { color: "#00C853" }]}>{formatKRW(Math.round(hr.totalRevenue * 0.17))}</Text>
                      <Text style={styles.revenueSub}>순이익률 17.0%</Text>
                    </View>
                  </View>

                  {/* 20개 경영지표 확인 */}
                  <TouchableOpacity style={styles.fullPrescriptionBtn} onPress={openEvidence} activeOpacity={0.85}>
                    <Feather name="bar-chart-2" size={16} color="#64748B" />
                    <Text style={styles.fullPrescriptionText}>20개 경영지표 확인하기</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </ScrollView>
        </View>

        {/* RIGHT: Finance — 20개 지표 통합분석 + 3섹션 재무 심층 */}
        <View style={[styles.panel, { width: SCREEN_WIDTH }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Feather name="trending-up" size={18} color="#FF3B30" />
              <Text style={styles.panelTitle}>재무 & 심층 분석</Text>
            </View>

            {/* ── 종합 진단 헤더 (20개 지표 통합) ─────────────── */}
            <OverallVerdictHeader
              scores={axisScores}
              verdict={finance.overallVerdict}
              rootCause={rootCause}
              rootCauseName={rootCauseCanonical?.name ?? null}
              rootCauseCurrent={rootCauseSnap?.current ?? null}
              rootCauseReason={finance.rootCauseReason}
              onPressOverall={() => openKpiPrescription("overall")}
              onPressRootCause={() => rootCause && openKpiPrescription(rootCause.kpiKey)}
              onPressExplainScore={() => setScoreExplainerOpen(true)}
            />

            {/* ═══ 섹션 1: 수익성 (Unit Economics) ══════════════ */}
            <SectionHeader title="수익성" framework="Unit Economics (a16z 2024)" score={axisScores.profitability} onPressExplain={() => setScoreExplainerOpen(true)} />
            <InsightCard tone="profit" text={finance.profitabilityInsight} />

            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openKpiPrescription("ltvCac")}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardLabel}>LTV : CAC 비율</Text>
                <Feather name="chevron-right" size={14} color="#CBD5E1" />
              </View>
              <LtvCacGauge current={finance.ltvCac.current} ltv={finance.ltvCac.ltv} cac={finance.ltvCac.cac} payback={finance.ltvCac.payback} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openKpiPrescription("bepDay")}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardLabel}>BEP 달성률</Text>
                <Feather name="chevron-right" size={14} color="#CBD5E1" />
              </View>
              <Text style={[styles.cardBigNum, { color: "#00C853" }]}>{finance.bep.achievement}%</Text>
              <View style={styles.barWrap}><View style={[styles.barFill, { width: `${Math.min(finance.bep.achievement, 100)}%` as any, backgroundColor: "#00C853" }]} /></View>
              <Text style={styles.bepText}>목표 {formatKRW(finance.bep.target)} · 현재 {formatKRW(finance.bep.current)}</Text>
              <Text style={styles.chartCaption}>{finance.bepCaption}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openKpiPrescription("netProfit")}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardLabel}>월 순이익률 추이</Text>
                <Feather name="chevron-right" size={14} color="#CBD5E1" />
              </View>
              <Text style={[styles.cardBigNum, { color: finance.netProfit.latest >= finance.netProfit.benchmark ? "#00C853" : "#FFB300", fontSize: 24 }]}>
                {finance.netProfit.latest}%
              </Text>
              <AxisTrendLine
                data={finance.netProfit.trend}
                color={finance.netProfit.latest >= finance.netProfit.benchmark ? "#00C853" : "#FFB300"}
                benchmark={finance.netProfit.benchmark}
                benchmarkLabel={`벤치 ${finance.netProfit.benchmark}%`}
                width={SCREEN_WIDTH - 80}
              />
              <Text style={styles.chartCaption}>연차 대비 목표 {finance.netProfit.benchmark}% · 현재 {finance.netProfit.latest}%</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>HR × 재무 크로스</Text>
              <LaborCrossCard
                laborProfitRatio={finance.laborProfitRatio}
                perStaffProfit={finance.perStaffProfit}
                onPressLaborRatio={() => openKpiPrescription("laborProfitRatio")}
                onPressPerStaff={() => openKpiPrescription("perStaffProfit")}
              />
              <Text style={styles.chartCaption}>인건비 자체는 좌측 HR 관제 · 여기는 순이익 창출 관점</Text>
            </View>

            {/* ═══ 섹션 2: 유지 (유지 경제학 · Value-Based Care) ═══════ */}
            <SectionHeader title="유지" framework="유지 경제학 · Value-Based Care" score={axisScores.retention} onPressExplain={() => setScoreExplainerOpen(true)} />
            <InsightCard tone="retention" text={finance.retentionInsight} />

            <View style={styles.card}>
              <Text style={styles.cardLabel}>재내원·리콜·예방 트리오</Text>
              <RetentionTrio
                returnRate={finance.retention.returnRate}
                recallRate={finance.retention.recallRate}
                preventiveRatio={finance.retention.preventiveRatio}
                onPressKey={(k) => openKpiPrescription(k)}
              />
              <Text style={styles.chartCaption}>리콜 성공률이 재내원율의 upstream · 여기부터 개선</Text>
            </View>

            {/* ═══ 섹션 3: 리스크·현금 (Lean · 재무 기본) ═══════ */}
            <SectionHeader title="리스크·현금" framework="Lean Healthcare · 재무 기본" score={axisScores.risk} onPressExplain={() => setScoreExplainerOpen(true)} />
            <InsightCard tone="risk" text={finance.riskInsight} />

            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openKpiPrescription("noShow")}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardLabel}>노쇼(No-Show) 추이</Text>
                <Feather name="chevron-right" size={14} color="#CBD5E1" />
              </View>
              <Text style={[styles.cardBigNum, { color: "#FF3B30", fontSize: 24 }]}>{finance.noShowLatest}% <Text style={{ color: "#FF3B30", fontSize: 16 }}>↑</Text></Text>
              <NoShowChart data={finance.noShowTrend} />
              <Text style={styles.chartCaption}>{finance.noShowCaption}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openKpiPrescription("cancelRate")}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardLabel}>당일 취소율 추이</Text>
                <Feather name="chevron-right" size={14} color="#CBD5E1" />
              </View>
              <Text style={[styles.cardBigNum, { color: "#FF3B30", fontSize: 24 }]}>{finance.cancelRate.current}%</Text>
              <AxisTrendLine
                data={finance.cancelRate.trend}
                color="#FF3B30"
                benchmark={3}
                benchmarkLabel="Lean ≤ 3%"
                width={SCREEN_WIDTH - 80}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openKpiPrescription("caseAcceptance")}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardLabel}>상담 거절 사유 분석</Text>
                <Feather name="chevron-right" size={14} color="#CBD5E1" />
              </View>
              {finance.rejectionReasons.map((r, i) => (
                <View key={i} style={styles.rejectRow}>
                  <Text style={styles.rejectLabel}>{r.reason}</Text>
                  <View style={styles.rejectBar}>
                    <View style={[styles.rejectFill, { width: `${r.percentage}%` as any, backgroundColor: i === 0 ? "#FF3B30" : i === 1 ? "#FFB300" : "#33A6FF" }]} />
                  </View>
                  <Text style={styles.rejectPct}>{r.percentage}%</Text>
                </View>
              ))}
              <Text style={styles.chartCaption}>{finance.rejectionSampleCaption}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openKpiPrescription("uncollected")}>
              <View style={styles.cardHeadRow}>
                <Text style={styles.cardLabel}>미수금 회수 파이프라인</Text>
                <Feather name="chevron-right" size={14} color="#CBD5E1" />
              </View>
              <UncollectedFunnel total={finance.uncollected.total} buckets={finance.uncollected.buckets} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Evidence Modal (Layer 2) */}
      {showEvidence && (
        <Animated.View style={[styles.evidenceModal, { transform: [{ translateY: evidenceAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] }]}>
          {Platform.OS !== "web" ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFFEE" }]} />
          )}
          <View style={styles.evidenceInner}>
            <View style={styles.evidenceHandle} />
            <View style={styles.evidenceHeader}>
              <Text style={styles.evidenceTitle}>20개 경영지표</Text>
              <TouchableOpacity onPress={closeEvidence}><Feather name="x" size={22} color="#94A3B8" /></TouchableOpacity>
            </View>
            <Text style={styles.kpiSubtitle}>건강보험심사평가원 2025 · 대한치과의사협회 2024 · ADA Health Policy Institute 2024 · Levin Group 2024</Text>
            <Text style={[styles.kpiSubtitle, { fontSize: 10, marginTop: 2, color: "#33A6FF" }]}>적용 방법론 · Unit Economics · Lean Healthcare(TPS) · Value-Based Care · Theory of Constraints · NRR</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {([
                { key: "warning",  label: "⚠ 경고",  color: "#FFB300", bg: "#FFF8E7", border: "#FFE0A0" },
                { key: "normal",   label: "✓ 정상",  color: "#33A6FF", bg: "#EBF5FF", border: "#C0DEFF" },
                { key: "best",     label: "★ 최상",  color: "#00C853", bg: "#EDFFF5", border: "#A7F3C8" },
              ] as const).map(group => {
                const items = all20ForPeriod.filter(k => k.status === group.key);
                if (items.length === 0) return null;
                return (
                  <View key={group.key} style={[styles.kpiGroup, { borderColor: group.border, backgroundColor: group.bg }]}>
                    <View style={styles.kpiGroupHeader}>
                      <Text style={[styles.kpiGroupLabel, { color: group.color }]}>{group.label}</Text>
                      <Text style={[styles.kpiGroupCount, { color: group.color }]}>{items.length}개</Text>
                    </View>
                    {items.map((item, i) => {
                      const kpiKey = ALL20_KEY_MAP[item.id];
                      const hasPrescription = kpiKey && (ALL20_PRESCRIPTIONS[kpiKey] || KPI_PRESCRIPTIONS[kpiKey]);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.kpiRow, i < items.length - 1 && styles.kpiRowBorder]}
                          onPress={() => hasPrescription && openKpiPrescription(kpiKey)}
                          activeOpacity={hasPrescription ? 0.7 : 1}
                        >
                          <View style={styles.kpiRowLeft}>
                            <Text style={styles.kpiRowName}>{item.name}</Text>
                            <Text style={styles.kpiRowBench}>기준 {item.benchmark}</Text>
                          </View>
                          <View style={styles.kpiRowRight}>
                            <Text style={[styles.kpiRowValue, { color: group.color }]}>{item.current}</Text>
                            {hasPrescription && <Feather name="chevron-right" size={14} color={group.color} style={{ opacity: 0.6 }} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {/* Simulation Popup (Layer 3) */}
      {showSimulation && (
        <View style={styles.simOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSimulation} activeOpacity={1} />
          <Animated.View style={[styles.simBox, { transform: [{ translateY: simAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
            <View style={styles.evidenceHandle} />
            <Text style={styles.simTitle}>실행 결과 시뮬레이션</Text>
            <Text style={styles.simSubtitle}>처방 집행 시 예측되는 Before → After</Text>
            {sim && (
              <View style={styles.simMetrics}>
                {[
                  { icon: "rotate-cw" as const, label: "체어 회전율", before: `${sim.chairRate.before}%`, after: `${sim.chairRate.after}% (+${sim.chairRate.after - sim.chairRate.before}%)`, color: "#33A6FF" },
                  { icon: "shield" as const, label: "고정비 방어액", before: "0원", after: `${formatKRW(sim.defense)} 방어`, color: "#33A6FF" },
                  { icon: "heart" as const, label: "스태프 피로도", before: "위험", after: sim.staffRisk, color: "#33A6FF" },
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.simDivider} />}
                    <View style={styles.simMetric}>
                      <Feather name={item.icon} size={18} color={item.color} />
                      <Text style={styles.simMetricLabel}>{item.label}</Text>
                      <View style={styles.simBeforeAfter}>
                        <Text style={styles.simBefore}>{item.before}</Text>
                        <Feather name="arrow-right" size={14} color="#94A3B8" />
                        <Text style={[styles.simAfter, { color: "#00C853" }]}>{item.after}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
            {!simulationDone ? (
              <TouchableOpacity style={styles.executeBtn} onPress={executeAction} activeOpacity={0.85}>
                <Text style={styles.executeBtnText}>확인 및 실행</Text>
                <Feather name="zap" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.executedBlock}>
                <Feather name="check-circle" size={28} color="#00C853" />
                <Text style={styles.executedText}>스케줄 재배치 완료!</Text>
                <TouchableOpacity onPress={closeSimulation} style={styles.closeBtn}><Text style={styles.closeBtnText}>닫기</Text></TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      )}

      {/* KPI 처방전 모달 */}
      {prescriptionKpi !== null && (() => {
        // 'overall' 특수 키는 mockData의 period 스코프 통합 처방을 사용.
        const isOverall = prescriptionKpi === "overall";
        const rx = isOverall
          ? finance.overallPrescription
          : (KPI_PRESCRIPTIONS[prescriptionKpi] ?? ALL20_PRESCRIPTIONS[prescriptionKpi]);
        const kpi: { name: string; unit: string; current: number | string; benchmark: number; direction: string; benchmarkLabel: string } | undefined =
          isOverall
            ? { name: "20개 지표 통합 처방", unit: "", current: `${axisScores.profitability}/${axisScores.retention}/${axisScores.risk}`, benchmark: 100, direction: "higher", benchmarkLabel: "3축 스코어" }
            : (adjustedTop3.find(k => k.id === prescriptionKpi)
               ?? adjustedExtraKpis.find(k => k.id === prescriptionKpi)
               ?? FINANCE_KPIS.find(k => k.id === prescriptionKpi));
        return (
          <View style={styles.simOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeKpiPrescription} activeOpacity={1} />
            <Animated.View style={[styles.rxSheet, { transform: [{ translateY: prescriptionAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] }]}>
              <View style={styles.evidenceHandle} />
              {/* 헤더 */}
              <View style={styles.rxHeader}>
                <View style={styles.crisisBadge}><Text style={styles.crisisBadgeText}>🚨 위기 처방전</Text></View>
                <Text style={styles.rxKpiName}>{kpi?.name}</Text>
                <Text style={[styles.crisisValue, { fontSize: 26 }]}>{kpi?.current}{kpi?.unit}</Text>
                {period !== "month" && !isOverall && (
                  <View style={styles.rxPeriodNotice}>
                    <Feather name="info" size={11} color="#8B5CF6" />
                    <Text style={styles.rxPeriodNoticeText}>
                      처방문은 이달 기준 예시입니다. 상단 값은 현재 선택하신 {PERIOD_LABELS.find(l => l.key === period)?.label} 기준.
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {/* 분석 내용 */}
                <View style={styles.rxSection}>
                  <View style={styles.rxSectionLabel}>
                    <Feather name="activity" size={14} color="#FF3B30" />
                    <Text style={styles.rxSectionTitle}>분석 내용</Text>
                  </View>
                  {rx?.analysis.map((item, i) => (
                    <View key={i} style={styles.rxBulletRow}>
                      <View style={[styles.rxBulletDot, { backgroundColor: "#FF3B30" }]} />
                      <Text style={styles.rxBulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* 해결책 */}
                <View style={styles.rxSection}>
                  <View style={styles.rxSectionLabel}>
                    <Feather name="tool" size={14} color="#33A6FF" />
                    <Text style={[styles.rxSectionTitle, { color: "#33A6FF" }]}>해결책</Text>
                  </View>
                  {rx?.solution.map((item, i) => (
                    <View key={i} style={styles.rxBulletRow}>
                      <View style={[styles.rxBulletDot, { backgroundColor: "#33A6FF" }]} />
                      <Text style={styles.rxBulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* 효과 */}
                <View style={styles.rxSection}>
                  <View style={styles.rxSectionLabel}>
                    <Feather name="trending-up" size={14} color="#00C853" />
                    <Text style={[styles.rxSectionTitle, { color: "#00C853" }]}>예상 효과</Text>
                  </View>
                  {rx?.effect.map((item, i) => (
                    <View key={i} style={styles.rxBulletRow}>
                      <View style={[styles.rxBulletDot, { backgroundColor: "#00C853" }]} />
                      <Text style={styles.rxBulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* 실행 버튼 */}
                <TouchableOpacity style={styles.rxActionBtn} onPress={closeKpiPrescription} activeOpacity={0.85}>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.rxActionText}>{rx?.action}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rxCancelBtn} onPress={closeKpiPrescription} activeOpacity={0.75}>
                  <Text style={styles.rxCancelText}>닫기</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        );
      })()}

      {/* Voice Memo Modal */}
      {showVoice && (
        <View style={styles.simOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeVoice} activeOpacity={1} />
          <Animated.View style={[styles.simBox, { transform: [{ translateY: voiceAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
            <View style={styles.evidenceHandle} />
            <Text style={styles.simTitle}>AI 경영 메모</Text>
            <Text style={styles.simSubtitle}>말씀하시면 자동으로 분류됩니다</Text>
            {voiceRecording && (
              <View style={styles.voiceActive}>
                <TouchableOpacity style={styles.micBtn} onPress={stopVoice} activeOpacity={0.85}>
                  <Animated.View style={{ opacity: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }}>
                    <Feather name="mic" size={36} color="#FF3B30" />
                  </Animated.View>
                </TouchableOpacity>
                <Text style={styles.recordingText}>녹음 중... 탭하여 중지</Text>
                <View style={styles.waveRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
                    <Animated.View key={i} style={[styles.waveBar, { height: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [8 + i * 4, 30 - i * 2] }), opacity: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) }]} />
                  ))}
                </View>
                <Text style={styles.voiceExample}>예: "김 실장 보너스 10만 원, 세탁비 3만 5천 원"</Text>
              </View>
            )}
            {!voiceRecording && !voiceParsed && (
              <TouchableOpacity style={styles.micStartBtn} onPress={() => setVoiceRecording(true)} activeOpacity={0.85}>
                <Feather name="mic" size={32} color="#fff" />
              </TouchableOpacity>
            )}
            {voiceParsed && (
              <View style={styles.parsedResult}>
                <View style={styles.parsedResultHeader}>
                  <Feather name="check-circle" size={16} color="#00C853" />
                  <Text style={styles.parsedResultTitle}>AI 파싱 완료</Text>
                </View>
                {voiceParsed.transactions.map((t, i) => (
                  <View key={i} style={styles.transRow}>
                    <View style={[styles.categoryTag, { backgroundColor: t.category === "HR_EXPENSE" ? "#EBF5FF" : "#FFF8E7" }]}>
                      <Text style={[styles.categoryText, { color: t.category === "HR_EXPENSE" ? "#33A6FF" : "#FFB300" }]}>{t.category}</Text>
                    </View>
                    <View style={styles.transInfo}>
                      {t.target_staff && <Text style={styles.transStaff}>{t.target_staff}</Text>}
                      <Text style={styles.transNote}>{t.note}</Text>
                    </View>
                    <Text style={styles.transAmount}>{formatKRW(t.amount)}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.executeBtn} onPress={closeVoice} activeOpacity={0.85}>
                  <Text style={styles.executeBtnText}>DB에 저장하기</Text>
                  <Feather name="save" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      )}

      <ScoreExplainerModal
        visible={scoreExplainerOpen}
        onClose={() => setScoreExplainerOpen(false)}
        scores={axisScores}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 10, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  headerLogo: { width: 48, height: 48 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800" as const, color: "#00153D", letterSpacing: 1 },
  headerSub: { fontSize: 11, color: "#64748B" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerBtn: { padding: 8 },
  periodRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: "#FFFFFF" },
  periodBtn: { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 10, backgroundColor: "#F1F5F9" },
  periodBtnActive: { backgroundColor: "#EBF5FF", borderWidth: 1, borderColor: "#C0DEFF" },
  periodLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" as const },
  periodLabelActive: { color: "#33A6FF" },
  panelDots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBD5E1" },
  dotActive: { backgroundColor: "#33A6FF", width: 20 },
  panelScroll: { flex: 1 },
  panel: { flex: 1 },
  panelContent: { padding: 16, paddingBottom: 40, gap: 14 },
  panelHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  panelTitle: { fontSize: 16, fontWeight: "700" as const, color: "#00153D" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLabel: { fontSize: 12, color: "#64748B" },
  cardBigNum: { fontSize: 30, fontWeight: "800" as const, color: "#00153D", fontVariant: ["tabular-nums"] },
  cardMidNum: { fontSize: 16, fontWeight: "700" as const, color: "#00153D" },
  cardSubNum: { fontSize: 12, color: "#64748B" },
  cardRight: { alignItems: "flex-end", gap: 2 },
  barWrap: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  chartLegend: { flexDirection: "row", gap: 16 },
  chartLegendRow: { flexDirection: "row", gap: 16, marginBottom: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: "#64748B" },
  sectionTitle: { fontSize: 14, fontWeight: "700" as const, color: "#00153D", marginTop: 4 },
  staffCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#00153D", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  staffCardWarning: { borderColor: "#FFE0A0", backgroundColor: "#FFFDF5" },
  staffCardCritical: { borderColor: "#FFB8B2", backgroundColor: "#FFF5F5" },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 13, fontWeight: "600" as const, color: "#00153D" },
  staffPos: { fontSize: 11, color: "#64748B" },
  overtimeBadge: { backgroundColor: "#FFF0EE", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  overtimeText: { fontSize: 10, color: "#FF3B30", fontWeight: "600" as const },
  voiceInputBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EBF5FF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#C0DEFF" },
  voiceInputText: { color: "#33A6FF", fontSize: 14, fontWeight: "600" as const },
  loadingBlock: { alignItems: "center", gap: 16, paddingVertical: 60 },
  aiSpinner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#EBF5FF", alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 18, fontWeight: "700" as const, color: "#00153D" },
  loadingSubtext: { fontSize: 13, color: "#64748B" },
  statusCard: { borderRadius: 20, borderWidth: 1.5, padding: 20, gap: 14 },
  statusBadge: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" as const },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: "600" as const },
  conclusion: { fontSize: 20, fontWeight: "800" as const, color: "#00153D", lineHeight: 30 },
  alertList: { gap: 8, marginVertical: 4 },
  alertItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertItemText: { fontSize: 17, fontWeight: "700" as const, flex: 1 },
  riskPreview: { fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 18 },
  actionBtn: { borderRadius: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  crisisBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FF3B30", borderRadius: 16, padding: 16, marginBottom: 12 },
  crisisBannerLeft: { flexDirection: "row", alignItems: "flex-start", gap: 12, flex: 1 },
  crisisBannerIcon: { fontSize: 28 },
  crisisBannerTitle: { fontSize: 17, fontWeight: "800" as const, color: "#fff" },
  crisisBannerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: "500" as const },
  crisisBannerCount: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  crisisBannerNum: { fontSize: 20, fontWeight: "900" as const, color: "#fff" },
  crisisCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 2, borderColor: "#FF3B30", padding: 16, marginBottom: 12, shadowColor: "#FF3B30", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  crisisCardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  crisisCardLeft: { flex: 1 },
  crisisCardRight: { alignItems: "flex-end", gap: 4 },
  crisisBadge: { alignSelf: "flex-start", backgroundColor: "#FF3B30", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  crisisBadgeText: { fontSize: 11, fontWeight: "700" as const, color: "#fff" },
  crisisKpiName: { fontSize: 18, fontWeight: "800" as const, color: "#00153D", marginBottom: 3 },
  crisisGap: { fontSize: 12, color: "#FF3B30", fontWeight: "600" as const },
  crisisValue: { fontSize: 32, fontWeight: "900" as const, color: "#FF3B30", marginLeft: 8 },
  crisisBarWrap: { height: 6, backgroundColor: "#FFE5E3", borderRadius: 3, marginBottom: 10 },
  crisisBarFill: { height: 6, backgroundColor: "#FF3B30", borderRadius: 3 },
  crisisImpact: { fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 17 },
  crisisActionBtn: { backgroundColor: "#FF3B30", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  crisisActionText: { color: "#fff", fontSize: 14, fontWeight: "700" as const },
  prescriptionSummary: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EFF8FF", borderRadius: 12, padding: 14, marginBottom: 12 },
  prescriptionSummaryText: { flex: 1, fontSize: 13, color: "#00153D", lineHeight: 19 },
  warnSection: { backgroundColor: "#FFFBEB", borderRadius: 12, borderWidth: 1, borderColor: "#FDE68A", padding: 14, marginBottom: 12 },
  warnSectionLabel: { fontSize: 12, fontWeight: "700" as const, color: "#B45309", marginBottom: 8 },
  warnRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#FEF3C7" },
  warnName: { flex: 1, fontSize: 13, color: "#00153D", fontWeight: "600" as const },
  warnValue: { fontSize: 14, fontWeight: "800" as const, color: "#D97706", marginRight: 8 },
  warnBench: { fontSize: 11, color: "#92400E" },
  fullPrescriptionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E8EDF5", backgroundColor: "#F5F7FA" },
  fullPrescriptionText: { fontSize: 13, color: "#64748B", fontWeight: "600" as const },
  revenueRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  revenueCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#33A6FF", padding: 14 },
  revenueLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" as const, marginBottom: 6 },
  revenueValue: { fontSize: 22, fontWeight: "900" as const, color: "#33A6FF", marginBottom: 4 },
  revenueSub: { fontSize: 11, color: "#94A3B8" },
  rxSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20 },
  rxHeader: { marginBottom: 16, gap: 6 },
  rxKpiName: { fontSize: 22, fontWeight: "900" as const, color: "#00153D" },
  rxPeriodNotice: {
    flexDirection: "row" as const, alignItems: "center", gap: 5,
    backgroundColor: "#F5F3FF", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6,
    borderWidth: 1, borderColor: "#EDE9FE", marginTop: 4,
  },
  rxPeriodNoticeText: { fontSize: 10, color: "#7C3AED", flex: 1, lineHeight: 14, fontWeight: "600" as const },
  rxSection: { backgroundColor: "#F5F7FA", borderRadius: 14, padding: 14, marginBottom: 12 },
  rxSectionLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  rxSectionTitle: { fontSize: 13, fontWeight: "700" as const, color: "#FF3B30" },
  rxBody: { fontSize: 14, color: "#334155", lineHeight: 22 },
  rxBulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  rxBulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  rxBulletText: { flex: 1, fontSize: 14, color: "#334155", lineHeight: 21 },
  rxActionBtn: { backgroundColor: "#FF3B30", borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10, marginTop: 4 },
  rxActionText: { color: "#fff", fontSize: 16, fontWeight: "800" as const },
  rxCancelBtn: { alignItems: "center", paddingVertical: 10, marginBottom: 8 },
  rxCancelText: { fontSize: 14, color: "#94A3B8" },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" as const },
  evidenceLink: { alignItems: "center", paddingVertical: 4 },
  evidenceLinkText: { color: "#64748B", fontSize: 13 },
  quickStats: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  quickStat: { flex: 1, alignItems: "center", gap: 4 },
  quickStatNum: { fontSize: 18, fontWeight: "800" as const },
  quickStatLabel: { fontSize: 10, color: "#64748B" },
  quickStatDivider: { width: 1, backgroundColor: "#F1F5F9" },
  top3Card: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, gap: 14, borderWidth: 1, borderColor: "#E8EDF5", shadowColor: "#00153D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  top3CardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  top3CardTitle: { fontSize: 13, fontWeight: "700" as const, color: "#00153D", flex: 1 },
  top3CardSource: { fontSize: 10, color: "#94A3B8" },
  top3Row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  top3Left: { flex: 1, gap: 5 },
  top3NameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  top3Rank: { fontSize: 11, fontWeight: "800" as const, color: "#33A6FF" },
  top3Name: { fontSize: 12, fontWeight: "700" as const, color: "#00153D", flex: 1 },
  top3StatusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  top3StatusText: { fontSize: 10, fontWeight: "700" as const },
  top3BarWrap: { height: 4, backgroundColor: "#F1F5F9", borderRadius: 2, overflow: "hidden" as const },
  top3BarFill: { height: "100%" as any, borderRadius: 2 },
  top3Impact: { fontSize: 10, color: "#64748B", lineHeight: 14 },
  top3Right: { alignItems: "flex-end", gap: 3, minWidth: 56 },
  top3Value: { fontSize: 20, fontWeight: "800" as const, letterSpacing: -0.5 },
  top3Bench: { fontSize: 10, color: "#94A3B8", fontWeight: "600" as const },
  rejectRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rejectLabel: { fontSize: 12, color: "#64748B", width: 90 },
  rejectBar: { flex: 1, height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  rejectFill: { height: "100%", borderRadius: 3 },
  rejectPct: { fontSize: 12, color: "#00153D", width: 36, textAlign: "right" },
  bepText: { fontSize: 11, color: "#64748B" },
  chartCaption: { fontSize: 10, color: "#94A3B8", marginTop: 6, textAlign: "center" as const },
  cardHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  // Evidence modal
  evidenceModal: { position: "absolute", bottom: 0, left: 0, right: 0, height: "75%", borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "#E8EDF5", shadowColor: "#00153D", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  evidenceInner: { flex: 1, padding: 20, gap: 14 },
  evidenceHandle: { width: 36, height: 4, backgroundColor: "#CBD5E1", borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  evidenceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  evidenceTitle: { fontSize: 18, fontWeight: "700" as const, color: "#00153D" },
  kpiSubtitle: { fontSize: 11, color: "#94A3B8", marginBottom: 14, marginTop: -4 },
  kpiGroup: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  kpiGroupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  kpiGroupLabel: { fontSize: 14, fontWeight: "800" as const },
  kpiGroupCount: { fontSize: 13, fontWeight: "700" as const },
  kpiRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  kpiRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  kpiRowLeft: { flex: 1 },
  kpiRowName: { fontSize: 14, fontWeight: "600" as const, color: "#00153D", marginBottom: 2 },
  kpiRowBench: { fontSize: 11, color: "#94A3B8" },
  kpiRowRight: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4 },
  kpiRowValue: { fontSize: 15, fontWeight: "800" as const, marginLeft: 12 },
  evidenceSectionLabel: { fontSize: 11, color: "#33A6FF", fontWeight: "700" as const, letterSpacing: 1 },
  evidenceBriefing: { fontSize: 14, color: "#475569", lineHeight: 22 },
  // Simulation
  simOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000044", justifyContent: "flex-end" },
  simBox: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#00153D", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  simTitle: { fontSize: 20, fontWeight: "800" as const, color: "#00153D", textAlign: "center" },
  simSubtitle: { fontSize: 13, color: "#64748B", textAlign: "center" },
  simMetrics: { gap: 14 },
  simMetric: { gap: 6 },
  simDivider: { height: 1, backgroundColor: "#F1F5F9" },
  simMetricLabel: { fontSize: 13, color: "#64748B" },
  simBeforeAfter: { flexDirection: "row", alignItems: "center", gap: 10 },
  simBefore: { fontSize: 16, color: "#94A3B8", fontWeight: "600" as const },
  simAfter: { fontSize: 16, fontWeight: "800" as const },
  executeBtn: { backgroundColor: "#33A6FF", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#33A6FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  executeBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" as const },
  executedBlock: { alignItems: "center", gap: 10 },
  executedText: { fontSize: 18, fontWeight: "700" as const, color: "#00C853" },
  closeBtn: { padding: 10 },
  closeBtnText: { color: "#64748B", fontSize: 14 },
  receiptFab: {
    position: "absolute", right: 20,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F97316", borderRadius: 28,
    paddingHorizontal: 18, paddingVertical: 14,
    shadowColor: "#F97316", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  receiptFabText: { color: "#fff", fontSize: 14, fontWeight: "800" as const },
  // Voice
  voiceActive: { alignItems: "center", gap: 14 },
  micBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center" },
  recordingText: { fontSize: 14, color: "#FF3B30" },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 4, height: 40 },
  waveBar: { width: 4, backgroundColor: "#33A6FF", borderRadius: 2 },
  voiceExample: { fontSize: 12, color: "#64748B", textAlign: "center" },
  micStartBtn: { backgroundColor: "#33A6FF", borderRadius: 60, width: 80, height: 80, alignItems: "center", justifyContent: "center", alignSelf: "center", shadowColor: "#33A6FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  parsedResult: { gap: 10 },
  parsedResultHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  parsedResultTitle: { fontSize: 14, fontWeight: "700" as const, color: "#00C853" },
  transRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10 },
  categoryTag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  categoryText: { fontSize: 9, fontWeight: "700" as const },
  transInfo: { flex: 1 },
  transStaff: { fontSize: 13, fontWeight: "600" as const, color: "#00153D" },
  transNote: { fontSize: 11, color: "#64748B" },
  transAmount: { fontSize: 14, fontWeight: "700" as const, color: "#00153D" },
});
