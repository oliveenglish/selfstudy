"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Student } from "@/lib/types";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadStudents() {
    const { data } = await supabase.from("students").select("*").order("name");
    setStudents((data as Student[]) ?? []);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function isDuplicatePin(candidatePin: string, excludeId?: string) {
    return students.some((s) => s.pin_code === candidatePin && s.id !== excludeId);
  }

  function startEdit(student: Student) {
    setEditingId(student.id);
    setName(student.name);
    setPin(student.pin_code);
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPin("");
  }

  async function handleSave() {
    setMessage(null);
    if (!name.trim() || !pin.trim()) {
      setMessage("이름과 PIN을 모두 입력해주세요.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin.trim())) {
      setMessage("PIN은 4~6자리 숫자로 입력해주세요.");
      return;
    }
    // 먼저 화면에서 바로 중복 여부를 확인해서 안내합니다.
    if (isDuplicatePin(pin.trim(), editingId ?? undefined)) {
      setMessage(`이미 사용 중인 PIN이에요. 다른 번호를 입력해주세요. (PIN ${pin.trim()})`);
      return;
    }

    setSaving(true);
    if (editingId) {
      const { error } = await supabase
        .from("students")
        .update({ name: name.trim(), pin_code: pin.trim() })
        .eq("id", editingId);
      setSaving(false);
      if (error) {
        // DB의 unique 제약이 마지막 방어선입니다 (동시에 같은 PIN을 저장하는 경우 등).
        setMessage(
          error.message.includes("duplicate") || error.message.includes("unique")
            ? "이미 사용 중인 PIN이에요. 다른 번호를 입력해주세요."
            : "저장 중 오류가 발생했어요: " + error.message
        );
        return;
      }
      setMessage(`${name.trim()} 학생 정보가 수정되었어요.`);
    } else {
      const { error } = await supabase.from("students").insert({ name: name.trim(), pin_code: pin.trim() });
      setSaving(false);
      if (error) {
        setMessage(
          error.message.includes("duplicate") || error.message.includes("unique")
            ? "이미 사용 중인 PIN이에요. 다른 번호를 입력해주세요."
            : "저장 중 오류가 발생했어요: " + error.message
        );
        return;
      }
      setMessage(`${name.trim()} 학생이 추가되었어요.`);
    }

    resetForm();
    loadStudents();
  }

  async function handleDelete(id: string) {
    await supabase.from("students").delete().eq("id", id);
    if (editingId === id) resetForm();
    loadStudents();
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">학생 관리</h1>
        <Link href="/teacher" className="text-sm text-gray-400 underline">
          대시보드로
        </Link>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-600">
          {editingId ? "학생 정보 수정" : "새 학생 추가"}
        </h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="학생 이름"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="PIN (4자리 숫자)"
            maxLength={6}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          {pin && isDuplicatePin(pin, editingId ?? undefined) && (
            <p className="text-xs font-medium text-help">
              이미 사용 중인 PIN이에요. 다른 번호를 입력해주세요.
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-accent py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : editingId ? "수정 완료" : "학생 추가"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-500"
              >
                취소
              </button>
            )}
          </div>
        </div>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {students.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="font-semibold text-navy">{s.name}</p>
              <p className="text-xs text-gray-400">PIN {s.pin_code}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(s)} className="text-xs font-medium text-accent">
                수정
              </button>
              <button onClick={() => handleDelete(s.id)} className="text-xs font-medium text-help">
                삭제
              </button>
            </div>
          </div>
        ))}
        {students.length === 0 && (
          <p className="text-sm text-gray-400">아직 등록된 학생이 없어요.</p>
        )}
      </div>
    </main>
  );
}
