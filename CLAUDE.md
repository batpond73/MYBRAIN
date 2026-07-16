# CLAUDE.md

## 프로젝트
- mybrain-v2 — Expo Router 6 (SDK 54) 앱, Railway에 웹 SPA로 배포

## 배포 워크플로우
- 절대 localhost로 테스트하지 말 것
- 코드 수정 후 반드시 git push
- Railway가 자동 빌드 & 배포 (2~3분 소요)
- 환경변수 변경 시 Railway 대시보드에서 Deploy 버튼 수동 클릭 필요

## URL
- mybrain-web (기존, 유지): https://mandoo-1-production.up.railway.app
- mybrain-v2 (신규): Railway 대시보드에서 이 레포로 새 서비스 생성 후 도메인 확인

## 빌드/서빙 규약
- 빌드: `npm run build` → `expo export --platform web` → `dist/`
- 서빙: `npm run start` → `node server/serve.js` (SPA fallback, `$PORT` bind)
- Node 20 필수 (nixpacks.toml/package.json engines에 pin)

## 라우팅 주의
- 초기 진입 라우트인 `app/(tabs)/index.tsx`는 `AppContext.isLoaded`가 true가 될 때까지 렌더를 지연시켜야 함.
  안 그러면 Root Layout mount 전에 `<Redirect>`가 실행돼 "Attempted to navigate before mounting the Root Layout" 에러 발생.
- 다른 화면의 `router.push/replace`는 `useEffect`/이벤트 핸들러 내부여야 안전.
