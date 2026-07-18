# MYBRAIN 코드 지도

원장 전용 AI 경영 관제탑. 이 문서는 앱의 모든 소스 파일을 한 번에 훑어볼 수
있게 정리한 참조서다. "무엇을 하는가 · 어디에 있는가 · 왜 그렇게 짜여 있는가"
세 가지에 집중한다.

---

## 1. 개요

- **제품**: 치과 원장을 위한 경영 관제탑. HR·재무·환자 20개 KPI를 스캔·판정·처방까지 하나의 UX로 묶는다.
- **UI 모델**: Expo Router 6 (SDK 54) 앱을 웹 SPA로 export → Railway에 배포.
- **데이터**: 현재는 mockData 기반 · EMR·CAPS·OCR 연동 훅 지점만 남겨두고 실제 값은 하드코딩. 실서비스 붙일 때 `mockData`·`npsStorage`만 교체하면 UI가 그대로 동작.
- **인증**: 없음 (데모 로그인 · AsyncStorage로 세션 유지).
- **테스트**: 없음 · 빌드는 `expo export --platform web`이 통과하면 됨.

---

## 2. 기술 스택 & 빌드·배포

| 층 | 선택 | 이유 |
| --- | --- | --- |
| 런타임 | Node 20 (`engines` + `nixpacks.toml`) | `expo` CLI가 요구 |
| 프레임워크 | Expo SDK 54 · Router 6 | 라우팅/스플래시/폰트/이미지/제스처가 한 세트 |
| 프론트 언어 | TypeScript 5.9 | 라이브 데이터 스키마·판정 엔진의 타입 안전 |
| 상태 | React state + Context + AsyncStorage | 로컬 데모라 서버 없음. Redux 오버킬 |
| 스타일 | React Native StyleSheet + inline | 웹 native 병행 |
| SVG | `react-native-svg` | 게이지·차트·미니 그래프 전부 자체 렌더 |
| 서버 | 순정 Node `http` (`server/serve.js`) | dist를 서빙만 하면 되고 dep 최소화 |
| 배포 | Railway (nixpacks) | 원버튼 재배포 · `$PORT` bind 규약 준수 |

**빌드 흐름** (Railway):
1. `npm ci` → Node 20 · Expo/React 등 인스톨
2. `npm run build` = `expo export --platform web` → `dist/` 생성 (SPA · `app.json` `web.output = "single"`)
3. `npm run start` = `node server/serve.js` → `dist/`를 `$PORT`로 서빙, SPA fallback 처리

**로컬 확인 금지 규약**: `CLAUDE.md`에 "절대 localhost로 테스트하지 말 것" 명시. 코드 수정 → `git push` → Railway 자동 빌드 → 브라우저에서 배포 URL 확인이 표준 사이클.

---

## 3. 디렉터리 구조 & 라우팅

