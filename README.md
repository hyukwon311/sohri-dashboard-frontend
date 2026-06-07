# sohri-dashboard-frontend

Sohri 프로젝트의 진행상황을 공유하기 위한 프론트엔드 대시보드입니다.  
기획/경영진이 한눈에 상태를 확인할 수 있도록 타임라인과 칸반 형태로 작업 상태를 시각화합니다.

현재는 개발 생산성을 위해 mock(MSW) 기반 데이터 조회를 지원하며,  
API 호출 레이어가 분리되어 있어 추후 FastAPI 백엔드 연동으로 전환하기 쉽게 구성되어 있습니다.

## 기술 스택

- React `^19.2.7`
- TypeScript `^6.0.3`
- Vite `^8.0.12`
- React Query (`@tanstack/react-query`) `^5.101.0`
- Axios `^1.17.0`
- MSW `^2.14.6`
- Nginx (Docker 정적 서빙)

## 사전 요구사항

- Node.js: `(확인 필요)`
  - 참고: Docker 빌드 스테이지는 `node:20-alpine` 사용
- npm (`package-lock.json` 기준)

## 시작하기 (Getting Started)

```bash
git clone <repo-url>
cd sohri-dashboard-frontend
cp .env.example .env
npm ci
npm run dev
```

개발 서버 실행 후 브라우저에서 Vite가 출력한 로컬 주소로 접속합니다.

## 환경변수

Vite 환경변수는 `VITE_` prefix가 필요합니다.

기본 템플릿:

```bash
cp .env.example .env
```

| 변수명              | 용도                                               | 예시                    |
| ------------------- | -------------------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | 실제 API 호출 시 base URL. mock 비활성화 시 사용   | `http://localhost:4411` |
| `VITE_ENABLE_MSW`   | 개발 모드에서 MSW 사용 여부 (`"false"`면 비활성화) | `false`                 |

참고:

- `src/shared/api/client.ts`에서 `VITE_API_BASE_URL`, `VITE_ENABLE_MSW`를 사용합니다.
- `src/main.tsx`에서 개발 모드 + `VITE_ENABLE_MSW !== "false"`일 때 MSW를 초기화합니다.

## 사용 가능한 스크립트

```bash
npm run dev
```

- Vite 개발 서버 실행

```bash
npm run build
```

- TypeScript 빌드(`tsc -b`) + Vite 프로덕션 빌드(`dist` 생성)

```bash
npm run preview
```

- 빌드 결과물 로컬 프리뷰 서버 실행

## 폴더 구조

```text
src/
├─ app/
│  ├─ App.tsx
│  ├─ providers/
│  ├─ mocks/
│  └─ styles/
├─ pages/
│  └─ dashboard/
├─ features/
│  └─ progress/
│     ├─ api/
│     ├─ model/
│     ├─ ui/
│     └─ mock/
├─ shared/
│  └─ api/
├─ assets/
├─ main.tsx
└─ vite-env.d.ts
```

주요 디렉터리 역할:

- `app`: 앱 진입/프로바이더/전역 스타일/앱 레벨 mock bootstrap
- `pages`: 페이지 조립 레벨 컴포넌트
- `features/progress`: 진행상황 도메인(API, 타입/쿼리, UI, mock)
- `shared/api`: 공용 HTTP 클라이언트(axios)
- `assets`: 정적 에셋

## Docker 빌드·실행

### 1) Dockerfile 기반 실행

```bash
docker build -t sohri-dashboard-frontend \
  --build-arg VITE_API_BASE_URL=http://<backend-host>:<port> \
  --build-arg VITE_ENABLE_MSW=false \
  .
```

```bash
docker run -d --name sohri-frontend -p 80:80 sohri-dashboard-frontend
```

### 2) docker-compose 기반 실행

```bash
# compose 실행 전 .env 값을 설정
cp .env.example .env
# 필요 시 .env의 VITE_API_BASE_URL 수정
docker compose up -d --build
```

설명:

- `Dockerfile`은 멀티스테이지 빌드(`node` → `nginx`)를 사용합니다.
- 최종 이미지는 `dist` 정적 파일만 nginx로 서빙합니다.
- SPA 라우팅 fallback(`try_files ... /index.html`)이 포함되어 있습니다.

## 데이터 연동 현황

- 현재 상태:
  - API 함수: `src/features/progress/api/progressApi.ts`
  - 조회 훅: `src/features/progress/model/queries.ts`
  - mock 핸들러: `src/features/progress/mock/handlers.ts`
- 동작 방식:
  - 개발 모드에서 `VITE_ENABLE_MSW !== "false"`이면 mock 사용
  - 그 외에는 `VITE_API_BASE_URL`로 실제 API 호출
- 향후 전환:
  - mock을 끄고(`VITE_ENABLE_MSW=false`) 백엔드 URL을 주입하면 실제 API 연동 가능

## 확인 필요 항목

- 로컬 개발 표준 Node.js 버전(`package.json`의 `engines` 미정)
