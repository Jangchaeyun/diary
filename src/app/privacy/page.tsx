import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="page">
      <p className="eyebrow">안내</p>
      <h1 className="display">일기와 AI</h1>
      <div className="stack" style={{ marginTop: 18 }}>
        <section className="card">
          <h2>계정마다 따로</h2>
          <p className="muted">이메일과 비밀번호로 로그인하면 그 계정의 일기만 보여요. 다른 계정의 기록과 사진은 열리지 않아요. 이 서버에 접속할 수 있는 사람과 비밀번호를 나누면 그 계정도 열 수 있으니, 개인 컴퓨터에서 사용해 주세요.</p>
        </section>
        <section className="card">
          <h2>어디에 저장되나요</h2>
          <p className="muted">일기와 AI 응답은 이 앱을 실행하는 컴퓨터의 데이터 폴더에 남아요. 사진은 기본적으로 같은 폴더에 있고, S3 호환 저장소를 환경 변수로 연결하면 그곳으로 올라가요. 연결되지 않았으면 클라우드에 올라간 것처럼 보이지 않아요.</p>
        </section>
        <section className="card">
          <h2>AI에는 언제 보이나요</h2>
          <p className="muted">요약, 감정, 공감, 회고 질문, 월간 회고 버튼을 눌렀을 때만 제목, 본문, 고른 기분, 날짜가 서버를 거쳐 설정된 LLM으로 전달돼요. 사진은 기록 화면에서 ‘사진을 AI에 함께 보내기’를 켠 경우에만, 그 요청에 포함돼요. 테스트 예시는 사진을 보지 않아요. 같은 내용의 결과가 이미 있으면 다시 호출하지 않고 저장본을 보여 줘요.</p>
        </section>
        <section className="card">
          <h2>키가 없을 때</h2>
          <p className="muted">API 키가 없으면 실제 분석을 만든 것처럼 보이진 않아요. 화면의 테스트 예시는 연결 확인용이고, 감정 차트에는 포함되지 않아요. 기록이 적은 달은 월간 회고를 추측해서 만들지 않아요.</p>
        </section>
        <section className="card">
          <h2>연결 방법</h2>
          <p className="muted">프로젝트의 <code>.env.local</code>에 <code>OPENAI_API_KEY</code>를 넣으세요. OpenAI와 같은 형식의 주소라면 <code>OPENAI_BASE_URL</code>과 <code>OPENAI_MODEL</code>도 바꿀 수 있어요. 사진 저장소는 <code>S3_ENDPOINT</code>, <code>S3_BUCKET</code>, <code>S3_ACCESS_KEY</code>, <code>S3_SECRET_KEY</code>가 모두 있을 때만 사용돼요. 키는 브라우저 코드에 들어가지 않고, 서버 요청에만 사용돼요.</p>
        </section>
        <section className="card">
          <h2>분석은 참고예요</h2>
          <p className="muted">AI는 일기에 적힌 표현을 따뜻하게 정리할 뿐, 마음 상태를 진단하거나 평가하지 않아요. 결과가 마음에 들지 않으면 무시해도 기록은 그대로 남습니다.</p>
        </section>
      </div>
      <Link href="/" className="btn btn-soft" style={{ marginTop: 18 }}>홈으로</Link>
    </div>
  );
}
