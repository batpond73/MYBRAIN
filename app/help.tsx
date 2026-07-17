import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeFab } from "@/components/HomeFab";
import { NpsExportCard } from "@/components/help/NpsExportCard";
import { NpsSurveyForm } from "@/components/help/NpsSurveyForm";
import { useAppContext } from "@/context/AppContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Entry = { q: string; a: string };
type Reference = { name: string; org: string; year: string; note: string };

// ── 사용 가이드 ─────────────────────────────────────────────────────
// 앱을 처음 여는 원장님이 무엇을 어떤 순서로 하면 되는지, 각 화면이
// 무엇을 보여주는지 쉬운 말로 정리. 각 스텝은 한 번에 하나만 열림.
const GUIDE: Entry[] = [
  {
    q: "1. 처음 로그인하면 무엇을 하나요?",
    a: "회원가입 후 자동으로 '관제탑 3단계 설정'으로 이동합니다. 이 3단계를 마쳐야 대시보드가 원장님 병원 데이터로 채워집니다. 미리 체험하고 싶다면 회원가입 화면 아래쪽 '데모 대시보드 바로 체험하기'를 눌러 샘플 데이터로 먼저 둘러볼 수 있습니다.",
  },
  {
    q: "2. 관제탑 3단계는 무엇인가요?",
    a: "① 소프트웨어 깨우기 — EMR(전자차트) 프로그램과 연결해 예약·환자·진료 데이터를 자동 수집합니다. ② 원장님 동기화 — 진료 속도, 환자 소통, 체어 회전 성향을 슬라이더로 입력하면 AI가 원장님 스타일에 맞춰 조언합니다. ③ 재무 서류 스캔 — 카드 매출표, 세금계산서 등 8종을 카메라로 찍으면 자동으로 숫자를 뽑아 20개 지표를 완성합니다.",
  },
  {
    q: "3. 대시보드는 무엇을 보여주나요?",
    a: "원장님 병원의 20개 경영지표를 한 화면에 요약합니다. 위기(빨강) · 경고(노랑) · 정상(파랑) · 최우수(초록) 4단계로 색이 나뉘고, 상단 TOP 3에는 지금 손을 대야 하는 지표 세 개가 뜹니다. 각 지표를 누르면 '왜 문제인지', '얼마 손실인지', 'AI 처방'까지 펼쳐서 볼 수 있습니다.",
  },
  {
    q: "4. AI 처방(액션 카드)은 어떻게 쓰나요?",
    a: "각 KPI 카드를 펼치면 AI가 '지금 이렇게 하세요'라고 실행 문구를 제시합니다. 대부분 스태프 한 명이 30분 안에 시작할 수 있는 구체적 행동(예: '리마인드 문자 발송', '분납 옵션 안내')입니다. 실행 후 며칠 지나면 다음 대시보드에서 개선 여부가 바로 보입니다.",
  },
  {
    q: "5. 하루 매출 영수증은 언제 확인하나요?",
    a: "대시보드 상단 영수증(receipt) 아이콘을 누르면 오늘 하루의 매출·비용·순이익이 영수증 형태로 뜹니다. 스태프 조회용이 아니라 원장님 개인 확인용이며, 매일 저녁 마감 후 5초 안에 하루 성적을 확인하는 용도입니다.",
  },
  {
    q: "6. 히스토리는 언제 보나요?",
    a: "설정 > 경영 히스토리에서 최근 6개월의 지표 변화를 볼 수 있습니다. '위기 → AI 처방 → 개선'까지 어떤 액션이 실제로 숫자를 바꿨는지 타임라인으로 확인해, 다음 분기 계획을 세울 때 근거로 씁니다.",
  },
  {
    q: "7. 원장님 진료 스타일은 왜 조정하나요?",
    a: "동일한 KPI라도 '신속·효율'을 우선하는 원장님과 '꼼꼼·안정'을 우선하는 원장님의 이상적 수치는 다릅니다. 슬라이더 3개(속도·소통·체어)와 경영 성향(공격적 확장 / 고정비 절감)을 조정하면, AI가 원장님 성향에 맞춰 판정 기준과 조언을 다르게 냅니다. 언제든 설정에서 다시 바꿀 수 있고 자동 저장됩니다.",
  },
];

