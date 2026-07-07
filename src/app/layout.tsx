import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

// Configura a fonte Inter para textos corridos (leitura agradável e moderna)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Configura a fonte Outfit para títulos marcantes e design premium
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

// Metadados Globais do E-Commerce otimizados para SEO e mídias sociais (Open Graph)
export const metadata: Metadata = {
  title: "DNT Loja Virtual | E-Commerce Premium",
  description: "Encontre Smartphones, Notebooks, Moda e Produtos Regionais do Pará. Frete expresso grátis para Ananindeua, PA e entregas para todo o Brasil com segurança.",
  keywords: ["e-commerce", "Ananindeua", "Pará", "loja virtual", "smartphones", "açaí", "DNT Loja Virtual"],
  authors: [{ name: "DNT Loja Virtual" }],
  openGraph: {
    title: "DNT Loja Virtual | E-Commerce Premium",
    description: "Sua loja online com frete rápido, checkout integrado e o melhor catálogo nacional e regional.",
    type: "website",
    locale: "pt_BR",
    siteName: "DNT Loja Virtual",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Layout raiz que envelopa todo o ecossistema do frontend do e-commerce
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
