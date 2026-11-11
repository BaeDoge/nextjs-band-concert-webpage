# BAND NIGHT 2026

2026년 11월 21일 공연용 모바일 우선 안내 페이지입니다. Next.js + Vercel + Supabase로 구성했습니다.

## 로컬 실행
```bash
npm install
cp .env.example .env.local
npm run dev
```

Supabase 연결 전에는 화면 미리보기 모드로 동작합니다. 응원, 질문, 뒤풀이 응답의 서버 저장은 Supabase 환경변수를 등록해야 활성화됩니다.

## Supabase 설정
1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. Project Settings → API에서 Project URL과 service_role key를 확인합니다.
4. 로컬 `.env.local` 및 Vercel Environment Variables에 아래 값을 설정합니다.

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_ACCESS_KEY=긴_랜덤_비밀번호
```

service-role key와 ADMIN_ACCESS_KEY는 서버 비밀값입니다. 절대 NEXT_PUBLIC_ 접두사를 붙이거나 Git에 커밋하지 마세요.

## 이미지/영상 파일
첨부 원본 파일을 아래 경로로 복사해 주세요.
- 고양이 영상: `public/media/concert-cat.mp4`
- 기타 고양이 WebP: `public/images/guitar-cat.webp`

영상은 8초, 406×720, 24fps입니다. 원본에 없는 디테일을 실제로 복원하는 업스케일은 불가능해 원본을 보존하도록 구성했습니다. 워터마크도 원본 그대로 사용합니다.

## Vercel
GitHub 저장소를 Vercel에 Import하고 환경변수 3개를 등록한 뒤 Deploy합니다. QR 섹션은 현재 접속 도메인으로 QR을 자동 생성합니다.

운영자는 배포 주소의 `/host`에서 ADMIN_ACCESS_KEY로 로그인해 관객 질문을 읽고 답변할 수 있습니다. 키는 관객에게 공유하지 마세요.

## 입력 정보
- 전체 행사: 2026.11.21 (토) 18:00–21:00
- 밴드 공연: 18:00–19:30
- 셋리스트 11곡, 멤버 정보: 전달받은 내용 반영
- 공연 장소: 목동 제이에스아트홀, 서울 양천구 등촌로 36 지하 1층 (목동)
- 밴드 공식 명칭과 뒤풀이 장소/시간: 미정
