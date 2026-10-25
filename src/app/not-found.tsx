import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <p className="eyebrow">404</p>
      <h1 className="display">이 페이지는 없어요</h1>
      <p className="lead">일기장으로 돌아가 볼까요?</p>
      <Link href="/" className="btn btn-primary">홈으로</Link>
    </div>
  );
}
