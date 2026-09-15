"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PinPad from "@/components/PinPad";
import { supabase } from "@/lib/supabaseClient";
import { saveStudentSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(pin: string) {
    setChecking(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from("students")
      .select("id, name")
      .eq("pin_code", pin)
      .maybeSingle();

    if (dbError || !data) {
      setError("PIN이 일치하지 않아요. 다시 입력해주세요.");
      setChecking(false);
      return;
    }

    saveStudentSession(data.id);
    router.push("/student");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-navy">내 PIN을 입력하세요</h1>
        <p className="mt-1 text-sm text-gray-500">4자리 숫자를 누르면 자동으로 확인돼요</p>
      </div>
      <PinPad onSubmit={handleSubmit} disabled={checking} />
      {error && <p className="text-sm font-medium text-redo">{error}</p>}
    </main>
  );
}