```
app/
├─ _layout.tsx          ← Root Stack + 전역 Provider + 웹 input focus reset
├─ +not-found.tsx       ← 미매칭 URL fallback
├─ intro.tsx            ← 로고 애니메이션 인트로
├─ (tabs)/
│  ├─ _layout.tsx       ← 빈 Stack (그룹 컨테이너 전용)
│  └─ index.tsx         ← 초기 진입 라우터 게이트 (Redirect 트리)
├─ (auth)/
│  ├─ _layout.tsx       ← 빈 Stack
│  ├─ sign-up.tsx       ← 회원가입 + 소셜 mock + 데모 진입
│  └─ login.tsx         ← 로그인 + 소셜 mock
├─ (quest)/             ← 관제탑 3단계 온보딩
│  ├─ _layout.tsx
│  ├─ index.tsx         ← 3단계 진행 허브
│  ├─ profile.tsx       ← Quest 2: 원장 동기화 (슬라이더·경영 성향)
│  ├─ scan.tsx          ← Quest 3: 재무 서류 스캔 (OCR mock)
│  └─ emr.tsx           ← Quest 1: EMR 연결 mock
├─ dashboard.tsx        ← 메인 관제탑 (HR + 크리시스 top3 + 재무 심층)
├─ history.tsx          ← 20 KPI 3개월 히스토리
├─ daily-receipt.tsx    ← CAPS 카드 매출 rec 업로드
├─ settings.tsx         ← 슬라이더 재조정 · 로그아웃 · 용어사전 진입
├─ help.tsx             ← 사용 가이드 · FAQ · 용어 사전 · NPS 설문
└─ survey.tsx           ← 공개 NPS 설문 (인증 없이 접근 · 태블릿용)

components/
├─ ErrorBoundary.tsx           ← 전역 Fallback
├─ ErrorFallback.tsx           ← 에러 화면 UI
├─ HomeFab.tsx                 ← 모든 비대시보드 화면의 대시보드 바로가기 FAB
├─ KeyboardAwareScrollViewCompat.tsx
├─ dashboard/                  ← 재무 심층분석 전용
│  ├─ SectionHeader.tsx        ← 3섹션 헤더 + 축 스코어 pill
│  ├─ InsightCard.tsx          ← 섹션별 통합 인사이트 카드
│  ├─ OverallVerdictHeader.tsx ← 종합 진단 헤더 (3축 배지 + rootCause)
│  ├─ AxisScoreBadge.tsx       ← 축 하나짜리 미니 배지
│  ├─ ScoreExplainerModal.tsx  ← 3축 스코어 설명 모달
│  ├─ LtvCacGauge.tsx          ← LTV:CAC 반원 게이지
│  ├─ RetentionTrio.tsx        ← 재내원/리콜/예방 3게이지 병렬
│  ├─ UncollectedFunnel.tsx    ← 미수금 4버킷 파이프라인
│  ├─ LaborCrossCard.tsx       ← HR × 재무 크로스 지표 카드
│  └─ AxisTrendLine.tsx        ← 라인 차트 + 벤치마크 라인
└─ help/
   ├─ NpsSurveyForm.tsx        ← NPS 설문 입력 폼 (demo/collect 모드)
   └─ NpsExportCard.tsx        ← QR + URL + CSV 내보내기 카드

lib/
├─ kpiEngine.ts          ← ABS/REL/DERIVED KPI 상태 판정 순수 함수 + 벤치
├─ financialInsights.ts  ← 3축 스코어 계산 + rootCause upstream DAG 선정
├─ kpiPrescriptions.ts   ← period × KPI 처방 매트릭스 (근본 스키마)
└─ npsStorage.ts         ← NPS 응답 AsyncStorage 저장·CSV 교환

constants/
├─ mockData.ts           ← 병원·EMR·HR·재무·KPI 20개 · period 4× 데이터
├─ historyData.ts        ← 20 KPI 6개월 히스토리 (history.tsx용)
└─ colors.ts             ← 시맨틱 컬러 팔레트 (light/dark)

context/
└─ AppContext.tsx        ← 인증·온보딩·슬라이더·period·다크모드 상태

server/
└─ serve.js              ← SPA 정적 서버 (외부 의존 0)

docs/
└─ CODE_MAP.md           ← 이 문서
```

---

## 4. 초기 진입·라우팅 게이트

`app/_layout.tsx` (Root Stack)
- 전역 Provider 체인: `ErrorBoundary → GestureHandlerRootView → SafeAreaProvider → KeyboardProvider → QueryClientProvider → AppProvider → Stack`
- `SplashScreen.preventAutoHideAsync()` 후 폰트(`Inter_400~700`) 로드 완료 시 해제
- 웹 전용 CSS injection: `input:focus { outline: none }` — RN-Web이 native `<input>` 렌더링 시 브라우저 기본 포커스 링을 뿌리는 문제 근본 차단
- `Stack.Screen` 등록: `(tabs)` · `intro` · `(auth)` · `(quest)` · `dashboard` · `daily-receipt` · `settings` · `help` · `history` · `survey`

`app/(tabs)/index.tsx` (=`/`)
- 앱 진입 라우터. 4단계 Redirect:
  1. `!isLoaded` → 아무것도 렌더하지 않음 (Root Layout mount 완료 대기 · "Attempted to navigate before mounting the Root Layout" 방지)
  2. `!hasSeenIntro` → `/intro`
  3. `!isAuthenticated` → `/(auth)/sign-up`
  4. `!allQuestsCompleted` → `/(quest)`
  5. 그 외 → `/dashboard`

`app/intro.tsx`
- 로고 페이드+스케일 애니메이션 · 완료 시 `markIntroSeen()` 호출 후 다음 라우트로. 이미 인증·quest 완료 상태면 `/dashboard`로 바로 튐.

`app/+not-found.tsx`
- 미매칭 URL fallback. Home 링크.

---

## 5. 상태 관리 (AppContext)

`context/AppContext.tsx` 하나로 앱 전체 상태 관리.

**저장 필드** (`AppState`):
- `isAuthenticated`, `hasSeenIntro`
- `userId`, `clinicName`, `clinicTenureYears` (REL 판정용 개원 연차 · 기본 3)
- `questsCompleted: { quest1, quest2, quest3 }`
- `doctorProfile`: `speedSlider · communicationSlider · chairSlider · managementType("A"|"B"|null)`
- `period: "today"|"week"|"month"|"quarter"` — 대시보드 · 처방 · 벤치마크 스코프
- `isDarkMode` (미사용 · 향후 훅)

