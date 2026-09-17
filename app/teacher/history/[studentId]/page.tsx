"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DailyTask, STATUS_LABEL, Student } from "@/lib/types";

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function StudentHistoryPage({ params }: { params: { studentId: string } }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", page_range: "", description: "", teacher_comment: "" });

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  async function load() {
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from("students").select("*").eq("id", params.studentId).maybeSingle(),
      supabase
        .from("daily_tasks")
        .select("*")
        .eq("student_id", params.studentId)
        .order("task_date", { ascending: false })
        .order("step_no", { ascending: true }),
    ]);
    setStudent((s as Student) ?? null);
    setTasks((t as DailyTask[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.studentId]);

  const groupedByDate = useMemo(() => {
    return tasks.reduce<Record<string, DailyTask[]>>((acc, t) => {
      acc[t.task_date] = acc[t.task_date] ?? [];
      acc[t.task_date].push(t);
      return acc;
    }, {});
  }, [tasks]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function startEdit(t: DailyTask) {
    setEditingId(t.id);
    setEditDraft({
      title: t.title,
      page_range: t.page_range ?? "",
      description: t.description ?? "",
      teacher_comment: t.teacher_comment ?? "",
    });
  }

  async function saveEdit(taskId: string) {
    await supabase
      .from("daily_tasks")
      .update({
        title: editDraft.title.trim(),
        page_range: editDraft.page_range.trim() || null,
        description: editDraft.description.trim() || null,
        teacher_comment: editDraft.teacher_comment.trim() || null,
      })
      .eq("id", taskId);
    setEditingId(null);
    await load();
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-gray-400">불러오는 중...</main>;
  }

  const selectedTasks = selectedDate ? groupedByDate[selectedDate] ?? [] : [];

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">{student?.name ?? "학생"}의 학습 이력</h1>
        <Link href="/teacher" className="text-sm text-gray-400 underline">
          대시보드로
        </Link>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={goPrevMonth} className="rounded-lg px-2 py-1 text-sm text-gray-500">
            ◀
          </button>
          <span className="text-sm font-semibold text-navy">
            {viewYear}년 {viewMonth + 1}월
          </span>
          <button onClick={goNextMonth} className="rounded-lg px-2 py-1 text-sm text-gray-500">
            ▶
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const dateStr = toDateStr(viewYear, viewMonth, day);
            const hasTasks = !!groupedByDate[dateStr]?.length;
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center rounded-lg py-1.5 text-xs ${
                  isSelected
                    ? "bg-accent text-white font-semibold"
                    : hasTasks
                    ? "bg-blue-50 text-navy font-semibold"
                    : "text-gray-400"
                }`}
              >
                <span>{day}</span>
                {hasTasks && !isSelected && <span className="mt-0.5 h-1 w-1 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-navy">{selectedDate}</span>
            <span className="text-xs text-gray-500">
              {selectedTasks.filter((t) => t.status === "done").length}/{selectedTasks.length} 완료
            </span>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-400">이 날짜에는 배정된 과제가 없어요.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedTasks.map((t) =>
                editingId === t.id ? (
                  <div key={t.id} className="rounded-xl bg-gray-50 p-3">
                    <input
                      type="text"
                      value={editDraft.title}
                      onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="과제 제목"
                      className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={editDraft.page_range}
                      onChange={(e) => setEditDraft((d) => ({ ...d, page_range: e.target.value }))}
                      placeholder="페이지 범위"
                      className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={editDraft.description}
                      onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="설명"
                      rows={2}
                      className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={editDraft.teacher_comment}
                      onChange={(e) => setEditDraft((d) => ({ ...d, teacher_comment: e.target.value }))}
                      placeholder="코멘트"
                      rows={2}
                      className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(t.id)}
                        className="flex-1 rounded-xl bg-accent py-2 text-sm font-semibold text-white"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 rounded-xl border border-gray-300 py-2 text-sm font-semibold text-gray-500"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={t.id} className="rounded-xl bg-gray-50 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold text-navy">
                        과제 {t.step_no} · {t.title} {t.page_range ? `(${t.page_range})` : ""}
                      </span>
                      <span className="text-xs font-medium text-gray-400">{STATUS_LABEL[t.status]}</span>
                    </div>
                    {t.description && <p className="mb-1 text-xs text-gray-500">📝 {t.description}</p>}
                    {t.teacher_comment && (
                      <p className="mb-1 rounded-lg bg-orange-50 px-2 py-1 text-xs text-redo">
                        코멘트: {t.teacher_comment}
                      </p>
                    )}
                    {(t.started_at || t.checked_at) && (
                      <p className="mb-1 text-xs text-gray-400">
                        {t.started_at && `⏱ 시작 ${formatTime(t.started_at)}`}
                        {t.started_at && t.checked_at && " · "}
                        {t.checked_at && `완료 ${formatTime(t.checked_at)}`}
                      </p>
                    )}
                    <button onClick={() => startEdit(t)} className="text-xs font-semibold text-accent underline">
                      ✏️ 수정하기
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">달력에서 날짜를 선택하면 그날 배정된 과제를 볼 수 있어요.</p>
      )}
    </main>
  );
}
