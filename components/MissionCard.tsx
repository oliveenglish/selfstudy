"use client";

import { DailyTask, STATUS_LABEL } from "@/lib/types";

export interface CommentLogEntry {
  comment: string;
  checked_at: string | null;
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function MissionCard({
  task,
  isCurrent,
  comments,
  onRequestCheck,
  onRequestHelp,
  onOpenMaterial,
}: {
  task: DailyTask;
  isCurrent: boolean;
  comments?: CommentLogEntry[];
  onRequestCheck: (taskId: string) => void;
  onRequestHelp: (taskId: string) => void;
  onOpenMaterial: (task: DailyTask) => void;
}) {
  const isDone = task.status === "done";
  const isWaiting = task.status === "waiting_check";
  const isRedo = task.status === "redo";
  const isHelp = task.status === "help_needed";
  const showActionButtons = isCurrent && !isWaiting && !isDone && !isHelp;
  const startedLabel = formatTime(task.started_at);
  const finishedLabel = formatTime(task.checked_at);

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-opacity ${
        isHelp
          ? "border-help bg-red-50 opacity-100"
          : isCurrent || isWaiting || isRedo
          ? "border-accent bg-white opacity-100"
          : isDone
          ? "border-done/40 bg-done/5 opacity-100"
          : "border-gray-200 bg-white opacity-40"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-accent">과제 {task.step_no}</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isDone
              ? "bg-done text-white"
              : isWaiting
              ? "bg-waiting text-navy"
              : isRedo
              ? "bg-redo text-white"
              : isHelp
              ? "bg-help text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isDone ? "완료! 🎯" : STATUS_LABEL[task.status]}
        </span>
      </div>
      <button type="button" onClick={() => onOpenMaterial(task)} className="block w-full text-left">
        <p className="text-lg font-bold text-navy">{task.title}</p>
        {task.page_range && <p className="mt-1 text-sm text-gray-500">{task.page_range}</p>}
        {task.description && <p className="mt-1 text-sm text-gray-400">📝 {task.description}</p>}
        {task.material_id && (
          <p className="mt-1 text-sm font-semibold text-accent">🔗 눌러서 자료 보기 (클릭!)</p>
        )}
      </button>

      {(startedLabel || finishedLabel) && (
        <p className="mt-2 text-xs text-gray-400">
          {startedLabel && `⏱ 시작 ${startedLabel}`}
          {startedLabel && finishedLabel && " · "}
          {finishedLabel && `완료 ${finishedLabel}`}
        </p>
      )}

      {comments && comments.length > 0 ? (
        <div className="mt-3 flex flex-col gap-1.5">
          {comments.map((c, idx) => (
            <p key={idx} className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-redo">
              선생님 코멘트: {c.comment}
            </p>
          ))}
        </div>
      ) : (
        task.teacher_comment && (
          <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-sm text-redo">
            선생님 코멘트: {task.teacher_comment}
          </p>
        )
      )}

      {showActionButtons && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onRequestCheck(task.id)}
            className="flex-1 rounded-xl bg-accent py-3 font-semibold text-white shadow-sm active:scale-[0.98]"
          >
            🙋‍♂️ 검사해주세요!
          </button>
          <button
            type="button"
            onClick={() => onRequestHelp(task.id)}
            className="rounded-xl bg-help px-4 py-3 font-semibold text-white shadow-sm active:scale-[0.98]"
          >
            🆘 도와주세요
          </button>
        </div>
      )}
      {isWaiting && (
        <p className="mt-4 text-center text-sm font-semibold text-waiting">
          완료된 과제예요. 선생님이 곧 확인할 예정이에요 — 다음 단계를 진행해주세요!
        </p>
      )}
      {isHelp && (
        <p className="mt-4 text-center text-sm font-semibold text-help">
          선생님이 도와주러 갈게요. 잠시만 기다려주세요!
        </p>
      )}
    </div>
  );
}