**Provider 규약**:
- 최초 render 시 `AsyncStorage["mybrain_state"]`에서 복원 → `isLoaded=true` flip
- 모든 mutator는 **함수형 setState** (`setState(prev => ...)`) — closure의 stale state 참조 방지 (근본 픽스 이력 참조)
- persist는 `useEffect([state, isLoaded])` 하나로 단일화 · isLoaded false 시 skip
- 로그아웃은 `setState(defaultState)` — 필드 개별 초기화 X

**노출 API**:
- `login(userId, clinicName)` · `logout()`
- `completeQuest(quest)` · `markIntroSeen()`
- `setDoctorProfile(partial)` · `setPeriod(period)` · `toggleDarkMode()`
- 파생 값: `allQuestsCompleted`

**Root Cause 잦은 실수 방지 노트** (파일 상단 주석 참조):
- `save()`처럼 closure state를 읽어 합치는 헬퍼는 두 mutator가 한 tick에 연속 호출될 때 두 번째가 첫 번째 update를 stale로 덮어쓴다. 반드시 함수형 setState로.

---

## 6. 핵심 데이터 (mockData, historyData, colors)

### `constants/mockData.ts` (~980줄)

앱이 보여주는 값의 90% 이상이 여기서 나온다. `period` 4× 스키마가 관통한다.

- `CLINIC_INFO`, `EMR_MOCK` — 병원 기본 정보 + EMR 원자재 mock
- `HR_DATA_BY_PERIOD` (Record<Period, HrPeriodData>) — 매출·급여·바차트·스태프 리스트
  - `HR_DATA` (@deprecated) — 구버전 호환용, month에서 파생
- `FINANCE_DATA_BY_PERIOD` (Record<Period, FinancePeriodData>) — 재무 심층 3섹션의 모든 데이터
  - 각 period마다 `noShow`, `netProfit`, `retention`, `cancelRate`, `uncollected`, `ltvCac`, `bep`, `laborProfitRatio`, `perStaffProfit`, 인사이트 3종, `overallPrescription` 전체 포함
  - `FINANCE_DATA` (@deprecated) — 구버전 호환용
- `KPI_TOP3_BY_PERIOD`, `KPI_EXTRA_CRISIS_BY_PERIOD`, `KPI_ALL20_BY_PERIOD` — HR 패널의 크리시스 랭킹·추가 위기 KPI·전체 20 KPI 스냅샷
- `KPI_BENCHMARKS` — 20 KPI 각각의 벤치마크 텍스트 (예: `"3~5x 정상"`)
- `PRESCRIPTIONS` — 카드형 처방 5개 (레거시 · 대시보드 상단 인디케이터 · `kpiPrescriptions.ts`와는 별도 역할)
- `TREATMENT_MIX`, `MARKETING_DATA`, `ONLINE_REVIEWS`, `NPS_DATA`, `FIXED_COST_DETAIL` — 부속 카드용
- `VOICE_PARSE_EXAMPLES` — Quest 2 원장 슬라이더 예시 문구

**타입 export**: `HrPeriodData`, `FinancePeriodData`, `OverallPrescription`, `Kpi20Snapshot`, `KpiTop3Snapshot`

**주의**: mockData의 순이익률·인당 순이익·미수금 금액 등은 산술적으로 정합해야 함. 과거에 `perStaffProfit`이 10배 오류로 표기됐던 이력 있음 → 이번 라인은 today 8만 원 / week 45만 원 / month 167만 원 / quarter 445만 원 (안정 벤치 7/47/200/600 대비 계산됨).

### `constants/historyData.ts` (~430줄)

`history.tsx` 전용 6개월 히스토리 데이터.

- `KPI_HISTORY: KpiHistoryData[]` — 20개 KPI 각각의 (id, name, judgeType, benefitDirection, month별 entries, action, result)
- 타입: `KpiStatus`, `TrendResult ("improved"|"worsened"|"stable")`, `JudgeType`, `BenefitDirection ("higher"|"lower"|"stable")`
- v0.4 정정: `higherIsBetter` boolean은 폐기, `benefitDirection` 문자열로 통일

### `constants/colors.ts`

`light`/`dark` 각각 시맨틱 컬러(text/tint/background/primary/muted/border 등). 현재 대부분 컴포넌트가 인라인 hex를 쓰고 있어 실제 참조는 적음 · 다크모드 스위치가 아직 hook 지점만 있고 미사용.

---

## 7. KPI 판정 엔진