// ── 경영분석 레퍼런스 ─────────────────────────────────────────────
// 대시보드 벤치마크와 처방 로직이 근거로 삼는 공개 자료·분석 프레임워크.
// 각 KPI 카드 하단의 "Lean 기준", "Unit Economics 기준" 같은 문구가
// 어디서 나온 숫자인지 원장님이 직접 확인할 수 있게 정리.
const REFERENCES: { section: string; hint: string; items: Reference[] }[] = [
  {
    section: "공식 통계 · 백서",
    hint: "국내외 치과·의료 산업 벤치마크 수치의 원천",
    items: [
      {
        name: "의료자원통계핸드북",
        org: "건강보험심사평가원 (HIRA)",
        year: "2025",
        note: "체어 수·인력·시설 규모별 국내 의원 통계. 체어 가동률·인당 매출 판정 기준.",
      },
      {
        name: "치과의료통계연보",
        org: "대한치과의사협회",
        year: "2024",
        note: "국내 치과의원 진료 건수·객단가·개원 연차 분포. 연차별 정상 매출 구간 산출.",
      },
      {
        name: "진료비 통계",
        org: "국민건강보험공단",
        year: "2024",
        note: "보험 청구액·비급여 매출 비율. 매출 구조 벤치마크와 예방·리콜 매출 비중 근거.",
      },
      {
        name: "The Dental Practice Report",
        org: "ADA Health Policy Institute",
        year: "2024",
        note: "미국 치과의원 인건비·재료비·기공료 비율 국제 벤치마크. 비용 지표 상한선 근거.",
      },
      {
        name: "2024 Dental Practice Benchmark Study",
        org: "Levin Group",
        year: "2024",
        note: "치과 컨설팅 40년 자산 데이터. 상담 동의율·노쇼율·재내원율 등 환자 지표 벤치마크.",
      },
    ],
  },
  {
    section: "분석 방법론 · 프레임워크",
    hint: "각 KPI를 판정하고 AI 처방을 만드는 데 쓰이는 이론 체계",
    items: [
      {
        name: "Unit Economics",
        org: "Andreessen Horowitz (a16z)",
        year: "2024",
        note: "환자 1명당 경제성(LTV·CAC·Payback) 분석. LTV:CAC 3~5배, Payback 12일 이하 기준의 출처.",
      },
      {
        name: "Lean Healthcare · TPS",
        org: "Toyota Production System 응용",
        year: "—",
        note: "7대 낭비(대기·재고·이동…) 제거 관점. 대기시간 10분 이하, 당일 취소율 3% 이하, 재료비 상한선 근거.",
      },
      {
        name: "Value-Based Care",
        org: "Michael Porter · Harvard Business School",
        year: "2010~",
        note: "행위량이 아닌 진료 결과 중심 성과 평가. 진료 완료율·환자 NPS·재내원율 판정 관점.",
      },
      {
        name: "Theory of Constraints (TOC)",
        org: "Eliyahu M. Goldratt",
        year: "1984",
        note: "병목 자원 식별 후 그 자원만 최적화하는 전략. 체어 가동률·상담 슬롯이 병목일 때 적용.",
      },
      {
        name: "NRR · 유지 경제학",
        org: "SaaS 재무 방법론 응용",
        year: "—",
        note: "Net Revenue Retention. 신환보다 기존 환자 유지·확대가 매출 안정성에 더 크게 기여한다는 관점. 재내원율·리콜 성공률·예방 비중의 상위 원리.",
      },
    ],
  },
];

