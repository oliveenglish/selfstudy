"use client";

const TEACHER_KEY = "progress_app_teacher_authed";

export function getTeacherPin(): string {
  return process.env.NEXT_PUBLIC_TEACHER_PIN ?? "000000";
}

export function isTeacherAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TEACHER_KEY) === "yes";
}

export function saveTeacherAuthed() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TEACHER_KEY, "yes");
}

export function clearTeacherAuthed() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TEACHER_KEY);
}
