import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";

import AuthProvider from "@/providers/auth-provider";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Transporte 2026 - SEDUC",
  description:
    "Sistema de Transporte Universitário - Secretaria de Educação de Caraguatatuba",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
