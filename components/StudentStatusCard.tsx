"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DailyTask, STATUS_COLOR, STATUS_LABEL } from "@/lib/types";

export default function StudentStatusCard({
  studentId,
  studentName,
  tasks,
  onResolve,
  onResolveHelp,
}: {
  studentId: string;
  studentName: string;
  tasks: DailyTask[];
  onResolve: (taskId: string, result: "pass" | "redo", comment: string) => void;
  onResolveHelp: (taskId: string) => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const sortedTasks = [...tasks].sort((a, b) => a.step_no - b.step_no);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  useEffect(() => {
    if (selectedTaskId && tasks.some((t) => t.id === selectedTaskId)) return;
    const priority =
      tasks.find((t) => t.status === "help_needed") ??
      tasks.find((t) => t.status === "waiting_check") ??
      null;
    setSelectedTaskId(priority?.id ?? null);
    setComment("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const selectedTask = sortedTasks.find((t) => t.id === selectedTaskId) ?? null;
  const isWaiting = selectedTask?.status === "waiting_check";
  const isHelp = selectedTask?.status === "help_needed";

  function selectTask(taskId: string) {
    setSelectedTaskId(taskId);
    setComment("");
  }

  function handleResolveClick(result: "pass" | "redo") {
    if (!selectedTask) return;
    onResolve(selectedTask.id, result, comment);
    setComment("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Link
          href={`/teacher/history/${studentId}`}
          className="font-bold text-navy underline-offset-2 hover:underline"
        >
          {studentName}
        </Link>
        <span className="text-xs font-semibold text-gray-500">
          {tasks.length ? `${doneCount}/${tasks.length} 완료 (${percent}%)` : "오늘 배정된 과제 없음"}
        </span>
      </div>

      {sortedTasks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedTasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTask(t.id)}
              title={t.title}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${STATUS_COLOR[t.status]} ${
                selectedTaskId === t.id ? "ring-2 ring-navy ring-offset-1" : "opacity-80"
              }`}
            >
              과제 {t.step_no}
            </button>
          ))}
        </div>
      )}

      {selectedTask && (
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">
              과제 {selectedTask.step_no} · {selectedTask.title}
            </p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[selectedTask.status]}`}>
              {STATUS_LABEL[selectedTask.status]}
            </span>
          </div>

          {isHelp && (
            <button
              onClick={() => onResolveHelp(selectedTask.id)}
              className="w-full rounded-xl bg-help py-2 text-sm font-semibold text-white"
            >
              도와줬어요 → 학습 계속하기
            </button>
          )}

          {isWaiting && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="코멘트 (선택, 보완 필요 시)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolveClick("pass")}
                  className="flex-1 rounded-xl bg-done py-2 text-sm font-semibold text-white"
                >
                  통과 ✅
                </button>
                <button
                  onClick={() => handleResolveClick("redo")}
                  className="flex-1 rounded-xl bg-redo py-2 text-sm font-semibold text-white"
                >
                  보완 필요
                </button>
              </div>
            </div>
          )}

          {!isWaiting && !isHelp && (
            <p className="text-xs text-gray-400">
              지금은 검토할 내용이 없는 과제예요. 다른 과제를 선택해보세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
