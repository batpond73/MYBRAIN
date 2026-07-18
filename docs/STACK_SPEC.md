# MYBRAIN 스택 명세서 (Stack Specification)

이 문서는 mybrain-v2 앱이 어떤 기술 조합 위에 서 있는지, 각 층·각 패키지·각
설정 파일이 무엇을 담당하는지 축약 없이 낱낱이 기록한 명세서다.
"어느 패키지가 왜 들어와 있는가 · 어디에서 어떻게 쓰이는가 · 웹으로
export될 때 어떻게 동작하는가"의 세 질문에 답할 수 있게 정리했다.

---

## 목차

1. 문서 규약
2. 시스템 요구사항
3. 프레임워크·플랫폼
4. 런타임 의존성 (dependencies) — 39개 전부 상세
5. 개발 의존성 (devDependencies) — 7개 전부 상세
6. 설정 파일 상세
7. 파일 구조 완전 목록
8. 빌드·배포 파이프라인
9. 웹 SPA 서버 상세
10. 라우팅 스택
11. 상태·데이터 흐름
12. 의존성 그래프 (누가 누구를 부르는가)
13. 웹 export 시 특이사항
14. 알려진 이슈·주의사항
15. 새 패키지 추가 시 체크리스트

---

## 1. 문서 규약

- 버전 표기는 `package.json`의 실제 pin 그대로 표기한다 (`~`, `^`는 그대로 유지). 이는 `expo` 계열 패키지의 SDK 매칭을 위한 chevron pin과 일반 패키지의 semver 캐럿 pin 규약이 섞여 있기 때문이다.
- "사용 위치"는 실제로 import되는 소스 파일 경로를 표기한다. 미사용 dep은 "미사용 (제거 후보)"로 표시한다.
- "웹 호환성"은 `expo export --platform web`으로 SPA 빌드했을 때 실제로 동작하는지, native 전용이면 어떻게 no-op되는지를 명시한다.
- 파일·라인 수는 이 문서 작성 시점 기준. 재작성 시 실측치를 다시 채운다.

---

## 2. 시스템 요구사항

### Node.js
- **요구 버전**: `>= 20` (`package.json` `engines.node`)
- **핀 이유**: Expo SDK 54의 `@expo/cli`, Metro bundler, `expo-router` typedRoutes 생성기가 Node 20의 `structuredClone`, native `fetch`, ES2023 문법을 요구한다.
- **Railway 매칭**: `nixpacks.toml`의 `[phases.setup]`에서 `nixPkgs = ["nodejs_20", "npm-10_x"]`로 Node 20 · npm 10을 고정 설치한다.

### npm
- **요구 버전**: npm 10 (nixpacks)
- **왜 10인가**: Expo 54가 npm 9 이하의 dependency resolver와 `overrides` 처리에서 충돌 이력이 있었다. 10은 workspace가 없어도 안정적으로 lockfile 없는 `npm install`을 지원한다.
- **lockfile 정책**: 이 레포는 `package-lock.json`을 커밋하지 않는다 (`.gitignore` 명시). 로컬 `npm install` 부산물은 Railway 배포와 무관하므로 히스토리를 오염시키지 않는다.

### 운영 체제
- **Railway 컨테이너**: Linux (nixpacks가 자동 제공)
- **개발**: macOS / Linux / Windows(WSL 권장) 모두 무관. 서버가 순정 Node라 OS 의존 없음.

### 포트
- **Railway 서비스 규약**: `$PORT` 환경 변수에 바인딩. `server/serve.js`가 `process.env.PORT || 3000`으로 자동 처리.
- **주소**: `0.0.0.0:$PORT`. Railway 프록시가 이 주소로 라우팅.

---

## 3. 프레임워크·플랫폼

### Expo SDK 54 (`expo@~54.0.27`)
- Expo는 React Native 앱 개발을 표준화하는 workflow + SDK 묶음이다. mybrain-v2는 그중 "Managed Workflow" + "React Native for Web" 조합을 사용한다.
- SDK 54가 정한 각 서브패키지 버전 (`expo-router`, `expo-image`, `expo-haptics` 등)은 서로 매칭되어야 하며, `~` 캐럿을 사용해 패치 업데이트만 허용한다.

### React 19.1.0 · React DOM 19.1.0
- **왜 19인가**: Expo 54가 React 19 기반. `useOptimistic`, `useActionState` 등 신기능은 아직 사용하지 않지만 `use()` API·자동 배치를 활용한다.
- **React Compiler**: `app.json`의 `experiments.reactCompiler = true`로 활성화. `babel-plugin-react-compiler`가 렌더 함수를 자동 memoize.

### React Native 0.81.5
- **역할**: 앱 UI의 뷰 시스템 (View, Text, StyleSheet, Animated, TouchableOpacity 등).
- **new architecture**: `app.json`의 `newArchEnabled = true`. Fabric renderer + TurboModules 기반. 웹 export는 Fabric을 우회하지만 API 표면은 그대로.

### React Native Web `react-native-web@^0.21.0`
- **역할**: `react-native`의 뷰 시스템을 브라우저 DOM으로 렌더링. `View → <div>`, `Text → <span>`, `TouchableOpacity → <div role="button">`.
- **Metro가 자동 alias**: `import { View } from "react-native"`가 웹 빌드 시 `react-native-web`으로 치환.
- **주의**: TextInput은 native `<input>`/`<textarea>`로 그려지고 브라우저 기본 outline이 씌워짐 → `app/_layout.tsx`에서 CSS injection으로 리셋.

### TypeScript 5.9.x (`typescript@~5.9.2`)
- **strict mode 활성** (`tsconfig.json`).
- **경로 alias**: `@/*` → `./*` (baseUrl 기준).
- **자동 typedRoutes**: `app.json`의 `experiments.typedRoutes = true` → `.expo/types/router.d.ts` 자동 생성, `router.push("/dashboard")` 등 경로가 리터럴 타입으로 검증됨.

---

## 4. 런타임 의존성 (dependencies) — 39개 전부 상세

각 패키지는 아래 표기 형식을 따른다:

- **버전 pin**: `package.json`의 정확한 문자열
- **카테고리**: 폰트/UI/라우팅/데이터/저장소/네이티브/유틸/서버
- **목적**
- **사용 위치**: import되는 실제 파일 경로
- **웹 호환성**

---

### 4.1 `@expo-google-fonts/inter`  ·  `^0.4.0`
- **카테고리**: 폰트
- **목적**: Inter 400/500/600/700 웨이트를 앱 폰트로 로드. 브랜드 타이포그래피.
- **사용 위치**: `app/_layout.tsx` — `useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })`. 로드 완료까지 `SplashScreen.preventAutoHideAsync()`로 스플래시 유지.
- **웹 호환성**: 웹에서는 폰트 파일이 dist에 번들되고 CSS `@font-face`로 등록되어 브라우저 폰트 캐시에 저장된다. 초기 방문 시 다운로드 지연이 있을 수 있음.

