import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./ProductCard.module.css";

/**
 * Interface do Objeto Produto esperado pelo Card
 */
export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    comparePriceCents?: number | null;
    brand?: string | null;
    images: Array<{
      url: string;
      altText?: string | null;
    }>;
  };
}

/**
 * Componente ProductCard
 * 
 * Exibe as informações essenciais do produto em formato de card interativo.
 * Formata os preços para a moeda local Real (BRL), calcula descontos promocionais
 * e possui efeitos premium no hover, direcionando para a página de detalhes.
 */
export default function ProductCard({ product }: ProductCardProps) {
  // Preço principal formatado (R$ 0,00)
  const formattedPrice = (product.priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Preço riscado formatado se aplicável
  const formattedComparePrice = product.comparePriceCents
    ? (product.comparePriceCents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : null;

  // Calcula o percentual de desconto se houver promoção
  const discountPercent =
    product.comparePriceCents && product.comparePriceCents > product.priceCents
      ? Math.round(
          ((product.comparePriceCents - product.priceCents) / product.comparePriceCents) * 100
        )
      : null;

  // Imagem principal (capa) ou placeholder caso o produto não tenha imagens
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : "/planejamento.avif";

  const imageAlt =
    product.images && product.images.length > 0
      ? product.images[0].altText || product.name
      : product.name;

  return (
    <div className={styles.card}>
      {/* Selo de Desconto (Badge) */}
      {discountPercent && (
        <span className={styles.badge} aria-label={`Promoção: ${discountPercent}% de desconto`}>
          -{discountPercent}%
        </span>
      )}

      {/* Invólucro da imagem para efeito de zoom */}
      <Link href={`/product/${product.slug}`} className={styles.imageWrapper} tabIndex={-1}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className={styles.image}
          loading="lazy"
        />
      </Link>

      {/* Conteúdo Informativo */}
      <div className={styles.content}>
        <span className={styles.brand}>{product.brand || "DNT Virtual"}</span>
        
        <Link href={`/product/${product.slug}`}>
          <h3 className={styles.title} title={product.name}>
            {product.name}
          </h3>
        </Link>

        {/* Faixa de Preços */}
        <div className={styles.priceContainer}>
          <span className={styles.price}>{formattedPrice}</span>
          {formattedComparePrice && (
            <span className={styles.comparePrice}>{formattedComparePrice}</span>
          )}
        </div>

        {/* Botão de Compra/Ação */}
        <Link href={`/product/${product.slug}`} className={styles.button}>
          <span>Ver Detalhes</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
