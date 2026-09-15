import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  // 개발 중에는 콘솔에서 바로 원인을 알 수 있도록 경고만 남기고 계속 진행합니다.
  // .env.local 에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요.
  // (supabase/schema.sql 을 먼저 프로젝트에 적용해야 합니다.)
  // eslint-disable-next-line no-console
  console.warn("Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
