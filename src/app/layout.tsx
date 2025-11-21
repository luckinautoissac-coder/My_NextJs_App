import "@/styles/globals.css";

import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "AI 聊天助手 - AIHUBMIX",
	description: "基于 AIHUBMIX 大模型服务的智能聊天应用",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="zh-CN">
			<body className="antialiased" suppressHydrationWarning={true}>
				{children}
				<Toaster position="top-center" richColors />
			</body>
		</html>
	);
}