// ── 자주 묻는 질문 (FAQ) ──────────────────────────────────────────
const FAQ: Entry[] = [
  {
    q: "환자 개인정보는 어디에 저장되나요?",
    a: "환자 이름·연락처 같은 식별 정보는 앱으로 전송되지 않습니다. 병원 내 EMR에서 이미 익명 처리된 통계값(진료 건수·매출·대기 시간 등)만 앱이 읽습니다. 서버에 원본 진료 기록이 저장되지 않습니다.",
  },
  {
    q: "지표 수치가 실제보다 낮아 보여요. 뭘 잘못한 건가요?",
    a: "① 재무 서류 스캔이 최신월까지 안 되어 있으면 최근 매출이 반영되지 않습니다. ② EMR 연동이 하루 이상 끊겼는지 확인하세요. ③ 원장님 진료 스타일 슬라이더가 극단(0% 또는 100%)이면 기준이 왜곡될 수 있습니다.",
  },
  {
    q: "AI 처방을 실행했는데 다음 날 지표가 안 바뀝니다.",
    a: "지표별로 반응 속도가 다릅니다. '노쇼율·당일 취소율'은 문자 발송 후 3~7일이면 바뀝니다. '재내원율·상담 동의율'은 4~8주 지나야 유의미한 변화가 잡힙니다. '순이익률·LTV'는 3개월 이상 누적된 뒤 판정합니다. 지표 카드에 예상 반영 시점이 표시됩니다.",
  },
  {
    q: "위기(빨강) 지표는 몇 개까지 정상인가요?",
    a: "0~2개가 관리 가능 구간입니다. 3개 이상이면 하나씩 순서대로 해결하지 말고, AI가 제시하는 '원인 지표(파생 관계)'를 먼저 손대야 두세 개가 함께 풀립니다. 예: 리콜 성공률을 올리면 재내원율·환자 LTV·순이익률이 함께 개선됩니다.",
  },
  {
    q: "데모 모드와 실제 모드는 어떻게 구분하나요?",
    a: "데모는 서울나눔치과의원(가상) 데이터로 진행되며, 대시보드 상단에 데모 배지가 뜹니다. 로그아웃 후 다시 회원가입하고 관제탑 3단계를 마치면 실제 병원 데이터로 전환됩니다.",
  },
  {
    q: "스태프에게 이 앱을 보여줘도 되나요?",
    a: "원장님 전용으로 설계되어 있습니다. 인건비 비율·순이익률·스태프 이직률 같이 원장 판단용 숫자가 그대로 노출되므로, 화면을 직접 공유하지 마시고 액션 카드에서 '스태프 안내용 문구'를 골라 캡처해 전달하는 방식을 권장합니다.",
  },
  {
    q: "여러 원장이 함께 쓰는 병원인데요?",
    a: "MVP 단계에서는 원장 1인당 1계정을 권장합니다. 향후 업데이트에서 '공동 원장 모드'(같은 데이터, 개별 조언)를 추가할 예정입니다.",
  },
  {
    q: "월 요금은 얼마인가요?",
    a: "회원가입 후 30일간 모든 기능이 무료입니다. 이후 요금제는 대시보드 알림 또는 이메일로 안내됩니다. 결제 정보는 지금 요구하지 않습니다.",
  },
];

