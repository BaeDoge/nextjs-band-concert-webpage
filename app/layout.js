import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://daeil-band.vercel.app"),
  title: "대일밴드 공연 | 2026.11.21",
  description: "2026년 11월 21일 목동 제이에스아트홀에서 만나요. 대일밴드 공연 안내, 셋리스트, 멤버, 응원과 메시지.",
  alternates: { canonical: "/" },
  icons: { icon: "/images/cat-headphones.svg", shortcut: "/images/cat-headphones.svg" },
  openGraph: {
    title: "대일밴드 공연 | 2026.11.21",
    description: "11월 21일 토요일 오후 6시, 목동 제이에스아트홀",
    url: "https://daeil-band.vercel.app",
    siteName: "대일밴드",
    locale: "ko_KR",
    type: "website"
  }
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#11100f" };

export default function RootLayout({ children }) {
  return <html lang="ko"><body>{children}</body></html>;
}
