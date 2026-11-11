import "./globals.css";

export const metadata = {
  title: "BAND NIGHT 2026 | 11.21 SAT",
  description: "2026년 11월 21일, 우리들의 90분. 공연 안내와 실시간 응원, 익명 질문, 뒤풀이 참석을 확인하세요.",
  openGraph: { title: "BAND NIGHT 2026", description: "11.21 SAT 18:00 — 21:00", type: "website" }
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#11100f" };

export default function RootLayout({ children }) {
  return <html lang="ko"><body>{children}</body></html>;
}