// ── 대시보드 스코어 · 배지 읽는 법 ────────────────────────────────
// 종합 진단 헤더와 각 섹션 헤더에 뜨는 0~100 점수의 계산법과 배지 색 의미.
// 대시보드 안에서 pill을 탭해도 요약 모달이 뜨지만, 여기서는 3축 매핑
// 표까지 전부 풀어서 설명한다.
const SCORE_GUIDE_STEPS: Entry[] = [
  {
    q: "이 점수는 뭘 뜻하나요?",
    a: "대시보드에 뜨는 20개 경영지표를 3가지 축(수익성 · 유지 · 리스크)으로 묶고, 각 축이 지금 얼마나 건강한지 0~100점으로 계산한 값입니다. 원장님 병원 상태를 '어느 축이 아프고 어느 축이 튼튼한가'로 한 번에 판단할 수 있게 만든 요약 숫자예요.",
  },
  {
    q: "0~100점은 어떻게 계산되나요?",
    a: "각 지표를 4단계로 채점합니다 — 위기(0점) · 경고(40점) · 정상(80점) · 최우수(100점). 축에 속한 지표들의 점수를 평균내면 이 숫자가 나옵니다. 예를 들어 수익성 축에 7개 지표가 있고 그중 5개가 정상(80점) · 2개가 최우수(100점)면 평균 약 85점이 됩니다.",
  },
  {
    q: "왜 어떤 지표는 2배로 반영되나요?",
    a: "레퍼런스(공식 통계와 경영 방법론) 여러 곳에서 반복해서 '가장 중요하다'고 나오는 핵심 지표는 평균을 낼 때 2배 가중치를 줍니다. 지금 2배 반영되는 지표는 5개예요 — LTV:CAC 비율, 재내원율, 리콜 성공률, 월 순이익률, 예방·리콜 매출 비중.",
  },
  {
    q: "3개 축에는 어떤 지표들이 들어가나요?",
    a:
      "▪ 수익성 (Unit Economics) 7개: 월 매출, 환자 LTV, LTV:CAC, 스태프 생산성, 월 순이익률, 시간당 생산성, 마케팅 ROI\n" +
      "▪ 유지 (NRR · Value-Based Care) 5개: 재내원율, 리콜 성공률, 진료 완료율, 환자 NPS, 예방·리콜 매출 비중\n" +
      "▪ 리스크·현금 (Lean · 재무 기본) 8개: 체어 가동률, 예약 충족률, 당일 취소율, 미수금 비율, 신환 내원, 스태프 이직률, 재료비 비율, 기공료 비율",
  },
  {
    q: "점수 밴드 색깔은 무슨 뜻이에요?",
    a:
      "▪ 위기 (0~39, 빨강): 이 축의 여러 지표가 임계값을 넘음. 이번 주 안에 우선 대응 필요.\n" +
      "▪ 경고 (40~59, 노랑): 절반 정도가 흔들리는 중. 원인 지표부터 파악.\n" +
      "▪ 정상 (60~84, 파랑): 평균 이상. 몇 개만 손보면 최우수 진입 가능.\n" +
      "▪ 최우수 (85~100, 초록): 이 축은 지금 아주 건강. 유지가 목표.",
  },
  {
    q: "'가장 먼저 손대야 할 지표'는 어떻게 골라지나요?",
    a: "각 지표에는 '이 지표가 나빠지면 어떤 지표들이 따라 나빠지는지'가 미리 매핑돼 있어요 (upstream 관계). 지금 위기·경고 상태인 지표들의 상류(원인) 자리에 가장 많이 등장하는 지표를 자동으로 뽑아 종합 진단에 표시합니다. 이 상류 지표 하나를 개선하면 하류의 여러 지표가 동시에 회복돼 가장 효율적으로 병원을 개선할 수 있어요.",
  },
];

