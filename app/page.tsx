import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold text-navy">개별 진도 관리 앱</h1>
      <p className="max-w-sm text-sm text-gray-500">
        학생은 PIN으로 로그인해서 오늘의 미션을 확인하고, 선생님은 대시보드에서
        모든 학생의 진행 상황을 한눈에 확인합니다.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm"
        >
          학생으로 시작하기
        </Link>
        <Link
          href="/teacher"
          className="rounded-xl border border-navy px-6 py-3 font-semibold text-navy"
        >
          선생님 대시보드
        </Link>
      </div>
    </main>
  );
}
