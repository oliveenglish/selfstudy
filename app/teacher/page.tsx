"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DailyTask, Notice, Student } from "@/lib/types";
import StudentStatusCard from "@/components/StudentStatusCard";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_ORDER: Record<string, number> = {
  help_needed: 0,
  waiting_check: 1,
  redo: 2,
  in_progress: 3,
  todo: 4,
  done: 5,
};

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [tasksByStudent, setTasksByStudent] = useState<Record<string, DailyTask[]>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [noticeDraft, setNoticeDraft] = useState("");
  const [savingNotice, setSavingNotice] = useState(false);

  const loadAll = useCallback(async () => {
    const [{ data: studentRows }, { data: taskRows }] = await Promise.all([
      supabase.from("students").select("*").order("name"),
      supabase.from("daily_tasks").select("*").eq("task_date", todayStr()).order("step_no"),
    ]);

    setStudents((studentRows as Student[]) ?? []);

    const grouped: Record<string, DailyTask[]> = {};
    ((taskRows as DailyTask[]) ?? []).forEach((t) => {
      grouped[t.student_id] = grouped[t.student_id] ?? [];
      grouped[t.student_id].push(t);
    });
    setTasksByStudent(grouped);
    setLoading(false);
  }, []);

  const loadNotice = useCallback(async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .eq("notice_date", todayStr())
      .maybeSingle();
    setNotice((data as Notice) ?? null);
    setNoticeDraft((data as Notice)?.message ?? "");
  }, []);

  useEffect(() => {
    loadAll();
    loadNotice();
    const channel = supabase
      .channel("teacher-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_tasks" }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll, loadNotice]);

  const rows = useMemo(() => {
    return students
      .map((s) => {
        const tasks = tasksByStudent[s.id] ?? [];
        const bestStatus = tasks.reduce<number>(
          (best, t) => Math.min(best, STATUS_ORDER[t.status] ?? 4),
          5
        );
        return { student: s, tasks, sortKey: tasks.length ? bestStatus : 6 };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [students, tasksByStudent]);

  async function handleResolve(taskId: string, result: "pass" | "redo", comment: string) {
    const now = new Date().toISOString();
    await supabase
      .from("daily_tasks")
      .update({
        status: result === "pass" ? "done" : "redo",
        checked_at: now,
        teacher_comment: comment || null,
      })
      .eq("id", taskId);

    await supabase.from("check_logs").insert({
      task_id: taskId,
      checked_at: now,
      result,
      comment: comment || null,
    });
  }

  async function handleResolveHelp(taskId: string) {
    await supabase.from("daily_tasks").update({ status: "in_progress" }).eq("id", taskId);
  }

  async function handleEditTask(
    taskId: string,
    fields: { title: string; page_range: string; description: string; teacher_comment: string }
  ) {
    await supabase
      .from("daily_tasks")
      .update({
        title: fields.title.trim(),
        page_range: fields.page_range.trim() || null,
        description: fields.description.trim() || null,
        teacher_comment: fields.teacher_comment.trim() || null,
      })
      .eq("id", taskId);
  }

  async function handleSaveNotice() {
    setSavingNotice(true);
    if (notice) {
      await supabase.from("notices").update({ message: noticeDraft }).eq("id", notice.id);
    } else if (noticeDraft.trim()) {
      await supabase.from("notices").insert({ message: noticeDraft.trim(), notice_date: todayStr() });
    }
    await loadNotice();
    setSavingNotice(false);
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-gray-400">불러오는 중...</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">오늘의 수업 현황</h1>
        <div className="flex gap-2">
          <Link href="/teacher/students" className="rounded-xl border border-navy px-4 py-2 text-sm font-semibold text-navy">
            학생 관리
          </Link>
          <Link href="/teacher/assign" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm">
            + 오늘 과제 출제하기
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-yellow-50 p-4 shadow-sm">
        <p className="mb-2 text-xs font-bold text-yellow-700">📢 오늘의 학생 전달사항 (학생 화면에 표시돼요)</p>
        <textarea
          value={noticeDraft}
          onChange={(e) => setNoticeDraft(e.target.value)}
          rows={2}
          placeholder="예: 오늘은 단어 시험이 있어요! 쉬는 시간에 노트 챙겨오세요."
          className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={handleSaveNotice}
          disabled={savingNotice}
          className="rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {savingNotice ? "저장 중..." : "전달사항 저장"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">등록된 학생이 없어요. Supabase의 students 테이블에 학생을 추가해주세요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ student, tasks }) => (
            <StudentStatusCard
              key={student.id}
              studentId={student.id}
              studentName={student.name}
              tasks={tasks}
              onResolve={handleResolve}
              onResolveHelp={handleResolveHelp}
              onEditTask={handleEditTask}
            />
          ))}
        </div>
      )}
    </main>
  );
}
