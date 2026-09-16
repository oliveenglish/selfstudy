"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getStudentSession, clearStudentSession } from "@/lib/auth";
import { DailyTask, Material } from "@/lib/types";
import MissionCard, { CommentLogEntry } from "@/components/MissionCard";
import ProgressBar from "@/components/ProgressBar";
import MaterialModal from "@/components/MaterialModal";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function StudentPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [commentsByTask, setCommentsByTask] = useState<Record<string, CommentLogEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState<{
    title: string;
    description: string | null;
    material: Material | null;
  } | null>(null);

  const loadTasks = useCallback(async (sid: string) => {
    const { data } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("student_id", sid)
      .eq("task_date", todayStr())
      .order("step_no", { ascending: true });
    const loadedTasks = (data as DailyTask[]) ?? [];
    setTasks(loadedTasks);
    setLoading(false);

    const taskIds = loadedTasks.map((t) => t.id);
    if (taskIds.length > 0) {
      const { data: logs } = await supabase
        .from("check_logs")
        .select("task_id, comment, checked_at")
        .in("task_id", taskIds)
        .not("comment", "is", null)
        .order("checked_at", { ascending: true });
      const grouped: Record<string, CommentLogEntry[]> = {};
      (logs ?? []).forEach((log: { task_id: string; comment: string; checked_at: string | null }) => {
        grouped[log.task_id] = grouped[log.task_id] ?? [];
        grouped[log.task_id].push({ comment: log.comment, checked_at: log.checked_at });
      });
      setCommentsByTask(grouped);
    } else {
      setCommentsByTask({});
    }
  }, []);

  useEffect(() => {
    const sid = getStudentSession();
    if (!sid) {
      router.replace("/login");
      return;
    }
    setStudentId(sid);

    supabase
      .from("students")
      .select("name")
      .eq("id", sid)
      .maybeSingle()
      .then(({ data }) => setStudentName(data?.name ?? ""));

    loadTasks(sid);

    const channel = supabase
      .channel(`student-tasks-${sid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_tasks", filter: `student_id=eq.${sid}` },
        () => loadTasks(sid)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, loadTasks]);

  const currentStepNo = useMemo(() => {
    const next = tasks.find((t) => t.status !== "done" && t.status !== "waiting_check");
    return next?.step_no ?? null;
  }, [tasks]);

  const percentDone = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === "done").length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  async function handleRequestCheck(taskId: string) {
    await supabase
      .from("daily_tasks")
      .update({ status: "waiting_check", requested_at: new Date().toISOString() })
      .eq("id", taskId);
  }

  async function handleRequestHelp(taskId: string) {
    await supabase
      .from("daily_tasks")
      .update({ status: "help_needed", requested_at: new Date().toISOString() })
      .eq("id", taskId);
  }

  async function handleOpenMaterial(task: DailyTask) {
    if (!task.material_id) {
      setActiveMaterial({ title: task.title, description: task.description, material: null });
      return;
    }
    const { data } = await supabase
      .from("materials")
      .select("*")
      .eq("id", task.material_id)
      .maybeSingle();
    setActiveMaterial({
      title: task.title,
      description: task.description,
      material: (data as Material) ?? null,
    });
  }

  function handleLogout() {
    clearStudentSession();
    router.replace("/login");
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-gray-400">불러오는 중...</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-16 pt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">안녕하세요,</p>
          <h1 className="text-xl font-bold text-navy">{studentName || "학생"}님</h1>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-400 underline">
          로그아웃
        </button>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <ProgressBar percent={percentDone} />
      </div>

      {tasks.length === 0 ? (
        <p className="mt-10 text-center text-sm text-gray-400">
          오늘 배정된 미션이 아직 없어요. 선생님께 확인해주세요.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task) => (
            <MissionCard
              key={task.id}
              task={task}
              isCurrent={task.step_no === currentStepNo}
              comments={commentsByTask[task.id]}
              onRequestCheck={handleRequestCheck}
              onRequestHelp={handleRequestHelp}
              onOpenMaterial={handleOpenMaterial}
            />
          ))}
        </div>
      )}

      {activeMaterial && (
        <MaterialModal
          title={activeMaterial.title}
          description={activeMaterial.description}
          material={activeMaterial.material}
          onClose={() => setActiveMaterial(null)}
        />
      )}
    </main>
  );
}
