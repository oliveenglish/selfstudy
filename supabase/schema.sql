-- 개별 진도 관리 앱 — Supabase 스키마
-- Supabase 프로젝트의 SQL Editor에 붙여넣고 실행하세요.

create extension if not exists "pgcrypto";

-- 학급/반 (선택 사항 — 지금은 단순하게 한 원장님 = 여러 학생 구조로 사용해도 됩니다)
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 학생
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_code text not null, -- 4자리 숫자 등 간단한 PIN
  class_id uuid references classes(id) on delete set null,
  created_at timestamptz not null default now()
);
-- PIN 중복 방지: 같은 PIN을 가진 학생이 동시에 존재할 수 없습니다.
create unique index if not exists students_pin_unique_idx on students (pin_code);

-- 학습 자료 (교재 설명, 이미지, 영상 링크 등)
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('text', 'image', 'video', 'pdf')),
  content text, -- 설명 텍스트 또는 URL
  created_at timestamptz not null default now()
);

-- 오늘의 미션 (학생별 단계)
create table if not exists daily_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  material_id uuid references materials(id) on delete set null,
  step_no int not null,
  title text not null,          -- 예: "개념 교재 p.24~25 설명 영상 시청"
  page_range text,              -- 예: "p.24~25"
  description text,             -- 이 과제를 어떻게 수행해야 하는지 안내 (선생님이 출제 시 입력)
  task_date date not null default current_date,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'waiting_check', 'done', 'redo', 'help_needed')),
  teacher_comment text,
  result_value text,            -- 단어 시험 점수 등 결과값 입력 (예: "8/10")
  requested_at timestamptz,     -- 검사받기 버튼을 누른 시각
  checked_at timestamptz,       -- 교사가 검사를 완료한 시각
  created_at timestamptz not null default now()
);
create index if not exists daily_tasks_student_date_idx on daily_tasks (student_id, task_date, step_no);

-- 검사 이력 (검사 요청/완료 로그 — 통계/이력용)
create table if not exists check_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references daily_tasks(id) on delete cascade,
  requested_at timestamptz not null default now(),
  checked_at timestamptz,
  result text check (result in ('pass', 'redo')),
  comment text,
  result_value text
);

-- 교사가 자주 쓰는 진도 템플릿 (즐겨찾기)
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  title text not null,          -- 예: "리딩앤라이팅 3권 진도"
  template_data jsonb not null, -- [{ title, page_range, material_id }, ...]
  created_at timestamptz not null default now()
);

-- 이미 이전 버전 스키마를 실행해서 테이블이 있던 경우를 위한 안전한 보정 (신규 설치라면 없어도 무방)
alter table daily_tasks add column if not exists description text;
alter table daily_tasks add column if not exists result_value text;
alter table daily_tasks drop constraint if exists daily_tasks_status_check;
alter table daily_tasks add constraint daily_tasks_status_check
  check (status in ('todo', 'in_progress', 'waiting_check', 'done', 'redo', 'help_needed'));
alter table check_logs add column if not exists result_value text;
drop index if exists students_pin_idx;
create unique index if not exists students_pin_unique_idx on students (pin_code);

-- Realtime 구독을 위해 daily_tasks 테이블을 publication에 추가 (이미 추가되어 있으면 건너뜀)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'daily_tasks'
  ) then
    alter publication supabase_realtime add table daily_tasks;
  end if;
end $$;

-- 개발/교실 내부용 MVP이므로 RLS는 비활성화 상태로 시작합니다.
-- 운영 단계에서는 반드시 RLS를 켜고 정책을 추가하세요.
alter table students disable row level security;
alter table materials disable row level security;
alter table daily_tasks disable row level security;
alter table check_logs disable row level security;
alter table favorites disable row level security;
alter table classes disable row level security;
