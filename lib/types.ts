export type TaskStatus = "todo" | "in_progress" | "waiting_check" | "done" | "redo" | "help_needed";

export interface Student {
  id: string;
  name: string;
  pin_code: string;
  class_id: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  type: "text" | "image" | "video" | "pdf";
  content: string | null;
  created_at: string;
}

export interface DailyTask {
  id: string;
  student_id: string;
  material_id: string | null;
  step_no: number;
  title: string;
  page_range: string | null;
  description: string | null;
  task_date: string;
  status: TaskStatus;
  teacher_comment: string | null;
  result_value: string | null;
  requested_at: string | null;
  checked_at: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  title: string;
  template_data: { title: string; page_range?: string; description?: string; material_id?: string }[];
  created_at: string;
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "대기",
  in_progress: "학습 중",
  waiting_check: "완료 과제 있음 · 검사 예정",
  done: "검사 완료",
  redo: "보완 필요",
  help_needed: "도와주세요",
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "bg-gray-200 text-gray-600",
  in_progress: "bg-study text-white",
  waiting_check: "bg-waiting text-navy",
  done: "bg-done text-white",
  redo: "bg-redo text-white",
  help_needed: "bg-help text-white",
};
