"use client";

const STUDENT_KEY = "progress_app_student_id";

export function saveStudentSession(studentId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STUDENT_KEY, studentId);
}

export function getStudentSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STUDENT_KEY);
}

export function clearStudentSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STUDENT_KEY);
}
