# BAND NIGHT 2026

2026년 11월 21일 대일밴드 공연용 모바일 우선 안내 페이지입니다. Next.js + Vercel + Supabase로 구성했습니다. 배포 주소: https://daeil-band.vercel.app

## 1. 사전 준비
- Node.js 20.9 이상 (Node.js 22 LTS 권장)
- Git, Supabase 프로젝트, Vercel 계정

## 2. 로컬 설치 (Windows CMD)
```bat
git clone https://github.com/BaeDoge/nextjs-band-concert-webpage.git
cd nextjs-band-concert-webpage
node -v
npm -v
npm install
```
Next.js 16은 Node.js 20.9 이상이 필요합니다. https://nextjs.org/docs/app/getting-started/installation

## 3. 고양이 이미지와 영상 추가
전달된 band-night-media-assets.zip을 다운로드해 압축을 풉니다. ZIP 안의 public 폴더를 프로젝트 루트에 복사해 기존 public 폴더와 병합합니다.
- public/images/guitar-cat.webp
- public/media/concert-cat.mp4

## 4. Supabase 데이터베이스 준비
1. Supabase Dashboard에서 프로젝트를 엽니다.
2. SQL Editor로 이동합니다.
3. 저장소의 supabase/schema.sql 파일 전체 내용을 SQL Editor에 붙여넣고 Run을 실행합니다.
4. Table Editor에서 cheers, questions, rsvps 세 테이블이 만들어졌는지 확인합니다.

## 5. 환경변수 설정
프로젝트 루트의 CMD에서 실행합니다.
```bat
copy .env.example .env.local
notepad .env.local
```
아래 값으로 채웁니다.
```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_ACCESS_KEY=길고_예측하기_어려운_임의의_비밀번호
```
- SUPABASE_URL: Supabase Project URL
- SUPABASE_SECRET_KEY: Settings → API Keys에서 만든 서버용 Secret key (sb_secret_...)
- ADMIN_ACCESS_KEY: 직접 정하는 관리자 로그인 비밀번호
구형 service_role 키(eyJ...)를 쓴다면 SUPABASE_SECRET_KEY 대신 SUPABASE_SERVICE_ROLE_KEY에 설정해도 됩니다.
Secret key와 관리자 비밀번호는 서버 전용입니다. NEXT_PUBLIC_ 접두사를 붙이거나 GitHub에 커밋하지 마세요.

## 6. 로컬 실행 및 확인
```bat
npm run dev
```
브라우저에서 http://localhost:3000 을 엽니다.
- 응원 이모티콘을 누르면 응원 수가 증가하는지 확인합니다.
- 질문을 보낸 뒤 http://localhost:3000/host 에서 ADMIN_ACCESS_KEY로 로그인해 질문을 확인합니다.
- 뒤풀이 참석 응답 저장과 새로고침 후 유지 여부를 확인합니다.
개발 서버 종료는 CMD에서 Ctrl + C입니다.

배포 전 프로덕션 빌드를 검사합니다.
```bat
npm run build
```

## 7. 미디어 파일을 GitHub에 반영
압축 해제 후 프로젝트 루트에서 실행합니다.
```bat
git add public/images/guitar-cat.webp public/media/concert-cat.mp4
git commit -m "assets: add concert cat media"
git push origin main
```

## 8. Vercel 배포
1. https://vercel.com/dashboard 에 로그인합니다.
2. Add New → Project에서 BaeDoge/nextjs-band-concert-webpage 저장소를 Import합니다.
3. Framework Preset은 Next.js, Root Directory는 저장소 루트로 설정합니다.
4. Project Settings → Environment Variables에서 SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_ACCESS_KEY를 등록합니다.
5. Production과 Preview 환경을 선택하고 Deploy합니다.
이미 GitHub 저장소를 Vercel에 연결했다면 main 브랜치 Push 시 자동 배포됩니다. 환경변수를 수정한 경우에는 새 배포가 필요합니다.

## 9. 배포 후 확인
- https://배포도메인/api/status 에서 configured 값이 true인지 확인합니다.
- https://배포도메인/api/cheers 에서 JSON 응답이 오는지 확인합니다.
- https://배포도메인/host 에서 운영자 로그인과 질문 확인을 테스트합니다.
- 모바일에서 Vercel 배포 도메인으로 QR 접속을 테스트합니다. localhost QR은 외부 관객이 접속할 수 없습니다.

