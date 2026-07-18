# MYBRAIN 바이블

> 누가 봐도 mybrain의 뼈대까지 다 파악할 수 있게 쓴 정본(定本).
> 개발자·기획자·원장 — 세 시선 모두를 위한 하나의 참조서.

이 문서는 mybrain의 존재 이유부터 각 코드 라인의 결정 근거까지 다섯 권의
"책"으로 나눠 정리한다. 앞의 두 형제 문서 `docs/CODE_MAP.md` (소스 지도)
와 `docs/STACK_SPEC.md` (스택 명세서)는 이 바이블의 어깨 위에 서 있는
세부 참조서다. 여기가 큰 그림을 잡는 곳이고, 저기가 세밀한 참조를 찾는
곳이다.

---

## 목차

**서장**: 이 문서를 어떻게 읽는가

**제1권 — 왜 존재하는가 (Why)**
1. 제품 철학: 원장 옆의 실장·회계사·컨설턴트를 하나로
2. 대상 사용자: 개원 3~7년차 원장의 하루
3. 왜 지금인가: EMR·CAPS·NPS 데이터가 흩어져 있는 시대
4. 무엇이 아닌가: 이 앱이 하지 않는 것

**제2권 — 무엇을 하는가 (What)**
5. 시나리오: 처음 앱을 켠 원장의 90초
6. 관제탑 지도: 15개 화면 · 하나의 흐름
7. 20 KPI 카탈로그: 무엇을 · 왜 · 언제 보는가
8. 판정 방법론: ABS · REL · DERIVED 세 프레임
9. 처방 문법: 분석 · 해법 · 효과 · 액션 · 풀이
10. 3축 스코어: 수익성 · 유지 경제학 · 리스크

**제3권 — 어떻게 서 있는가 (How)**
11. 아키텍처 큰 그림 · 6개 층
12. 상태 관리의 계약: 단일 진실원 + 함수형 setState
13. 라우팅 게이트: mount 안전과 4단계 리다이렉트
14. Period 스코프: 이 앱을 관통하는 기간의 힘
15. KPI 판정 엔진: 임계값 하나의 진실원
16. 3축 스코어 계산: Tier S 가중과 근본 원인 DAG
17. 처방 매트릭스: Period × KPI 4× 스키마
18. NPS 파이프라인: 로컬 저장 · CSV · QR
19. 웹 SPA 서버: 87줄로 하는 정적 서빙
20. 컴포넌트 층: 재사용의 규칙과 예외

**제4권 — 왜 그렇게 서 있는가 (Why This Way)**
21. 설계 결정 히스토리: 무엇을 바꿨고 왜 그랬는가
22. 근본 픽스의 5원칙
23. 규약: 컨벤션이 아닌 안전 장치
24. 반복된 실수 · 다시는 이렇게 하지 말 것
25. 방법론 계보: 이 지표들이 어디서 왔는가

**제5권 — 어디로 가는가 (Where Next)**
26. 확장 가능성: 다음 6개월의 로드맵
27. 실 데이터 연동 시나리오
28. 다국어 · 다크모드 · 태블릿
29. 알려진 한계와 우회
30. 새 KPI · 새 화면 추가 매뉴얼

**부록**
- A. 용어 사전
- B. 커밋 히스토리로 읽는 앱 성장
- C. 트러블슈팅 플레이북
- D. 관련 문서 지도

---

# 서장: 이 문서를 어떻게 읽는가

이 문서는 **세 가지 시선**을 하나로 엮어 쓰였다:

1. **원장의 시선** — 이 앱이 나에게 어떤 결정을 도와주는가
2. **기획자의 시선** — 왜 화면이 이렇게 흐르는가
3. **개발자의 시선** — 소스가 왜 이렇게 짜여 있는가

각 절은 세 시선 중 어느 하나에 무게가 실린다. 기술적 세부가 나오는 절
앞에는 `[기술]`, 방법론이 나오는 절 앞에는 `[방법론]`, 제품 스토리는
`[제품]` 표기를 붙였다.

바쁜 독자를 위한 최소 읽기 경로:
- **원장·의사결정자**: 1장 · 2장 · 5장 · 6장 · 10장 · 21장
- **기획자·PM**: 1~10장 전체 · 21장 · 25장 · 27장
- **신규 개발자 온보딩**: 11~20장 · 22~24장 · 30장 + 부록 D
- **재방문 개발자 (기억 재환기)**: 부록 B · 24장 · 각 근본 픽스 절

각 장 끝에는 `→ 관련 파일`, `→ 관련 문서` 링크를 붙였다.

---

# 제1권 — 왜 존재하는가

## 1장. 제품 철학: 원장 옆의 실장·회계사·컨설턴트를 하나로

**[제품]**

치과 병원을 성장시키는 데 필요한 지식은 세 사람에게 흩어져 있다:

- **실장(사무장)**: 하루 예약률, 노쇼, 스태프 스케줄, 대기시간
- **회계사·세무사**: 매출, 인건비, 재료비, 순이익률, BEP
- **경영 컨설턴트**: LTV, CAC, 유지 경제학, 벤치마크, 3~5년 전략

원장이 이 세 데이터를 한자리에 놓고 판단하려면:
1. 실장에게 물어보고
2. 회계사에게 자료를 요청하고
3. 컨설턴트에게 결과 해석을 부탁해야 한다.

세 사람의 답이 각기 다른 언어·다른 프레임으로 도착하므로, **원장은
원장이 아니라 통역자가 되어 살아간다**. 진료 시간이 아까운 이유다.

**mybrain의 존재 이유**: 이 세 언어를 하나로 통합해 원장의 시선 앞에
"오늘 어떤 결정을 해야 하는가"만 남긴다. 관제탑처럼 · 3초 안에 · 쉬운
말로.

### 세 가지 약속

1. **하나의 대시보드**: HR + 재무 + 환자 관계를 나눠 보지 않는다.
   서로 원인·결과가 얽혀 있으니 한 화면에서 보고, 한 필터(period)로
   같은 기간을 훑는다.

2. **판정 + 처방까지**: "이 숫자가 78%다"에서 끝나지 않는다.
   "78%가 정상 구간의 어디쯤이며, 왜 이 상태이고, 오늘·이번 주·이번 달
   무엇을 해야 하는지"까지 한 카드에 담는다.

3. **원장의 언어**: 회계·경영 용어를 억지로 배우게 하지 않는다.
   모든 지표·판정·처방에 **쉬운말 풀이**를 붙여 놓는다. 지표 뒤에 숨은
   개념(LTV·CAC·ToC·NRR)은 도움말에서 배울 수 있으나, 대시보드에서는
   보지 않고도 판단이 가능해야 한다.

### 이 약속을 지키는 코드 근거

- HR·재무·환자가 한 화면: `app/dashboard.tsx` (3열 관제 + 세로 심층)
- 판정 + 처방: `lib/kpiEngine.ts` + `lib/kpiPrescriptions.ts`
- 쉬운말 풀이: 모든 처방 analysis 배열의 마지막 bullet · 도움말의
  용어 사전 `range` 필드

→ 관련 문서: `docs/CODE_MAP.md` §1 (개요)

---

## 2장. 대상 사용자: 개원 3~7년차 원장의 하루

**[제품]**

- **직군**: 치과 원장 (병원장·개원의)
- **연차**: 개원 3~7년차 · 안정기~성숙기
- **규모**: 체어 4~10대 · 스태프 6~12명
- **일일 진료 시간**: 8~10시간
- **경영에 쓸 수 있는 시간**: 하루 15~30분 · 주로 오전 진료 전 or 저녁 마감 후

이 시간대에 원장이 얻고자 하는 답:
1. **위기 감지**: 지금 새고 있는 돈은 어디인가
2. **다음 액션**: 오늘 or 이번 주에 뭘 해야 하는가
3. **추세 판단**: 이번 달·분기 흐름이 좋아지고 있는가

이 세 질문에 3~5분 안에 답할 수 있어야 한다.

### 원장의 하루 시나리오

- **08:00** 진료 전 · mybrain 열기 → HR 관제 3열로 어제·오늘 이슈 스캔
  → 스태프 이직·번아웃 신호 있으면 실장과 조회
- **12:30** 점심 · 크리시스 top3 카드 tap → 처방문 읽기 → 오늘 오후에
  할 액션 1~2개 확인
- **19:30** 마감 후 · 재무 심층분석 세로 스크롤 → 3축 스코어 · rootCause
  · overallPrescription → 이번 주 회의 안건 뽑기
- **주말** · 히스토리·설정·도움말 (레퍼런스 학습) 열람

이 시나리오는 앱의 UX 결정에 그대로 반영되어 있다:
- HR 3열은 **탐색 (scanning)** 최적화 · 큰 그림 3초에 파악
- 크리시스 top3는 **행동 (action)** 최적화 · 처방을 즉시 제안
- 재무 심층은 **전략 (strategy)** 최적화 · 세로 스크롤로 층층이 이해

### 데모 원장 페르소나

`constants/mockData.ts`의 CLINIC_INFO가 이 페르소나를 담고 있다:
```ts
{
  name: "서울나눔치과의원",
  doctorName: "박지연 원장",
  chairCount: 6,
  staffCount: 8,
  clinicTenureYears: 3,   // v0.4: REL 판정 기준
}
```

3년차 · 체어 6대 · 스태프 8명 = "지금 안정기 진입 직전, 성장이냐 내실이냐"
갈림길에 있는 원장의 상태를 상정.

→ 관련 파일: `constants/mockData.ts:1-8`

---

## 3장. 왜 지금인가: EMR·CAPS·NPS 데이터가 흩어져 있는 시대

**[제품]**

2020년대 중반의 치과 병원 데이터 환경:

- **EMR** (두번에·덴트웹·이지플러스 등): 예약·진료·수납 데이터 · API가 있어도 문서화 부실 · 병원마다 커스터마이징
- **CAPS** (카드 승인 데이터): 매출 실적 · CSV 다운로드는 되지만 EMR과 매칭 어려움
- **네이버·카카오 리뷰**: 온라인 평판 · 개별 확인
- **NPS 설문**: 태블릿 or 종이 · 대개 수집만 하고 분석 안 함
- **회계 프로그램**: 손익 계산서 월 1회 · PDF로 도착

원장이 이 다섯 갈래 데이터를 하나로 엮는 건 사실상 불가능. 실장이나
회계사가 각자의 프레임으로 요약해 오면 원장은 그걸 통역해서 봐야 한다.

**mybrain의 데이터 통합 전략**:
- **1단계 (현재)**: mockData 기반 시연 · UX·판정·처방 로직 검증
- **2단계**: EMR 단방향 스캔 (읽기 전용 · 예약·수납 데이터)
- **3단계**: CAPS CSV 자동 임포트 · CAPS ↔ EMR 매칭
- **4단계**: NPS 설문 태블릿 실시간 · QR로 접근
- **5단계**: 회계 PDF OCR · 손익 계산서 자동 파싱
- **6단계**: 원장 슬라이더로 개인화된 벤치마크

이 6단계 중 1단계는 완성, 4단계는 파이프라인 구축 완료 (`/survey` +
CSV 교환), 5단계는 UI mock만 존재 (`daily-receipt.tsx`, `(quest)/scan.tsx`),
2·3·6단계는 hook 지점만 남겨둔 상태.

**"지금"이 필요한 이유**: 원장이 데이터를 볼 수 있는 도구가 대부분 회계
프로그램의 부록으로 존재. "경영 대시보드"가 아니라 "장부의 그림". 원장의
의사결정 언어로 재조직된 도구는 시장에 부재.

→ 관련 파일: `constants/mockData.ts` (EMR_MOCK), `lib/npsStorage.ts`,
`app/daily-receipt.tsx`, `app/(quest)/scan.tsx`

---

## 4장. 무엇이 아닌가: 이 앱이 하지 않는 것

**[제품]**

기대 관리를 위해 명시적으로 하지 않는 것들:

1. **회계 프로그램 대체가 아니다** — 손익 계산서·부가세 신고는 회계사와 회계 SW의 영역
2. **EMR 대체가 아니다** — 예약·진료 기록·차팅은 EMR에 계속 남는다
3. **환자 CRM이 아니다** — 개별 환자 커뮤니케이션·리마인더는 EMR/카카오 CRM이 담당
4. **팀 채팅이 아니다** — 원장·스태프·실장 커뮤니케이션은 슬랙·카카오
5. **매출 목표 강요 없음** — v0.4 정정 이후 "월 매출 1억" 같은 절대 목표를 강요하지 않는다. REL 판정으로 연차·규모 대비 추세를 본다
6. **자동 액션 실행 없음** — 처방을 제안하되 실장·스태프 스케줄 변경을 앱이 직접 하지 않는다

이 경계선은 UX에도 반영:
- 처방 문구가 항상 "① 오늘 ~ / ② 이번 주 ~ / ③ 이번 달 ~" 3단 액션 형식으로 원장이 실장에게 지시할 수 있는 형태
- 대시보드에 팀 채팅·환자 리스트·주소록 없음

