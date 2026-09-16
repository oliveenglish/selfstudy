"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Favorite, Student } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface StepDraft {
  title: string;
  page_range: string;
  description: string;
  materialUrl: string;
}

function isYouTubeUrl(url: string) {
  return /youtu\.be|youtube\.com/.test(url);
}

export default function AssignPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([
    { title: "", page_range: "", description: "", materialUrl: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    supabase
      .from("students")
      .select("*")
      .order("name")
      .then(({ data }) => setStudents((data as Student[]) ?? []));
    supabase
      .from("favorites")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setFavorites((data as Favorite[]) ?? []));
  }, []);

  function updateStep(index: number, field: keyof StepDraft, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, { title: "", page_range: "", description: "", materialUrl: "" }]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function applyTemplate(favId: string) {
    const fav = favorites.find((f) => f.id === favId);
    if (!fav) return;
    setSteps(
      fav.template_data.map((t) => ({
        title: t.title,
        page_range: t.page_range ?? "",
        description: t.description ?? "",
        materialUrl: "",
      }))
    );
  }

  async function handleSave() {
    if (!selectedStudentId || steps.every((s) => !s.title.trim())) {
      setMessage("학생과 최소 1개의 미션 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    setMessage(null);

    // 이미 오늘 배정된 과제가 있으면 처음(과제 1)으로 되돌리지 않고, 마지막 번호 다음부터 이어서 배정합니다.
    const { data: existingTasks } = await supabase
      .from("daily_tasks")
      .select("step_no")
      .eq("student_id", selectedStudentId)
      .eq("task_date", todayStr())
      .order("step_no", { ascending: false })
      .limit(1);
    const startStepNo = ((existingTasks?.[0] as { step_no: number } | undefined)?.step_no ?? 0) + 1;
    const hasExistingTasks = startStepNo > 1;

    const filledSteps = steps.filter((s) => s.title.trim());

    // 유튜브/구글 드라이브 등 링크가 있으면 자료(materials)로 먼저 등록하고, 그 자료를 과제에 연결합니다.
    const materialIds: (string | null)[] = [];
    for (const s of filledSteps) {
      const url = s.materialUrl.trim();
      if (!url) {
        materialIds.push(null);
        continue;
      }
      const { data: material, error: materialError } = await supabase
        .from("materials")
        .insert({
          title: s.title.trim(),
          type: isYouTubeUrl(url) ? "video" : "pdf",
          content: url,
        })
        .select()
        .single();
      if (materialError) {
        setSaving(false);
        setMessage("자료 저장 중 오류가 발생했어요: " + materialError.message);
        return;
      }
      materialIds.push((material as { id: string }).id);
    }

    const rows = filledSteps.map((s, idx) => ({
      student_id: selectedStudentId,
      step_no: startStepNo + idx,
      title: s.title.trim(),
      page_range: s.page_range.trim() || null,
      description: s.description.trim() || null,
      material_id: materialIds[idx],
      task_date: todayStr(),
      status: !hasExistingTasks && idx === 0 ? "in_progress" : "todo",
    }));

    const { error } = await supabase.from("daily_tasks").insert(rows);
    setSaving(false);

    if (error) {
      setMessage("저장 중 오류가 발생했어요: " + error.message);
      return;
    }
    setMessage(
      hasExistingTasks ? `과제 ${startStepNo}번부터 이어서 저장되었어요!` : "오늘의 미션이 저장되었어요!"
    );
    setSteps([{ title: "", page_range: "", description: "", materialUrl: "" }]);
  }

  async function handleSaveAsFavorite() {
    if (!templateName.trim() || steps.every((s) => !s.title.trim())) return;
    const template_data = steps
      .filter((s) => s.title.trim())
      .map((s) => ({ title: s.title, page_range: s.page_range, description: s.description }));
    const { data, error } = await supabase
      .from("favorites")
      .insert({ title: templateName.trim(), template_data })
      .select()
      .single();
    if (!error && data) {
      setFavorites((prev) => [data as Favorite, ...prev]);
      setTemplateName("");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">오늘 과제 출제하기</h1>
        <Link href="/teacher" className="text-sm text-gray-400 underline">
          대시보드로
        </Link>
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-semibold text-gray-600">학생 선택</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">학생을 선택하세요</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {favorites.length > 0 && (
          <div className="mt-3">
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              즐겨찾는 진도 불러오기
            </label>
            <select
              defaultValue=""
              onChange={(e) => e.target.value && applyTemplate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">템플릿 선택...</option>
              {favorites.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3">
        {steps.map((step, idx) => (
          <div key={idx} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-accent">과제 {idx + 1}</span>
              {steps.length > 1 && (
                <button onClick={() => removeStep(idx)} className="text-xs text-gray-400">
                  삭제
                </button>
              )}
            </div>
            <input
              type="text"
              value={step.title}
              onChange={(e) => updateStep(idx, "title", e.target.value)}
              placeholder="예: 개념 교재 p.24~25 설명 영상 시청"
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={step.page_range}
              onChange={(e) => updateStep(idx, "page_range", e.target.value)}
              placeholder="페이지 범위 (예: p.24~25)"
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <textarea
              value={step.description}
              onChange={(e) => updateStep(idx, "description", e.target.value)}
              placeholder="이 과제를 어떻게 수행해야 하는지 설명 (예: 영상을 먼저 보고, 노트에 핵심 문장 3개를 따라 써보세요)"
              rows={2}
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={step.materialUrl}
              onChange={(e) => updateStep(idx, "materialUrl", e.target.value)}
              placeholder="자료 링크 (유튜브 영상 또는 구글 드라이브 파일 링크)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          onClick={addStep}
          className="rounded-xl border border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-500"
        >
          + 단계 추가
        </button>
      </div>

      <div className="mb-4 flex gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="이 진도를 템플릿으로 저장 (템플릿 이름)"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={handleSaveAsFavorite}
          className="rounded-xl border border-navy px-4 py-2 text-sm font-semibold text-navy"
        >
          저장
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white shadow-sm disabled:opacity-50"
      >
        {saving ? "저장 중..." : "오늘의 미션으로 배정하기"}
      </button>

      {message && <p className="mt-3 text-center text-sm text-gray-600">{message}</p>}
    </main>
  );
}