// ── 경영지표 용어 사전 ────────────────────────────────────────────
// 대시보드/히스토리/설정에 등장하는 20개 KPI + 판정 방식 + 자주 나오는
// 약어를 한 번에 정리. 어려운 회계·경영 용어를 원장님이 쉽게 알아볼
// 수 있게 풀어 씀.
const GLOSSARY: {
  section: string;
  items: { term: string; short?: string; body: string }[];
}[] = [
  {
    section: "매출·수익성 지표",
    items: [
      {
        term: "월 매출",
        body: "그 달 병원이 벌어들인 총 진료비. 보험 청구액 + 비급여 수납액을 합친 값. 연차·체어 수와 비교해 정상 여부를 판정합니다.",
      },
      {
        term: "월 순이익률",
        body: "매출에서 인건비·재료비·기공료·임대료·세금까지 다 빼고 원장 손에 남는 비율. 개원 초기 10% 전후, 안정기(3년 이상) 20~25%가 건강한 구간입니다.",
      },
      {
        term: "환자 LTV",
        short: "Lifetime Value",
        body: "한 환자가 병원을 다니는 전체 기간 동안 지불하는 총액. 계산식: 객단가 × 연간 내원 횟수 × 평균 유지 연수. 신환 유치 비용을 몇 년 만에 회수하는지 판단하는 핵심 숫자.",
      },
      {
        term: "LTV:CAC 비율",
        short: "Lifetime Value : Customer Acquisition Cost",
        body: "환자 한 명이 병원에 주는 총 매출(LTV)을 그 환자를 데려오는 데 든 비용(CAC)으로 나눈 값. 3~5배가 정상, 2배 미만이면 마케팅이 손해, 5배 초과면 오히려 광고 투자를 늘려도 됩니다.",
      },
      {
        term: "시간당 생산성",
        body: "체어 한 대가 1시간 돌 때 벌어들이는 진료비. 병원 시간당 고정비의 2배 이상이면 건강, 그 이하면 체어 한 대 돌릴 때마다 손해가 쌓입니다.",
      },
    ],
  },
  {
    section: "환자·예약 관련 지표",
    items: [
      {
        term: "체어 가동률",
        body: "진료실 의자(체어)가 열려있는 총 시간 중 실제로 환자가 앉아 있던 시간의 비율. 70~85%가 최적, 90% 넘으면 스태프 과부하가 시작됩니다.",
      },
      {
        term: "예약 충족률",
        body: "예약 가능 슬롯 중 실제로 예약이 잡힌 비율. 병원이 설정한 목표 회전 수 대비 얼마나 채웠는지 봅니다.",
      },
      {
        term: "당일 취소율",
        body: "당일에 예약이 취소된 비율. 3% 이하가 우수, 5% 넘으면 위기. 하루 전 리마인드 문자 하나로도 크게 줄어드는 지표입니다.",
      },
      {
        term: "노쇼율",
        short: "No-Show",
        body: "예약해놓고 연락 없이 오지 않는 환자 비율. 4% 이하 목표. 리마인드 문자 + 노쇼 3회 시 예약 제한 정책으로 대부분 잡힙니다.",
      },
      {
        term: "신환 내원",
        body: "그 달 처음 온 환자 수. 전체 환자 중 신환 비중이 15~25%면 건강, 그 이하면 마케팅 부족, 그 이상이면 재내원이 약하다는 신호일 수 있습니다.",
      },
      {
        term: "재내원율",
        body: "치료가 끝난 환자가 다시 병원을 찾는 비율. 55~70% 정상, 70% 넘으면 우수. 이 수치가 높으면 광고비를 안 써도 매출이 유지됩니다.",
      },
      {
        term: "리콜 성공률",
        body: "정기 검진·스케일링 시기가 된 환자에게 안내했을 때 실제로 예약이 잡히는 비율. 병원의 '재구매율'에 해당하며, 재내원율·환자 LTV의 원인이 되는 지표입니다.",
      },
      {
        term: "진료 완료율",
        body: "계획한 치료를 중도 이탈 없이 끝까지 마친 환자 비율. 75% 이상 정상, 60% 미만이면 위기. 비용·기간 부담이 큰 임플란트·교정에서 특히 중요.",
      },
      {
        term: "상담 동의율",
        body: "상담 후 실제로 치료 계약으로 이어진 비율. 70% 이상이 목표. 낮으면 대부분 비용·기간 부담이 원인 — 분납·단계 치료 옵션 안내로 즉시 개선됩니다.",
      },
      {
        term: "환자 NPS",
        short: "Net Promoter Score",
        body: "환자에게 '이 병원을 지인에게 추천하시겠습니까?'를 10점 척도로 물어 계산하는 만족도 지수. 절대 점수보다 지난 분기 대비 오르는 추세가 중요합니다.",
      },
    ],
  },
  {
    section: "비용·인력 지표",
    items: [
      {
        term: "인건비 비율",
        body: "매출 대비 전체 인건비 비율. 25% 이하가 이상적, 30% 넘으면 순이익이 급격히 줄어듭니다. 초과분은 그 달 확정 손실.",
      },
      {
        term: "재료비 비율",
        body: "매출 대비 진료 재료(임플란트 픽스처, 크라운, 소모품) 비용 비율. 20% 이하가 정상, 25% 넘으면 위기. 재료비가 갑자기 오르면 재료 도매처 재검토 신호.",
      },
      {
        term: "기공료 비율",
        body: "보철 매출 대비 외주 기공소에 지불한 비용 비율. 12% 이하 정상, 15% 넘으면 경고. 기공소 여러 곳 견적 비교로 조정 가능.",
      },
      {
        term: "미수금 비율",
        body: "매출 중 아직 회수되지 않은 금액의 비율. 1.5% 이하 우수, 3% 넘으면 위기. 오래 방치할수록 회수 확률이 급격히 떨어집니다.",
      },
      {
        term: "스태프 이직률",
        body: "1년간 그만두는 스태프의 비율. 15% 넘으면 경고, 25% 넘으면 위기. 스태프 채용·교육 비용은 통상 그 사람 연봉의 30~50%에 달합니다.",
      },
      {
        term: "스태프 생산성",
        body: "스태프 1인당 창출한 월 매출. 규모별 벤치마크와 비교. 낮으면 인력 재배치 또는 업무 자동화 신호.",
      },
      {
        term: "예방·리콜 매출 비중",
        body: "전체 매출 중 스케일링·검진·예방 진료의 비중. 18~20% 이상이 건강한 병원. 12% 미만이면 신환에만 의존하는 위태로운 구조.",
      },
      {
        term: "마케팅 ROI",
        short: "Return On Investment",
        body: "광고비 1원당 몇 원의 매출이 돌아왔는지. LTV:CAC와 같은 산식. 채널(네이버·인스타·전단지)별로 따로 계산해 성과 낮은 채널을 줄입니다.",
      },
    ],
  },
  {
    section: "판정 방식 · 기타 용어",
    items: [
      {
        term: "ABS 판정",
        short: "Absolute · 절대 기준",
        body: "의원 규모·연차와 관계없이 업계 공통 임계값으로 판정. 예: 노쇼율 4% 이하 정상, 5% 넘으면 위기. '3% 우수 / 3~5% 경고 / >5% 위기' 식으로 표시.",
      },
      {
        term: "REL 판정",
        short: "Relative · 연차 대비",
        body: "개원 연차나 병원 규모(체어·스태프 수)에 맞춰 다르게 판정. 예: 순이익률은 신규 병원 10%, 안정기 20~25%. 같은 수치라도 3년차와 10년차의 평가가 다릅니다.",
      },
      {
        term: "DERIVED 판정",
        short: "Derived · 파생 지표",
        body: "이 지표 자체를 손대기보다 이 값을 만드는 원인 지표부터 개선해야 하는 항목. 예: 환자 LTV는 재내원율·리콜 성공률을 먼저 올려야 따라 올라옵니다.",
      },
      {
        term: "EMR",
        short: "Electronic Medical Record",
        body: "전자 진료 기록 시스템. 병원이 사용하는 두번에·덴트웹·이지플러스 같은 프로그램. myBrain은 여기서 예약·진료·수납 데이터를 자동으로 읽어옵니다.",
      },
      {
        term: "CAPS",
        short: "Card Approval Processing System",
        body: "카드 매출 승인 데이터. 카드 단말기에서 나온 매출 내역을 CSV로 받아 앱에 넣으면 매출 지표가 자동으로 채워집니다.",
      },
      {
        term: "OCR",
        short: "Optical Character Recognition",
        body: "종이 서류를 카메라로 찍으면 글자·숫자를 자동으로 뽑아주는 기술. 재무 서류 스캔 단계에서 사용됩니다.",
      },
      {
        term: "CAC",
        short: "Customer Acquisition Cost",
        body: "신환 한 명을 데려오는 데 든 총비용. 마케팅비 ÷ 그 기간에 온 신환 수. LTV와 짝으로 봐야 광고 효율이 판정됩니다.",
      },
      {
        term: "객단가",
        body: "환자 한 명의 1회 진료당 평균 매출. 매출을 진료 건수로 나눈 값. 임플란트 비중이 높은 병원일수록 객단가가 큽니다.",
      },
    ],
  },
];

