import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold text-navy">개별 진도 관리 앱</h1>
      <p className="max-w-sm text-sm text-gray-500">
        오늘의 미션을 확인하려면 PIN으로 로그인해주세요.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm"
        >
          학생으로 시작하기
        </Link>
      </div>
    </main>
  );
}