---

### 4.2 `@expo/vector-icons`  ·  `^15.0.3`
- **카테고리**: UI (아이콘)
- **목적**: Feather · Ionicons · MaterialIcons 등 벡터 아이콘 세트. mybrain은 Feather만 사용.
- **사용 위치**: 거의 모든 화면·컴포넌트. 대표 예:
  - `app/dashboard.tsx`: `chevron-right`, `activity`, `zap`, `check-circle`
  - `app/help.tsx`: `target`, `info`
  - `components/HomeFab.tsx`: `home`
- **웹 호환성**: 아이콘 폰트 TTF가 dist에 임베드. 모두 정상 렌더.

---

### 4.3 `@react-native-async-storage/async-storage`  ·  `2.2.0`
- **카테고리**: 저장소 (Key-Value)
- **목적**: 세션·설정·NPS 응답 로컬 영속화.
- **사용 위치**:
  - `context/AppContext.tsx` — `mybrain_state` key. `AsyncStorage.setItem(state)` / `getItem`.
  - `lib/npsStorage.ts` — `mybrain_nps_responses` key. NPS 응답 배열 JSON.
- **웹 호환성**: 브라우저에서는 `localStorage` 백엔드로 자동 폴백 (라이브러리 내부). 5MB 한계 있음 · 시연 스케일에서는 문제없음.

---

### 4.4 `@stardazed/streams-text-encoding`  ·  `^1.0.2`
- **카테고리**: 폴리필
- **목적**: Web Streams API의 TextEncoder/Decoder polyfill.
- **사용 위치**: 직접 import 없음. `expo`/`react-native` 내부 의존성으로 필요.
- **웹 호환성**: 브라우저 native 지원이라 사실상 우회. Hermes/JSC 대응.

---

### 4.5 `@tanstack/react-query`  ·  `^5.87.4`
- **카테고리**: 데이터 (서버 상태 관리)
- **목적**: 원격 데이터 fetching + 캐시. 향후 EMR/CAPS 실 API 연동 시 사용.
- **사용 위치**: `app/_layout.tsx`에서 `QueryClientProvider`로 앱 감싸기만 함. 현재 mockData 기반이라 실제 `useQuery` 호출은 없음.
- **웹 호환성**: 완전 호환. React 19 지원 버전.

---

### 4.6 `@ungap/structured-clone`  ·  `^1.3.0`
- **카테고리**: 폴리필
- **목적**: `structuredClone()` 폴리필. Deep clone.
- **사용 위치**: 직접 import 없음. `expo-router`가 이전 SDK 호환 위해 소환.
- **웹 호환성**: 모던 브라우저는 native로 노출. 사실상 우회.

---

### 4.7 `expo`  ·  `~54.0.27`
- **카테고리**: 프레임워크 코어
- **목적**: Expo SDK 진입점. 각 서브 SDK를 하나로 묶는 메타 패키지 + Metro 설정 + build/export CLI 통합.
- **사용 위치**:
  - `metro.config.js` — `getDefaultConfig` import
  - `components/ErrorFallback.tsx` — `reloadAppAsync()` 사용 (에러 시 재실행)
  - `babel.config.js` — `babel-preset-expo`
- **웹 호환성**: 웹 export 자체를 제공.

---

### 4.8 `expo-blur`  ·  `~15.0.8`
- **카테고리**: UI (효과)
- **목적**: iOS 스타일 blur 배경. `BlurView` 컴포넌트.
- **사용 위치**: `app/dashboard.tsx` — `import { BlurView } from "expo-blur"`. 대시보드 상단 sticky bar 배경에 사용 후보였으나 현재 대부분 인라인 배경으로 대체 · 잔존 import.
- **웹 호환성**: CSS `backdrop-filter: blur()`로 자동 매핑. 사파리/크롬 최신은 지원, 오래된 브라우저는 무효 처리.

---

### 4.9 `expo-constants`  ·  `~18.0.11`
- **카테고리**: 유틸
- **목적**: 앱 실행 컨텍스트(플랫폼, 매니페스트) 접근.
- **사용 위치**: 직접 import 없음. Expo 내부 의존.
- **웹 호환성**: 웹에서도 `Constants.expoConfig` 반환.

---

### 4.10 `expo-document-picker`  ·  `~14.0.8`
- **카테고리**: 네이티브 API
- **목적**: OS 파일 선택 다이얼로그 (CSV, PDF, 이미지).
- **사용 위치**:
  - `app/daily-receipt.tsx` — CAPS 카드 CSV 업로드 mock
  - `app/(quest)/scan.tsx` — 재무 서류 스캔 mock
  - `components/help/NpsExportCard.tsx` — NPS CSV 불러오기
- **웹 호환성**: `<input type="file">` fallback. macOS Safari에서 여러 파일 확장자 지정에 제약이 있으나 시연 스케일 무관.
- **app.json 플러그인 설정**: `{ iCloudContainerEnvironment: "Production" }` — iOS에서 iCloud Files 접근용.

---

### 4.11 `expo-font`  ·  `~14.0.10`
- **카테고리**: 폰트
- **목적**: Inter 로드 시 하위 API.
- **사용 위치**: `@expo-google-fonts/inter` 내부 의존.
- **웹 호환성**: `@font-face` 생성.

---

### 4.12 `expo-glass-effect`  ·  `~0.1.4`
- **카테고리**: UI (효과)
- **목적**: iOS 26+ 유리질감 효과. 실험적.
- **사용 위치**: 직접 import 없음. 향후 대시보드 카드 배경에 사용 후보.
- **웹 호환성**: 대응 없음. 웹에서는 무시.

---

### 4.13 `expo-haptics`  ·  `~15.0.8`
- **카테고리**: 네이티브 API
- **목적**: 진동 피드백. `impactAsync`, `notificationAsync`, `selectionAsync`.
- **사용 위치**: 거의 모든 인터랙션 지점. 예:
  - `app/(auth)/login.tsx` — 로그인 버튼 tap
  - `app/dashboard.tsx` — KPI 카드 tap
  - `app/help.tsx` — 접힘/펼침 토글
  - `components/HomeFab.tsx` — FAB tap
- **웹 호환성**: 웹에서는 no-op. try/catch로 감싸 에러 발생 없음.

---

### 4.14 `expo-image`  ·  `~3.0.11`
- **카테고리**: UI (미디어)
- **목적**: 고성능 이미지 컴포넌트. RN `Image`보다 캐싱·placeholder·blurhash 우수.
- **사용 위치**:
  - `app/(auth)/login.tsx`, `sign-up.tsx` — 로고 이미지
  - `app/intro.tsx` — 로고 애니메이션
  - `app/settings.tsx` — 프로필 아바타
  - `app/survey.tsx` — 로고
