"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DailyTask, STATUS_COLOR, STATUS_LABEL } from "@/lib/types";

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function StudentStatusCard({
  studentId,
  studentName,
  tasks,
  onResolve,
  onResolveHelp,
  onEditTask,
}: {
  studentId: string;
  studentName: string;
  tasks: DailyTask[];
  onResolve: (taskId: string, result: "pass" | "redo", comment: string) => void;
  onResolveHelp: (taskId: string) => void;
  onEditTask: (
    taskId: string,
    fields: { title: string; page_range: string; description: string; teacher_comment: string }
  ) => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({ title: "", page_range: "", description: "", teacher_comment: "" });

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
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const selectedTask = sortedTasks.find((t) => t.id === selectedTaskId) ?? null;
  const isWaiting = selectedTask?.status === "waiting_check";
  const isHelp = selectedTask?.status === "help_needed";
  const startedLabel = formatTime(selectedTask?.started_at ?? null);
  const finishedLabel = formatTime(selectedTask?.checked_at ?? null);

  function selectTask(taskId: string) {
    setSelectedTaskId(taskId);
    setComment("");
    setEditing(false);
  }

  function handleResolveClick(result: "pass" | "redo") {
    if (!selectedTask) return;
    onResolve(selectedTask.id, result, comment);
    setComment("");
  }

  function startEdit() {
    if (!selectedTask) return;
    setEditDraft({
      title: selectedTask.title,
      page_range: selectedTask.page_range ?? "",
      description: selectedTask.description ?? "",
      teacher_comment: selectedTask.teacher_comment ?? "",
    });
    setEditing(true);
  }

  function saveEdit() {
    if (!selectedTask) return;
    onEditTask(selectedTask.id, editDraft);
    setEditing(false);
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

      {selectedTask && !editing && (
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">
              과제 {selectedTask.step_no} · {selectedTask.title}
            </p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[selectedTask.status]}`}>
              {STATUS_LABEL[selectedTask.status]}
            </span>
          </div>
          {selectedTask.page_range && <p className="mb-1 text-xs text-gray-500">{selectedTask.page_range}</p>}
          {selectedTask.description && <p className="mb-1 text-xs text-gray-400">📝 {selectedTask.description}</p>}
          {selectedTask.teacher_comment && (
            <p className="mb-2 rounded-lg bg-orange-50 px-2 py-1 text-xs text-redo">
              코멘트: {selectedTask.teacher_comment}
            </p>
          )}
          {(startedLabel || finishedLabel) && (
            <p className="mb-2 text-xs text-gray-400">
              {startedLabel && `⏱ 시작 ${startedLabel}`}
              {startedLabel && finishedLabel && " · "}
              {finishedLabel && `완료 ${finishedLabel}`}
            </p>
          )}

          <button onClick={startEdit} className="mb-2 text-xs font-semibold text-accent underline">
            ✏️ 과제 내용 수정하기
          </button>

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

      {selectedTask && editing && (
        <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3">
          <input
            type="text"
            value={editDraft.title}
            onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="과제 제목"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={editDraft.page_range}
            onChange={(e) => setEditDraft((d) => ({ ...d, page_range: e.target.value }))}
            placeholder="페이지 범위"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <textarea
            value={editDraft.description}
            onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="설명"
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <textarea
            value={editDraft.teacher_comment}
            onChange={(e) => setEditDraft((d) => ({ ...d, teacher_comment: e.target.value }))}
            placeholder="코멘트"
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex-1 rounded-xl bg-accent py-2 text-sm font-semibold text-white">
              저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-xl border border-gray-300 py-2 text-sm font-semibold text-gray-500"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
