"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DailyTask, Student } from "@/lib/types";
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

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel("teacher-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_tasks" }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  const rows = useMemo(() => {
    return students
      .map((s) => {
        const tasks = tasksByStudent[s.id] ?? [];
        // 여러 단계 중 선생님이 가장 먼저 봐야 하는 상태(도와주세요 > 검사대기 > ...)를 우선 표시합니다.
        const current =
          [...tasks].sort(
            (a, b) => (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4)
          )[0] ?? null;
        const doneCount = tasks.filter((t) => t.status === "done").length;
        return {
          student: s,
          current,
          progressText: tasks.length ? `${doneCount}/${tasks.length} 완료` : "오늘 배정된 과제 없음",
          sortKey: STATUS_ORDER[current?.status ?? "todo"] ?? 5,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [students, tasksByStudent]);

  async function handleResolve(
    taskId: string,
    result: "pass" | "redo",
    comment: string,
    resultValue: string
  ) {
    const now = new Date().toISOString();
    await supabase
      .from("daily_tasks")
      .update({
        status: result === "pass" ? "done" : "redo",
        checked_at: now,
        teacher_comment: comment || null,
        result_value: resultValue || null,
      })
      .eq("id", taskId);

    await supabase.from("check_logs").insert({
      task_id: taskId,
      checked_at: now,
      result,
      comment: comment || null,
      result_value: resultValue || null,
    });
  }

  async function handleResolveHelp(taskId: string) {
    await supabase
      .from("daily_tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId);
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-gray-400">불러오는 중...</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">오늘의 수업 현황</h1>
        <div className="flex gap-2">
          <Link
            href="/teacher/students"
            className="rounded-xl border border-navy px-4 py-2 text-sm font-semibold text-navy"
          >
            학생 관리
          </Link>
          <Link
            href="/teacher/assign"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            + 오늘 과제 출제하기
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">등록된 학생이 없어요. Supabase의 students 테이블에 학생을 추가해주세요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ student, current, progressText }) => (
            <StudentStatusCard
              key={student.id}
              studentId={student.id}
              studentName={student.name}
              currentTask={current}
              progressText={progressText}
              onResolve={handleResolve}
              onResolveHelp={handleResolveHelp}
            />
          ))}
        </div>
      )}
    </main>
  );
}