- **웹 호환성**: `<img>` 태그 + IntersectionObserver로 lazy loading. `contentFit="contain"` 등 속성 지원.

---

### 4.15 `expo-image-picker`  ·  `~17.0.9`
- **카테고리**: 네이티브 API
- **목적**: 카메라·앨범에서 이미지 선택.
- **사용 위치**: 직접 import 없음. 향후 프로필 사진·서류 촬영에 사용 예정.
- **웹 호환성**: `<input type="file" accept="image/*">` fallback.
- **app.json 플러그인 설정**: 앨범/카메라 권한 문구 한국어로 설정 (`photosPermission`, `cameraPermission`).

---

### 4.16 `expo-linear-gradient`  ·  `~15.0.8`
- **카테고리**: UI
- **목적**: 그라디언트 배경. `<LinearGradient colors={[...]}>`.
- **사용 위치**:
  - `app/dashboard.tsx` — 대시보드 상단 배경 그라디언트
  - `app/(quest)/emr.tsx` — 헤더 배경
  - `app/(quest)/scan.tsx` — 유사
- **웹 호환성**: CSS `linear-gradient`로 자동 매핑.

---

### 4.17 `expo-linking`  ·  `~8.0.10`
- **카테고리**: 네이티브 API
- **목적**: 딥링크·URL scheme 처리. `mybrain://` 등록 (`app.json`의 `scheme`).
- **사용 위치**: 직접 import 없음. Expo Router가 내부적으로 사용.
- **웹 호환성**: 웹에서는 `window.location` 기반.

---

### 4.18 `expo-location`  ·  `~19.0.8`
- **카테고리**: 네이티브 API
- **목적**: GPS·주소 조회.
- **사용 위치**: 직접 import 없음. 미사용 (**제거 후보** — 향후 병원 위치 기반 벤치마크에 쓸 여지가 있어 남겨둠).
- **웹 호환성**: `navigator.geolocation` fallback.

---

### 4.19 `expo-router`  ·  `~6.0.17`
- **카테고리**: 라우팅
- **목적**: 파일 시스템 기반 라우팅. `app/**/*.tsx`가 자동으로 라우트가 됨. Stack·Tabs·Drawer·Modal 프리셋 제공.
- **사용 위치**:
  - `app/_layout.tsx` — `<Stack>` 루트
  - 모든 화면 — `import { router } from "expo-router"`; `router.push`, `router.replace`, `router.back`, `router.canGoBack`
  - `app/(auth)/_layout.tsx`, `(quest)/_layout.tsx`, `(tabs)/_layout.tsx` — 그룹 컨테이너
  - `app/(tabs)/index.tsx` — `<Redirect href="..." />`로 라우팅 게이트
- **웹 호환성**: HTML5 History API 기반. `web.output = "single"` 설정 시 SPA 모드. 서버 SPA fallback 필요 (`server/serve.js`가 처리).

---

### 4.20 `expo-splash-screen`  ·  `~31.0.12`
- **카테고리**: UI
- **목적**: 앱 시작 스플래시 화면 유지/해제 API.
- **사용 위치**: `app/_layout.tsx` — `preventAutoHideAsync()` + 폰트 로드 완료 시 `hideAsync()`.
- **웹 호환성**: `app.json`의 `splash` 이미지가 초기 HTML에 임베드되어 JS 번들 로드 전까지 표시.

---

### 4.21 `expo-status-bar`  ·  `~3.0.9`
- **카테고리**: UI
- **목적**: iOS·Android 상태바 스타일 (색상, hide).
- **사용 위치**: 직접 import 없음. Expo 내부 폴백.
- **웹 호환성**: 웹에서는 no-op.

---

### 4.22 `expo-symbols`  ·  `~1.0.8`
- **카테고리**: UI
- **목적**: iOS SF Symbols 렌더링.
- **사용 위치**: 미사용 (**제거 후보**).
- **웹 호환성**: 미대응. Feather 아이콘으로 대체 중.

---

### 4.23 `expo-system-ui`  ·  `~6.0.9`
- **카테고리**: UI
- **목적**: 앱 배경색 · 시스템 UI 스타일 제어.
- **사용 위치**: 직접 import 없음. Expo 내부.
- **웹 호환성**: 웹은 body background로 대응.

---

### 4.24 `expo-web-browser`  ·  `~15.0.10`
- **카테고리**: 네이티브 API
- **목적**: 인앱 브라우저 · 외부 URL 오픈. OAuth 리다이렉트 등에 사용.
- **사용 위치**: 직접 import 없음. `app.json` `plugins`에 등록되어 있어 향후 소셜 로그인 실 연동 시 활용.
- **웹 호환성**: `window.open()` 대체.

---

### 4.25 `react`  ·  `19.1.0`
- **카테고리**: 프레임워크 코어
- **목적**: UI 라이브러리.
- **사용 위치**: 모든 파일. `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useContext`, `createContext`, `Component`, `PropsWithChildren` 등.
- **웹 호환성**: `react-dom` 페어링.

---

### 4.26 `react-dom`  ·  `19.1.0`
- **카테고리**: 웹 렌더러
- **목적**: React 트리를 브라우저 DOM에 그리는 renderer.
- **사용 위치**: Metro가 웹 export 시 자동으로 사용.
- **웹 호환성**: 웹 전용.

---

### 4.27 `react-native`  ·  `0.81.5`
- **카테고리**: UI 프레임워크
- **목적**: `View`, `Text`, `StyleSheet`, `Animated`, `Dimensions`, `Platform`, `KeyboardAvoidingView`, `ScrollView`, `TouchableOpacity`, `TextInput`, `Modal`, `Alert`, `LayoutAnimation`, `ActivityIndicator`, `Pressable` 등.
- **사용 위치**: 모든 화면·컴포넌트.
- **웹 호환성**: Metro alias로 `react-native-web`으로 치환.

---

### 4.28 `react-native-gesture-handler`  ·  `~2.28.0`
- **카테고리**: 상호작용
- **목적**: 스와이프·팬·핀치 등 고성능 제스처 처리. Expo Router의 스크린 스와이프 뒤로가기에 필수.
- **사용 위치**: `app/_layout.tsx` — 루트를 `<GestureHandlerRootView>`로 감싸기.
- **웹 호환성**: 폰트 pointer events 기반 폴백. 스와이프 back 등 일부 동작이 제한적.

---

