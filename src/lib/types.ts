export type MoodId = "happy" | "excited" | "calm" | "sad" | "anxious" | "tired";

export type ThemeId = "ivory" | "blush" | "lavender" | "sage" | "sand" | "dusk";

export type EntryStatus = "draft" | "saved";

export type DayTask = {
  id: string;
  date: string;
  text: string;
  done: boolean;
  createdAt: string;
};

export type AiSource = "llm" | "test";

export type AiKind = "summary" | "emotion" | "empathy" | "questions" | "monthly";

export type Photo = {
  id: string;
  mime: string;
};

export type AiFlags = {
  summary: boolean;
  emotion: boolean;
  empathy: boolean;
  questions: boolean;
};

export type DiaryEntry = {
  id: string;
  title: string;
  body: string;
  mood: MoodId | null;
  theme: ThemeId;
  entryDate: string;
  status: EntryStatus;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  aiReady: AiFlags;
};

export type SummaryPayload = {
  summary: string;
  mainEmotions: string[];
  goodMoment: string;
  reflection: string;
  closing: string;
};

export type EmotionPayload = {
  emotions: { label: string; intensity: number }[];
  mixed: boolean;
  note: string;
};

export type EmpathyPayload = {
  message: string;
};

export type QuestionItem = {
  index: number;
  text: string;
  answer: string | null;
};

export type QuestionsPayload = {
  questions: QuestionItem[];
};

export type MonthlyPayload = {
  events: string;
  emotionFlow: string;
  happyMoments: string;
  interests: string;
  nextQuestions: string[];
};

export type AiRecord<T> = {
  id: string;
  source: AiSource;
  createdAt: string;
  stale: boolean;
  payload: T;
};

export type EntryAi = {
  summary: AiRecord<SummaryPayload> | null;
  emotion: AiRecord<EmotionPayload> | null;
  empathy: AiRecord<EmpathyPayload> | null;
  questions: AiRecord<QuestionsPayload> | null;
};

export type EntryDetail = DiaryEntry & {
  ai: EntryAi;
};

export type EntryInput = {
  title: string;
  body: string;
  mood: MoodId | null;
  theme: ThemeId;
  entryDate: string;
  status: EntryStatus;
};

export type DayMark = {
  date: string;
  mood: MoodId | null;
  count: number;
};

export type MoodCount = {
  mood: MoodId | null;
  count: number;
};

export type AiEmotionBar = {
  label: string;
  intensity: number;
  count: number;
};