// ── 화면 ────────────────────────────────────────────────────────
export default function HelpScreen() {
  // Auth gate wrapper — hooks 순서 안전.
  const { isLoaded, isAuthenticated } = useAppContext();
  if (!isLoaded) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-up" />;
  return <HelpScreenInner />;
}

function HelpScreenInner() {
  const insets = useSafeAreaInsets();
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggle = async (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    try { await Haptics.selectionAsync(); } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/settings" as any);
          }}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={26} color="#00153D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>도움말 · 사용 가이드</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
      >
        {/* 인트로 */}
        <View style={styles.introCard}>
          <View style={styles.introIconWrap}>
            <Feather name="book-open" size={22} color="#33A6FF" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.introTitle}>처음 오신 원장님께</Text>
            <Text style={styles.introBody}>
              아래는 앱 사용법, 자주 묻는 질문, 대시보드에 나오는 경영지표 용어 사전입니다.
              항목을 눌러 펼쳐서 필요할 때마다 확인하세요.
            </Text>
          </View>
        </View>

        {/* 사용 가이드 */}
        <Section
          icon="compass"
          label="사용 가이드"
          hint="앱 흐름을 순서대로 안내"
          items={GUIDE}
          keyPrefix="guide"
          openKeys={openKeys}
          onToggle={toggle}
        />

        {/* 대시보드 스코어 · 배지 읽는 법 */}
        <Section
          icon="award"
          label="대시보드 스코어 · 배지 읽는 법"
          hint="종합 진단과 섹션마다 뜨는 0~100점의 계산법 · 색 밴드 · 어느 지표가 어느 축에 속하는지"
          items={SCORE_GUIDE_STEPS}
          keyPrefix="score-guide"
          openKeys={openKeys}
          onToggle={toggle}
        />

        {/* 환자 NPS 설문 폼 (인터랙티브 예시) */}
        <View style={styles.sectionHead}>
          <Feather name="clipboard" size={14} color="#33A6FF" />
          <Text style={styles.sectionLabelInline}>환자 NPS 설문 폼 예시</Text>
        </View>
        <Text style={styles.sectionHint}>
          진료 후 카카오톡·SMS로 환자에게 발송할 만족도 설문. 아래에서 직접 응답해보시면
          Promoter/Passive/Detractor 분류와 원장님 액션 팁까지 즉시 확인할 수 있습니다.
        </Text>
        <View style={styles.card}>
          <NpsSurveyForm />
        </View>

        {/* NPS 내보내기 · 응답 집계 · CSV 교환 */}
        <View style={styles.sectionHead}>
          <Feather name="share-2" size={14} color="#33A6FF" />
          <Text style={styles.sectionLabelInline}>NPS 태블릿 배포 · 응답 집계</Text>
        </View>
        <Text style={styles.sectionHint}>
          위 폼을 태블릿에 열어 환자에게 받고, 응답을 이 기기로 병합·집계합니다.
        </Text>
        <View style={styles.card}>
          <NpsExportCard />
        </View>

        {/* 경영분석 레퍼런스 */}
        <View style={styles.sectionHead}>
          <Feather name="book" size={14} color="#33A6FF" />
          <Text style={styles.sectionLabelInline}>경영분석 레퍼런스</Text>
        </View>
        <Text style={styles.sectionHint}>
          앱이 보여주는 벤치마크와 AI 처방이 근거로 삼는 공개 자료·이론.
        </Text>
        {REFERENCES.map((group) => (
          <View key={group.section} style={styles.card}>
            <View style={styles.glossaryGroupHead}>
              <Feather name="bookmark" size={12} color="#33A6FF" />
              <Text style={styles.glossaryGroupText}>{group.section}</Text>
            </View>
            <Text style={styles.refGroupHint}>{group.hint}</Text>
            {group.items.map((ref, idx) => (
              <View key={ref.name}>
                <View style={styles.refRow}>
                  <View style={styles.refBullet}>
                    <Text style={styles.refBulletText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.refName}>
                      {ref.name}
                      {ref.year !== "—" && (
                        <Text style={styles.refYear}> · {ref.year}</Text>
                      )}
                    </Text>
                    <Text style={styles.refOrg}>{ref.org}</Text>
                    <Text style={styles.refNote}>{ref.note}</Text>
                  </View>
                </View>
                {idx < group.items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ))}

        {/* 자주 묻는 질문 */}
        <Section
          icon="help-circle"
          label="자주 묻는 질문"
          hint="원장님들이 가장 많이 물어보시는 것"
          items={FAQ}
          keyPrefix="faq"
          openKeys={openKeys}
          onToggle={toggle}
        />

        {/* 용어 사전 */}
        <Text style={styles.sectionLabel}>경영지표 용어 사전</Text>
        <Text style={styles.sectionHint}>
          대시보드·히스토리·설정 곳곳에 등장하는 지표와 약어를 쉬운 말로 설명합니다.
        </Text>
        {GLOSSARY.map((group) => (
          <View key={group.section} style={styles.card}>
            <View style={styles.glossaryGroupHead}>
              <Feather name="tag" size={12} color="#33A6FF" />
              <Text style={styles.glossaryGroupText}>{group.section}</Text>
            </View>
            {group.items.map((item, idx) => {
              const key = `glossary:${group.section}:${item.term}`;
              const isOpen = openKeys.has(key);
              return (
                <View key={key}>
                  <TouchableOpacity
                    style={styles.entryRow}
                    activeOpacity={0.75}
                    onPress={() => toggle(key)}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.termText}>{item.term}</Text>
                      {item.short && <Text style={styles.termShort}>{item.short}</Text>}
                    </View>
                    <Feather
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#CBD5E1"
                    />
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.entryBody}>
                      <Text style={styles.entryBodyText}>{item.body}</Text>
                    </View>
                  )}
                  {idx < group.items.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.footer}>
          도움이 더 필요하시면 설정 &gt; 앱 버전에 표시된 채널로 문의 주세요.
        </Text>
      </ScrollView>

      <HomeFab />
    </View>
  );
}

// ── 재사용 섹션 (가이드 · FAQ 공통) ────────────────────────────
function Section({
  icon,
  label,
  hint,
  items,
  keyPrefix,
  openKeys,
  onToggle,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  hint: string;
  items: Entry[];
  keyPrefix: string;
  openKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <>
      <View style={styles.sectionHead}>
        <Feather name={icon} size={14} color="#33A6FF" />
        <Text style={styles.sectionLabelInline}>{label}</Text>
      </View>
      <Text style={styles.sectionHint}>{hint}</Text>
      <View style={styles.card}>
        {items.map((entry, idx) => {
          const key = `${keyPrefix}:${idx}`;
          const isOpen = openKeys.has(key);
          return (
            <View key={key}>
              <TouchableOpacity
                style={styles.entryRow}
                activeOpacity={0.75}
                onPress={() => onToggle(key)}
              >
                <Text style={styles.entryQ}>{entry.q}</Text>
                <Feather
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#CBD5E1"
                />
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.entryBody}>
                  <Text style={styles.entryBodyText}>{entry.a}</Text>
                </View>
              )}
              {idx < items.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E8EDF5",
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" as const, color: "#00153D" },
  content: { padding: 16, gap: 8 },

  introCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, marginBottom: 8,
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  introIconWrap: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: "#EBF5FF",
    alignItems: "center", justifyContent: "center",
  },
  introTitle: { fontSize: 15, fontWeight: "700" as const, color: "#00153D" },
  introBody: { fontSize: 12, color: "#64748B", lineHeight: 18 },

  sectionHead: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 4 },
  sectionLabelInline: { fontSize: 13, fontWeight: "700" as const, color: "#00153D", letterSpacing: 0.3 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700" as const, color: "#00153D",
    letterSpacing: 0.3, marginTop: 12, paddingHorizontal: 4,
  },
  sectionHint: { fontSize: 11, color: "#94A3B8", marginBottom: 8, paddingHorizontal: 4 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 14,
    shadowColor: "#00153D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 4,
  },

  entryRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10,
  },
  entryQ: { flex: 1, fontSize: 14, fontWeight: "600" as const, color: "#00153D", lineHeight: 20 },
  entryBody: {
    backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12,
    marginBottom: 8,
  },
  entryBodyText: { fontSize: 13, color: "#334155", lineHeight: 20 },

  divider: { height: 1, backgroundColor: "#F1F5F9" },

  glossaryGroupHead: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginBottom: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  glossaryGroupText: { fontSize: 11, fontWeight: "700" as const, color: "#33A6FF", letterSpacing: 0.5 },

  termText: { fontSize: 14, fontWeight: "700" as const, color: "#00153D" },
  termShort: { fontSize: 11, color: "#94A3B8", fontStyle: "italic" as const },

  refGroupHint: { fontSize: 11, color: "#94A3B8", marginBottom: 10, lineHeight: 16 },
  refRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8 },
  refBullet: {
    width: 22, height: 22, borderRadius: 8, backgroundColor: "#EBF5FF",
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  refBulletText: { fontSize: 10, fontWeight: "800" as const, color: "#33A6FF" },
  refName: { fontSize: 13, fontWeight: "700" as const, color: "#00153D" },
  refYear: { fontSize: 11, color: "#94A3B8", fontWeight: "500" as const },
  refOrg: { fontSize: 11, color: "#33A6FF", fontWeight: "600" as const },
  refNote: { fontSize: 11, color: "#475569", lineHeight: 17 },

  footer: {
    textAlign: "center", fontSize: 11, color: "#CBD5E1",
    marginTop: 20, paddingHorizontal: 16, lineHeight: 16,
  },
});
