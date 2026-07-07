import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Smartphone, Laptop, Headphones, Wifi, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

async function getCategories() {
  "use cache";
  return db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        where: { product: { isActive: true } },
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
        take: 4,
      },
    },
  });
}

export default async function CategoriesPage() {
  // Busca as categorias com o contador de produtos ativos e os primeiros 4 produtos via cache
  const categories = await getCategories();

  // Função auxiliar para mapear slugs para ícones apropriados
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "smartphones":
        return <Smartphone size={24} />;
      case "informatica":
        return <Laptop size={24} />;
      case "fones-e-audio":
        return <Headphones size={24} />;
      case "acessorios":
        return <Wifi size={24} />;
      default:
        return <Laptop size={24} />;
    }
  };

  return (
    <div className={styles.page}>
      <Suspense fallback={<div className={styles.headerFallback} />}>
        <Header />
      </Suspense>

      <main className={`${styles.main} container animate-fade-in`}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Categorias</h1>
          <p className={styles.subtitle}>
            Explore nossas divisões de produtos e encontre a melhor tecnologia do mercado para as suas necessidades.
          </p>
        </div>

        <div className={styles.categoriesList}>
          {categories.map((category) => {
            const productCount = category.products.length;
            const icon = getCategoryIcon(category.slug);

            return (
              <div key={category.id} className={`${styles.categoryCard} glass`}>
                <div className={styles.categoryHeader}>
                  <div className={styles.iconContainer}>{icon}</div>
                  <div className={styles.categoryInfo}>
                    <h2 className={styles.categoryName}>{category.name}</h2>
                    <span className={styles.productCount}>
                      {productCount === 0 
                        ? "Nenhum produto cadastrado" 
                        : productCount === 1 
                        ? "1 produto cadastrado" 
                        : `${productCount} produtos cadastrados`}
                    </span>
                  </div>
                  <Link
                    href={`/catalog?category=${category.slug}`}
                    className={styles.viewAllBtn}
                  >
                    <span>Ver Todos</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {category.products.length > 0 ? (
                  <div className={styles.previewGrid}>
                    {category.products.map(({ product }) => {
                      const price = (product.priceCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                      const comparePrice = product.comparePriceCents
                        ? (product.comparePriceCents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : null;
                      const image = product.images[0]?.url || "/planejamento.avif";

                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          className={styles.productMiniCard}
                        >
                          <div className={styles.imageWrapper}>
                            <Image src={image} alt={product.name} className={styles.productImg} fill sizes="(max-width: 768px) 100vw, 33vw" />
                          </div>
                          <div className={styles.productDetails}>
                            <span className={styles.productBrand}>{product.brand || "DNT Tech"}</span>
                            <h3 className={styles.productTitle} title={product.name}>{product.name}</h3>
                            <div className={styles.priceRow}>
                              <span className={styles.productPrice}>{price}</span>
                              {comparePrice && (
                                <span className={styles.comparePrice}>{comparePrice}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.noProducts}>Nenhum produto disponível nesta categoria no momento.</p>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
