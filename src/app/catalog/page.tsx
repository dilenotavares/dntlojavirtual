import React, { Suspense } from "react";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CatalogSidebar from "@/components/CatalogSidebar";
import SortSelect from "@/components/SortSelect";
import styles from "./page.module.css";

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      searchParams: {
        category: "smartphones",
        search: "",
        minPrice: "",
        maxPrice: "",
        sort: "newest",
      },
    },
    {
      searchParams: {
        category: "",
        search: "DNT",
        minPrice: "0",
        maxPrice: "100000",
        sort: "price-asc",
      },
    },
  ],
};

interface CatalogPageProps {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    sort?: string;
  }>;
}

// Consulta categorias cacheada no servidor
async function getCategories() {
  "use cache";
  return db.category.findMany({
    orderBy: { name: "asc" },
  });
}

// Componente interno assíncrono para renderizar o conteúdo dinâmico do catálogo
async function CatalogContent({
  searchParams,
  categories,
}: {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    sort?: string;
  }>;
  categories: any[];
}) {
  const params = await searchParams;
  const categorySlug = params.category || "";
  const search = params.search || "";
  const minPrice = params.minPrice || "";
  const maxPrice = params.maxPrice || "";
  const sort = params.sort || "newest";

  // Monta as condições de filtro da listagem de produtos
  const whereClause: any = {
    isActive: true,
  };

  if (categorySlug) {
    whereClause.categories = {
      some: {
        category: {
          slug: categorySlug,
        },
      },
    };
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { brand: { contains: search } },
    ];
  }

  if (minPrice || maxPrice) {
    whereClause.priceCents = {};
    if (minPrice) {
      whereClause.priceCents.gte = parseInt(minPrice);
    }
    if (maxPrice) {
      whereClause.priceCents.lte = parseInt(maxPrice);
    }
  }

  let orderByClause: any = { createdAt: "desc" };
  if (sort === "price-asc") {
    orderByClause = { priceCents: "asc" };
  } else if (sort === "price-desc") {
    orderByClause = { priceCents: "desc" };
  }

  const products = await db.product.findMany({
    where: whereClause,
    orderBy: orderByClause,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const pageTitle = activeCategory ? activeCategory.name : "Nossos Produtos";
  const pageSubtitle = search
    ? `Resultados para a busca "${search}"`
    : activeCategory
    ? `Explore nossos produtos de ${activeCategory.name}`
    : "Explore toda a variedade e qualidade dos produtos DNT";

  const displayMinPrice = minPrice ? (parseInt(minPrice) / 100).toString() : "";
  const displayMaxPrice = maxPrice ? (parseInt(maxPrice) / 100).toString() : "";

  return (
    <>
      <h1 className={styles.title}>{pageTitle}</h1>
      <p className={styles.subtitle}>{pageSubtitle}</p>

      <div className={styles.layout}>
        <CatalogSidebar
          categories={categories}
          currentCategory={categorySlug}
          currentSearch={search}
          currentMinPrice={displayMinPrice}
          currentMaxPrice={displayMaxPrice}
          currentSort={sort}
        />

        <div className={styles.productsSection}>
          <div className={styles.controlBar}>
            <span className={styles.resultsCount} aria-live="polite">
              {products.length === 0
                ? "Nenhum produto encontrado"
                : products.length === 1
                ? "1 produto encontrado"
                : `${products.length} produtos encontrados`}
            </span>
            <SortSelect currentSort={sort} />
          </div>

          {products.length > 0 ? (
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>Nenhum resultado localizado</h2>
              <p>Experimente alterar os filtros da barra lateral ou digitar outros termos de busca.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Página do Catálogo de Produtos (SSR + Static Shell)
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const categories = await getCategories();

  return (
    <div className={styles.page}>
      <Suspense fallback={<div style={{ height: "var(--header-height)" }} />}>
        <Header />
      </Suspense>
      <main className={`${styles.content} container`}>
        <Suspense fallback={
          <div className={styles.emptyState} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <div className="loader" role="status" aria-label="Carregando catálogo"></div>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Carregando produtos...</p>
          </div>
        }>
          <CatalogContent searchParams={searchParams} categories={categories} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
