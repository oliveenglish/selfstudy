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
    { id: "t3", student_id: STUDENT_ID, material_id: null, step_no: 3, title: "단어 테스트 10문항", page_range: null, description: "선생님이 불러주는 단어를 받아쓰세요.", task_date: today, status: "waiting_check", teacher_comment: null, result_value: null, requested_at: today, checked_at: null, created_at: today },
    { id: "t3b", student_id: STUDENT_ID, material_id: null, step_no: 4, title: "받아쓰기 채점표 작성", page_range: null, description: null, task_date: today, status: "todo", teacher_comment: null, result_value: null, requested_at: null, checked_at: null, created_at: today },
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

// 한 과제(t6)에 선생님이 여러 번 코멘트를 남긴 이력을 보여주기 위한 샘플
const checkLogsByTask = {
  t6: [
    { task_id: "t6", comment: "시제를 다시 확인해볼까요?", checked_at: today },
    { task_id: "t6", comment: "이번엔 3번 문장만 다시 써볼까요?", checked_at: today },
  ],
};

const allTasks = Object.values(tasksByStudent).flat();
const allLogs = Object.values(checkLogsByTask).flat();

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

  if (table === "check_logs") {
    const decodedUrl = decodeURIComponent(url);
    const taskInMatch = decodedUrl.match(/task_id=in\.\(([^)]*)\)/);
    if (taskInMatch) {
      const ids = taskInMatch[1].split(",");
      const data = allLogs.filter((l) => ids.includes(l.task_id));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
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

  // 3) 학생 오늘의 미션 화면 (로그인 되어 있다고 가정) - 여러 개 검사대기 + 코멘트 이력
  await page.evaluate((sid) => localStorage.setItem("progress_app_student_id", sid), STUDENT_ID);
  await page.goto("http://localhost:3000/student", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "shots/3-student.png", fullPage: true });

  // 3b) 이하은 학생 화면 (코멘트 여러 번 남은 과제)
  await page.evaluate((sid) => localStorage.setItem("progress_app_student_id", sid), STUDENT3_ID);
  await page.goto("http://localhost:3000/student", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "shots/3b-student-comments.png", fullPage: true });

  // 교사 PIN 로그인 통과 처리 (localStorage)
  await page.evaluate(() => localStorage.setItem("progress_app_teacher_authed", "yes"));

  // 0) 교사 로그인 화면 (인증 전 상태를 보여주기 위해 별도로 클리어했다가 방문)
  await page.evaluate(() => localStorage.removeItem("progress_app_teacher_authed"));
  await page.goto("http://localhost:3000/teacher/login", { waitUntil: "networkidle" });
  await page.screenshot({ path: "shots/0-teacher-login.png" });
  await page.evaluate(() => localStorage.setItem("progress_app_teacher_authed", "yes"));

  // 4) 교사 대시보드 (와이드 뷰) - 학생별 검토할 과제 선택 + 전체 과제 그리드
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("http://localhost:3000/teacher", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "shots/4-teacher.png", fullPage: true });

  // 4b) 박서연 카드에서 검토할 과제 목록 펼치기 (선택권 데모)
  await page.getByText("과제 2 · 유형 문제집 p.30 풀어보기").click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: "shots/4b-teacher-choose.png", fullPage: true });

  // 5) 교사 과제 출제기 (자료 링크 입력란 포함)
  await page.setViewportSize({ width: 500, height: 950 });
  await page.goto("http://localhost:3000/teacher/assign", { waitUntil: "networkidle" });
  await page.fill('input[placeholder="자료 링크 (유튜브 영상 또는 구글 드라이브 파일 링크)"]', "https://youtu.be/dQw4w9WgXcQ");
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