### `lib/kpiEngine.ts` — v0.4 판정 순수 함수

핵심: 하나의 KPI 값 + judgeType → `KpiStatus`("crisis"|"warning"|"normal"|"best")

- `evaluateKpiStatus(input)`:
  - `judgeType === "ABS"` → `KPI_THRESHOLDS[key]` 비교 (crisis/warning/best · lowerIsBetter)
  - `judgeType === "REL"` → `KPI_OPTIMAL_RANGES[key]` 범위 비교 (안·밖)
  - `judgeType === "DERIVED"` → `DERIVED_OPTIMAL_RANGES[key]` 범위 비교 + 상류 원인 지표 참조 힌트

- `KPI_THRESHOLDS` (전 KPI 단일 진실원):
  - `noShow`, `cancelRate`, `uncollected`, `materialCost`, `labFee`, `laborCost`, `staffTurnover`, `caseAcceptance`, `netProfit`(REL로 이관), `recallRate`, `treatComplete`, ...
- `KPI_OPTIMAL_RANGES` — `chairUtil (70~85)`, `newPatients (15~25%)`, `laborProfitRatio (1.0~2.0)` 등
- `DERIVED_OPTIMAL_RANGES` — `ltvCac (3~5)`, `patientLtv (280~)`, `revenuePerPt`, `marketingROI`

**단일 진실원 규약**: KPI 임계값이 바뀌면 이 파일만 수정. `mockData` `KPI_BENCHMARKS` 텍스트도 함께 손보되, 판정 로직은 이 파일이 유일.

### `lib/financialInsights.ts` — 3축 헬스 스코어 + rootCause

`dashboard.tsx`의 재무 심층분석 패널이 이 두 함수를 쓴다.

- `Axis` = `"profitability" | "retention" | "risk"`
- `AXIS_OF_ID: Record<number, Axis>` — 20 KPI를 축에 할당 (Tier B: 진료완료율·NPS·체어가동률은 재무 심층 UI에서 제외하지만 스코어 계산엔 포함)
- `TIER_S_IDS` — 스코어 계산 시 2× 가중치 KPI (LTV:CAC, 재내원율, 리콜, 순이익률, 예방·리콜 매출)
- `STATUS_HEALTH: Record<KpiStatus, number>` — best=100, normal=75, warning=45, crisis=15 (가중 평균 기반)

- `computeAxisScores(snapshots)` → `{ profitability, retention, risk }` 0~100
  - 각 축에 속한 KPI들의 status를 STATUS_HEALTH로 변환 · TIER_S는 2× 가중
- `bandOf(score)` → `"critical" | "risk" | "healthy" | "excellent"` (30/50/75 경계)
- `pickRootCause(snapshots, upstreamMap)` → `{ kpiKey, axis, count, reason }`
  - crisis/warning KPI의 상류 지표를 upstreamKpiKeys DAG로 역추적 → 하류 위기 지표를 가장 많이 유발하는 상류 하나를 선정

### `lib/kpiPrescriptions.ts` — 처방 매트릭스 (~1,160줄)

**구조**: `Record<Period, Record<KpiKey, KpiPrescription>>` 4×.

- `KpiPrescription`: `{ analysis[], solution[], effect[], action, judgeType?, isResultMetric?, upstreamKpiKeys? }`
- `KPI_PRESCRIPTIONS_BY_PERIOD` — 중앙 크리시스 5개 (laborCost / noShow / caseAcceptance / cancelRate / uncollected). 4개 period 전부 독립 재작성 · analysis·solution·effect·action 모두 period 스코프에 맞춰 조정 (예: today는 "지금 오후에", quarter는 "이번 분기 안에")
- `ALL20_PRESCRIPTIONS_BY_PERIOD` — 나머지 24 KPI. `month`가 baseline · today/week/quarter는 numeric claim이 명백히 부정확해지는 5개(netProfit·monthlyRevenue·patientLtv·recallRate·revenueMix)만 override
- `getKpiPrescription(kpiKey, period)` — period → month 순으로 fallback해서 반환. 대시보드 처방 모달이 이 helper 하나로 조회
- `hasKpiPrescription(kpiKey, period)` — 위 helper의 null 체크 래퍼

**규약**:
- `(풀이)` 문단은 개념 설명이라 period-agnostic — 원문 유지
- 구조적 조언(리콜 자동화·체어 병목·SOP 표준화)이 period-agnostic한 KPI들은 month advice로 fallback — 우회 아니고 설계 의도
- v0.4 정정 이후 `staffTurnover` 임계값 · `nps` 추세 기반 · `marketingROI` 응용식 등이 반영됨

