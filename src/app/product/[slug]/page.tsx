import React, { Suspense, cache } from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetailsClient from "@/components/ProductDetailsClient";
import styles from "./page.module.css";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      params: { slug: "smartphone-dnt-pro-max-256gb" },
    },
    {
      params: { slug: "fone-sem-fio-dnt-buds-pro" },
    },
  ],
};

/**
 * Propriedades esperadas da Rota Dinâmica
 */
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Função de busca cacheada para evitar consultas redundantes no mesmo request
const getProductBySlug = cache(async (slug: string) => {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      reviews: { orderBy: { createdAt: "desc" } },
      categories: { include: { category: true } },
    },
  });
});

/**
 * Geração Dinâmica de Metadados para SEO (Title, Description, Open Graph)
 * Executado pelo Next.js no servidor antes de renderizar a página.
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const slug = (await params).slug;
  
  try {
    const product = await getProductBySlug(slug);

    if (!product) {
      return {
        title: "Produto não encontrado | DNT Loja Virtual",
      };
    }

    return {
      title: `${product.name} | DNT Loja Virtual`,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        type: "website",
        images: [
          {
            url: product.images[0]?.url || "/smartphone256.avif", // Fallback imagem de capa
          }
        ],
      },
    };
  } catch {
    return {
      title: "DNT Loja Virtual",
    };
  }
}

// Componente interno assíncrono que carrega e exibe os detalhes do produto
async function ProductDetailsContent({ params }: ProductPageProps) {
  const slug = (await params).slug;
  
  // 1. Busca os detalhes do produto e relacionamentos via função cacheada
  const product = await getProductBySlug(slug);

  // Se o produto não for localizado ou estiver desativado
  if (!product || !product.isActive) {
    return (
      <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h1>Produto não encontrado</h1>
        <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>
          Desculpe, o produto solicitado não está disponível ou não existe em nosso catálogo.
        </p>
        <Link href="/catalog" style={{ display: "inline-block", marginTop: "24px", color: "var(--primary)", fontWeight: "600" }}>
          Voltar para o Catálogo
        </Link>
      </main>
    );
  }

  // Calcula notas médias para renderização no HTML estático do servidor
  const reviewsCount = product.reviews.length;
  const ratingAverage =
    reviewsCount > 0
      ? parseFloat((product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1))
      : 0;

  // 2. Injeta JSON-LD de Produto estruturado para rastreadores (Google Rich Snippets)
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images.map((img) => img.url),
    "description": product.description,
    "sku": product.variants[0]?.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "DNT",
    },
    "offers": {
      "@type": "Offer",
      "url": `https://dnt-loja-virtual.com.br/product/${product.slug}`,
      "priceCurrency": "BRL",
      "price": (product.priceCents / 100).toFixed(2),
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.variants.some((v) => v.stockQuantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    "aggregateRating": reviewsCount > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": ratingAverage.toString(),
      "reviewCount": reviewsCount.toString(),
    } : undefined,
  };

  const categoryName = product.categories[0]?.category.name || "Produtos";

  return (
    <main className={`${styles.content} container`}>
      {/* Script JSON-LD para indexação SEO estruturada */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Trilha de Navegação (Breadcrumb) */}
      <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <ChevronRight size={14} />
        <Link href="/catalog" className={styles.breadcrumbLink}>Produtos</Link>
        <ChevronRight size={14} />
        <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{categoryName}</span>
      </nav>

      {/* Renderiza o componente cliente interativo da página de produto */}
      <ProductDetailsClient
        product={{
          ...product,
          ratingAverage,
          reviewsCount,
          reviews: product.reviews.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(), // Serializa a data para passar por props de forma segura
          })),
        }}
      />

      {product.richDescription && (
        <section className={styles.descriptionSection}>
          <h2 className={styles.descriptionTitle}>Especificações e Detalhes</h2>
          <div
            className={styles.richText}
            dangerouslySetInnerHTML={{ __html: product.richDescription }}
          />
        </section>
      )}

      {/* Seção de Avaliações dos Clientes (Customer Reviews) */}
      <section className={styles.reviewsSection}>
        <h2 className={styles.descriptionTitle}>Avaliações dos Clientes</h2>
        <div className={styles.reviewsGrid}>
          {/* Resumo Esquerdo das avaliações */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "3rem", fontWeight: "800" }}>{ratingAverage}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>/ 5.0</span>
            </div>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.round(ratingAverage) ? "currentColor" : "none"}
                  color="var(--warning)"
                />
              ))}
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              Baseado em {reviewsCount} {reviewsCount === 1 ? "opinião" : "opiniões"} de clientes.
            </p>
          </div>

          {/* Listagem Direita dos Comentários das avaliações */}
          <div>
            {product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewAuthor}>{review.userName}</span>
                    <span className={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className={styles.stars} style={{ marginBottom: "10px", fontSize: "0.8rem" }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < review.rating ? "currentColor" : "none"}
                        color="var(--warning)"
                      />
                    ))}
                  </div>
                  {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                Este produto ainda não recebeu avaliações dos consumidores.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Página de Detalhes do Produto (SSR + Static Shell)
 */
export default async function ProductPage({ params }: ProductPageProps) {
  return (
    <div className={styles.page}>
      <Suspense fallback={<div style={{ height: "var(--header-height)" }} />}>
        <Header />
      </Suspense>
      <Suspense fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="loader" role="status" aria-label="Carregando detalhes do produto"></div>
        </div>
      }>
        <ProductDetailsContent params={params} />
      </Suspense>
      <Footer />
    </div>
  );
}
