import { getMood } from "@/lib/catalog";
import type { MoodId } from "@/lib/types";

const SYSTEM = `당신은 개인 일기장 옆에서 하루를 함께 읽어 주는 따뜻한 동반자입니다.
사용자를 평가하거나 심리 상태, 성격, 질환을 진단하지 않습니다.
의학적 조언, 진단명, 위험 판단, 치료 제안을 하지 않습니다.
일기 본문에 없는 사건, 장소, 인물, 감정을 지어내지 않습니다.
근거가 약하면 그 칸에 "기록만으로는 잘 모르겠어요."라고 적습니다.
응답은 반드시 JSON 객체 하나만 출력합니다.`;

function diaryBlock(entry: { entryDate: string; title: string; body: string; mood: MoodId | null }, photoNote?: string) {
  const mood = getMood(entry.mood);
  return `날짜: ${entry.entryDate}
사용자가 직접 고른 기분: ${mood ? mood.label : "선택하지 않음"}
제목: ${entry.title || "(제목 없음)"}
본문:
${entry.body}

${photoNote ?? "첨부 사진은 전달되지 않았습니다. 사진에 무엇이 있는지는 추측하지 마세요."}`;
}

export function summaryPrompt(entry: { entryDate: string; title: string; body: string; mood: MoodId | null }, photoNote?: string) {
  return {
    system: SYSTEM,
    user: `${diaryBlock(entry, photoNote)}

위 일기만 바탕으로 JSON을 작성하세요.
{
  "summary": "오늘 하루의 핵심을 2~3문장으로",
  "mainEmotions": ["본문에서 읽히는 감정 단어"],
  "goodMoment": "좋았던 순간. 없으면 없다고 말하기",
  "reflection": "스스로 돌아볼 만한 점을 부드럽게 한 가지. 지적하거나 충고하지 않기",
  "closing": "부담 없는 짧은 마무리"
}
사용자가 고른 기분은 참고만 하고, 본문과 다르면 본문을 우선하세요.`,
  };
}

export function emotionPrompt(entry: { entryDate: string; title: string; body: string; mood: MoodId | null }, photoNote?: string) {
  return {
    system: SYSTEM,
    user: `${diaryBlock(entry, photoNote)}

감정 분석은 참고용입니다. 진단처럼 쓰지 마세요.
{
  "emotions": [{ "label": "감정 이름", "intensity": 0.0 }],
  "mixed": true,
  "note": "이 정리가 참고용이라는 점을 담은 한 문장"
}
intensity는 0과 1 사이입니다. 감정은 최대 4개입니다.
본문에 여러 감정이 있으면 mixed를 true로 하세요.
사용자가 고른 기분과 글의 결이 다르면 note에 그 차이를 부드럽게 적으세요.`,
  };
}

export function empathyPrompt(entry: { entryDate: string; title: string; body: string; mood: MoodId | null }, photoNote?: string) {
  return {
    system: SYSTEM,
    user: `${diaryBlock(entry, photoNote)}

{
  "message": "일기 속 구체적인 장면에 닿는 공감 메시지"
}
힘든 하루라면 억지로 긍정적으로 바꾸지 말고, 그 마음을 인정하세요.
밝은 하루라면 그 장면을 함께 기뻐하세요.
2~4문장, 상투적인 위로만 반복하지 마세요. 본문에 없는 조언은 하지 마세요.`,
  };
}

export function questionsPrompt(entry: { entryDate: string; title: string; body: string; mood: MoodId | null }, photoNote?: string) {
  return {
    system: SYSTEM,
    user: `${diaryBlock(entry, photoNote)}

{
  "questions": ["질문 1", "질문 2", "질문 3"]
}
하루를 조금 더 돌아보게 하는 질문 3개만 작성하세요.
일기 속 장면이 있으면 그 장면에 기대어 묻고, 없는 사실을 전제로 묻지 마세요.
일기가 짧으면 부담 없는 회고 질문을 쓰되, 지어낸 사건을 넣지 마세요.`,
  };
}

export function monthlyPrompt(
  month: string,
  entries: { entryDate: string; title: string; body: string; mood: MoodId | null }[],
) {
  const blocks = entries
    .map((entry, index) => {
      const mood = getMood(entry.mood);
      const body = entry.body.length > 1200 ? `${entry.body.slice(0, 1200)}…` : entry.body;
      return `${index + 1}. ${entry.entryDate} / 고른 기분: ${mood ? mood.label : "없음"} / 제목: ${entry.title || "(제목 없음)"}\n${body}`;
    })
    .join("\n\n");
  return {
    system: SYSTEM,
    user: `${month}에 저장된 일기입니다. 이 기록 밖에 있는 일은 추측하지 마세요.

${blocks}

{
  "events": "기록에 나온 주요 사건과 기억",
  "emotionFlow": "자주 나타난 감정과 기분 변화. 사용자가 고른 기분과 글의 결을 구분",
  "happyMoments": "행복했거나 고마웠던 일. 없으면 없다고 말하기",
  "interests": "반복해서 나타난 관심사나 목표. 없으면 없다고 말하기",
  "nextQuestions": ["다음 달을 위한 가벼운 질문", "질문 2", "질문 3"]
}`,
  };
}
