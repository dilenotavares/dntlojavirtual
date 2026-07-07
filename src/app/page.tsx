import React, { Suspense } from "react";
import Link from "next/link";
import { Smartphone, Laptop, Headphones, Wifi, Truck } from "lucide-react";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Carousel from "@/components/Carousel";
import ProductCard from "@/components/ProductCard";
import styles from "./page.module.css";




async function getFeaturedProducts() {
  "use cache";
  try {
    // Busca um produto de cada uma das 4 categorias principais
    const categorySlugs = ["smartphones", "informatica", "fones-e-audio", "acessorios"];
    const productsPromises = categorySlugs.map(slug => 
      db.product.findFirst({
        where: {
          isActive: true,
          categories: {
            some: {
              category: { slug }
            }
          }
        },
        include: {
          images: {
            orderBy: { sortOrder: "asc" }
          }
        }
      })
    );
    const results = await Promise.all(productsPromises);
    return results.filter((p): p is NonNullable<typeof p> => p !== null);
  } catch (error) {
    console.error("Erro ao recuperar produtos no SSR:", error);
    return [];
  }
}

/**
 * Página Inicial do E-Commerce (Home Page)
 * 
 * Implementada como um Next.js Server Component (SSR).
 * Realiza a consulta de produtos utilizando 'use cache' no servidor, 
 * otimizando o carregamento inicial, SEO e permitindo navegação instantânea.
 */
export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  // Lista estática de categorias para navegação rápida
  const categories = [
    { name: "Smartphones", slug: "smartphones", icon: <Smartphone size={32} /> },
    { name: "Informática", slug: "informatica", icon: <Laptop size={32} /> },
    { name: "Fones & Áudio", slug: "fones-e-audio", icon: <Headphones size={32} /> },
    { name: "Acessórios", slug: "acessorios", icon: <Wifi size={32} /> }
  ];

  return (
    <div className={styles.main}>
      {/* Cabeçalho Global */}
      <Suspense fallback={<div style={{ height: "var(--header-height)" }} />}>
        <Header />
      </Suspense>

      {/* Hero Banner Section */}
      <section className={`${styles.heroSection} container`}>
        <Carousel />
      </section>

      {/* Seção 1: Categorias de Destaque */}
      <section className={`${styles.section} container`}>
        <h2 className={styles.sectionTitle}>Navegue por Categorias</h2>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => (
            <Link 
              key={cat.slug} 
              href={`/catalog?category=${cat.slug}`}
              className={styles.categoryCard}
              title={`Ver produtos da categoria ${cat.name}`}
            >
              <div className={styles.categoryIcon}>{cat.icon}</div>
              <span className={styles.categoryName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Seção 2: Vitrine de Produtos em Destaque */}
      <section className={`${styles.section} container`}>
        <h2 className={styles.sectionTitle}>Novidades para Você</h2>
        {featuredProducts.length > 0 ? (
          <div className={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            Nenhum produto cadastrado no momento.
          </div>
        )}
      </section>

      {/* Seção 3: Banner Logístico com Oferta Local (Ananindeua, PA) */}
      <section className={`${styles.section} container`}>
        <div className={styles.regionalBanner}>
          {/* Conteúdo de marketing do frete expresso local */}
          <div className={styles.regionalContent}>
            <span className={styles.regionalTag}>Orgulho Paraense</span>
            <h2 className={styles.regionalTitle}>Entrega Expressa Grátis em Ananindeua</h2>
            <p className={styles.regionalDescription}>
              Comprando em nossa loja com endereço em Ananindeua (PA), você recebe seu pedido no mesmo dia
              sem custo de frete através do DNT Express. Válido também para retirada agendada física.
            </p>
          </div>
          
          {/* Botão de chamada para ação (CTA) */}
          <Link href="/catalog" className={styles.regionalCTA}>
            Aproveitar Frete Grátis
          </Link>

          {/* Ícone de fundo decorativo */}
          <Truck size={200} className={styles.regionalBackground} aria-hidden="true" />
        </div>
      </section>

      {/* Rodapé Global */}
      <Footer />
    </div>
  );
}
