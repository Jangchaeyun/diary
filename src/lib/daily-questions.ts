const QUESTIONS = [
  "오늘 가장 오래 머문 마음은 무엇이었나요?",
  "오늘 나를 살짝 웃게 한 장면이 있나요?",
  "하루 중 숨을 고르고 싶었던 순간은 언제였나요?",
  "오늘 나 자신을 위해 작게라도 한 일이 있나요?",
  "누군가에게 고맙다고 말하고 싶은 일이 있었나요?",
  "오늘 그냥 지나쳤지만, 다시 떠올리고 싶은 장면이 있나요?",
  "몸과 마음은 오늘 어느 쪽에 더 기울어 있었나요?",
  "내일의 나에게 부담 없이 건네고 싶은 말이 있나요?",
  "오늘 창밖이나 길 위에서 눈에 남은 것이 있나요?",
  "기대와 다르게 흘러간 일이 있다면, 그때 어떤 마음이 들었나요?",
  "오늘 충분히 하지 못해도 괜찮았던 일이 있나요?",
  "하루를 색으로 고르면 어떤 빛에 가깝나요?",
  "오늘 들은 말 가운데 아직 남아 있는 문장이 있나요?",
  "잠들기 전, 이 하루에 제목을 붙인다면 무엇인가요?",
];

export function dailyQuestion(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return QUESTIONS[(day - 1 + QUESTIONS.length) % QUESTIONS.length];
}