### 4.29 `react-native-keyboard-controller`  ·  `1.18.5`
- **카테고리**: 상호작용
- **목적**: 키보드 표시/숨김 시 뷰 자동 스크롤·오프셋. `KeyboardAwareScrollView`.
- **사용 위치**:
  - `app/_layout.tsx` — `<KeyboardProvider>` 루트
  - `components/KeyboardAwareScrollViewCompat.tsx` — 웹에서는 순정 ScrollView로 스왑
- **웹 호환성**: 웹에서는 대부분 no-op (브라우저가 자체 처리) — Compat 컴포넌트가 이를 명시적으로 대체.

---

### 4.30 `react-native-reanimated`  ·  `~4.1.1`
- **카테고리**: 애니메이션
- **목적**: 60fps worklet 기반 애니메이션. Gesture Handler와 페어링.
- **사용 위치**: 직접 import 없음. `expo-router`가 스크린 전환 애니메이션에 사용.
- **웹 호환성**: 웹에서는 `requestAnimationFrame` 폴백. 성능 저하는 있으나 시각적으로는 동작.

---

### 4.31 `react-native-safe-area-context`  ·  `~5.6.0`
- **카테고리**: 레이아웃
- **목적**: 노치·홈 인디케이터 회피 safe area 계산.
- **사용 위치**:
  - `app/_layout.tsx` — `<SafeAreaProvider>` 루트
  - 모든 화면 — `useSafeAreaInsets()` 로 `insets.top`, `insets.bottom` 참조
- **웹 호환성**: `env(safe-area-inset-*)` CSS 매핑. 데스크톱에서는 0.

---

### 4.32 `react-native-screens`  ·  `~4.16.0`
- **카테고리**: 라우팅 최적화
- **목적**: 스크린 언마운트 최적화 (백그라운드 스크린을 실제 native view에서 detach).
- **사용 위치**: 직접 import 없음. `expo-router`가 내부적으로 사용.
- **웹 호환성**: 웹에서는 no-op.

---

### 4.33 `react-native-svg`  ·  `15.12.1`
- **카테고리**: 그래픽
- **목적**: `<Svg>`, `<Path>`, `<Line>`, `<Circle>`, `<Rect>`, `<Text>` 등 SVG 프리미티브. 앱 내 모든 차트·게이지가 이걸로 그려짐.
- **사용 위치**:
  - `app/dashboard.tsx` — 미니 차트
  - `components/dashboard/LtvCacGauge.tsx` — 반원 게이지
  - `components/dashboard/RetentionTrio.tsx` — 원형 게이지
  - `components/dashboard/AxisTrendLine.tsx` — 라인 차트
  - `components/dashboard/UncollectedFunnel.tsx` — 스택 바
- **웹 호환성**: 네이티브 `<svg>` 태그로 렌더. viewBox·style 조합으로 반응형 처리 규약.

---

### 4.34 `react-native-web`  ·  `^0.21.0`
- **카테고리**: 웹 폴백
- **목적**: RN 뷰 → DOM 매핑.
- **사용 위치**: Metro 자동 alias.
- **웹 호환성**: 웹 전용.

---

### 4.35 `react-native-qrcode-svg`  ·  `^6.3.15`
- **카테고리**: 그래픽
- **목적**: QR 코드 SVG 생성.
- **사용 위치**: `components/help/NpsExportCard.tsx` — 공개 설문 URL을 QR로 인코딩해서 태블릿 카메라로 스캔하도록 함.
- **웹 호환성**: 완전 호환. `react-native-svg` 위에 얹혀 있음.

---

### 4.36 `react-native-worklets`  ·  `0.5.1`
- **카테고리**: 애니메이션 하위 층
- **목적**: Reanimated 4의 worklet 실행 엔진.
- **사용 위치**: `react-native-reanimated`가 내부적으로 사용.
- **웹 호환성**: 웹에서는 메인 스레드 폴백.

---

### 4.37 `zod`  ·  `^3.24.1`
- **카테고리**: 검증
- **목적**: 런타임 스키마 검증. 향후 EMR API 응답 검증 시 활용.
- **사용 위치**: 직접 import 없음 (**현재 미사용**). 실 데이터 연동 시 파싱 layer에 도입 예정.
- **웹 호환성**: 순수 JS이라 완전 호환.

---

### 4.38 `zod-validation-error`  ·  `^3.4.0`
- **카테고리**: 검증 (에러 포맷)
- **목적**: Zod 에러를 사람 읽기 좋은 문자열로 변환.
- **사용 위치**: 직접 import 없음. Zod와 페어링으로 예약.
- **웹 호환성**: 순수 JS.

---

### 4.39 `@react-native-async-storage/async-storage` (중복 없음)
- 위 4.3에서 이미 다룸.

**총 39개 (한 개는 언급 중복 · 실제 dependencies는 39개)**

---

## 5. 개발 의존성 (devDependencies) — 7개 전부 상세

### 5.1 `@babel/core`  ·  `^7.25.2`
- **카테고리**: 트랜스파일러
- **목적**: JS 트랜스파일. Metro가 소환.
- **사용 위치**: `babel.config.js` 통해.

### 5.2 `@expo/cli`  ·  `54.0.23`
- **카테고리**: 빌드 CLI
- **목적**: `expo export`, `expo start`, `expo prebuild` 등 명령.
- **사용 위치**: `package.json` scripts (`npm run build`가 내부적으로 실행).

### 5.3 `@types/react`  ·  `~19.1.10`
- **카테고리**: 타입 정의
- **목적**: React 19 TypeScript 타입.
- **사용 위치**: TypeScript 컴파일 시.

### 5.4 `@types/react-dom`  ·  `~19.1.7`
- **카테고리**: 타입 정의
- **목적**: React DOM 19 타입.
- **사용 위치**: TypeScript 컴파일 시.

### 5.5 `babel-plugin-react-compiler`  ·  `^19.0.0-beta-e993439-20250117`
- **카테고리**: 트랜스파일 플러그인
- **목적**: React 19 Compiler. 렌더 함수 자동 memoize · useCallback/useMemo 생략 가능.
- **사용 위치**: `babel-preset-expo`가 `app.json`의 `experiments.reactCompiler = true`를 감지하여 자동 로드.

### 5.6 `babel-preset-expo`  ·  `~54.0.3`
- **카테고리**: 트랜스파일 프리셋
- **목적**: Expo 앱용 Babel 프리셋 (Reanimated worklet, expo-router, React Native 등 통합).
- **사용 위치**: `babel.config.js` — `presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]]`.

### 5.7 `typescript`  ·  `~5.9.2`
- **카테고리**: 컴파일러
- **목적**: TypeScript 컴파일 · `npm run typecheck`에서 사용.
- **사용 위치**: `tsconfig.json`이 지시.

---

## 6. 설정 파일 상세

