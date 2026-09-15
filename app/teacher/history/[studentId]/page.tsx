"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DailyTask, STATUS_LABEL, Student } from "@/lib/types";

export default function StudentHistoryPage({ params }: { params: { studentId: string } }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    load();
  }, [params.studentId]);

  const groupedByDate = tasks.reduce<Record<string, DailyTask[]>>((acc, t) => {
    acc[t.task_date] = acc[t.task_date] ?? [];
    acc[t.task_date].push(t);
    return acc;
  }, {});

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-gray-400">불러오는 중...</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">{student?.name ?? "학생"}의 학습 이력</h1>
        <Link href="/teacher" className="text-sm text-gray-400 underline">
          대시보드로
        </Link>
      </div>

      {Object.keys(groupedByDate).length === 0 && (
        <p className="text-sm text-gray-400">아직 기록된 학습 이력이 없어요.</p>
      )}

      <div className="flex flex-col gap-5">
        {Object.entries(groupedByDate).map(([date, dayTasks]) => {
          const doneCount = dayTasks.filter((t) => t.status === "done").length;
          return (
            <div key={date} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-navy">{date}</span>
                <span className="text-xs text-gray-500">
                  {doneCount}/{dayTasks.length} 완료
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {dayTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Step {t.step_no} · {t.title} {t.page_range ? `(${t.page_range})` : ""}
                    </span>
                    <span className="text-xs font-medium text-gray-400">{STATUS_LABEL[t.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}