---

## 8. 화면별 상세

### `app/dashboard.tsx` (~1,283줄) — 메인 관제탑

3열 관제 UI + 세로 스크롤로 재무 심층분석.

- **상단 헤더** — 인사, 오늘 날짜, HomeFab을 대체하는 톱바 액션(설정·히스토리·일일 리시트)
- **Period 필터** — 오늘/이번 주/이번 달/분기 pill · 이 값이 모든 하위 데이터의 스코프
- **HR 관제** (좌) — 매출·급여·이직·스태프 리스트
- **크리시스 TOP3 + 추가 위기** (중앙) — `KPI_TOP3_BY_PERIOD` + `KPI_EXTRA_CRISIS_BY_PERIOD` · 카드 탭 → `openKpiPrescription(kpiKey)` → 처방 모달
- **재무 심층분석** (우) — 3섹션 구조
  1. **수익성 (Unit Economics)** — LtvCacGauge · BEP 카드 · InsightCard(profit)
  2. **유지 경제학·Value-Based Care** — RetentionTrio · patientLtv · treatComplete · InsightCard(retention)
  3. **리스크·현금** — 노쇼/취소 AxisTrendLine · UncollectedFunnel · InsightCard(risk)
  - 각 섹션에 `SectionHeader` + 방법론 라벨 + 축 스코어 pill(?) → `ScoreExplainerModal`
  - HR × 재무 크로스: `LaborCrossCard` (인건비 대비 순이익 배수 · 인당 순이익)
- **처방 모달** — 20 KPI 어느 카드든 탭 시 등장. `overall` 특수 키는 `finance.overallPrescription` (mockData의 period 스코프) 사용. 개별 KPI는 `getKpiPrescription(key, period)` 조회.
- **20 KPI 확장 목록** — `ALL20_KEY_MAP`으로 id ↔ key 매핑

**주의점**:
- 조회는 무조건 `getKpiPrescription()` — 예전엔 `KPI_PRESCRIPTIONS[kpi] ?? ALL20_PRESCRIPTIONS[kpi]` 체인이었으나 근본 스키마 도입 후 통일됨
- period notice 배지는 제거됨 (4× 확장으로 근본 대응)

### `app/history.tsx` (~455줄)

`KPI_HISTORY` 20개를 카테고리별 접힘/펼침 카드로 표시. 각 KPI 카드에는 6개월 라인 차트 + judgeType 배지 + benefitDirection 화살표 + 결과(개선/악화/유지) 태그가 붙는다. Auth gate 래퍼 패턴 (`function HistoryScreen()` = 게이트, `function HistoryScreenInner()` = 실제 화면 — hooks 순서 안전).

### `app/daily-receipt.tsx` (~455줄)

CAPS(카드 승인 데이터) CSV 업로드 mock. `expo-document-picker` 사용, 파일 파싱은 없음 (UI 시연 목적). 성공 시 요약 카드로 표시. Auth gate 래퍼.

### `app/settings.tsx` (~570줄)

- 슬라이더 3개 (speed/communication/chair) + 경영 성향 타입 A/B 재조정
- 변경 즉시 `setDoctorProfile(partial)` 저장 (기존엔 명시적 저장 버튼 필요했음 → 이제 즉시 반영 UX)
- 로그아웃 · 앱 버전 · KPI 벤치 요약 · 용어 사전 진입 링크
- 웹 뒤로가기: `router.canGoBack() ? back() : replace("/dashboard")` — 새로고침 후 히스토리 없는 상태 대응
- Auth gate 래퍼

### `app/help.tsx` (~770줄)

- **사용 가이드** — 접힘 섹션 4~5개 (온보딩·용어·판정 규칙·NPS 등)
- **점수 규칙** — 3축 스코어 산출 근거 · Tier S 가중 등 상세 설명
- **NPS 설문** — `NpsSurveyForm mode="demo"` (샘플 · 즉시 저장) + `NpsExportCard` (수집 URL + QR + CSV 내보내기)
- **레퍼런스** — 분야별 참고 문헌 (Unit Economics · Lean · TPS · VBC · ToC · NRR)
- **FAQ** — 자주 묻는 질문
- **경영지표 용어 사전** — 23개 KPI + 판정 방식 + 부속 약어(EMR/CAPS/OCR/CAC/객단가)
  - 각 항목: `term` · `short?` · `body` · `range?` (정상 범위)
  - `range`는 초록색 target 아이콘 callout으로 별도 표시 — 우수/정상/경고/위기 구간 + 원장 스타일 조정·v0.4 정정·상류 지표 여부 등 특기사항
- Auth gate 래퍼 + HomeFab

