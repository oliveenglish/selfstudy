# 개별 진도 관리 앱 (MVP)

여러 학생이 각자 다른 진도로 학습하는 학원을 위한 앱입니다.
학생은 PIN으로 로그인해 오늘의 미션 카드를 확인하고 "검사받기" 버튼을 누르며,
교사는 대시보드에서 모든 학생의 상태를 실시간으로 확인하고 검사합니다.

기획서(`개별진도관리앱_기획서.docx`)의 구조를 그대로 코드로 옮긴 1차 버전입니다.

## 화면 구성

- `/` — 시작 화면 (학생/교사 진입점)
- `/login` — 학생 PIN 로그인 (숫자 키패드)
- `/student` — 오늘의 미션 카드, 자료 보기, 검사받기 버튼, 진도율
- `/teacher` — 실시간 학생 상태 그리드, 통과/보완필요 처리
- `/teacher/assign` — 학생별 오늘의 미션(Step) 등록, 즐겨찾기 템플릿
- `/teacher/history/[studentId]` — 학생별 누적 학습 이력

## 실행 방법

### 1) Supabase 프로젝트 준비

1. https://supabase.com 에서 무료 프로젝트를 생성합니다.
2. 프로젝트의 **SQL Editor**에 `supabase/schema.sql` 내용을 붙여넣고 실행합니다.
   (students, materials, daily_tasks, check_logs, favorites 테이블과 Realtime 설정이 만들어집니다.)
3. Supabase 대시보드의 **Table Editor** > `students` 테이블에 학생을 몇 명 추가합니다.
   - `name`: 학생 이름
   - `pin_code`: 학생이 로그인할 4자리 PIN (예: "1234")

### 2) 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`을 열어 Supabase 프로젝트의 **Settings > API**에서 확인한 값으로 채웁니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3) 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

- 학생 PC/태블릿에서는 `/login` 으로 바로 이동해두면 편합니다.
- 선생님은 `/teacher` 를 열어두고, `/teacher/assign` 에서 오늘 진도를 입력합니다.

### 4) 실제 서비스로 배포 (선택)

`npm run build` 로 빌드가 정상 동작하는지 확인했습니다. 실제로 학원 밖에서도 접속하려면
[Vercel](https://vercel.com)에 이 프로젝트를 올리고, 위 환경변수 2개를 Vercel 프로젝트 설정에도
동일하게 등록하면 됩니다.

## 지금 버전에서 아직 없는 것 (다음 단계 후보)

- 로그인 보안 강화 (지금은 교실 내부용으로 간단한 PIN 대조만 사용합니다. 외부에 공개하는
  서비스로 확장한다면 Supabase Auth + RLS 정책 적용을 권장합니다.)
- 소리/진동 알림
- 전날 진도 불러오기(복사) 버튼
- 학부모 공유용 진도 리포트 내보내기
- 일괄 과제 배정(여러 학생에게 동시 등록)

## 폴더 구조

```
app/
  page.tsx                     시작 화면
  login/page.tsx                학생 PIN 로그인
  student/page.tsx              학생용 오늘의 미션 화면
  teacher/page.tsx              교사 실시간 대시보드
  teacher/assign/page.tsx       진도/과제 출제기
  teacher/history/[studentId]/  학생별 학습 이력
components/                     PinPad, MissionCard, ProgressBar, MaterialModal, StudentStatusCard
lib/                            supabase 클라이언트, 타입, 로그인 세션 유틸
supabase/schema.sql             DB 스키마 (Supabase SQL Editor에 실행)
```
