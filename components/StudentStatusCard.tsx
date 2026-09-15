"use client";

import { useState } from "react";
import Link from "next/link";
import { DailyTask, STATUS_LABEL } from "@/lib/types";

const BORDER: Record<string, string> = {
  todo: "border-gray-200",
  in_progress: "border-study",
  waiting_check: "border-waiting",
  done: "border-done",
  redo: "border-redo",
  help_needed: "border-help",
};

const BADGE: Record<string, string> = {
  todo: "bg-gray-100 text-gray-500",
  in_progress: "bg-study text-white",
  waiting_check: "bg-waiting text-navy",
  done: "bg-done text-white",
  redo: "bg-redo text-white",
  help_needed: "bg-help text-white",
};

export default function StudentStatusCard({
  studentId,
  studentName,
  currentTask,
  progressText,
  onResolve,
  onResolveHelp,
}: {
  studentId: string;
  studentName: string;
  currentTask: DailyTask | null;
  progressText: string;
  onResolve: (taskId: string, result: "pass" | "redo", comment: string, resultValue: string) => void;
  onResolveHelp: (taskId: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [resultValue, setResultValue] = useState("");
  const status = currentTask?.status ?? "todo";
  const isWaiting = status === "waiting_check";
  const isHelp = status === "help_needed";

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border-2 bg-white p-4 shadow-sm ${
        isHelp ? "bg-red-50" : ""
      } ${BORDER[status]}`}
    >
      <div className="flex items-center justify-between">
        <Link href={`/teacher/history/${studentId}`} className="font-bold text-navy underline-offset-2 hover:underline">
          {studentName}
        </Link>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[status]}`}>
          {isHelp ? "🆘 " + STATUS_LABEL[status] : STATUS_LABEL[status]}
        </span>
      </div>

      <p className="text-sm text-gray-500">{progressText}</p>

      {currentTask && (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Step {currentTask.step_no} · {currentTask.title}
        </p>
      )}

      {isHelp && currentTask && (
        <button
          onClick={() => onResolveHelp(currentTask.id)}
          className="w-full rounded-xl bg-help py-2 text-sm font-semibold text-white"
        >
          도와줬어요 → 학습 계속하기
        </button>
      )}

      {isWaiting && currentTask && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={resultValue}
            onChange={(e) => setResultValue(e.target.value)}
            placeholder="결과값 입력 (예: 단어시험 8/10)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="코멘트 (선택, 보완 필요 시)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onResolve(currentTask.id, "pass", comment, resultValue)}
              className="flex-1 rounded-xl bg-done py-2 text-sm font-semibold text-white"
            >
              통과 ✅
            </button>
            <button
              onClick={() => onResolve(currentTask.id, "redo", comment, resultValue)}
              className="flex-1 rounded-xl bg-redo py-2 text-sm font-semibold text-white"
            >
              보완 필요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