→ 관련 문서: `docs/CODE_MAP.md` §14 (설계 규약)

---

# 제2권 — 무엇을 하는가

## 5장. 시나리오: 처음 앱을 켠 원장의 90초

**[제품 · 개발자]**

첫 방문 시 mybrain이 원장에게 보여주는 흐름:

### 0~3초: Intro
- 로고 페이드 인 + 스케일 · 앱 이름 "myBrain"과 태그라인 "병원장 전용 AI 경영 관제탑"
- 배경: 흰색 → 파랑 그라디언트
- 하단: "탭해서 시작" 안내
- **코드**: `app/intro.tsx`. `markIntroSeen()` 호출 후 다음 라우트로.

### 3~10초: 인증 (Sign-up · Login)
- 아이디 + 비밀번호 (mock) 또는 Apple/Google 소셜 (mock 3종 버튼) 또는 데모 대시보드 바로 체험
- 태그라인·안내는 여전히 부드러운 파스텔 톤
- **데모 진입**: `handleDemo()`가 login + completeQuest×3 → `/dashboard` 직행
- **코드**: `app/(auth)/sign-up.tsx`, `app/(auth)/login.tsx`

### 10~60초: 관제탑 3단계 (Quest)
데모가 아닌 경우 온보딩 3단계로 진입:
1. **Quest 1 · EMR 연결** (`(quest)/emr.tsx`): EMR 브랜드 선택 → "연결" tap → 완료 배지
2. **Quest 2 · 원장 동기화** (`(quest)/profile.tsx`):
   - 슬라이더 3개 (진료 속도 · 커뮤니케이션 · 체어 운영)
   - 경영 성향 A/B (공격적 확장 · 고정비 절감) 카드 선택
   - 이 값들이 나중에 KPI 벤치마크를 개인화 (예: A형 원장 → 인건비 27%까지 허용 · B형은 22%로 엄격)
3. **Quest 3 · 재무 서류 스캔** (`(quest)/scan.tsx`): 3장의 서류 카테고리 · OCR mock (실제 파싱 없음)

### 60~90초: 대시보드 진입
- 3단계 완료 → `allQuestsCompleted = true` → `/dashboard`
- 상단 인사 + 오늘 날짜
- Period 필터 (오늘/이번 주/이번 달/분기 · 기본 이번 달)
- 3열 관제 (HR / 크리시스 top3 / 재무 심층 헤더) → 세로 스크롤로 재무 심층 3섹션
- 첫 눈에 들어오는 것: 위기 지표 3개 + 각각의 처방 CTA

이 90초 안에 원장이 이 앱이 하는 일 · 자신의 데이터가 어디로 흘러들어가는지 · 무엇을 얻을 것인지를 감각적으로 이해할 수 있어야 한다.

### 재방문 시나리오
- AsyncStorage에 세션·quest·doctorProfile 저장되어 있음 → intro 스킵 · 로그인 스킵 · 바로 dashboard
- Quest 완료 상태이면 게이트 통과 · 미완료 KPI가 있으면 그 quest로 재진입

**핵심**: 세션 유지가 UX 마찰의 대부분을 흡수. 원장이 "매번 다시 로그인하는 번거로움"을 느끼지 않도록 `hasSeenIntro`·`isAuthenticated`·`questsCompleted` 모두 persist.

→ 관련 파일: `app/(tabs)/index.tsx`, `context/AppContext.tsx`

---

## 6장. 관제탑 지도: 15개 화면 · 하나의 흐름

**[제품 · 기획자]**

앱에는 15개의 화면이 있다. 이들은 3개의 "삼각형"으로 조직된다:

### 삼각형 1: 진입 (Onboarding Triangle)
- **Intro** (`intro.tsx`): 브랜드 · 첫 인상
- **Auth** (`(auth)/sign-up`, `(auth)/login`): 계정 시작
- **Quest** (`(quest)/index`, `emr`, `profile`, `scan`): 3단계 데이터 연결

→ 목표: 원장이 "이 앱이 나를 위한 도구다"라고 인지하고 데이터·성향을 앱에 넘김.

### 삼각형 2: 관제 (Command Triangle)
- **Dashboard** (`dashboard.tsx`): 매일 여는 관제탑
- **History** (`history.tsx`): 6개월 추세 · 개선/악화 판정
- **Daily Receipt** (`daily-receipt.tsx`): CAPS CSV 업로드 (매일 or 매주)

→ 목표: 원장의 하루·주·달 사이클에 맞춘 데이터 진입점.

### 삼각형 3: 참조 (Reference Triangle)
- **Settings** (`settings.tsx`): 원장 슬라이더 재조정 · 벤치마크 확인
- **Help** (`help.tsx`): 사용 가이드 · 용어 사전 · NPS 설문 폼
- **Survey** (`survey.tsx`): 공개 NPS 설문 URL (환자 태블릿용)

→ 목표: 원장·스태프·환자 각각이 필요할 때 참조하는 부속 페이지.

### 화면 간 이동 규칙

- **초기 진입 게이트** (`(tabs)/index.tsx`): `isLoaded` 이후 4단계 리다이렉트
- **비대시보드 화면 → 대시보드**: `HomeFab` (모든 비대시보드 화면 우하단 FAB)
- **뒤로가기**: `router.canGoBack() ? back() : replace("/dashboard")` — 웹 새로고침 후 히스토리가 비었을 때도 안전
- **HomeFab 예외**: Auth·Quest·Survey는 FAB 없음 (인증 전 or 공개 페이지)

### 시각적 언어

