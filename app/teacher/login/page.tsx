"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PinPad from "@/components/PinPad";
import { getTeacherPin, saveTeacherAuthed } from "@/lib/teacherAuth";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(pin: string) {
    if (pin === getTeacherPin()) {
      saveTeacherAuthed();
      router.replace("/teacher");
    } else {
      setError("PIN이 일치하지 않아요. 다시 입력해주세요.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-navy">선생님 대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">6자리 PIN을 입력하세요</p>
      </div>
      <PinPad length={6} onSubmit={handleSubmit} />
      {error && <p className="text-sm font-medium text-redo">{error}</p>}
    </main>
  );
}