## 공연 정보
- 날짜: 2026.11.21 (토)
- 전체 행사: 18:00–21:00
- 우리 밴드: 18:00–19:30
- 장소: 목동 제이에스아트홀 (서울 양천구 등촌로 36 지하 1층, 목동)
- 셋리스트 11곡 및 멤버 정보: 전달받은 내용 반영
- 밴드 공식 명칭 및 뒤풀이 장소/시간: 추후 확정 시 업데이트


## PREVIEW / 연결 오류 확인

메인 화면 하단의 연결 안내는 `/api/status`가 Supabase URL, 서버용 키, 세 테이블 조회를 확인한 결과입니다. 안내 메시지에 누락된 환경변수나 테이블명이 표시됩니다.

Vercel Project Settings → Environment Variables에서 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`(또는 `SUPABASE_SERVICE_ROLE_KEY`)를 **Production** 환경에 등록했는지 확인하세요. 운영자 질문함을 사용하려면 `ADMIN_ACCESS_KEY`도 Production에 필요합니다. 값을 추가하거나 수정했다면 반드시 새 Production Deployment를 실행해야 합니다.

응원 수는 DB에 저장된 전체 행 개수를 기준으로 표시합니다. 관리자 페이지에서 초기화하면 `cheers` 테이블의 기록이 삭제되고 관객 화면도 다음 동기화 때 0으로 바뀝니다.


## 화면 및 디자인 개선

- 한글 웹폰트: Pretendard Variable (jsDelivr CDN, 시스템 폰트 fallback 포함)
- 메인 히어로: 타이틀/고양이 영상/공연 카운트다운 중심으로 구성
- 공연장 약도: Google Maps 주소 검색 임베드, 네이버/카카오 지도 링크
- 응원 애니메이션: 페이지 전체에 표시되며 3초 주기로 새 응원 기록을 확인
- 메시지: 입장 닉네임과 메시지 내용을 함께 저장하며 관리자 화면에서 발신자 확인


## 방문자 통계 및 차단 기능 DB 마이그레이션

이미 기존 DB를 사용 중인 프로젝트는 전체 `schema.sql`을 다시 실행하지 말고, 다음 파일을 Supabase SQL Editor에서 한 번 실행하세요.

- `supabase/migrations/20261112_admin_moderation.sql`

이 마이그레이션은 방문자 테이블, 응원/메시지의 visitor_id 컬럼, 인덱스, 관리자 통계 함수(`daeil_admin_stats`)를 추가합니다. 기존 cheers/questions/rsvps 데이터는 삭제하지 않습니다. 다만 마이그레이션 이전 기록에는 visitor_id가 없어 기존 사용자를 소급해 구분하거나 차단할 수 없습니다.

관리자 페이지 `/host`에서 등록 방문자 수, 고유 닉네임 수, 이모티콘별 응원 수, 사용자별 응원 수, 메시지 내용 및 답변, 뒤풀이 통계를 확인하고 브라우저 ID별 차단/해제를 할 수 있습니다.

차단은 계정 로그인이 아닌 브라우저 UUID 기준입니다. 동일 사용자가 시크릿 모드 또는 다른 기기에서 새 UUID를 발급받으면 차단을 우회할 수 있습니다. 완전한 계정 단위 제재가 필요하다면 Supabase Auth 로그인 도입이 필요합니다.

### 응원 API 부하 개선

공개 페이지는 응원 현황을 10초마다 단일 `/api/live` 요청으로 조회하고, 브라우저 탭이 보이지 않을 때는 조회를 건너뜁니다. 관리자별 이모티콘 집계는 DB 함수에서 계산해 API가 대량의 cheers 행을 내려받지 않습니다.


## Activity photo carousel

Run `supabase/migrations/20261112_gallery_settings.sql` once in Supabase SQL Editor. This creates the persistent `site_settings.gallery_enabled` option (default ON). The administrator can toggle it in `/host`.

The six photos uploaded for the event are downscaled and embedded in `public/images/activity-gallery.svg.gz` as small JPEG thumbnails. They are rendered in a non-clickable, continuous marquee under the final invitation panel. Browser context-menu and drag interactions are suppressed to discourage casual saving; public images cannot be made technically impossible to download because a browser must receive the image bytes to display them.

The gallery is a single compressed SVG strip (about 32 KB before transport) repeated twice for a seamless left-to-right marquee.
