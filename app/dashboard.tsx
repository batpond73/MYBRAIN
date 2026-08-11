import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
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
import { computeAxisScores, generateRootCauseReason, pickRootCause } from "@/lib/financialInsights";
import { KpiPrescription, getKpiPrescription } from "@/lib/kpiPrescriptions";

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

// KpiPrescription 타입은 lib/kpiPrescriptions.ts에서 import — 처방 자료는 별도 파일로 분리.

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

// Auth gate wrapper · 다른 5개 화면(settings/history/help/daily-receipt/(tabs)/index)과 규약 통일.
// 이전엔 dashboard만 useEffect에서 redirect 처리해 AsyncStorage restore 이전에
// defaultState(isAuthenticated=false)로 순간 렌더링되는 우회 상태였음. 근본 픽스:
// (1) isLoaded=false → null 반환 (Root Layout mount 완료 대기)
// (2) 인증·intro 게이트를 render 시점에 · useEffect 아님
export default function Dashboard() {
  const { isLoaded, isAuthenticated, hasSeenIntro } = useAppContext();
  if (!isLoaded) return null;
  if (!hasSeenIntro) return <Redirect href="/intro" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-up" />;
  return <DashboardInner />;
}

function DashboardInner() {
  const insets = useSafeAreaInsets();
  const { period, setPeriod, clinicName, logout, doctorProfile, isDemoMode } = useAppContext();

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

  // 인증·intro 리다이렉트는 상위 wrapper(Dashboard)에서 처리 · 여기서는 정상 사용자만.

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
  // rootCause 이유 텍스트는 계산 결과에서 동적 생성 (근본 · mockData 하드코딩 제거).
  // 이전에는 mockData.rootCauseReason이 pickRootCause 계산과 다른 KPI를 가리켜
  // 헤더의 이름·값·이유가 서로 다른 KPI로 나오는 3원 어긋남 버그가 있었음.
  const rootCauseReasonText = rootCause && rootCauseSnap
    ? generateRootCauseReason(rootCause, { current: rootCauseSnap.current, status: rootCauseSnap.status })
    : "";

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
          <Text style={styles.headerSub}>{clinicName || "병원명 미설정"}</Text>
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

      {/* 데모 배지 · 실 EMR 연동 이전엔 이 상태 명시 (근본 · 이전엔 help.tsx가
         약속했으나 실제로는 미구현 상태였음) */}
      {isDemoMode && (
        <TouchableOpacity
          style={styles.demoBadge}
          onPress={() => router.push("/settings" as any)}
          activeOpacity={0.85}
        >
          <Feather name="info" size={12} color="#8B5CF6" />
          <Text style={styles.demoBadgeText}>
            데모 데이터로 표시 중 · 실 EMR 연동 요청은 설정에서
          </Text>
          <Feather name="chevron-right" size={12} color="#8B5CF6" />
        </TouchableOpacity>
      )}

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
              rootCauseReason={rootCauseReasonText}
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
                      const hasPrescription = !!(kpiKey && getKpiPrescription(kpiKey, period));
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
        // 개별 KPI 처방은 getKpiPrescription으로 period 스코프 조회 (근본 스키마).
        const isOverall = prescriptionKpi === "overall";
        const rx: KpiPrescription | undefined = isOverall
          ? finance.overallPrescription
          : getKpiPrescription(prescriptionKpi, period);
        const kpi: { name: string; unit: string; current: number | string; benchmark: number; direction: string; benchmarkLabel: string } | undefined =
          isOverall
            ? { name: "20개 지표 통합 처방", unit: "", current: `${axisScores.profitability}/${axisScores.retention}/${axisScores.risk}`, benchmark: 100, direction: "higher", benchmarkLabel: "3축 스코어" }
            : (adjustedTop3.find(k => k.id === prescriptionKpi)
               ?? adjustedExtraKpis.find(k => k.id === prescriptionKpi)
               ?? FINANCE_KPIS.find(k => k.id === prescriptionKpi));
        // period notice badge 제거: KPI_PRESCRIPTIONS_BY_PERIOD가 4× 확장되어 이제 근본 대응.
        // (구조적 조언은 month → 다른 period에도 그대로 유효한 KPI는 fallback으로 통과.)
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
  // 데모 배지 · 실 EMR 연동 이전 상태 명시. 탭 시 설정으로 이동.
  demoBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    backgroundColor: "#F5F3FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  demoBadgeText: { fontSize: 11, color: "#8B5CF6", fontWeight: "700" as const, flexShrink: 1 },
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