- **주 배경**: 흰색 (#FFFFFF) or 파스텔 파랑 (#EBF5FF ~ #F5F7FA)
- **주 색상**: 딥 네이비 (#00153D · 브랜드 · 헤딩) · 스카이 블루 (#33A6FF · CTA · 활성)
- **상태 색**: 초록 (#00C853 · 정상) · 주황 (#FFB300 · 경고) · 빨강 (#FF3B30 · 위기)
- **텍스트 위계**: 24pt(제목) → 15pt(본문) → 11pt(라벨) → 10pt(캡션)

→ 관련 파일: `constants/colors.ts`, 각 화면의 `styles`

---

## 7장. 20 KPI 카탈로그: 무엇을 · 왜 · 언제 보는가

**[제품 · 방법론]**

mybrain이 관장하는 20개 KPI. 각각 축(Axis) · 판정 타입 · 결과/원인 여부로 분류.

| id | KPI | 축 | 판정 | 결과? | 상류 원인 | 왜 보는가 |
|---:|:---|:---|:---|:---|:---|:---|
| 1 | monthlyRevenue | profit | REL | 결과 | chairUtil · appointmentRate · cancelRate | 병원 규모의 절대적 척도 |
| 2 | patientLtv | profit | DERIVED | 결과 | returnRate · recallRate · treatComplete | 환자 한 명 평생 가치 |
| 3 | ltvCac | profit | DERIVED | 결과 | patientLtv · recallRate | 마케팅 회수 배수 |
| 4 | chairUtil | risk | REL | 원인 | — | 매출 병목 (Theory of Constraints) |
| 5 | appointmentRate | risk | REL | 원인 | — | 예약 슬롯 소진율 |
| 6 | cancelRate | risk | ABS | 원인 | — | 당일 취소 · Lean 무결점 |
| 7 | uncollected | risk | ABS | 원인 | — | 현금 흐름 · Cash Flow Optimization |
| 8 | newPatients | profit | REL | 원인 | — | 마케팅 · 소개 · 자연 유입 총량 |
| 9 | returnRate | retention | REL | 원인 | recallRate · treatComplete | 유지 경제학의 정점 |
| 10 | recallRate | retention | ABS | 원인 | — | 정기 검진 안내 성공률 |
| 11 | treatComplete | retention | ABS | 원인 | — | 치료 중도 이탈 방지 |
| 12 | staffTurnover | risk | ABS | 원인 | — | 이직 · 채용 비용 |
| 13 | staffProductivity | profit | REL | 결과 | chairUtil · hourlyProd | 스태프 인당 매출 |
| 14 | materialCost | profit | ABS | 원인 | — | 재료비 비율 |
| 15 | labFee | profit | ABS | 원인 | — | 기공료 비율 |
| 16 | netProfit | profit | REL | 결과 | laborCost · chairUtil · caseAcceptance | 순이익률 · 최종 척도 |
| 17 | hourlyProd | profit | REL | 원인 | chairUtil | 시간당 생산성 · ToC 임계 |
| 18 | nps | retention | 추세 | 원인 | treatComplete · waitTime | 환자 만족도 · 소개 임계 |
| 19 | marketingROI | profit | DERIVED | 결과 | patientLtv · newPatients | 광고비 대비 매출 배수 |
| 20 | preventiveRecall | retention | REL | 원인 | recallRate · returnRate | 예방·리콜 매출 비중 |

이 외 크리시스 top3 · 5개 카드 · 재무 심층에 자주 등장하는 지표:
- `laborCost` (인건비 비율) — HR 관제 중심 · caseAcceptance (상담 동의율) · noShow (노쇼율) · waitTime (대기시간) · fixedCost (고정비 비율) · revenueMix (매출 다각화) · bepDay (BEP 달성일) · laborProfitRatio · perStaffProfit · revenuePerPt

→ 관련 파일: `constants/mockData.ts` KPI_ALL20_BY_PERIOD, `lib/kpiEngine.ts` KPI_THRESHOLDS, `lib/kpiPrescriptions.ts`

### 지표 선정의 논리

이 20개는 아무렇게나 뽑은 게 아니다. 다음 5가지 방법론이 교차하는 지점을 채웠다:

1. **Unit Economics (a16z 2024)** — LTV · CAC · Payback · 순이익률
2. **유지 경제학 (Retention Economics)** — 재내원율 · 리콜 · NPS · NRR 개념 차용
3. **Value-Based Care (Porter)** — 예방·리콜 매출 비중 · 진료 완료율
4. **Lean Healthcare / TPS** — 대기 · 노쇼 · 취소 · 낭비(Muda) 제거
5. **Theory of Constraints (Goldratt)** — 체어 가동률 · 시간당 생산성 · 병목 해소

→ 관련 문서: `app/help.tsx`의 레퍼런스 섹션

---

## 8장. 판정 방법론: ABS · REL · DERIVED 세 프레임

**[방법론 · 개발자]**

한 KPI의 "정상 여부"를 어떻게 판단하는가? mybrain은 세 가지 판정 프레임을 KPI별로 골라 쓴다.

### ABS (Absolute · 절대 기준)
- 업계 공통 임계값. 의원 규모·연차와 관계없이 일정.
- 예: **노쇼율** ≤4% 정상, >5% 경고, >6% 위기
- 왜: 이 지표들은 원장 스타일이나 병원 규모와 무관하게 "우량 병원의 실무 기준"이 정해져 있다.
- 코드: `lib/kpiEngine.ts`의 `KPI_THRESHOLDS`

### REL (Relative · 상대·연차 대비)
- 개원 연차·병원 규모·원장 스타일 대비 판정.
- 예: **월 순이익률**은 신규 병원(1~2년차) 10% 전후, 안정기(3년+) 20~25%, 성숙기(7년+) 25~30% 목표. 같은 17%라도 3년차엔 부족, 신규엔 우수.
- 왜: 절대 목표를 강요하면 성숙기 병원이 안일해지고, 신규 병원이 위기로 오판됨.
- 코드: `lib/kpiEngine.ts`의 `KPI_OPTIMAL_RANGES` + `context/AppContext.tsx`의 `clinicTenureYears` + `doctorProfile.managementType`

### DERIVED (Derived · 파생 지표)
- 이 지표 자체보다 상류 원인 지표를 봐야 하는 결과 지표.
- 예: **환자 LTV**는 결과일 뿐 · 리콜 성공률 · 재내원율 · 진료 완료율을 먼저 개선해야 자동으로 오름.
- 왜: 결과 지표를 직접 손대려 하면 무리한 목표(광고비 폭증·강매)로 이어짐. 상류를 손대는 것이 정공법.
- 코드: `lib/kpiEngine.ts`의 `DERIVED_OPTIMAL_RANGES` + `upstreamKpiKeys` 필드

### 판정 결과: 4밴드
- `best` (최우수) — 최상위 벤치
- `normal` (정상) — 안전 구간
- `warning` (경고) — 개선 필요
- `crisis` (위기) — 즉시 대응

**Coloring 규약** (STATUS_COLORS): normal=#33A6FF(파랑) · warning=#FFB300(주황) · crisis=#FF3B30(빨강). `best`는 코드에서 excellent와 짝지어 그린색(#00C853) 또는 그린 배지로 강조.

→ 관련 문서: `app/help.tsx`의 용어 사전 "ABS · REL · DERIVED 판정" 절

---

## 9장. 처방 문법: 분석 · 해법 · 효과 · 액션 · 풀이

**[방법론 · 기획자]**

각 KPI 카드 tap 시 뜨는 처방 모달은 5가지 요소를 항상 이 순서로 담는다:

### analysis[] — 분석 내용 (3~4 bullets · 빨강 도트)
- 지금 이 값이 이 상태인 **근거**
- 벤치마크 대비 gap · 원인 지목 · 방치 시 손실 추정
- 마지막 bullet: **쉬운말 풀이** (원장 언어 · 괄호 없이 단일 구성 항목)

### solution[] — 해결 방안 (3 bullets · 파랑 도트)
- `① 오늘 · ② 이번 주 · ③ 이번 달`(또는 분기)의 3단 액션
- 실장·스태프에게 지시할 수 있는 형태

### effect[] — 기대 효과 (3 bullets · 초록 도트)
- 각 액션이 가져올 금전적·구조적 효과
- 예: "리마인드 문자 발송 시 노쇼율 -3~4%p"

### action — 즉시 실행 CTA (빨강 버튼)
- 한 문장. "지금 바로 무엇을 할 것인가"
- 예: "내일 예약자 리마인드 지금 발송"

### (내부 필드)
- `judgeType`, `isResultMetric`, `upstreamKpiKeys` — 결과 지표 여부 · 상류 원인 · rootCause DAG용

### 처방 5원칙

1. **1인칭 · 원장 언어**: "지금 오후에 문자 보내주세요" 톤. 컨설팅 리포트 문체 아님.
2. **수치 근거**: 모든 주장에 대해 벤치마크·업계 검증 수치·계산식 포함.
3. **행동 가능성**: 앱 밖에서 원장이 즉시 지시 가능한 액션.
4. **결과 vs 원인 분리**: 결과 지표 처방은 "이 값을 직접 손대지 말고 상류 지표부터"로 리다이렉트.
5. **Period 스코프**: today에서는 "지금"·"오후 마감 전"·"내일", quarter에서는 "이번 분기 안"·"다음 분기" 등 시간 언어 조정.

### 처방 매트릭스의 크기
- KPI_PRESCRIPTIONS (중앙 크리시스 5개) × 4 period = 20 sets
- ALL20_PRESCRIPTIONS (KPI 모달 24개) × 4 period = 96 sets · month baseline · today/week/quarter는 numeric-heavy 5개(netProfit·monthlyRevenue·patientLtv·recallRate·revenueMix)만 override
- 재무 심층 크로스 (laborProfitRatio · perStaffProfit) · overallPrescription (period별)

**5,000자 이상**의 처방 원본 텍스트가 앱에 내재. 이걸 개별 화면에 넣지 않고 `lib/kpiPrescriptions.ts` 하나에 집중시킨 이유: 카피 편집·검토 사이클을 UI 리팩터와 분리하기 위함.

→ 관련 파일: `lib/kpiPrescriptions.ts`

---

## 10장. 3축 스코어: 수익성 · 유지 경제학 · 리스크

**[방법론 · 제품]**

재무 심층분석 패널의 최상단에 뜨는 종합 진단은 세 축의 헬스 스코어로 표현된다:

### 세 축의 의미

1. **수익성 (Profitability)** — Unit Economics (a16z 2024)
   - 얼마나 남기는가 · 회수 얼마나 빠른가
   - 대표 KPI: LTV · CAC · LTV:CAC · 순이익률 · 시간당 생산성

2. **유지 경제학 (Retention Economics)** — Value-Based Care · NRR
   - 환자가 얼마나 오래 · 자주 오는가
   - 대표 KPI: 재내원율 · 리콜 성공률 · 예방·리콜 매출 비중 · NPS · 진료 완료율

3. **리스크·현금 (Risk & Cash)** — Lean · Cash Flow Optimization
   - 새고 있는 돈 · 흔들리는 안전성
   - 대표 KPI: 노쇼 · 당일 취소 · 미수금 · 이직 · 상담 거절

### 스코어 계산

각 축에 소속된 KPI들의 status를 4단계 health 값으로 변환한 뒤 가중 평균:

```
STATUS_HEALTH = { best: 100, normal: 75, warning: 45, crisis: 15 }

축 스코어 = Σ(KPI health × weight) / Σ(weight)
```

여기서 **Tier S** KPI 5개는 2× 가중치:
- ltvCac · returnRate · recallRate · netProfit · preventiveRecall

이유: 이 5개는 다른 지표의 상류 원인이자 병원 전체 건강의 대표. 예를 들어 리콜 성공률이 좋으면 재내원율·환자 LTV·예방 매출이 자동으로 함께 좋아진다.

### 밴드
- `excellent` (75+) — 최우수 · 성장 시그널
- `healthy` (50~75) — 정상 · 유지 관리
- `risk` (30~50) — 개선 필요
- `critical` (<30) — 즉시 재구조화

### 3축 값이 서로 다를 때의 해석

원장이 자주 만나는 조합:
- **수익성 67 / 유지 50 / 리스크 60** — 지금은 벌고 있지만 유지가 약함. 리콜·재내원을 손대야 지속 가능
- **수익성 45 / 유지 75 / 리스크 50** — 환자 유지는 강한데 수익 밀도가 낮음. 케이스 믹스 개선 or 대기시간 단축
- **수익성 60 / 유지 60 / 리스크 30** — 벌고 유지도 되지만 현금이 새고 있음. 미수금·취소·이직 즉시 대응

이 조합의 해석을 사람 말로 정리한 것이 `finance.overallVerdict` · `overallPrescription`. period별로 mockData에 저장되어 있다.

### 근본 원인 (rootCause)

3축 스코어만으로는 "어느 KPI를 손대야 하는가"가 안 나온다. 이를 위한 함수: `pickRootCause`

작동 원리:
1. 모든 crisis + warning KPI를 수집
2. 각 KPI의 `upstreamKpiKeys` DAG를 역추적
3. "이 상류 지표를 손대면 하류에서 몇 개가 회복되는가"를 세어봄
4. 가장 많은 하류를 유발하는 상류 KPI 하나를 선정
5. 그 지표명 · 축 · 영향 수 · 이유를 반환

예: 지금 crisis인 KPI가 patientLtv · preventiveRecall · marketingROI 3개일 때, upstream을 역추적하면 recallRate가 셋 다의 원인. → rootCause = recallRate.

→ 관련 파일: `lib/financialInsights.ts:computeAxisScores, pickRootCause`

---

# 제3권 — 어떻게 서 있는가

## 11장. 아키텍처 큰 그림 · 6개 층

**[개발자 · 기획자]**

mybrain은 6개의 레이어로 조직된다. 위층은 아래층에 의존하고, 반대는 없다.

```
┌────────────────────────────────────────────────────────┐
│  1. 화면 (app/**)                                       │
│     사용자가 실제로 보는 곳                            │
└────────────────────────────────────────────────────────┘
                        │ uses
                        ▼
┌────────────────────────────────────────────────────────┐
│  2. 컴포넌트 (components/**)                            │
│     재사용 UI · 대시보드 시각·NPS·공통                 │
└────────────────────────────────────────────────────────┘
                        │ uses
                        ▼
┌────────────────────────────────────────────────────────┐
│  3. 상태 (context/AppContext.tsx)                       │
│     인증·세션·period·doctorProfile · AsyncStorage       │
└────────────────────────────────────────────────────────┘
                        │ uses
                        ▼
┌────────────────────────────────────────────────────────┐
│  4. 순수 함수 · 계산 (lib/**)                          │
│     판정·스코어·처방·저장 헬퍼                          │
└────────────────────────────────────────────────────────┘
                        │ uses
                        ▼
┌────────────────────────────────────────────────────────┐
│  5. 데이터 (constants/**)                              │
│     mockData · historyData · colors                    │
└────────────────────────────────────────────────────────┘
                        │ uses
                        ▼
┌────────────────────────────────────────────────────────┐
│  6. 런타임 · 배포 (server/**, config)                  │
│     Node http 서버 · Metro · Railway · Nixpacks         │
└────────────────────────────────────────────────────────┘
```

### 층의 원칙

- **1층은 얇게**: 화면 파일은 로직을 담지 않고 컴포넌트·상태·계산 함수를 조립만 한다. `app/dashboard.tsx`가 1,283줄로 예외적으로 큰 이유는 3열 관제 UI + 처방 모달 + 20 KPI 목록 확장을 한 화면에 모두 넣기 때문. 여전히 판정·계산·처방은 별도 layer에 위임.
- **4층은 순수하게**: 부작용 없이 · 입력 하나에 출력 하나. 테스트 없이도 신뢰 가능하도록.
- **5층은 하드코딩**: 지금은 mock. 실 데이터로 갈아끼울 때 이 층만 교체하면 위 4개 층은 그대로.
- **의존 방향 절대 규칙**: 위→아래만. 4층 함수가 3층 상태를 읽지 않는다. (필요하면 인자로 받는다.)
- **6층은 최소한**: 순정 Node http · 외부 dep 0.

→ 관련 문서: `docs/CODE_MAP.md` §3~13 (각 층 파일 상세)

---

## 12장. 상태 관리의 계약: 단일 진실원 + 함수형 setState

**[개발자]**

### 앱 전역 상태 스키마

```ts
interface AppState {
  isAuthenticated: boolean;
  hasSeenIntro: boolean;
  userId: string;
  clinicName: string;
  clinicTenureYears: number;              // v0.4: REL 판정 기준
  questsCompleted: { quest1, quest2, quest3 };
  doctorProfile: {
    speedSlider: number;                  // 0~1
    communicationSlider: number;          // 0~1
    chairSlider: number;                  // 0~1
    managementType: "A" | "B" | null;
  };
  period: "today" | "week" | "month" | "quarter";
  isDarkMode: boolean;
}
```

### 계약

**1. 저장 · 복원 · Persist 규약**
- `AsyncStorage["mybrain_state"]` 하나에 전체 state JSON stringify로 저장
- 앱 시작 시 `useEffect(() => { getItem(); setIsLoaded(true) })` 한 번만
- 이후 모든 state 변경에 대해 `useEffect([state, isLoaded]) → setItem`
- `isLoaded=false` 동안은 setItem 스킵 (defaultState가 저장본을 덮어쓰지 않도록)

**2. Mutator 규약**
- 모든 mutator는 반드시 `setState(prev => ...)` 함수형 형태
- Closure의 `state` 변수 참조 금지
- 이유: 한 tick 안에 mutator 두 개가 연속 호출될 때 두 번째가 첫 번째의 in-memory 업데이트를 못 보고 stale로 덮어쓰는 버그 방지

**3. isLoaded 게이트 규약**
- 라우팅 게이트(`(tabs)/index.tsx`)는 `isLoaded=false`이면 `null` 반환
- Root Layout mount 완료 대기 · "Attempted to navigate before mounting the Root Layout" 방지

### mutator 목록

```ts
login(userId, clinicName)                → setState 함수형
logout()                                  → setState(defaultState)
completeQuest(quest)                      → setState 함수형
setDoctorProfile(partial)                 → setState 함수형
setPeriod(period)                         → setState 함수형
toggleDarkMode()                          → setState 함수형
markIntroSeen()                           → setState 함수형
```

### 파생 값

```ts
allQuestsCompleted =
  state.questsCompleted.quest1 &&
  state.questsCompleted.quest2 &&
  state.questsCompleted.quest3;
```

### 왜 Redux/Zustand/Jotai 안 쓰는가

- 상태가 얕고 단순 (단 하나의 flat state)
- 서버 상태 없음 (mock 시연 · 향후 React Query 이미 provider까지 감쌈)
- 팀 규모 소 · Context 하나가 오히려 이해하기 쉬움
- 성능 이슈 아직 없음 (렌더 프로파일링 결과 문제 없음)

향후 서버 데이터 도입 시 React Query가 서버 상태를 · Context는 UI 상태만 담당하도록 분리 가능.

### 근본 픽스 이력

**경영성향 저장 안 되던 버그** (2026-07):
- 원인: quest/profile.tsx의 handleComplete가 `setDoctorProfile({...})` 직후 `await completeQuest("quest2")`를 호출. 두 함수 모두 closure의 `state`를 읽어 새 상태를 만들었는데, completeQuest가 stale state로 AsyncStorage를 덮어써서 managementType이 사라짐.
- 픽스: 모든 mutator를 함수형 setState로 통일 · persist는 useEffect 하나로 단일화.

→ 관련 파일: `context/AppContext.tsx`

---

## 13장. 라우팅 게이트: mount 안전과 4단계 리다이렉트

**[개발자]**

### Expo Router 파일 시스템 라우팅
- `app/**/*.tsx` 파일 하나 = 라우트 하나
- 괄호 그룹 `(auth)`, `(quest)`, `(tabs)`은 URL에 반영 안 됨 · layout 상속용
- `_layout.tsx` = 그 그룹의 Stack/Tabs 정의
- `+not-found.tsx` = 미매칭 fallback

### Root Layout (`app/_layout.tsx`)

Provider chain 순서:
```
ErrorBoundary
  → GestureHandlerRootView
    → SafeAreaProvider
      → KeyboardProvider
        → QueryClientProvider
          → AppProvider
            → Stack (라우팅 컨테이너)
```

각 Provider가 감싸는 이유:
- **ErrorBoundary**: 어떤 에러도 흰 화면으로 이어지지 않게 fallback
- **GestureHandlerRootView**: 스와이프 뒤로가기 등 제스처 필수
- **SafeAreaProvider**: `useSafeAreaInsets()` 훅 제공
- **KeyboardProvider**: 키보드 표시 시 뷰 오프셋
- **QueryClientProvider**: 향후 React Query hook 대비
- **AppProvider**: 전역 state · AsyncStorage

또한 Root Layout에서:
- `useFonts(...)` — Inter 4 웨이트 로드
- `SplashScreen.preventAutoHideAsync()` → 폰트 로드 후 hide
- **웹 전용 CSS injection**: `input:focus { outline: none }` — react-native-web이 native `<input>` 렌더 시 브라우저 기본 포커스 링 씌우는 문제 근본 차단

### Stack.Screen 등록

```tsx
<Stack.Screen name="(tabs)" />
<Stack.Screen name="intro"          options={{ animation: "fade" }} />
<Stack.Screen name="(auth)"         options={{ animation: "fade" }} />
<Stack.Screen name="(quest)"        options={{ animation: "slide_from_right" }} />
<Stack.Screen name="dashboard"      options={{ animation: "fade" }} />
<Stack.Screen name="daily-receipt"  options={{ animation: "slide_from_bottom", presentation: "modal" }} />
<Stack.Screen name="settings"       options={{ animation: "slide_from_right" }} />
<Stack.Screen name="help"           options={{ animation: "slide_from_right" }} />
<Stack.Screen name="history"        options={{ animation: "slide_from_right" }} />
<Stack.Screen name="survey"         options={{ animation: "fade" }} />
```

### 초기 진입 게이트 (`app/(tabs)/index.tsx`)

```tsx
if (!isLoaded)              return null;
if (!hasSeenIntro)          return <Redirect href="/intro" />;
if (!isAuthenticated)       return <Redirect href="/(auth)/sign-up" />;
if (!allQuestsCompleted)    return <Redirect href="/(quest)" />;
return <Redirect href="/dashboard" />;
```

### 화면 내 이동 규칙

- `<Redirect>`는 이 파일에서만 사용 · 다른 화면은 event handler 안에서만
- `router.push/replace`는 `useEffect` 또는 `onPress` 안에서만
- 뒤로가기: `router.canGoBack() ? back() : replace("/dashboard")` — 웹 새로고침으로 히스토리 비었을 때 안전

### 근본 픽스 이력

**"Attempted to navigate before mounting the Root Layout" 에러** (2026-07):
- 원인: 초기 진입 게이트가 `isLoaded` 확인 없이 바로 `<Redirect>` 반환 → Root Layout mount 완료 전에 navigation 시도.
- 픽스: `AppContext`에 `isLoaded` 필드 추가 + AsyncStorage 복원 완료 시에만 true. 게이트가 그 전에는 null 반환.

→ 관련 파일: `app/_layout.tsx`, `app/(tabs)/index.tsx`, `context/AppContext.tsx`

---

## 14장. Period 스코프: 이 앱을 관통하는 기간의 힘

**[개발자 · 기획자]**

`period` 상태(오늘/이번 주/이번 달/분기)는 mybrain의 가장 강력한 데이터 축이다. 이 하나의 값이 대시보드 전체의 데이터·처방·벤치마크 텍스트를 통제한다.

### Period가 관장하는 데이터

`constants/mockData.ts`에서 `_BY_PERIOD` 접미사가 붙은 상수들:

- `HR_DATA_BY_PERIOD` — 매출·급여·이직·스태프 리스트 (4×)
- `FINANCE_DATA_BY_PERIOD` — 재무 심층의 모든 데이터 (4×):
  - 노쇼·순이익률·재내원·취소·미수금·LTV:CAC·BEP·laborProfitRatio·perStaffProfit
  - 3축 인사이트 (profitability · retention · risk)
  - overallVerdict · rootCauseKpiKey · rootCauseReason
  - overallPrescription (period별 통합 처방)
- `KPI_TOP3_BY_PERIOD` — 크리시스 top 3 랭킹
- `KPI_EXTRA_CRISIS_BY_PERIOD` — 추가 위기 카드 (cancelRate · uncollected)
- `KPI_ALL20_BY_PERIOD` — 전체 20 KPI 스냅샷 (current · status)

### Period가 관장하는 처방

`lib/kpiPrescriptions.ts`:
- `KPI_PRESCRIPTIONS_BY_PERIOD` — 중앙 크리시스 5개 (4× 완전 확장)
- `ALL20_PRESCRIPTIONS_BY_PERIOD` — KPI 모달 24개 (month baseline + 5개 override)

### 조회 흐름

```
사용자가 Period 필터 변경 → setPeriod("week")
    ↓
AppContext state.period = "week"
    ↓
Dashboard 리렌더
    ↓
  hr = HR_DATA_BY_PERIOD[period]
  finance = FINANCE_DATA_BY_PERIOD[period]
  top3 = KPI_TOP3_BY_PERIOD[period]
  all20 = KPI_ALL20_BY_PERIOD[period]
    ↓
  computeAxisScores(all20) → axisScores
  pickRootCause(all20, upstreamMap) → rootCause
    ↓
KPI 카드 tap 시:
  rx = getKpiPrescription(kpiKey, period)
```

### Period 언어 규약

각 period는 UI 문구·처방 액션에서 고유한 시간 표현을 쓴다:

| period | 처방 액션 언어 | 시각 표현 |
|:---:|:---|:---|
| today | "지금" · "오후 마감 전" · "내일" | "오늘 하루" |
| week | "이번 주" · "다음 주" | "이번 주" |
| month | "오늘" · "이번 달" · "다음 달" | "이달" |
| quarter | "이번 분기 안" · "다음 분기" | "분기" |

### 근본 픽스 이력

**처방 텍스트 period 하드코딩** (2026-07):
- 이전: 모든 처방이 month 기준 · 다른 period 선택 시 KPI 값만 변하고 처방 텍스트는 "이달 380만 원" 그대로. 근본이 아닌 mitigation은 배지로 "처방문은 이달 기준 예시" 알림.
- 근본 픽스: `KPI_PRESCRIPTIONS_BY_PERIOD` 4× 스키마 확장. 중앙 5개는 완전 재작성 · KPI 모달 24개는 month baseline + numeric-heavy 5개 override. `getKpiPrescription(kpiKey, period)` 헬퍼 하나로 조회 · fallback 자동.

**Period 필터가 대시보드 전 패널에 반영 안 되던 버그**:
- 이전: HR 관제만 반응 · 재무 심층은 하드코딩.
- 근본 픽스: 모든 재무 데이터를 `FINANCE_DATA_BY_PERIOD` 4×로 확장 · dashboard가 `state.period`로 조회.

→ 관련 파일: `constants/mockData.ts`, `lib/kpiPrescriptions.ts`, `app/dashboard.tsx`

---

## 15장. KPI 판정 엔진: 임계값 하나의 진실원

**[개발자 · 방법론]**

### 파일: `lib/kpiEngine.ts` (111줄)

3개 프레임 판정을 하나의 순수 함수로:

```ts
evaluateKpiStatus({
  kpiKey: string,
  value: number,
  judgeType: "ABS" | "REL" | "DERIVED"
}): "crisis" | "warning" | "normal" | "best"
```

### KPI_THRESHOLDS (ABS)

절대 임계값 사전. 예:
```ts
noShow: { crisis: 6, warning: 4, best: 3, lowerIsBetter: true }
uncollected: { crisis: 3, warning: 1.5, lowerIsBetter: true }
cancelRate: { crisis: 5, warning: 3, best: 3, lowerIsBetter: true }
materialCost: { crisis: 25, warning: 20, best: 5, lowerIsBetter: true }
labFee: { crisis: 15, warning: 12, best: 3, lowerIsBetter: true }
staffTurnover: { crisis: 25, warning: 15, best: 10, lowerIsBetter: true }
caseAcceptance: { crisis: 50, warning: 60, best: 70, lowerIsBetter: false }
recallRate: { crisis: 45, warning: 60, best: 75, lowerIsBetter: false }
treatComplete: { crisis: 60, warning: 75, best: 85, lowerIsBetter: false }
laborCost: { crisis: 35, warning: 30, best: 25, lowerIsBetter: true }
```

### KPI_OPTIMAL_RANGES (REL)

최적 범위. 이 안이면 normal · 밖이면 warning/crisis (거리에 비례).

```ts
chairUtil: { min: 70, max: 85 }        // 70% 미만 매출 손실 · 85% 초과 번아웃
newPatients: { min: 15, max: 25 }      // 신환 비중
laborProfitRatio: { min: 1.0, max: 2.0 } // 인건비 1원당 순이익
```

### DERIVED_OPTIMAL_RANGES

결과 지표는 순수 하드 임계값보다 "이 값을 붙잡고 있지 말고 원인 지표 봐라"의 시그널로 사용.

```ts
ltvCac: { min: 3, max: 5 }             // 미만 마케팅 손해 · 초과 광고 확장 여력
patientLtv: { min: 280, max: Infinity } // 280만 원 이상 · Unit Economics 기준
```

### 원장 개인화

`getAdjustedBenchmarks(profile)` 함수 (`app/dashboard.tsx`)가 원장의 슬라이더·성향에 따라 벤치마크를 조정:

- `managementType === "A"`(공격적 확장) → 인건비 27%까지 허용
- `managementType === "B"`(고정비 절감) → 인건비 22%로 엄격
- `chairSlider < 0.35`(다수 체어 동시) → 노쇼 3% 엄격
- `chairSlider > 0.65`(소수 집중) → 노쇼 5% 허용
- `communicationSlider > 0.65`(정서 교감 상담) → 상담 동의율 75% 목표
- `communicationSlider < 0.35`(핵심 간결) → 65%

이 조정은 **판정에 영향** · 처방 텍스트도 그 벤치에 맞춰 나옴.

### 단일 진실원 규약

- KPI 임계값이 바뀌면 `lib/kpiEngine.ts` **하나만** 수정
- `constants/mockData.ts`의 `KPI_BENCHMARKS` 텍스트도 함께 손봐야 하지만 판정 로직은 이 파일이 유일
- `KPI_HISTORY` (`constants/historyData.ts`)의 status도 이 임계값과 정합해야 함

→ 관련 파일: `lib/kpiEngine.ts`

---

## 16장. 3축 스코어 계산: Tier S 가중과 근본 원인 DAG

**[개발자 · 방법론]**

### 파일: `lib/financialInsights.ts` (156줄)

두 함수:
```ts
computeAxisScores(snapshots): { profitability, retention, risk }
pickRootCause(snapshots, upstreamMap): { kpiKey, axis, count, reason }
```

### 축 매핑

```ts
AXIS_OF_ID: Record<number, Axis> = {
  1: "profit",     // monthlyRevenue
  2: "profit",     // patientLtv
  3: "profit",     // ltvCac
  4: "risk",       // chairUtil (Tier B: 재무 심층 UI에서 제외, 스코어엔 포함)
  5: "risk",       // appointmentRate
  6: "risk",       // cancelRate
  7: "risk",       // uncollected
  8: "profit",     // newPatients
  9: "retention",  // returnRate
  10: "retention", // recallRate
  11: "retention", // treatComplete
  12: "risk",      // staffTurnover
  13: "profit",    // staffProductivity
  14: "profit",    // materialCost
  15: "profit",    // labFee
  16: "profit",    // netProfit
  17: "profit",    // hourlyProd
  18: "retention", // nps
  19: "profit",    // marketingROI
  20: "retention", // preventiveRecall
};
```

### Tier S 5개 (2× 가중)

```ts
TIER_S_IDS = [3, 9, 10, 16, 20]
// ltvCac · returnRate · recallRate · netProfit · preventiveRecall
```

이 5개는 다른 지표의 상류 원인이자 병원 전체 헬스의 대표. 리콜 성공률이 좋으면 재내원율·환자 LTV·예방 매출이 자동으로 함께 좋아진다.

### Health 값

```ts
STATUS_HEALTH = { best: 100, normal: 75, warning: 45, crisis: 15 }
```

의도적으로 warning(45)과 crisis(15) 사이에 큰 간격을 둠 → 위기 지표 하나가 축 전체를 확 끌어내리도록.

### 축 스코어 계산 로직

```ts
for each axis:
  총점 = 0, 가중합 = 0
  for each KPI in this axis:
    weight = TIER_S_IDS.includes(id) ? 2 : 1
    총점 += STATUS_HEALTH[status] × weight
    가중합 += weight
  score = round(총점 / 가중합)
```

### 밴드

```ts
bandOf(score) →
  score >= 75  ? "excellent"
: score >= 50  ? "healthy"
: score >= 30  ? "risk"
:               "critical"
```

### rootCause DAG

```
1. crisis + warning KPI 전체를 수집 → 하류 목록
2. 각 하류의 upstreamKpiKeys를 역추적 → 상류 후보
3. 상류 후보별로 "이걸 손대면 하류 몇 개가 회복되는가" 카운트
4. 카운트 최댓값의 상류 하나 선정
5. { kpiKey, axis, count, reason } 반환
```

이 로직이 대시보드 종합 진단 헤더의 "지금 손대야 할 원인 지표"를 자동 선정.

### 왜 하드코딩이 아닌 계산인가

mockData에 스코어를 하드코딩할 수도 있었으나 하지 않은 이유:
- period 4× × 3축 = 12개 값을 매번 손으로 맞추면 정합성 깨짐
- KPI 값을 하나 바꿨을 때 축 스코어도 자동 재계산되어야 "20개 지표 통합 분석 결과"가 유의미해짐

→ 관련 파일: `lib/financialInsights.ts`

---

## 17장. 처방 매트릭스: Period × KPI 4× 스키마

**[개발자]**

### 파일: `lib/kpiPrescriptions.ts` (1,162줄)

이 앱에서 가장 카피가 많이 든 파일. 5,000자 이상의 원장 언어 처방문이 처방 5원칙(제9장)에 맞춰 정리됨.

### 스키마

```ts
type Period = "today" | "week" | "month" | "quarter";

type KpiPrescription = {
  analysis: string[];
  solution: string[];
  effect: string[];
  action: string;
  judgeType?: "ABS" | "REL" | "DERIVED";
  isResultMetric?: boolean;
  upstreamKpiKeys?: string[];
};

const KPI_PRESCRIPTIONS_BY_PERIOD: Record<Period, Record<string, KpiPrescription>> = {
  today:    { laborCost: {...}, noShow: {...}, caseAcceptance: {...}, cancelRate: {...}, uncollected: {...} },
  week:     { ... },
  month:    { ... },
  quarter:  { ... },
};

const ALL20_PRESCRIPTIONS_BY_PERIOD: Record<Period, Record<string, KpiPrescription>> = {
  today:    { netProfit, monthlyRevenue, patientLtv, recallRate, revenueMix },  // 5개 override
  week:     { 동일 5개 override },
  month:    { fixedCost, netProfit, chairUtil, newPatients, recallRate, revenuePerPt,
              waitTime, materialCost, labFee, hourlyProd, newPtConvert, staffTurnover,
              treatComplete, marketingROI, onlineReview, revenueMix, nps, bepDay,
              monthlyRevenue, patientLtv, ltvCac, appointmentRate, returnRate,
              staffProductivity, preventiveRecall, laborProfitRatio, perStaffProfit },  // 27개 baseline
  quarter:  { 동일 5개 override },
};
```

### 조회 함수

```ts
getKpiPrescription(kpiKey, period): KpiPrescription | undefined
```

체인:
1. `KPI_PRESCRIPTIONS_BY_PERIOD[period][kpiKey]`
2. `KPI_PRESCRIPTIONS_BY_PERIOD.month[kpiKey]` (fallback)
3. `ALL20_PRESCRIPTIONS_BY_PERIOD[period][kpiKey]`
4. `ALL20_PRESCRIPTIONS_BY_PERIOD.month[kpiKey]` (fallback)
5. undefined

이 fallback이 우회가 아닌 설계 의도인 이유: 구조적 조언(리콜 자동화·체어 병목·SOP 표준화)이 period-agnostic한 KPI들은 month advice가 4개 period 모두에 정확히 적용됨.

### 규약

1. **(풀이) bullet**: 마지막 analysis 항목 · 원장 언어 · 개념 설명이라 period-agnostic → 원문 유지
2. **외곽 괄호 금지**: 처방 analysis 배열의 단일 구성 항목은 이미 시각적으로 색점 bullet으로 분리 표시되므로 외곽 괄호 잉여. 내부 정보 괄호(예: `(17.0%, 5%p↓)`, `(61%→75%)`)는 정상 용법으로 유지
3. **Period 언어 조정**: today는 "지금", quarter는 "이번 분기 안" 등
4. **판정 표기 통일**: v0.4 정정 이후 `staffTurnover` 12% 정상 · `nps` 추세 기반 · `marketingROI` 응용식 등

→ 관련 파일: `lib/kpiPrescriptions.ts`

---

## 18장. NPS 파이프라인: 로컬 저장 · CSV · QR

**[개발자 · 방법론]**

### 파일: `lib/npsStorage.ts` (234줄)

NPS(Net Promoter Score) 설문의 수집 · 저장 · 분석 · 내보내기 전체를 담당.

### 스키마

```ts
type NpsCategory = "promoter" | "passive" | "detractor";

type NpsResponse = {
  id: string;                              // timestamp + random
  score: number;                           // 0~10
  reason?: string;
  tabletId?: string;                       // 어느 태블릿에서 왔는가
  createdAt: string;                       // ISO 8601
};

type NpsSummary = {
  score: number;                           // NPS = %promoter - %detractor
  promoters: number;
  passives: number;
  detractors: number;
  count: number;
  average: number;
  byMonth: { month: string; nps: number; count: number }[];
};
```

### 함수

```ts
categoryOf(score) → 9~10:promoter · 7~8:passive · 0~6:detractor
saveResponse(input) → NpsResponse (id·createdAt 자동)
loadResponses() → NpsResponse[] (오래된 순)
clearResponses()
summarize(responses) → NpsSummary
responsesToCsv(responses) → string (CSV RFC 4180 escape)
csvToResponses(csv) → NpsResponse[]
importAndMerge(csv) → { added, skipped }   // id 중복 스킵
```

### 저장소

- AsyncStorage key: `mybrain_nps_responses`
- 배열 JSON 전체 write
- 향후 백엔드 붙일 때 `saveResponse`/`loadResponses` **두 함수만 교체**하면 UI 그대로 동작

### 폴백 시나리오 (백엔드 없이 시연)

```
[환자 태블릿]
  1. QR 스캔 → 공개 /survey URL
  2. NpsSurveyForm mode="collect"
  3. saveResponse → 태블릿 로컬 AsyncStorage

[매일 or 매주]
  4. 태블릿에서 responsesToCsv → 파일 공유 (이메일·에어드롭)

[원장 앱]
  5. NpsExportCard의 "CSV 불러오기" tap
  6. expo-document-picker로 파일 선택
  7. importAndMerge(csv) → 원장 앱 로컬 AsyncStorage에 병합 (id 중복 스킵)
  8. 도움말에서 요약 확인
```

### CSV 포맷

```
id,score,reason,tabletId,createdAt
"1699234567-abc",10,"의료진 친절","tablet-01","2026-07-18T09:30:00Z"
```

RFC 4180 escape: 쉼표·따옴표·개행 포함 시 큰따옴표로 감싸고 내부 따옴표는 두 번 반복.

### UI 조합

- `NpsSurveyForm mode="demo"` — 도움말 안 · 시연용 (저장은 됨)
- `NpsSurveyForm mode="collect"` — `/survey` 공개 URL · 태블릿용
- `NpsExportCard` — 도움말 안 · QR + URL + CSV 내보내기·불러오기

→ 관련 파일: `lib/npsStorage.ts`, `components/help/NpsSurveyForm.tsx`, `components/help/NpsExportCard.tsx`, `app/survey.tsx`

---

## 19장. 웹 SPA 서버: 87줄로 하는 정적 서빙

**[개발자]**

### 파일: `server/serve.js` (87줄)

Expo web export가 만든 `dist/` SPA를 서빙하는 서버. **외부 의존성 zero.**

### 왜 순정 Node인가

- 필요한 기능: 정적 파일 서빙 + SPA fallback + 캐시 헤더
- 이 세 가지만 하는 서버라면 Express/Fastify/Koa 모두 오버킬
- npm install 대상이 줄어들면 Railway 빌드 시간·이미지 크기 감소
- 그리고 이 서버가 미래에 바뀔 이유가 거의 없다

### 아키텍처

```
1. dist/index.html 존재 검증 (없으면 exit 1)
2. HTTP 서버 listen(0.0.0.0, $PORT)
3. 요청 처리:
   a. URL parsing (decodeURIComponent + posix normalize)
   b. Path traversal 차단 (DIST 밖 경로는 403)
   c. 실제 파일 존재 → serveFile()
   d. 아니면 dist/index.html 반환 (SPA fallback)
4. Content-Type: MIME 매핑
5. Cache-Control:
   - /_expo/static/*: max-age=31536000, immutable
   - else: max-age=0, must-revalidate
```

### 로그

```
[mybrain-v2] serving <DIST> on http://0.0.0.0:<port>
```

에러:
```
[mybrain-v2] dist/index.html not found at <path>
[mybrain-v2] run "npm run build" before starting the server
```

### 왜 캐시 헤더가 이렇게 나뉘어 있는가

- `/_expo/static/entry-<hash>.js` 같은 파일은 파일명이 콘텐츠 해시 → 내용이 바뀌면 파일명도 바뀜 → 1년 캐시 안전
- `index.html`은 캐시하면 배포 후에도 옛 버전이 걸림 → 매 요청 revalidate 필요

### 왜 SPA fallback인가

- Expo Router가 클라이언트 사이드 라우팅
- `/dashboard`, `/help/faq` 같은 URL이 직접 요청될 때 서버에 그 파일이 없음
- 이때 `dist/index.html`을 반환하면 JS 번들이 로드되어 클라이언트에서 정확한 라우트로 이동

### 왜 `must-revalidate`인가

- max-age=0 만으로도 매 요청 재검증이 되지만
- must-revalidate는 stale 캐시 재사용을 명시적으로 금지 → 프록시·중간 캐시에서도 안전

→ 관련 파일: `server/serve.js`

---

## 20장. 컴포넌트 층: 재사용의 규칙과 예외

**[개발자]**

### 컴포넌트 카테고리

1. **공통 (`components/`)** — 어느 화면에서도 쓸 수 있는 것
2. **대시보드 전용 (`components/dashboard/`)** — 대시보드 화면이 아니면 안 쓰이는 것
3. **도움말 전용 (`components/help/`)** — 도움말·설문 관련

### 공통

- `ErrorBoundary` + `ErrorFallback` — 전역 에러 catch · Fallback UI
- `HomeFab` — 모든 비대시보드 화면 우하단 대시보드 바로가기 FAB
- `KeyboardAwareScrollViewCompat` — 웹에서는 순정 ScrollView · 네이티브에서는 KeyboardAwareScrollView로 스왑

### 대시보드 시각 컴포넌트 10개

각각 특정 KPI 그룹의 시각화·상호작용을 담당. 자세한 설명은 `docs/CODE_MAP.md` §9 참조.

- `SectionHeader` — 3섹션 헤더 + 축 스코어 pill
- `InsightCard` — 섹션 최상단 통합 인사이트
- `OverallVerdictHeader` — 종합 진단 헤더 + AxisScoreBadge×3
- `AxisScoreBadge` — 축 하나의 미니 배지
- `ScoreExplainerModal` — 스코어 pill (?) → 쉬운말 모달
- `LtvCacGauge` — 반원 게이지 (0~8x · 3~5x 그린 밴드)
- `RetentionTrio` — 재내원·리콜·예방 원형 3게이지
- `UncollectedFunnel` — 미수금 4버킷 파이프라인
- `LaborCrossCard` — HR × 재무 크로스 (laborProfitRatio·perStaffProfit)
- `AxisTrendLine` — 라인 차트 + 벤치마크 라인 오버레이

### 도움말·설문 컴포넌트

- `NpsSurveyForm` — mode="demo"|"collect" · 저장은 npsStorage
- `NpsExportCard` — QR + URL + CSV export/import

### 재사용의 규칙

1. **화면에 종속되는 순간 분리한다** — 대시보드에서만 쓰이는 SVG는 `dashboard/` 하위
2. **props로만 데이터 받는다** — 컴포넌트가 mockData·context 직접 import하지 않는다 (도움말 NPS 컴포넌트 예외 — NPS 저장이 컴포넌트 관심사라서 npsStorage 직접 import)
3. **스타일은 인라인 or 파일 내 StyleSheet** — 별도 스타일 파일 만들지 않는다
4. **자기 자신을 정렬한다** — 부모 alignment에 의존하지 않고 필요하면 `alignSelf: "center"` (LTV:CAC 게이지의 근본 픽스 이력)

### 근본 픽스 이력

**LTV:CAC 게이지 좌측 정렬 버그** (2026-07):
- 원인: `wrap` 스타일에 `width: 220` 고정만 있고 자기 자신 정렬 속성 없음. 부모 카드가 더 넓을 때 좌측에 붙음.
- 픽스: `wrap`에 `alignSelf: "center"` 추가 (근본 · flex 컨테이너 아무 곳에서도 자기 자신 중앙 배치). `alignItems`는 유지 (내부 자식 정렬용).

→ 관련 파일: `components/dashboard/LtvCacGauge.tsx`

---

# 제4권 — 왜 그렇게 서 있는가

## 21장. 설계 결정 히스토리: 무엇을 바꿨고 왜 그랬는가

**[개발자 · 기획자]**

이 앱은 처음 만들어진 v0.1부터 여러 번 재구조화됐다. 그 흔적이 코드 곳곳에 있으며, 재방문 개발자가 "왜 이렇게 돼 있지?" 물을 때의 답이 대부분 여기 있다.

### v0.1 → v0.2: 이메일 → 아이디 로그인

- 배경: 실 EMR 연동이 없으므로 소셜 로그인 실 인증도 mock. 원장이 앱을 여러 번 여는 UX에서 이메일 입력이 마찰.
- 픽스: 4자 이상 아이디로 변경. 소셜은 시각적 mock 3종 유지.

### v0.2 → v0.3: Redirect 마운트 안전

- 배경: 초기 진입 게이트가 Root Layout mount 전에 `<Redirect>` 발동 → 웹 에러.
- 픽스: `AppContext`에 `isLoaded` 필드 추가 · 게이트가 그 전에는 null 반환. `docs/CODE_MAP.md` §14 상세.

### v0.3 → v0.4: 절대 목표 → 상대 판정

- 배경: v0.3까지 "월 매출 1억", "재내원율 80%" 같은 절대 목표를 강요. 실 병원은 연차·규모·성향이 다양해서 이 목표가 오히려 오판.
- 픽스:
  - `judgeType: "REL"` 도입 · `clinicTenureYears` state · `KPI_OPTIMAL_RANGES`
  - `staffTurnover` 12% 정상 · `nps` 추세 기반 판정 · `marketingROI` 응용식
  - `returnRate` 55~70% 정상, >70% 우수 재밴딩
- 이 정정은 처방 텍스트에도 반영. 예: `patientLtv` 처방이 "이 값을 직접 늘리려 하지 말고 리콜·재내원 상류부터"로 리다이렉트.

### v0.4 → v0.5: 재무 심층분석 3섹션 재구성 (옵션 B)

- 배경: 재무 심층이 처음엔 KPI 카드 나열식이었음. 20개 지표를 통합 분석한 결과가 반영되지 않음.
- 픽스:
  - 3섹션 구조로 재구성 (수익성 · 유지 경제학 · 리스크)
  - 각 섹션 최상단 통합 InsightCard
  - 종합 진단 헤더 (OverallVerdictHeader · 3축 스코어 배지 · rootCause)
  - overallPrescription (20 KPI 통합 처방) 신설
  - HR × 재무 크로스 (laborProfitRatio · perStaffProfit) LaborCrossCard 신설
  - 6개 신규 시각 컴포넌트 (LtvCacGauge · RetentionTrio · UncollectedFunnel · LaborCrossCard · AxisTrendLine · AxisScoreBadge)

### v0.5 → v0.6: Period 4× 스코프

- 배경: 초기엔 "이번 달" 하나만 · Period 필터가 UI만 반응.
- 픽스:
  - 모든 데이터 상수를 `_BY_PERIOD` 접미사 4× 스키마로 확장
  - `KPI_TOP3_BY_PERIOD` · `KPI_ALL20_BY_PERIOD` · `KPI_BENCHMARKS` 모두 period 스코프
  - 처방 텍스트는 임시로 mitigation 배지 ("이달 기준 예시")
  - 나중 근본 픽스로 `KPI_PRESCRIPTIONS_BY_PERIOD` 4× 확장 · 배지 제거

### v0.6 → v0.7: 쉬운말 풀이 & NPS 파이프라인

- 배경: 원장 언어로 이해되지 않는 처방 문구에 대한 사용자 피드백.
- 픽스:
  - 모든 처방 analysis 마지막 bullet에 (풀이) 문단 추가
  - 처음엔 "쉽게 말해서: ..." 접두사 있었으나 사용자 지적으로 제거
  - 처음엔 (풀이)를 괄호로 감쌌으나 "단일 구성 항목이니까 괄호 제거" 지시로 최종적으로 외곽 괄호 삭제
  - 도움말 용어 사전 23개에 `range` 필드 추가 · 정상 범위 별도 callout
  - NPS 설문 폼 (demo/collect) · 공개 URL /survey · QR + CSV 파이프라인

### v0.7 → v0.8: 근본 상태 관리 정정

- 배경: 경영성향 저장 안 되던 버그 · closure state 참조가 원인.
- 픽스: 모든 mutator를 setState 함수형 + persist를 useEffect 하나로 단일화. `docs/CODE_MAP.md` §14의 상세 근거.

### 이 히스토리에서 배울 것

- 자연스러운 성장 방향: **강요된 기준 → 상대 판정 · 나열식 → 통합 분석 · 이달 하나 → period 매트릭스 · 컨설팅 문체 → 원장 언어**
- 각 정정은 특정 사용자 피드백에서 왔다. 우회·mitigation을 먼저 하고, 뿌리를 나중에 뽑는 이터레이션 패턴.

→ 관련 문서: `docs/CODE_MAP.md` §15 (근본 수정 이력)

---

## 22장. 근본 픽스의 5원칙

**[개발자]**

사용자가 반복 강조한 "우회·쌓기 금지, 근본 수정"의 실천 원칙:

### 원칙 1: 증상이 아니라 원인을 만진다

- 증상: "게이지가 좌측에 붙는다"
- 우회: `marginLeft: "auto"` 부모에 추가
- 근본: `wrap` 스타일에 `alignSelf: "center"` — 이 컴포넌트가 어느 부모에 놓여도 스스로 중앙 배치

### 원칙 2: 여러 곳을 고치지 말고 하나의 진실원을 만진다

- 증상: "period 바꾸면 처방문 숫자가 안 맞는다"
- 우회: 처방문에 "이달 기준 예시" 배지 표시
- 근본: `KPI_PRESCRIPTIONS_BY_PERIOD` 4× 스키마 확장 + `getKpiPrescription(kpi, period)` 헬퍼

### 원칙 3: 조건문·플래그로 감싸지 않고 데이터 구조를 바꾼다

- 증상: "특정 period에 처방문 mismatch"
- 우회: `if (period !== "month") return "일반 조언"` 같은 분기
- 근본: Record<Period, ...> 스키마 · fallback은 설계 의도로 명시

### 원칙 4: closure에 갇힌 값이 아닌 latest 값으로 계산한다

- 증상: "경영성향 저장 안 됨"
- 우회: quest/profile에서 setDoctorProfile을 setTimeout으로 지연
- 근본: 모든 mutator를 `setState(prev => ...)` 함수형으로 통일 · persist를 useEffect로 단일화

### 원칙 5: mitigation은 다음 근본 픽스의 진입점으로만 남긴다

- 배지·안내·주석은 즉시 문제 완화의 목적만 · 근본이 오면 지운다
- 실제로 mitigation 배지들이 모두 근본 픽스와 함께 지워졌다 (period notice · treatComplete 임계값 임시 안내 · 등)

### 이 원칙을 코드 리뷰에 적용하는 방법

**질문 5개**:
1. 이 픽스는 증상을 지우는가, 원인을 지우는가?
2. 다른 파일에서 같은 종류의 버그가 다시 발생할 여지가 있는가?
3. 이 조건문이 데이터 구조로 치환될 수 있는가?
4. 이 함수가 참조하는 값이 진짜 최신인가?
5. mitigation이 아니라 진짜 픽스인가?

이 5개 질문을 통과하면 근본. 하나라도 걸리면 다시.

→ 관련 문서: 각 근본 픽스 커밋의 message 본문

---

## 23장. 규약: 컨벤션이 아닌 안전 장치

**[개발자]**

앞서 여러 장에 흩어진 규약들을 한자리에 모아 표시. 이것들은 스타일 취향이 아니라 안전 장치다.

### 상태
- **함수형 setState 필수**: mutator가 closure `state` 읽으면 stale
- **isLoaded 게이트**: 라우팅 게이트에서 `!isLoaded`이면 null 반환
- **useEffect persist 단일화**: 각 mutator가 저장 로직 갖지 않기

### 라우팅
- **`<Redirect>`는 (tabs)/index.tsx에서만**
- **`router.push/replace`는 event handler 또는 useEffect 안에서만**
- **뒤로가기 fallback**: `canGoBack() ? back() : replace("/dashboard")`

### KPI · 판정
- **임계값 진실원**: `lib/kpiEngine.ts`. 다른 곳에서 하드코딩 금지
- **처방 진실원**: `lib/kpiPrescriptions.ts`. period × KPI 조회는 `getKpiPrescription`
- **v0.4 정정**: `staffTurnover` · `nps` · `marketingROI`의 판정 방식이 이전과 달라짐

### Period 스코프
- **모든 데이터는 `_BY_PERIOD` 스키마**
- **처방 텍스트 언어 period별 조정**: today/week/month/quarter 각각의 시간 표현

### UI · 접근성
- **웹 focus outline reset**: `_layout.tsx`에서 한 번만 CSS inject
- **HomeFab**: 모든 비대시보드 화면에 FAB (Auth/Quest/Survey 예외)
- **자기 정렬**: 컴포넌트가 자기 자신을 정렬 (부모 alignItems 의존 최소화)

### 파일 시스템
- **`app/**` 하나가 라우트 하나** (Expo Router 규칙)
- **`(groupName)/` = 그룹**, `_layout.tsx` = 그 그룹 layout
- **`+not-found.tsx`** = 404 fallback

### Git · 배포
- **로컬 테스트 금지** (`CLAUDE.md`) — Railway 사이클 사용
- **package-lock.json 커밋 금지** (`.gitignore` 명시)
- **커밋 후 push → 2~3분 배포 대기**

### 코드 스타일
- **주석은 왜 그런지에 대한 것만** (무엇을 하는지는 코드가 이미 말함)
- **작은 파일에 큰 논리**: 순수 함수는 특히 `lib/` 밑에 하나씩 · 화면 파일은 조립만

→ 관련 문서: `CLAUDE.md`, `docs/CODE_MAP.md` §14

---

## 24장. 반복된 실수 · 다시는 이렇게 하지 말 것

**[개발자]**

같은 실수 두 번 하지 않기 위한 명시적 목록:

### 1. Closure state 참조

**증상**: mutator가 두 번 연속 호출될 때 두 번째가 첫 번째의 update를 stale로 덮어씀.
**예방**: 함수형 setState (`setState(prev => ...)`)만 사용.
**감지**: 상태 저장 후 다른 mutator가 곧바로 호출되는 코드는 즉시 의심.

### 2. mount 전 navigation

**증상**: "Attempted to navigate before mounting the Root Layout" 에러 · 흰 화면.
**예방**: `(tabs)/index.tsx`가 `isLoaded=false`일 때 null 반환.
**감지**: `<Redirect>`를 어디에 두든 상위 컨테이너의 mount 상태를 확인.

### 3. 절대 목표 강요

**증상**: 신규 병원이 위기로 오판 · 성숙기 병원이 안일해짐.
**예방**: REL 판정 · `clinicTenureYears`·`doctorProfile` 반영.
**감지**: "월 1억", "재내원 80%" 같은 하드코딩 목표 발견 시 즉시 REL로 이관.

### 4. Mitigation 남기기

**증상**: 근본 픽스 이후에도 배지·안내·주석이 잔존해 사용자 혼란.
**예방**: 근본 픽스 커밋에서 mitigation도 함께 제거.
**감지**: 커밋 diff에 "이달 기준 예시" 같은 텍스트가 여전히 있으면 지우기.

### 5. 우회로 문제 감추기

**증상**: 조건문·플래그·기간별 분기로 근본 원인을 감쌈.
**예방**: 데이터 구조 자체를 바꿔서 조건 없이 해결.
**감지**: `if (period !== "month")` 같은 분기가 처방 로직에 있으면 근본 후보.

### 6. 컴포넌트가 부모에 의존

**증상**: 컴포넌트가 특정 부모 컨테이너에서만 정상 · 다른 곳에 놓으면 깨짐.
**예방**: `alignSelf`, `flex: 1` 등 자기 정렬 우선.
**감지**: 카드 안에서 좌측 붙음 등 특정 위치 이슈 시 컴포넌트 내부 스타일 검토.

### 7. mockData 산술 오류

**증상**: perStaffProfit 10배 오류 · 미수금 액수 불일치.
**예방**: mockData의 파생 값은 실측치와 벤치가 산술적으로 정합해야 함.
**감지**: 배포 후 UI에서 이상한 값 발견 시 mockData의 4개 period 전부 재검산.

### 8. 처방 텍스트와 실 데이터 값 mismatch

**증상**: 처방문이 "이달 380만 원" · 사용자는 "이번 주"를 선택 중.
**예방**: `KPI_PRESCRIPTIONS_BY_PERIOD` 4× 스키마 유지 · `getKpiPrescription(kpi, period)` 조회.
**감지**: 새 처방 카피를 추가할 때 반드시 period 스코프 결정.

### 9. 외곽 괄호로 (풀이) 감싸기

**증상**: 이미 bullet으로 시각적으로 분리된 항목을 괄호로 감싸 잉여.
**예방**: 단일 구성 bullet의 외곽 괄호 제거. 내부 정보 괄호는 유지.
**감지**: analysis 배열에서 `"(문장)"` 패턴 발견 시 벗기기.

### 10. lockfile 실수 커밋

**증상**: `package-lock.json`이 히스토리에 실수로 들어감.
**예방**: `.gitignore`에 명시 · stop hook이 untracked 경고.
**감지**: `git status`에 `package-lock.json` 발견 시 gitignore 확인.

이 10가지 목록은 살아있다. 새 실수가 반복되면 즉시 추가.

---

## 25장. 방법론 계보: 이 지표들이 어디서 왔는가

**[방법론]**

mybrain의 20 KPI · 판정 · 처방은 5개 방법론 계열이 교차해서 만들어졌다.

### Unit Economics (a16z 2024)

**출처**: Andreessen Horowitz의 "Unit Economics" 프레임워크 (Andrew Chen 등).
**핵심**: 사업의 최소 단위(고객·환자)에서 이익이 나야 스케일이 의미가 있다.
**mybrain 적용**:
- LTV · CAC · LTV:CAC · Payback (일)
- 이 4개가 재무 심층 수익성 섹션의 뼈대
- LtvCacGauge 컴포넌트 · 3~5x 정상 밴드 · a16z 벤치 인용

### 유지 경제학 (Retention Economics · NRR 응용)

**출처**: SaaS 업계의 NRR(Net Revenue Retention) 개념을 클리닉에 이식.
**핵심**: 신규 고객보다 기존 고객 유지가 압도적으로 저렴하다.
**mybrain 적용**:
- 재내원율 · 리콜 성공률 · 예방·리콜 매출 비중 · NPS · 진료 완료율
- Retention 축 스코어 · RetentionTrio 컴포넌트

### Value-Based Care (Michael Porter, Harvard Business School)

**출처**: 2006 "Redefining Health Care" 이후 미국 의료계 표준. 진료량이 아닌 진료 가치를 재무 지표로.
**핵심**: 예방·조기 발견이 만성 치료보다 총비용이 낮다.
**mybrain 적용**:
- 예방·리콜 매출 비중을 중심 KPI로 격상
- OverallVerdictHeader의 방법론 라벨 "유지 경제학·VBC"

### Lean Healthcare / Toyota Production System

**출처**: TPS의 7대 낭비(Muda) 개념을 병원 프로세스에 적용.
**핵심**: 대기·재작업·이동·과다 처리는 부가가치 없는 비용.
**mybrain 적용**:
- 대기시간 · 노쇼 · 당일 취소를 낭비로 규정
- KPI_THRESHOLDS의 무결점 기준 (cancelRate ≤3% 등)
- 처방문의 "Lean 흐름 개선" 어구

### Theory of Constraints (Eliyahu Goldratt)

**출처**: 1984 "The Goal". 어떤 시스템에도 하나의 병목이 있고 그것을 풀어야 전체 처리량이 는다.
**핵심**: 병목 아닌 곳을 최적화해도 무의미.
**mybrain 적용**:
- 체어 = 이 병원의 핵심 병목 자원 (ToC · chairUtil)
- 시간당 생산성 = 시간당 고정비의 2배 목표 (ToC 임계)
- 처방문의 "체어 병목 해소" 어구

### 도움말의 레퍼런스 섹션

`app/help.tsx`의 참고문헌 섹션에 이 5개 방법론이 분야별로 정리되어 있다. 각 방법론의 원저·핵심 아이디어·mybrain 적용 예시.

### 왜 이 5개인가

- 서로 다른 각도에서 병원 경영을 바라봄 (재무·마케팅·현금·프로세스·병목)
- 각 방법론이 관장하는 KPI가 서로 겹치지 않음 · 20개 지표를 자연스럽게 커버
- 실증된 프레임워크 (모두 10년+ 검증)

---

# 제5권 — 어디로 가는가

## 26장. 확장 가능성: 다음 6개월의 로드맵

**[제품 · 개발자]**

### 6개월 로드맵 (제안)

**M1 - 2 · 실 EMR 연동 (읽기 전용)**
- 두번에·덴트웹·이지플러스 API 스캔
- `mockData.HR_DATA_BY_PERIOD`·`FINANCE_DATA_BY_PERIOD`를 실 값으로 교체
- Hook 지점: React Query useQuery 도입 · `_layout.tsx`의 QueryClientProvider 활용

**M2 - 3 · CAPS CSV 자동 임포트**
- 카드 승인 데이터 매일 자동 pull (Railway cron)
- CAPS ↔ EMR 매칭 로직
- 매출 지표 자동 채움 · `daily-receipt.tsx` UI가 자동화된 로그로 변형

**M3 - 4 · 회계 PDF OCR**
- Google Vision or Naver Clova OCR
- 손익 계산서 파싱 · 순이익률 자동 계산
- `(quest)/scan.tsx`가 실 OCR로 승격

**M4 - 5 · NPS 백엔드 저장**
- Supabase or Firebase Firestore
- 태블릿에서 실시간 저장 · 원장 앱에서 실시간 조회
- `lib/npsStorage.ts`의 `saveResponse`/`loadResponses`만 교체

**M5 - 6 · 원장 개인화 벤치마크 강화**
- managementType A/B + 슬라이더 3개로 KPI_THRESHOLDS 동적 계산
- 벤치 자체가 성향에 맞춰 이동 · 지금은 극히 일부만 적용됨

**M6+ · 팀 계정 · 실장 뷰**
- 원장·실장·회계사가 다른 뷰로 접근
- 권한 관리 · 알림 채널

### 로드맵에 반영되지 않은 것

- 다국어 (지금은 한국어만) — 필요할 때 i18n 도입
- 다크모드 — Provider·팔레트는 준비되어 있으나 화면 스타일 인라인이라 손이 많이 감
- 태블릿·데스크톱 반응형 — 현재 폰 위주. 원장이 태블릿 쓸 일이 오면 검토

→ 관련 문서: `docs/CODE_MAP.md` 부록 (다음에 어떻게 확장하나)

---

## 27장. 실 데이터 연동 시나리오

**[개발자]**

### 4단계 이관 절차

**1. mockData 유지 · React Query 도입 (병렬)**
```tsx
// _layout.tsx에 이미 QueryClientProvider 감쌈
// 대시보드에서:
const { data: finance } = useQuery({
  queryKey: ["finance", period],
  queryFn: () => fetchFinance(period),
  initialData: FINANCE_DATA_BY_PERIOD[period], // fallback
});
```
- fetchFinance API 없으면 initialData가 그대로 사용됨
- 배포 없이 미리 hook만 설치

**2. API 하나씩 붙이기**
- `/api/finance?period=month` 같은 endpoint
- fetchFinance만 구현 · 스키마는 `FinancePeriodData` 그대로
- 실패 시 initialData fallback으로 정상 동작

**3. mockData 코멘트로 격하**
```ts
/** @deprecated 실 API 도입 완료 후 남기는 참고용 · 배포 최소화 위해 유지 */
export const FINANCE_DATA_BY_PERIOD = ...
```

**4. 완전 제거 (선택)**
- mockData가 아무 곳에서도 참조되지 않을 때 파일 삭제
- 배포 크기 감소

### API 계약 (제안)

```
GET /api/finance?period=today|week|month|quarter
→ FinancePeriodData

GET /api/hr?period=...
→ HrPeriodData

GET /api/kpi-all20?period=...
→ Kpi20Snapshot[]

GET /api/kpi-top3?period=...
→ KpiTop3Snapshot[]
```

각 응답 스키마는 `constants/mockData.ts`의 타입 그대로 · zod 검증 (`zod`가 이미 dep에 있음).

### 인증 (M6+에 필요할 때)
- JWT + refresh token 표준
- `AppContext`에 `accessToken` 필드 추가 · 함수형 setState로 갱신
- API 호출 시 Authorization 헤더

---

## 28장. 다국어 · 다크모드 · 태블릿

**[개발자]**

### 다국어 (i18n)

지금 상태: 한국어 하드코딩. 화면·컴포넌트·처방·용어사전 전부 한국어 리터럴.

이관 절차:
1. `react-native-i18n` or `expo-localization` + `i18next` 도입
2. `constants/i18n/ko.json` 신설 · 한국어 키-값
3. `t("dashboard.title")` 형식으로 리터럴 교체
4. 언어 리소스 별도 파일 (영어·일본어 등)

주의: 처방 텍스트는 원장 언어에 크게 의존 · 단순 기계 번역은 부적절. 언어별 재작성 필요.

### 다크모드

지금 상태:
- `AppContext.isDarkMode` state 있음
- `toggleDarkMode()` mutator 있음
- `constants/colors.ts`에 light·dark 팔레트 존재
- 그러나 대부분 컴포넌트가 인라인 색 리터럴 사용 · dark 팔레트 참조 안 함

이관 절차:
1. 각 컴포넌트에서 색을 `useColors()` 훅으로 조회
2. `constants/colors.ts`의 dark 팔레트를 실제로 참조하는 훅 신설
3. 스타일 정의 시 인라인 리터럴 → 훅 반환값 사용

주의: 스타일 인라인 리팩터가 큰 작업 · 필요할 때 화면 단위로 점진 이관.

### 태블릿·데스크톱 반응형

지금 상태: 폰 폭(360~430px) 기준. 넓은 화면에서는 여백만 늘어남.

이관 방향:
1. **폰**: 그대로 (3열 관제 스크롤)
2. **태블릿**: 가로 2열 (좌 HR + 크리시스, 우 재무 심층 세로 스크롤)
3. **데스크톱**: 3열 (좌 HR · 중 크리시스 · 우 재무 심층 모두 병렬)

기술 도구:
- `Dimensions.get("window")` + `useEffect(resize listener)`
- or `expo-screen-orientation`
- Grid layout은 flexbox로 이미 표현 가능

주의: 원장이 태블릿·데스크톱에서 쓸 시나리오가 실제로 있을 때 손대는 게 효율.

---

## 29장. 알려진 한계와 우회

**[개발자]**

### 웹 export 제약

- **Reanimated 4**: worklet이 메인 스레드 폴백 · 복잡한 애니메이션은 프레임 드롭 가능
- **Gesture Handler**: 스와이프 뒤로가기 제한적
- **Haptics**: 완전 no-op · 시각적 피드백에 의존
- **Native modal**: `presentation: "modal"`이 fade로 축소
- **디스크 접근**: 파일 저장 없음 · CSV export는 브라우저 다운로드

### 데이터 정합 부담

- mockData의 4개 period × 20 KPI × 여러 필드 = 정합해야 하는 조합 폭발
- 실 API 도입 전까지는 카피 수정 시 4개 period 다 손봐야 함
- 완화: `_BY_PERIOD` 스키마의 month이 baseline · 다른 period는 override만

### AsyncStorage 5MB 한계

- 브라우저 localStorage 백엔드 · 5MB 제한
- 현재 앱 스토리지 사용량 미미 (state + NPS 응답 · 1MB 미만)
- 실 데이터 도입 시 지역 캐시로 옮길 필요 · React Query 자체 캐시 활용

### 세션 관리

- 로그아웃 후 즉시 로그인해도 quest 상태 복구 안 됨 · logout이 defaultState로 초기화
- 실 서비스에서는 서버 세션 있으니 계정 기반 복구 자연스럽게 됨

### 배포 캐시

- Railway 뒤에 CDN 없음 · 서버가 must-revalidate 헤더로 보호
- 대용량 배포 시 CDN 추가 검토 (Cloudflare 등)

---

## 30장. 새 KPI · 새 화면 추가 매뉴얼

**[개발자]**

### 새 KPI 추가

1. **`lib/kpiEngine.ts`**: `KPI_THRESHOLDS` or `KPI_OPTIMAL_RANGES`에 임계값 등록
2. **`constants/mockData.ts`**:
   - `KPI_ALL20_BY_PERIOD`에 4× id 추가 (기존 20 초과 시 목록 확장)
   - `KPI_BENCHMARKS`에 벤치 텍스트
3. **`lib/kpiPrescriptions.ts`**: `ALL20_PRESCRIPTIONS_BY_PERIOD.month`에 처방 추가 (4× 확장은 필요할 때)
4. **`constants/historyData.ts`**: `KPI_HISTORY`에 6개월 mock 데이터
5. **`app/dashboard.tsx`**: `ALL20_KEY_MAP`에 id ↔ key 매핑 추가
6. **`app/help.tsx`**: `GLOSSARY`의 적절한 section에 용어 등록 (term · short · body · range)

### 새 화면 추가

1. **`app/새이름.tsx`** 생성
2. **`app/_layout.tsx`**에 `<Stack.Screen name="새이름" options={{...}} />` 등록
3. **Auth gate wrapper 패턴 적용**:
```tsx
export default function 새Screen() {
  const { isLoaded, isAuthenticated } = useAppContext();
  if (!isLoaded) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-up" />;
  return <새ScreenInner />;
}

function 새ScreenInner() {
  const insets = useSafeAreaInsets();
  // ... 실제 hook 사용
}
```
4. **HomeFab 추가** (비대시보드 화면이면)
5. **뒤로가기 fallback**: `canGoBack() ? back() : replace("/dashboard")`
6. **`docs/CODE_MAP.md` §8 업데이트** · `docs/STACK_SPEC.md` §7.1 업데이트

### 새 대시보드 컴포넌트 추가

1. **`components/dashboard/새Component.tsx`** 생성
2. **파일 상단 주석**으로 목적·기준·상호작용 명시
3. **props만 받는 순수 컴포넌트로**: mockData·context 직접 import 금지
4. **자기 정렬**: `alignSelf: "center"` 등 부모 의존 최소화
5. **SVG 사용 시**: `viewBox` + `style` props로 반응형
6. **`app/dashboard.tsx`에 import + 배치**

### 이 매뉴얼을 따랐는지 자동 검증

없음. 코드 리뷰 시 이 매뉴얼 대조.

---

# 부록

## 부록 A. 용어 사전

앱 내부와 이 문서에서 자주 등장하는 용어 · 코드 심볼 · 방법론 개념을 한 번에.

### 앱 개념
- **관제탑 3단계 (Quest)**: 온보딩. EMR 연결·원장 동기화·재무 서류 스캔.
- **크리시스 top3**: 대시보드 중앙 위기 랭킹 3개 KPI.
- **처방 (Prescription)**: KPI 카드 tap 시 뜨는 모달. analysis · solution · effect · action + (풀이).
- **rootCause**: 3축 스코어 헤더에 뜨는 "지금 손대야 할 상류 지표".
- **overallPrescription**: 20 KPI 통합 처방. mockData의 finance.overallPrescription에 period별로.
- **Auth gate wrapper**: 화면 컴포넌트를 게이트+Inner로 분리하는 패턴 (hooks 순서 안전).
- **HomeFab**: 모든 비대시보드 화면 우하단 대시보드 바로가기 FAB.
- **(풀이)**: 처방 analysis의 마지막 bullet · 원장 언어로 개념 요약.

### 판정
- **ABS**: Absolute · 절대 임계값 판정.
- **REL**: Relative · 연차·규모·성향 대비 판정.
- **DERIVED**: Derived · 결과 지표 · 상류 원인 지표부터 손대라는 시그널.
- **Status**: crisis · warning · normal · best 4밴드.
- **Band**: 축 스코어의 밴드 · critical · risk · healthy · excellent.
- **Tier S**: 3축 스코어 계산 시 2× 가중 KPI 5개 (ltvCac · returnRate · recallRate · netProfit · preventiveRecall).
- **judgeType · isResultMetric · upstreamKpiKeys**: 처방 스키마 내부 필드.

### 방법론
- **Unit Economics**: a16z 2024 · 고객 단위 이익.
- **LTV**: Lifetime Value · 환자 평생 매출.
- **CAC**: Customer Acquisition Cost · 신환 유치 비용.
- **NRR**: Net Revenue Retention · 유지 경제학.
- **VBC**: Value-Based Care · Porter.
- **Lean · TPS**: Toyota Production System · 7대 낭비.
- **ToC**: Theory of Constraints · 병목 · Goldratt.
- **Muda**: TPS의 낭비.
- **NPS**: Net Promoter Score · 환자 만족도.
- **BEP**: Break-Even Point · 손익 분기.
- **REL 벤치**: 연차·규모별 상대 벤치마크.

### 상태·데이터 심볼
- **AppState**: 앱 전역 상태 인터페이스.
- **isLoaded**: AsyncStorage 복원 완료 플래그.
- **doctorProfile**: speedSlider · communicationSlider · chairSlider · managementType.
- **period**: today · week · month · quarter.
- **HR_DATA_BY_PERIOD · FINANCE_DATA_BY_PERIOD**: mockData의 4× 스키마.
- **KPI_ALL20_BY_PERIOD · KPI_TOP3_BY_PERIOD**: KPI 스냅샷.
- **KPI_BENCHMARKS**: 20 KPI 벤치 텍스트.
- **KPI_HISTORY**: 6개월 히스토리.
- **KpiPrescription**: 처방 타입.

### 기술 심볼
- **Expo Router**: 파일 시스템 라우팅.
- **`_layout.tsx`**: 그룹 layout 파일.
- **`(그룹명)/`**: URL에 반영되지 않는 그룹.
- **`+not-found.tsx`**: 404 fallback.
- **SPA fallback**: dist/index.html을 unknown path에 반환.
- **hashed asset**: `/_expo/static/*` 콘텐츠 해시 파일명.
- **must-revalidate**: HTTP 캐시 헤더 · 매 요청 재검증.
- **useEffect persist**: state 변경 시 AsyncStorage 자동 write.
- **함수형 setState**: `setState(prev => ...)`.
- **closure state**: 렌더 시점에 캡처된 stale `state`.
- **isLoaded 게이트**: mount 완료 대기 패턴.

---

## 부록 B. 커밋 히스토리로 읽는 앱 성장

주요 커밋들 (branch: `claude/mybrain-v2-root-layout-6sg553`):

**초기 셋업**
- Import mybrain-v2 source into MYBRAIN repo
- Fix "Attempted to navigate before mounting the Root Layout" (isLoaded 게이트)
- Adapt project for Railway (nixpacks · server/serve.js)

**인증·라우팅**
- Rename email → ID across auth
- Fix settings back button (canGoBack fallback)
- Build /help page with guide + FAQ + glossary
- Add references + HomeFab to non-dashboard pages

**Period 스코프**
- Make all dashboard panels reactive to period filter
- Period-scope all 20 KPI benchmarks + top3

**재무 심층분석 3섹션 (v0.5)**
- P1: mockData 스키마 확장 (overall + 축 인사이트)
- P2: 축 스코어 + rootCause 계산 (financialInsights.ts)
- P3: 신규 시각 컴포넌트 6종
- P4: OverallVerdictHeader + 각 섹션 InsightCard
- P5: 신규 처방 (laborProfitRatio·perStaffProfit·overall)
- P6: 재무 패널 3섹션 재구성

**NPS 파이프라인**
- 환자 NPS 설문 폼 컴포넌트 + help.tsx 통합
- NPS 설문 내보내기: /survey 공개 라우트 + QR + CSV

**쉬운말 · 정합 수정**
- A+C: 스코어 pill 탭 → 쉬운말 모달
- P2a: KPI_PRESCRIPTIONS 5개 analysis에 (풀이) 추가
- perStaffProfit 10배 오류 + 관련 텍스트 픽스
- 발견 픽스 A~C: mockData 산술 오류 · 처방·이름·밴드 통일 · auth 게이트
- P2b: 재무 심층 8개 처방 (풀이) 추가
- 픽스 D~I: 세부 정합
- P2c: 20 KPI 모달 나머지 19개 처방 (풀이)

**근본 스키마**
- 픽스 I 근본: KPI_PRESCRIPTIONS_BY_PERIOD 4× 스키마 확장 · notice 배지 제거

**컴포넌트 근본**
- LTV:CAC 게이지 카드 내 중앙 배치 (alignSelf: "center")

**용어 사전 · 문서**
- 도움말 용어 사전 23개에 range (정상 범위) 추가
- CODE_MAP.md · STACK_SPEC.md · BIBLE.md 문서 3종

**상태 관리 근본**
- 경영성향 저장 안 되던 버그 픽스 (함수형 setState + useEffect persist)
- 처방 단일 구성 bullet의 외곽 괄호 제거 (62개)

이 히스토리는 살아있다. `git log --oneline` 으로 최신 커밋 확인.

---

## 부록 C. 트러블슈팅 플레이북

### "Attempted to navigate before mounting the Root Layout"

**원인**: `<Redirect>`가 Root Layout mount 완료 전에 발동.
**진단**: `(tabs)/index.tsx`가 `!isLoaded`일 때 null 반환 확인. `AppContext.isLoaded` 초기값 false이고 useEffect에서만 true로 flip 되는지 확인.
**대응**: 위 조건 어느 하나 어긋나면 그것부터 수정.

### 경영성향·quest·doctorProfile 저장 안 됨

**원인**: mutator가 closure의 stale state를 참조.
**진단**: `AppContext.tsx`의 각 mutator가 `setState(prev => ...)` 함수형인지 확인.
**대응**: 아니면 함수형으로 통일. persist는 useEffect 하나로.

### Period 필터를 바꿔도 UI가 안 바뀜

**원인**: 데이터 조회가 `state.period`가 아닌 하드코딩된 "month" 사용.
**진단**: `HR_DATA_BY_PERIOD[period]` 등으로 조회하는지 확인.
**대응**: `state.period`로 조회 통일.

### 처방 텍스트가 이상함 (period 안 맞음)

**원인**: `getKpiPrescription(kpi, period)` 대신 예전 lookup 사용.
**진단**: `dashboard.tsx`에서 처방 조회 코드가 `getKpiPrescription`인지 확인.
**대응**: 새 헬퍼로 통일.

### LTV:CAC 게이지가 좌측으로 붙음

**원인**: `wrap` 스타일에 `alignSelf: "center"` 없음.
**진단**: `LtvCacGauge.tsx`의 `styles.wrap` 확인.
**대응**: `alignSelf: "center"` 추가.

### `dist/index.html not found` 서버 에러

**원인**: `npm run build` 안 함 or dist/ 삭제됨.
**진단**: `ls dist/` 확인.
**대응**: `npm run build` 재실행 · 또는 로컬이면 `dist/`가 gitignore라 재빌드 필요.

### Railway 배포 후 옛 버전이 뜸

**원인**: 브라우저 캐시가 `index.html`을 잡고 있음.
**진단**: DevTools Network 탭에서 index.html의 응답 헤더 확인 · Cache-Control이 must-revalidate인지.
**대응**: 하드 리로드 (Cmd+Shift+R). 만성이면 배포 워커에서 캐시 무효화 로직 추가 검토.

### 웹에서 input 포커스 시 파란 outline

**원인**: `_layout.tsx`의 CSS injection이 안 실행됨.
**진단**: DevTools에서 `<style id="mybrain-input-reset">` 태그 존재 확인.
**대응**: 없으면 CSS injection 코드 실행 순서 · Platform.OS 확인.

### package-lock.json이 실수로 커밋됨

**원인**: `.gitignore`에 있지만 이미 add된 파일은 자동 삭제 안 됨.
**대응**: `git rm --cached package-lock.json && git commit` 후 push.

### 새 dep 추가 후 Railway 빌드 실패

**진단**: Railway 대시보드에서 빌드 로그 확인.
**대응**:
- npm install 단계에서 실패면 dep peer 충돌 or 버전 미매칭
- build 단계에서 실패면 SDK 미스매치 or TypeScript 에러
- start 단계에서 실패면 dist가 없거나 서버 코드 문제

---

## 부록 D. 관련 문서 지도

**mybrain 저장소 문서 3종**:

- **`CLAUDE.md`** (root) — 프로젝트 규약. Claude Code 세션이 자동 읽음.
- **`docs/CODE_MAP.md`** (503줄) — 소스 지도. 어느 파일이 무엇을 하는지.
- **`docs/STACK_SPEC.md`** (1,151줄) — 스택 명세. 어느 패키지·설정이 왜 있는지.
- **`docs/BIBLE.md`** (이 문서) — 바이블. 왜·무엇을·어떻게·왜 그렇게·어디로.

**독서 경로**:

- **처음 온 개발자**: BIBLE 서장 → 제1권 → 제2권 → 제3권 11~14장 → CODE_MAP
- **KPI·처방 카피 수정**: BIBLE 8·9장 → kpiPrescriptions.ts
- **새 패키지 추가**: STACK_SPEC §15 체크리스트 → package.json
- **버그 픽스**: BIBLE 부록 C → 24장 (반복된 실수)
- **로드맵 논의**: BIBLE 제5권 → 27장 (실 데이터 시나리오)

**외부 참조**:

- Expo Router 6: https://docs.expo.dev/router/
- React 19 Compiler: https://react.dev/reference/rules
- React Native for Web: https://necolas.github.io/react-native-web/
- Railway Nixpacks: https://nixpacks.com/docs
- Andrew Chen "Unit Economics": https://andrewchen.co/
- Michael Porter "Value-Based Care": Harvard Business Review 2013

---

이 바이블은 살아있다. 앱이 바뀔 때마다 관련 절도 갱신한다. 새 KPI·새 화면·근본 픽스가 들어올 때 이 문서를 열지 않고 넘어가는 관행은 곧 다음 개발자의 야근으로 이어진다.

_end of bible_