### `app/(auth)/sign-up.tsx`, `login.tsx`

- 아이디 + 비밀번호 로그인 (mock). 소셜 로그인 3종 (Apple/Google mock).
- 회원가입에는 **데모 대시보드 바로 체험** 버튼 — `login("demo",...) + completeQuest×3 → /dashboard`
- 로그인/가입 성공 후 라우팅: `allQuestsCompleted ? /dashboard : /(quest)` (헬퍼 `afterLogin()`)

### `app/(quest)/index.tsx` — 3단계 온보딩 허브

3장의 큰 카드 (EMR · 원장 · 재무). 완료 상태에 따라 배지 색·아이콘 변경. 순서는 자유 · 3개 모두 완료 시 다음 라우팅에서 `/dashboard`로.

### `app/(quest)/emr.tsx` — Quest 1

EMR 연결 mock. 병원 EMR 브랜드 선택 UI · "연결" 버튼 tap 시 `completeQuest("quest1")` 후 `router.back()`.

### `app/(quest)/profile.tsx` — Quest 2

원장 동기화. 슬라이더 3개(진료 속도 · 커뮤니케이션 · 체어 운영) + 경영 성향 A/B 카드. 완료 시 `setDoctorProfile(all)` + `completeQuest("quest2")` 순서로 저장(과거 순서 뒤바꿔서 관리 타입이 저장 안 되는 버그가 있었음 · 함수형 setState + useEffect persist로 근본 해결).

### `app/(quest)/scan.tsx` — Quest 3

재무 서류 OCR mock. 3장 (일일 리시트 · 종합 계산서 · CAPS csv) 시나리오. 문서 선택 시 progress bar 애니메이션 후 완료 배지 · `completeQuest("quest3")`.

### `app/survey.tsx` — 공개 NPS 설문

- 인증·quest 게이트 없이 접근 가능 (`/survey`). 태블릿에서 QR로 열거나 URL 공유.
- `NpsSurveyForm mode="collect"`만 렌더 · 완료 화면 후 자동 리셋 UX 없음 (다음 응답자는 페이지 새로고침)

### `app/intro.tsx`

로고 페이드+스케일 애니메이션 (Animated · Pressable). 이미 인증·quest 완료 상태로 재진입해도 그대로 재생될 수 있어 `markIntroSeen()` 후 다음 라우트로 자연스레 이동.

---

## 9. 대시보드 컴포넌트 (`components/dashboard/*`)

### `SectionHeader`
좌: 섹션명 + 방법론 서브라벨 · 우: 축 스코어 pill (band 색상 background · 숫자/100 · `(?)` 아이콘 → `onPressExplain`).

### `InsightCard`
`tone: "profit" | "retention" | "risk"` 별 색조 (초록/파랑/주황). 큰 문장 하나. 섹션 최상단에 배치.

### `OverallVerdictHeader`
재무 심층분석 패널 최상단 종합 진단 헤더. `AxisScoreBadge` 3개 · 방법론 라벨 · rootCause 지표명·이유 · overall 처방 진입 CTA.

### `AxisScoreBadge`
축 하나의 미니 배지. `BAND_COLOR`/`BAND_LABEL` 규약: excellent(=최우수)/healthy/risk/critical.

### `ScoreExplainerModal`
스코어 pill `(?)` 탭 시 등장. 각 축이 왜 이 점수인지 · 어떤 KPI들이 기여하는지 쉬운말 설명. Tier S 가중치 · STATUS_HEALTH 계산식 소개.

### `LtvCacGauge`
반원 SVG 게이지. 0~8x 스케일 · 3~5x 초록(최적) 밴드 · 현재 값 파랑 arc · 아래 LTV/CAC/Payback 3분할. `alignSelf: "center"`로 부모 카드가 넓어도 중앙 배치.

### `RetentionTrio`
재내원율·리콜 성공률·예방·리콜 매출 비중 3개 원형 게이지 병렬. 각 게이지 탭 → `onPressKey(key)`로 처방 모달.

### `UncollectedFunnel`
미수금 4버킷 (`Bucket` 타입) 스택 바. 각 버킷에 회수 확률(%) 표시. 90일+ 급락 리스크 강조.

### `LaborCrossCard`
HR × 재무 크로스 두 지표를 한 카드에:
- 좌: `laborProfitRatio` (인건비 1원당 순이익)
- 우: `perStaffProfit` (스태프 인당 순이익 만 원)
- 인건비 자체는 좌측 HR 관제에 있으므로 여기선 "인건비가 낳는 이익" 각도

