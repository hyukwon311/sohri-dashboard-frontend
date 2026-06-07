# syntax=docker/dockerfile:1

# Build stage: React/Vite 앱을 정적 파일로 빌드한다.
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 레이어 캐시를 최대한 활용하기 위해 package 파일만 먼저 복사한다.
COPY package.json package-lock.json ./

# lock 파일 기준으로 재현 가능한 설치를 수행한다.
RUN npm ci

# 실제 소스 코드를 복사한 뒤 빌드를 수행한다.
COPY . .

# Vite는 빌드 타임 환경변수를 주입하므로 ARG를 사용한다.
ARG VITE_API_BASE_URL
ARG VITE_ENABLE_MSW=false

# ARG 값을 빌드 명령이 읽을 수 있도록 ENV로 연결한다.
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ENABLE_MSW=${VITE_ENABLE_MSW}

# TypeScript + Vite 프로덕션 빌드 결과물을 dist로 생성한다.
RUN npm run build

# Runtime stage: 빌드된 정적 파일만 nginx로 서빙한다.
FROM nginx:stable-alpine AS runner

# SPA 라우팅 대응: 존재하지 않는 경로는 index.html로 fallback 한다.
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '}' > /etc/nginx/conf.d/default.conf

# 빌드 산출물만 복사해 최종 이미지를 작게 유지한다.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx 포그라운드 실행.
CMD ["nginx", "-g", "daemon off;"]