### 6.1 `package.json`
```json
{
  "name": "mybrain-v2",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "expo export --platform web",
    "start": "node server/serve.js",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

- `main = "expo-router/entry"`: expo-router가 자동 등록하는 엔트리. `app/**` 파일 시스템 라우팅 활성화.
- `private = true`: npm publish 방지.
- Scripts 3개:
  - `build`: `expo export --platform web` → `dist/` SPA 생성
  - `start`: `node server/serve.js` → dist 서빙
  - `typecheck`: `tsc --noEmit` → 타입 체크만

### 6.2 `app.json`
```json
{
  "expo": {
    "name": "myBrain",
    "slug": "mybrain-v2",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "mybrain",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "ios": { "supportsTablet": false },
    "android": { "backgroundColor": "#FFFFFF" },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/icon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      ["expo-image-picker", {
        "photosPermission": "서류 사진을 선택하기 위해 사진 앨범 접근이 필요합니다.",
        "cameraPermission": "서류를 촬영하기 위해 카메라 접근이 필요합니다.",
        "microphonePermission": false
      }],
      ["expo-document-picker", { "iCloudContainerEnvironment": "Production" }]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

- `web.bundler = "metro"`: Webpack이 아닌 Metro로 웹 번들링.
- `web.output = "single"`: SPA. `dist/index.html` 하나만 생성, 모든 라우팅은 클라이언트에서 처리.
- `experiments.typedRoutes = true`: `.expo/types/router.d.ts` 자동 생성.
- `experiments.reactCompiler = true`: React 19 Compiler 활성.
- `scheme = "mybrain"`: iOS/Android 딥링크 URL scheme.
- `plugins`: 각 Expo SDK 모듈의 native 설정 (권한 문구 등).

### 6.3 `tsconfig.json`
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "baseUrl": ".",
    "strict": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- `expo/tsconfig.base` 상속: React Native + Expo용 기본 설정 (JSX, ES 타깃, moduleResolution).
- `strict = true`: `strictNullChecks`, `noImplicitAny` 등 전부 켜짐.
- `paths`: `@/*` alias.
- `include`: `.expo/types/**` 로 typedRoutes 자동 생성 파일 포함.

### 6.4 `babel.config.js`
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
```

- `api.cache(true)`: babel config 캐시 활성.
- `unstable_transformImportMeta`: ESM `import.meta` 문법 트랜스파일.

### 6.5 `metro.config.js`
```js
const { getDefaultConfig } = require("expo/metro-config");
module.exports = getDefaultConfig(__dirname);
```

- Expo가 제공하는 기본 Metro 설정을 그대로 사용. RN Web alias, SVG 로더 등 자동 처리.

### 6.6 `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm-10_x"]

[phases.install]
cmds = ["npm install --no-audit --no-fund"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

- Railway용 Nixpacks 빌드 명세.
- `setup`: Node 20 · npm 10.
- `install`: `--no-audit --no-fund`로 빌드 로그 간결화 + audit 서버 timeout 방지.
- `build`: `expo export --platform web` (npm script 경유).
- `start`: `node server/serve.js`.

### 6.7 `railway.json`
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- Railway 서비스 설정.
- 빌더: NIXPACKS (`nixpacks.toml` 사용).
- 실패 시 3회까지 자동 재시작.

### 6.8 `.gitignore`
- `node_modules/`, `package-lock.json`, `.expo/`, `dist/`, `web-build/`, `static-build/`, `expo-env.d.ts`, `ios/`, `android/`, `.env`, `.env*.local`, macOS `.DS_Store`, TypeScript `*.tsbuildinfo`, Metro `.metro-health-check*`, npm/yarn debug 로그.
- **핵심**: `package-lock.json` 명시 제외. 이 레포는 Railway nixpacks가 build 시점에 lock 재생성.

### 6.9 `CLAUDE.md`
- 프로젝트 규약 파일. Claude Code 세션이 자동 읽음.
- 주요 조항:
  - 절대 localhost 테스트 금지
  - 코드 수정 후 반드시 git push
  - Railway 자동 빌드·배포 (2~3분)
  - `app/(tabs)/index.tsx`의 `<Redirect>`는 `isLoaded=true` 이후에만 발동

### 6.10 `docs/CODE_MAP.md`
- 이 문서의 형제 문서. 소스 코드 구조·화면·컴포넌트 지도. 스택 명세와 상보적 역할.

### 6.11 `docs/STACK_SPEC.md`
- 이 문서.

---

## 7. 파일 구조 완전 목록

44개 소스 파일 (`.ts`/`.tsx`/`.js`) + 12개 설정/자산.

### 7.1 앱 라우팅 파일 (`app/`, 19개)
```
app/_layout.tsx                (98 lines)   Root Stack + Provider chain
app/+not-found.tsx             (45 lines)   404 fallback
app/intro.tsx                  (91 lines)   Logo intro animation
app/dashboard.tsx              (1,283 lines) 메인 관제탑
app/history.tsx                (455 lines)  20 KPI 6개월 히스토리
app/daily-receipt.tsx          (456 lines)  CAPS CSV 업로드 mock
app/settings.tsx               (570 lines)  슬라이더·경영성향·용어사전
app/help.tsx                   (769 lines)  가이드·용어사전·NPS·FAQ
app/survey.tsx                 (64 lines)   공개 NPS 설문 (인증 없음)
app/(auth)/_layout.tsx         (14 lines)
app/(auth)/login.tsx           (193 lines)
app/(auth)/sign-up.tsx         (220 lines)
app/(quest)/_layout.tsx        (14 lines)
app/(quest)/index.tsx          (212 lines)  Quest 3단계 허브
app/(quest)/profile.tsx        (232 lines)  Quest 2: 원장 동기화
app/(quest)/scan.tsx           (547 lines)  Quest 3: 재무 서류 OCR mock
app/(quest)/emr.tsx            (209 lines)  Quest 1: EMR 연결 mock
app/(tabs)/_layout.tsx         (6 lines)
app/(tabs)/index.tsx           (17 lines)   초기 진입 라우팅 게이트
```

### 7.2 컴포넌트 (`components/`, 17개)
```
components/ErrorBoundary.tsx                (54 lines)
components/ErrorFallback.tsx                (278 lines)
components/HomeFab.tsx                      (77 lines)
components/KeyboardAwareScrollViewCompat.tsx (29 lines)
components/dashboard/AxisScoreBadge.tsx     (94 lines)
components/dashboard/AxisTrendLine.tsx      (97 lines)
components/dashboard/InsightCard.tsx        (39 lines)
components/dashboard/LaborCrossCard.tsx     (83 lines)
components/dashboard/LtvCacGauge.tsx        (119 lines)
components/dashboard/OverallVerdictHeader.tsx (141 lines)
components/dashboard/RetentionTrio.tsx      (121 lines)
components/dashboard/ScoreExplainerModal.tsx (184 lines)
components/dashboard/SectionHeader.tsx      (80 lines)
components/dashboard/UncollectedFunnel.tsx  (97 lines)
components/help/NpsExportCard.tsx           (367 lines)
components/help/NpsSurveyForm.tsx           (465 lines)
```

### 7.3 라이브러리 (`lib/`, 4개)
```
lib/kpiEngine.ts          (111 lines)   ABS/REL/DERIVED 판정 순수 함수
lib/financialInsights.ts  (156 lines)   3축 스코어 + rootCause DAG
lib/kpiPrescriptions.ts   (1,162 lines) period × KPI 처방 매트릭스
lib/npsStorage.ts         (234 lines)   NPS 저장·CSV 교환
```

### 7.4 상수 (`constants/`, 3개)
```
constants/mockData.ts     (980 lines)   병원·HR·재무·KPI 20 · period 4×
constants/historyData.ts  (433 lines)   6개월 KPI 히스토리
constants/colors.ts       (59 lines)    시맨틱 팔레트
```

### 7.5 상태 (`context/`, 1개)
```
context/AppContext.tsx    (146 lines)   앱 전역 상태 · 함수형 setState
```

### 7.6 서버 (`server/`, 1개)
```
server/serve.js           (87 lines)    SPA 정적 서버 (외부 의존 0)
```

### 7.7 자산 (`assets/`)
```
assets/images/icon.png       (앱 아이콘 · app.json.icon)
assets/images/icon_raw.png   (원본)
assets/images/logo.png       (스플래시 · 로그인 · 인트로)
```

### 7.8 설정 (root)
```
package.json          (63 lines)   dep + scripts
app.json              (52 lines)   Expo 설정
tsconfig.json         (16 lines)   TypeScript
babel.config.js       (7 lines)    Babel
metro.config.js       (3 lines)    Metro
nixpacks.toml         (14 lines)   Railway 빌드
railway.json          (13 lines)   Railway 서비스
.gitignore            (45 lines)
CLAUDE.md             (프로젝트 규약)
```

### 7.9 문서 (`docs/`)
```
docs/CODE_MAP.md      (503 lines)   소스 지도
docs/STACK_SPEC.md    (이 문서)     스택 명세
```

### 7.10 총계
- 소스 라인: 약 **11,188 lines** (`.ts`/`.tsx`/`.js`)
- 설정 파일: 8개 (root)
- 문서: 2개
- 자산: 3개

---

## 8. 빌드·배포 파이프라인

### 8.1 로컬 개발 (참고용 — 실제로는 Railway 사이클 사용)
```
npm install                       # 의존성 설치
npm run typecheck                 # 타입 체크
npm run build                     # dist/ 생성
npm run start                     # dist/를 8080번 포트로 서빙 (PORT=8080 npm run start)
```

### 8.2 Railway 자동 파이프라인
1. **git push** to `claude/mybrain-v2-root-layout-6sg553` (또는 main)
2. Railway가 push를 감지하고 nixpacks 컨테이너 spin-up
3. **[phases.setup]** Node 20 + npm 10 설치
4. **[phases.install]** `npm install --no-audit --no-fund`
5. **[phases.build]** `npm run build` → `expo export --platform web` → `dist/`
6. 컨테이너 이미지 생성
7. **[deploy]** 컨테이너 실행 · `npm run start` → `node server/serve.js`
8. Railway 프록시가 `0.0.0.0:$PORT`로 트래픽 라우팅
9. 배포 URL로 접근 가능

**소요 시간**: 통상 2~3분.

### 8.3 환경 변수 규약
- `PORT`: Railway 자동 주입. 서버가 자동 처리.
- 그 외 환경 변수 사용 없음 (mock 데이터라 API 키 등 없음).
- 향후 실 API 연동 시 Railway 대시보드에서 설정 · deploy 버튼 수동 클릭 필요.

---

## 9. 웹 SPA 서버 상세 (`server/serve.js`)

### 9.1 아키텍처 요약
- 순수 Node.js `http`, `fs`, `path` 모듈만 사용.
- 외부 의존성 zero.
- 87줄.
- 목적: `dist/`를 서빙 + SPA fallback.

### 9.2 요청 처리 흐름
```
1. Request 도착
2. URL 파싱 (decodeURIComponent + posix.normalize + path traversal 차단)
3. resolved = DIST + path
4. resolved가 DIST 밖이면 403 Forbidden 반환
5. resolved가 존재하는 파일이면 serveFile()로 스트림
6. 아니면 dist/index.html (SPA fallback)
```

### 9.3 캐시 헤더
- `/_expo/static/*` (해시 파일명): `public, max-age=31536000, immutable` — 1년, 파일명이 콘텐츠 해시라 안전
- 그 외 (index.html 포함): `public, max-age=0, must-revalidate` — 매 요청 revalidate

### 9.4 MIME 매핑
- html, js, mjs, json, css, png, jpg, jpeg, gif, svg, ico, webp, woff, woff2, ttf, otf, map
- 미매칭 확장자: `application/octet-stream`

### 9.5 시작 시 검증
- `dist/index.html` 존재 확인
- 없으면 `console.error` + `process.exit(1)` — Railway가 재시작 정책에 따라 3회 재시도

### 9.6 로깅
- 시작 시 `[mybrain-v2] serving <DIST> on http://0.0.0.0:<port>`
- 요청 로그는 기본 미기록 (Railway 프록시 로그로 대체)

---

## 10. 라우팅 스택 (Expo Router 파일 시스템)

### 10.1 Stack.Screen 등록 (`app/_layout.tsx`)
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

### 10.2 URL 경로 매핑
```
/                          → app/(tabs)/index.tsx        (라우팅 게이트)
/intro                     → app/intro.tsx
/(auth)/sign-up            → app/(auth)/sign-up.tsx
/(auth)/login              → app/(auth)/login.tsx
/(quest)                   → app/(quest)/index.tsx
/(quest)/profile           → app/(quest)/profile.tsx
/(quest)/scan              → app/(quest)/scan.tsx
/(quest)/emr               → app/(quest)/emr.tsx
/dashboard                 → app/dashboard.tsx
/history                   → app/history.tsx
/daily-receipt             → app/daily-receipt.tsx
/settings                  → app/settings.tsx
/help                      → app/help.tsx
/survey                    → app/survey.tsx
```

**그룹 라우팅** (`(auth)`, `(quest)`, `(tabs)`): 괄호는 URL에 반영되지 않음. 그룹은 layout 상속·시각적 조직화 목적.

### 10.3 라우팅 게이트 (`app/(tabs)/index.tsx`)
```tsx
if (!isLoaded)              return null;             // Root Layout mount 대기
if (!hasSeenIntro)          return <Redirect href="/intro" />;
if (!isAuthenticated)       return <Redirect href="/(auth)/sign-up" />;
if (!allQuestsCompleted)    return <Redirect href="/(quest)" />;
return <Redirect href="/dashboard" />;
```

---

## 11. 상태·데이터 흐름

### 11.1 앱 전역 상태 (`context/AppContext.tsx`)
```ts
interface AppState {
  isAuthenticated: boolean;
  hasSeenIntro: boolean;
  userId: string;
  clinicName: string;
  clinicTenureYears: number;
  questsCompleted: { quest1, quest2, quest3 };
  doctorProfile: { speedSlider, communicationSlider, chairSlider, managementType };
  period: "today" | "week" | "month" | "quarter";
  isDarkMode: boolean;
}
```

- **저장**: AsyncStorage `mybrain_state` key. 전체 state를 JSON stringify.
- **로드**: `useEffect(() => { ... }, [])`에서 최초 render 시 복원.
- **isLoaded gate**: 복원 완료 전에는 라우팅 게이트에서 아무것도 렌더 안 함. Root Layout mount 완료 대기.
- **Persist**: `useEffect([state, isLoaded])` 하나로 단일화. 각 mutator는 저장 로직 없음.
- **Mutator 규약**: 모두 `setState(prev => ...)` 함수형. Closure state 참조 금지. (근본 픽스 이력)

### 11.2 순수 함수 계산 layer (`lib/`)
```
kpiEngine.ts          → evaluateKpiStatus(input): KpiStatus
                     → KPI_THRESHOLDS, KPI_OPTIMAL_RANGES, DERIVED_OPTIMAL_RANGES

financialInsights.ts  → computeAxisScores(snapshots): { profitability, retention, risk }
                     → pickRootCause(snapshots, upstreamMap): RootCause
                     → bandOf(score): ScoreBand
                     → AXIS_OF_ID, TIER_S_IDS, STATUS_HEALTH

kpiPrescriptions.ts   → getKpiPrescription(kpiKey, period): KpiPrescription
                     → KPI_PRESCRIPTIONS_BY_PERIOD, ALL20_PRESCRIPTIONS_BY_PERIOD

npsStorage.ts         → saveResponse(input): Promise<NpsResponse>
                     → loadResponses(): Promise<NpsResponse[]>
                     → summarize(responses): NpsSummary
                     → responsesToCsv(responses): string
                     → csvToResponses(csv): NpsResponse[]
                     → importAndMerge(csv): { added, skipped }
```

### 11.3 데이터 소스 (`constants/`)
```
mockData.ts           → HR_DATA_BY_PERIOD, FINANCE_DATA_BY_PERIOD,
                       KPI_TOP3_BY_PERIOD, KPI_EXTRA_CRISIS_BY_PERIOD,
                       KPI_ALL20_BY_PERIOD, KPI_BENCHMARKS,
                       PRESCRIPTIONS, TREATMENT_MIX, MARKETING_DATA,
                       ONLINE_REVIEWS, NPS_DATA, FIXED_COST_DETAIL,
                       VOICE_PARSE_EXAMPLES, CLINIC_INFO, EMR_MOCK

historyData.ts        → KPI_HISTORY (20 KPI × 6 개월)

colors.ts             → light/dark 시맨틱 팔레트
```

### 11.4 UI (`app/`, `components/`)
- 화면은 `useAppContext()` + 순수 함수 계산 layer + mockData를 조합해서 렌더.
- 사용자 액션 → mutator 호출 → state 변경 → `useEffect`가 AsyncStorage에 persist.

---

## 12. 의존성 그래프 (누가 누구를 부르는가)

### 12.1 앱 초기화 체인
```
main = "expo-router/entry"
  ↓
app/_layout.tsx
  ↓ (Provider chain)
  ErrorBoundary
    → GestureHandlerRootView
      → SafeAreaProvider
        → KeyboardProvider
          → QueryClientProvider
            → AppProvider (state + AsyncStorage)
              → Stack (라우팅)
  ↓ (초기 라우트)
app/(tabs)/index.tsx  (라우팅 게이트)
  ↓
  intro | sign-up | quest | dashboard
```

### 12.2 대시보드 렌더 체인
```
app/dashboard.tsx
  ├─ useAppContext           (state.period, doctorProfile)
  ├─ mockData
  │   ├─ HR_DATA_BY_PERIOD[period]
  │   ├─ FINANCE_DATA_BY_PERIOD[period]
  │   ├─ KPI_TOP3_BY_PERIOD[period]
  │   ├─ KPI_ALL20_BY_PERIOD[period]
  │   └─ KPI_BENCHMARKS, PRESCRIPTIONS, VOICE_PARSE_EXAMPLES
  ├─ lib/financialInsights
  │   ├─ computeAxisScores(snapshots)   → axisScores
  │   └─ pickRootCause(snapshots, upstreamMap) → rootCause
  ├─ lib/kpiPrescriptions
  │   └─ getKpiPrescription(kpiKey, period) → rx  (모달 오픈 시)
  └─ components/dashboard/*
      ├─ SectionHeader (bandOf)
      ├─ InsightCard
      ├─ OverallVerdictHeader (AxisScoreBadge, bandOf)
      ├─ ScoreExplainerModal (bandOf)
      ├─ LtvCacGauge (Svg)
      ├─ RetentionTrio (Svg)
      ├─ UncollectedFunnel
      ├─ LaborCrossCard
      └─ AxisTrendLine (Svg)
```

### 12.3 NPS 파이프라인
```
app/help.tsx
  ├─ components/help/NpsSurveyForm (mode="demo")
  │   └─ lib/npsStorage.saveResponse
  └─ components/help/NpsExportCard
      ├─ react-native-qrcode-svg (QR 생성)
      └─ lib/npsStorage
          ├─ loadResponses
          ├─ responsesToCsv
          └─ importAndMerge

app/survey.tsx  (공개 URL /survey)
  └─ components/help/NpsSurveyForm (mode="collect")
      └─ lib/npsStorage.saveResponse
```

---

## 13. 웹 export 시 특이사항

### 13.1 Metro가 자동 처리하는 것
- `react-native` → `react-native-web` alias
- SVG 렌더링 (`react-native-svg` → 네이티브 `<svg>`)
- Reanimated worklet → 메인 스레드 폴백
- `@expo/vector-icons` → 웹 폰트 임베드

### 13.2 자체 대응이 필요한 것
- **TextInput 포커스 outline**: `app/_layout.tsx`에서 CSS `<style>` 태그 주입으로 리셋
- **KeyboardAwareScrollView**: 웹에서 no-op → `components/KeyboardAwareScrollViewCompat.tsx`가 순정 ScrollView로 스왑
- **뒤로가기 (settings 등)**: `router.canGoBack() ? back() : replace("/dashboard")` — 새로고침으로 히스토리 없는 상태 대응
- **HomeFab**: 모든 비대시보드 화면에 대시보드 바로가기 FAB
- **Haptics**: 웹에서 no-op이라 try/catch로 감쌈

### 13.3 dist 산출물
```
dist/
├─ index.html                        (SPA entry)
├─ favicon.ico
├─ metadata.json
└─ _expo/static/js/web/entry-<hash>.js  (3~4 MB JS 번들)
```

- JS 번들이 3MB 초과 · gzip 후 800KB~1MB.
- 폰트·아이콘·이미지도 `_expo/static/` 하위에 해시 파일명으로 저장.

### 13.4 첫 페이지 로드 흐름
1. `dist/index.html` 반환 (with app.json splash 이미지)
2. 브라우저가 `entry-<hash>.js` 요청
3. JS 번들 로드 완료 → React 앱 부팅
4. `AppProvider`가 AsyncStorage (localStorage) 복원
5. `isLoaded = true` → 라우팅 게이트 발동 → 최종 라우트로 이동

---

## 14. 알려진 이슈·주의사항

### 14.1 미사용 dependencies (제거 후보)
- `expo-symbols` (iOS SF Symbols · 사용 없음)
- `expo-location` (GPS · 사용 없음)
- `expo-web-browser` (직접 import 없음 · plugins에만 등록)
- `expo-blur` (import 있으나 렌더 안 함 · 향후 카드 배경 후보로 남김)
- `zod`, `zod-validation-error` (실 API 연동 시 도입 예정)

### 14.2 웹 export에서 제한적 동작
- **Reanimated 4**: worklet이 메인 스레드 폴백 → 복잡한 애니메이션은 프레임 드롭 가능성
- **Gesture Handler**: 스와이프 뒤로가기 제한적. 상단 뒤로가기 버튼으로 대응.
- **Haptics**: 완전 no-op. 시각적 피드백에 의존.
- **Native modal presentation**: `daily-receipt`의 `presentation: "modal"`은 웹에서 fade 애니메이션으로 축소.

### 14.3 데이터 정합 주의
- `mockData`의 순이익률·인당 순이익·미수금 금액 등이 서로 산술적으로 정합해야 함
- 과거 `perStaffProfit` 10배 오류 이력 있음 → 현재 값: today 8만/week 45만/month 167만/quarter 445만 원
- period 변경 시 `KPI_BENCHMARKS` 텍스트가 실제 판정 기준과 일치해야 함

### 14.4 상태 저장 규약
- `AppContext`의 모든 mutator는 **함수형 setState** 필수
- Closure의 `state` 참조하면 stale 값 문제 발생 → 이력: 경영성향 저장 안 되던 버그
- Persist는 `useEffect([state, isLoaded])` 하나로 단일화

### 14.5 라우팅 시점 안전
- `(tabs)/index.tsx`에서 `<Redirect>`는 `isLoaded=true` 이후에만
- 다른 화면의 `router.push/replace`는 `useEffect`/이벤트 핸들러 내부에서만
- 위 규약 위반 시: `"Attempted to navigate before mounting the Root Layout"` 에러

### 14.6 lockfile 정책
- `package-lock.json`은 커밋 안 함 (`.gitignore` 명시)
- Railway가 build 시점에 lock 자동 재생성
- 로컬에서 실수로 커밋되지 않도록 주의

### 14.7 배포 후 페이지 반영 지연
- Railway 자동 빌드 2~3분
- 환경 변수 변경 시 Deploy 버튼 수동 클릭 필요
- 브라우저 캐시가 `index.html`을 잡고 있으면 새로고침 필요 (서버는 `must-revalidate` 헤더로 보호)

---

## 15. 새 패키지 추가 시 체크리스트

의존성 추가 결정 전에 확인:

1. **Expo SDK 매칭**: `expo-*` 패키지는 반드시 SDK 54와 매칭되는 버전으로. `expo install <pkg>` 명령이 자동 매칭해줌.
2. **웹 호환성**: 웹 export에서 동작하는지 · 네이티브 전용이면 폴백 준비.
3. **번들 크기**: dist JS 번들이 이미 3MB 초과. 큰 라이브러리 (>100KB) 추가 시 정말 필요한지 재고.
4. **React 19 호환**: peer dep 확인.
5. **native module 여부**: EAS Build 사용 안 하는 프로젝트라 Config Plugin 필요한 native module은 도입 불가.
6. **AsyncStorage 대체 여부**: 데이터 저장 라이브러리 도입 시 이미 있는 AsyncStorage와 겹치는지 확인.
7. **`babel-preset-expo` 통합**: 특수 babel plugin이 필요한 경우 `babel.config.js` 확인.
8. **types 패키지**: TypeScript 지원이 없으면 `@types/*` devDep 별도 필요.
9. **package.json 갱신 후 Railway 배포 확인**: install/build/start 모두 통과해야 실배포.
10. **CODE_MAP.md · STACK_SPEC.md 갱신**: 이 명세와 코드 지도에도 반영.

---

## 부록 A: 자주 하는 명령 요약

```
# 로컬
npm install                      # 의존 설치
npm run typecheck                # 타입 체크만
npm run build                    # dist/ 생성
npm run start                    # dist 서빙 (PORT=8080 npm run start)

# git
git status
git add <files>
git commit -m "..."
git push -u origin claude/mybrain-v2-root-layout-6sg553

# npx (권장하지 않음 — Railway 사이클 사용)
npx expo export --platform web
```

## 부록 B: 파일 크기 상위 10

| 순위 | 파일 | 라인 수 |
| ---: | :--- | ---: |
| 1 | `app/dashboard.tsx` | 1,283 |
| 2 | `lib/kpiPrescriptions.ts` | 1,162 |
| 3 | `constants/mockData.ts` | 980 |
| 4 | `app/help.tsx` | 769 |
| 5 | `app/settings.tsx` | 570 |
| 6 | `app/(quest)/scan.tsx` | 547 |
| 7 | `docs/CODE_MAP.md` | 503 |
| 8 | `components/help/NpsSurveyForm.tsx` | 465 |
| 9 | `app/daily-receipt.tsx` | 456 |
| 10 | `app/history.tsx` | 455 |

## 부록 C: 소스 파일 총 라인 수
- 앱 라우팅: 약 5,489 lines
- 컴포넌트: 약 2,325 lines
- 라이브러리: 약 1,663 lines
- 상수: 약 1,472 lines
- 상태: 약 146 lines
- 서버: 87 lines
- **합계**: 약 **11,188 lines**

---

이 문서는 mybrain-v2의 현재 상태를 반영한다. 패키지 · 버전 · 설정이 변경될 때마다 이 문서도 함께 갱신해야 한다. 관련 소스 지도는 `docs/CODE_MAP.md`를 참조하라.