### `AxisTrendLine`
라인 차트 + 벤치마크 라인 오버레이 SVG. 노쇼·당일 취소·순이익률 등에서 공통 사용. viewBox + style props로 반응형 스케일.

---

## 10. 도움말·NPS 컴포넌트 (`components/help/*`)

### `NpsSurveyForm`
- `mode: "demo" | "collect"` — demo는 도움말 안, collect는 공개 /survey에서
- 10점 척도 라디오 + 이유 서술 · 개인정보 미수집 (익명)
- 제출 시 `saveResponse()` (AsyncStorage 기반 · npsStorage.ts)

### `NpsExportCard`
- 3개 액션 카드
  1. **공개 URL** — 현재 도메인 + `/survey`
  2. **QR 코드** — `react-native-qrcode-svg`로 위 URL 인코딩
  3. **CSV 내보내기·불러오기** — `responsesToCsv` / `importAndMerge`
- 브라우저에서만 다운로드 링크 렌더 (native는 아직 Alert로 대체)

---

## 11. 공통 컴포넌트

### `ErrorBoundary` + `ErrorFallback`
- React 3.x classical `componentDidCatch` 기반. Fallback 컴포넌트는 별도 파일 (`ErrorFallback.tsx`)
- Fallback: 에러 아이콘 · 오류 요약 · 상세 스택 접힘 · "다시 시도" (reloadAppAsync)

### `HomeFab`
- 모든 비대시보드 화면 우하단에 뜨는 `대시보드` 바로가기 FAB
- 하단 safe-area 감안 · 그림자 + 파스텔 배경
- 눌리면 haptics + `router.replace("/dashboard")`

### `KeyboardAwareScrollViewCompat`
- 웹에서는 `ScrollView`, 네이티브에서는 `KeyboardAwareScrollView`로 자동 스왑
- 이유: `react-native-keyboard-controller`가 웹에서 no-op에 가까워서 오히려 층을 하나 없애는 게 이득

---

## 12. NPS 저장·CSV 파이프라인 (`lib/npsStorage.ts`)

- **저장**: AsyncStorage `mybrain_nps_responses` key에 배열 JSON. 향후 백엔드 붙일 때 `saveResponse`/`loadResponses`만 갈아끼우면 됨.
- **응답 타입**: `NpsResponse = { id, score, reason?, tabletId?, createdAt }`. `categoryOf(score)`로 promoter/passive/detractor 분류.
- **요약**: `summarize(responses)` → `{ score(=NPS), promoters, passives, detractors, count, average, byMonth[] }`
- **CSV 교환**:
  - `responsesToCsv(responses)` → 헤더 + 이스케이프 처리된 라인
  - `csvToResponses(csv)` → 파싱 (쉼표 안 따옴표 처리)
  - `importAndMerge(csv)` → 로컬 데이터와 병합 (id 중복 스킵) · `{ added, skipped }` 반환

**폴백 시나리오**: 태블릿에서 CSV로 내보내기 → 파일 공유 → 원장 앱에서 불러오기 → 로컬 스토리지 병합. 백엔드 없이 완전 오프라인 데모 가능.

---

## 13. 서버 (`server/serve.js`)

- 순정 Node `http` 모듈만 사용. 외부 의존 0.
- `DIST = dist/` · `INDEX = dist/index.html`
- `MIME` map: html/js/css/json/svg/png/webp/ico
- 요청 처리 순서:
  1. `/_expo/static/...` 해시 자산 → `Cache-Control: max-age=31536000, immutable`
  2. 그 외 정적 파일 → `Cache-Control: max-age=0, must-revalidate`
  3. 파일 없음 → `dist/index.html` 반환 (SPA fallback)
- `$PORT` 바인딩 (Railway 규약). 미지정 시 기본 3000.

---

## 14. 주요 설계 규약

### 라우팅 시점 안전
- `(tabs)/index.tsx`에서 `<Redirect>`는 `isLoaded=true` 이후에만 발동 — Root Layout mount 완료 대기. 이 규칙을 어기면 "Attempted to navigate before mounting the Root Layout" 에러.
- 다른 화면의 `router.push/replace`는 `useEffect`/이벤트 핸들러 내부여야 안전.

### Period 스코프 통일
- `period` 상태 하나가 대시보드·처방·벤치마크 텍스트에 관통. 새 카드나 KPI를 추가할 때는 반드시 `*_BY_PERIOD` 매트릭스에 4× 등록.

### Auth Gate Wrapper 패턴
- `SettingsScreen` = 게이트 (isLoaded/isAuthenticated 체크만), `SettingsInner` = 실제 hooks/렌더링
- 이 분리로 게이트 조기 return 시 hooks 순서 위배를 방지 · history.tsx, help.tsx 등 모두 동일 패턴

