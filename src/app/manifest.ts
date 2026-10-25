import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "감성 다이어리",
    short_name: "다이어리",
    description: "하루를 따뜻하게 기록하는 일기장",
    start_url: "/",
    display: "standalone",
    background_color: "#F3EBDF",
    theme_color: "#F3EBDF",
    lang: "ko",
  };
}
