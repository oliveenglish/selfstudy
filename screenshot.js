const { chromium } = require("playwright");

const STUDENT_ID = "11111111-1111-1111-1111-111111111111";
const STUDENT2_ID = "22222222-2222-2222-2222-222222222222";
const STUDENT3_ID = "33333333-3333-3333-3333-333333333333";

const students = [
  { id: STUDENT_ID, name: "박서연", pin_code: "1234", class_id: null, created_at: "2026-09-01" },
  { id: STUDENT2_ID, name: "김도윤", pin_code: "2222", class_id: null, created_at: "2026-09-01" },
  { id: STUDENT3_ID, name: "이하은", pin_code: "3333", class_id: null, created_at: "2026-09-01" },
];

const today = new Date().toISOString().slice(0, 10);

const tasksByStudent = {
  [STUDENT_ID]: [
    { id: "t1", student_id: STUDENT_ID, material_id: null, step_no: 1, title: "개념 교재 p.24~25 설명 영상 시청", page_range: "p.24~25", description: "영상을 먼저 보고, 노트에 핵심 문장 3개를 따라 써보세요.", task_date: today, status: "done", teacher_comment: null, result_value: null, requested_at: null, checked_at: today, created_at: today },
    { id: "t2", student_id: STUDENT_ID, material_id: null, step_no: 2, title: "유형 문제집 p.30 풀어보기", page_range: "p.30", description: null, task_date: today, status: "waiting_check", teacher_comment: null, result_value: null, requested_at: today, checked_at: null, created_at: today },
    { id: "t3", student_id: STUDENT_ID, material_id: null, step_no: 3, title: "단어 테스트 10문항", page_range: null, description: "선생님이 불러주는 단어를 받아쓰세요.", task_date: today, status: "todo", teacher_comment: null, result_value: null, requested_at: null, checked_at: null, created_at: today },
  ],
  [STUDENT2_ID]: [
    { id: "t4", student_id: STUDENT2_ID, material_id: null, step_no: 1, title: "리딩 교재 3과 지문 읽기", page_range: "p.10~12", description: null, task_date: today, status: "help_needed", teacher_comment: null, result_value: null, requested_at: today, checked_at: null, created_at: today },
    { id: "t5", student_id: STUDENT2_ID, material_id: null, step_no: 2, title: "독해 문제 풀기", page_range: "p.13", description: null, task_date: today, status: "todo", teacher_comment: null, result_value: null, requested_at: null, checked_at: null, created_at: today },
  ],
  [STUDENT3_ID]: [
    { id: "t6", student_id: STUDENT3_ID, material_id: null, step_no: 1, title: "라이팅 워크시트 문장 완성", page_range: "p.5", description: null, task_date: today, status: "redo", teacher_comment: "3번 문장 시제를 다시 확인해볼까요?", result_value: null, requested_at: today, checked_at: today, created_at: today },
    { id: "t7", student_id: STUDENT3_ID, material_id: null, step_no: 2, title: "단어 시험 10문항", page_range: null, description: null, task_date: today, status: "done", teacher_comment: null, result_value: "8/10", requested_at: today, checked_at: today, created_at: today },
  ],
};

const allTasks = Object.values(tasksByStudent).flat();

function matchTable(url) {
  const m = url.match(/\/rest\/v1\/([a-z_]+)/);
  return m ? m[1] : null;
}

async function mockRest(route) {
  const url = route.request().url();
  const table = matchTable(url);

  if (table === "students") {
    const pinMatch = url.match(/pin_code=eq\.(\d+)/);
    if (pinMatch) {
      const found = students.find((s) => s.pin_code === pinMatch[1]);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(found ?? null) });
    }
    const idMatch = url.match(/id=eq\.([\w-]+)/);
    if (idMatch) {
      const found = students.find((s) => s.id === idMatch[1]);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(found ?? null) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(students) });
  }

  if (table === "daily_tasks") {
    const studentMatch = url.match(/student_id=eq\.([\w-]+)/);
    const data = studentMatch ? (tasksByStudent[studentMatch[1]] ?? []) : allTasks;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  }

  if (table === "favorites") {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  }

  if (table === "materials") {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  }

  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 420, height: 860 } });
  const page = await context.newPage();
  await page.route("**/rest/v1/**", mockRest);
  await page.route("**/realtime/v1/**", (route) => route.abort());

  // 1) 시작 화면
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: "shots/1-home.png" });

  // 2) 학생 로그인 (PIN)
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.screenshot({ path: "shots/2-login.png" });

  // 3) 학생 오늘의 미션 화면 (로그인 되어 있다고 가정)
  await page.evaluate((sid) => localStorage.setItem("progress_app_student_id", sid), STUDENT_ID);
  await page.goto("http://localhost:3000/student", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "shots/3-student.png", fullPage: true });

  // 4) 교사 대시보드 (와이드 뷰)
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("http://localhost:3000/teacher", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "shots/4-teacher.png", fullPage: true });

  // 5) 교사 과제 출제기
  await page.setViewportSize({ width: 500, height: 900 });
  await page.goto("http://localhost:3000/teacher/assign", { waitUntil: "networkidle" });
  await page.screenshot({ path: "shots/5-assign.png", fullPage: true });

  // 6) 학생 관리 (PIN 중복 확인)
  await page.goto("http://localhost:3000/teacher/students", { waitUntil: "networkidle" });
  await page.fill('input[placeholder="학생 이름"]', "최민준");
  await page.fill('input[placeholder="PIN (4자리 숫자)"]', "1234");
  await page.waitForTimeout(200);
  await page.screenshot({ path: "shots/6-students.png", fullPage: true });

  await browser.close();
  console.log("screenshots done");
})();