### 단일 진실원
- KPI 임계값 → `lib/kpiEngine.ts`
- 3축 스코어 계산 → `lib/financialInsights.ts`
- Period × KPI 처방 → `lib/kpiPrescriptions.ts`
- Period × HR/재무 데이터 → `constants/mockData.ts`

### 함수형 setState + useEffect persist (AppContext)
- mutator에 closure state 참조 금지 · 반드시 `setState(prev => ...)`
- persist는 `useEffect([state, isLoaded])` 하나로 · 각 mutator에 저장 로직 X

### 웹 focus outline 리셋
- `_layout.tsx`에서 한 번만 CSS inject. 개별 컴포넌트에서 outline 처리 안 함.

### 조언·용어의 층 분리
- **분석 (analysis)**: 왜 이 값이 이 상태인지
- **처방 (solution/effect/action)**: 무엇을 언제 어떻게 할지
- **(풀이)**: 위 문장들의 쉬운말 요약 · 단일 항목 bullet으로 표시
- **정상 범위 (range)**: 도움말 용어 사전에서만 · 우수/정상/경고/위기 구간

---

## 15. 최근 근본 수정 이력 (참고용)

브랜치 `claude/mybrain-v2-root-layout-6sg553`의 주요 근본 픽스 (커밋 로그 참조):

- Root Layout mount 에러 → `isLoaded` 게이트 도입
- Railway 배포 파이프라인 (nixpacks.toml · package.json engines · server/serve.js)
- 이메일 → 아이디 로그인 전환
- 웹 input focus outline 근본 차단 (_layout.tsx CSS inject)
- Settings 뒤로가기 웹 히스토리 안전화 (`canGoBack() ? back() : replace()`)
- `/help` 사용 가이드·용어 사전 신설
- HomeFab 도입 · 모든 비대시보드 화면
- 대시보드 period 필터 → 모든 패널 반응
- 20 KPI 벤치마크·top3 period 4× 스코프
- 재무 심층분석 3섹션 재구성 (Unit Economics · VBC · Risk)
- 3축 스코어 계산 순수 함수 (financialInsights.ts)
- 신규 시각 컴포넌트 6종 (LtvCacGauge · RetentionTrio · UncollectedFunnel · LaborCrossCard · AxisTrendLine · AxisScoreBadge)
- NPS 설문 폼·CSV·QR 파이프라인
- 스코어 pill `(?)` → 쉬운말 모달
- 처방 20 KPI 전체에 `(풀이)` 문단 · 후 단일 항목이라 외곽 괄호 제거
- perStaffProfit 10배 오류 · 미수금 액수 · 스코어 정합
- `staffTurnover` 임계값 · `nps` 추세 · `marketingROI` 응용식 등 v0.4 정정
- `hasSeenIntro` AsyncStorage persist
- 회원가입 후 라우팅에 `allQuestsCompleted` 분기
- **처방 텍스트 period 하드코딩 근본**: `KPI_PRESCRIPTIONS_BY_PERIOD` 4× 스키마 확장 (mitigation 배지 제거)
- **경영성향 저장 근본**: AppContext 모든 mutator를 함수형 setState + useEffect persist (closure stale 참조 방지)
- LTV:CAC 게이지 카드 내 중앙 배치 (`alignSelf: "center"`)
- 도움말 용어 사전 23개 항목에 `range` (정상 범위) 필드 추가

---

## 부록: 다음에 어떻게 확장하나

- **실데이터 연동**: `mockData.ts`를 걷어내고 API/EMR fetch로 교체. 판정 로직·컴포넌트는 그대로.
- **백엔드 NPS 저장**: `npsStorage.ts`의 `saveResponse`/`loadResponses`만 Supabase/Firebase 콜로 교체.
- **다크모드 활성화**: `AppContext.toggleDarkMode`는 이미 있음 → `colors.ts`의 dark 팔레트를 쓰도록 컴포넌트에서 `useColorScheme` + `colors.dark.*` 참조로 전환.
- **KPI 추가**: `kpiEngine.KPI_THRESHOLDS` → `mockData.KPI_ALL20_BY_PERIOD` → `kpiPrescriptions.ts` → `historyData.ts` → `help.tsx` glossary 순으로 등록.
- **다국어**: 현재 UI 문구가 한국어 하드코딩. i18n 도입 시 문자열을 별도 리소스로 뽑아야 함.

이 문서는 앱의 현재 상태를 반영한다. 코드가 바뀔 때마다 관련 절도 갱신하는 걸 규약으로 삼는다.
