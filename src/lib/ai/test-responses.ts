import type { DiaryEntry, MonthlyPayload } from "@/lib/types";

const NOTICE = "테스트 예시입니다. 실제 모델이 분석한 문장이 아니에요.";

function excerpt(body: string) {
  const text = body.trim().replace(/\s+/g, " ");
  if (!text) return "확인할 본문이 없습니다.";
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export function testSummary(entry: DiaryEntry) {
  return {
    summary: `${NOTICE} 입력 확인용으로 본문 앞부분만 보여 줍니다. “${excerpt(entry.body)}”`,
    mainEmotions: [],
    goodMoment: "이 칸은 예시입니다. API를 연결하면 일기에서 좋았던 순간을 찾아 채웁니다.",
    reflection: "이 칸은 예시입니다. 실제 회고가 아닙니다.",
    closing: "연결을 확인하는 문장이에요. 위로의 분석으로 읽지 않아도 돼요.",
  };
}

export function testEmotion() {
  return {
    emotions: [],
    mixed: false,
    note: `${NOTICE} 감정 강도는 일부러 비워 두었습니다.`,
  };
}

export function testEmpathy(entry: DiaryEntry) {
  return {
    message: `${NOTICE} 제목 “${entry.title || "제목 없음"}”과 본문이 서버까지 전달된 것만 확인합니다. 공감 문장을 대신 만들지 않습니다.`,
  };
}

export function testQuestions() {
  return {
    questions: [
      "[테스트 예시] 오늘 가장 기억에 남는 순간은 무엇인가요?",
      "[테스트 예시] 오늘 나 자신을 위해 잘한 일은 무엇인가요?",
      "[테스트 예시] 내일의 나에게 해 주고 싶은 말은 무엇인가요?",
    ],
  };
}

export function testMonthly(entries: { title: string; entryDate: string }[]): MonthlyPayload {
  const titles = entries.map((entry) => `${entry.entryDate} ${entry.title || "(제목 없음)"}`).join(", ");
  return {
    events: `${NOTICE} 기록된 제목만 나열합니다: ${titles}`,
    emotionFlow: "예시 칸입니다. 감정 변화를 추정하지 않습니다.",
    happyMoments: "예시 칸입니다. 행복했던 일을 지어내지 않습니다.",
    interests: "예시 칸입니다. 관심사나 목표를 추측하지 않습니다.",
    nextQuestions: ["[테스트 예시] 이번 달 기록 중 다시 읽고 싶은 페이지는 무엇인가요?"],
  };
}
