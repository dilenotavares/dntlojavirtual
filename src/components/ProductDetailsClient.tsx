"use client";

import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import styles from "../app/product/[slug]/page.module.css";

/**
 * Interface do Tipo Galeria Imagem
 */
interface ImageItem {
  id: string;
  url: string;
  altText?: string | null;
}

/**
 * Interface do Tipo Variante do Produto
 */
interface VariantItem {
  id: string;
  sku: string;
  attributesJson: string; // JSON string. Ex: {"cor": "Azul", "tamanho": "GG"}
  priceCents: number;
  stockQuantity: number;
}

/**
 * Interface do Tipo Avaliação do Produto
 */
interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  comment?: string | null;
  createdAt: string | Date;
}

/**
 * Interface do Objeto Produto
 */
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  richDescription?: string | null;
  priceCents: number;
  comparePriceCents?: number | null;
  weightGrams: number;
  brand?: string | null;
  images: ImageItem[];
  variants: VariantItem[];
  reviews: ReviewItem[];
  ratingAverage: number;
  reviewsCount: number;
}

/**
 * Componente ProductDetailsClient (Interativo - Client Side)
 * 
 * Centraliza a experiência do usuário na página do produto:
 * 1. Galeria de fotos interativa.
 * 2. Motor de seleção de variantes de produto (combinações de cor e tamanho).
 * 3. Validador dinâmico de preços e estoques de SKUs.
 * 4. Simulador de prazos de entrega e frete dinâmico para Ananindeua, PA.
 * 5. Adição do SKU selecionado ao CartContext.
 */
export default function ProductDetailsClient({ product }: { product: Product }) {
  const { addToCart } = useCart();

  // 1. Estados da Galeria
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 2. Estados de Variantes
  // Parse inicial dos atributos das variantes disponíveis
  const parsedVariants = product.variants.map((v) => ({
    ...v,
    attributes: JSON.parse(v.attributesJson) as Record<string, string>,
  }));

  // Extrai as chaves de atributos disponíveis (Ex: ["cor", "tamanho"])
  const attributeKeys = Object.keys(parsedVariants[0]?.attributes || {});

  // Estado para armazenar as seleções ativas do usuário
  // Inicia com os atributos da primeira variante padrão
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
    parsedVariants[0]?.attributes || {}
  );

  // Estado para a variante correspondente atualmente selecionada
  const [activeVariant, setActiveVariant] = useState<VariantItem | null>(null);

  // Efeito para encontrar a variante física correspondente sempre que mudar a seleção
  useEffect(() => {
    const matched = product.variants.find((v) => {
      const attrs = JSON.parse(v.attributesJson);
      return attributeKeys.every((key) => attrs[key] === selectedAttributes[key]);
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveVariant(matched || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttributes, product.variants]); 

  // Trata alteração de seleção de atributo
  const handleSelectAttribute = (key: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Coleta os valores únicos possíveis para cada atributo no catálogo deste produto
  const getUniqueAttributeValues = (key: string) => {
    const values = new Set<string>();
    parsedVariants.forEach((v) => {
      if (v.attributes[key]) values.add(v.attributes[key]);
    });
    return Array.from(values);
  };

  // 3. Estados de Compra e Quantidade
  const [quantity, setQuantity] = useState(1);

  // Executa adição ao carrinho
  const handleAddToCart = () => {
    if (!activeVariant) return;

    // Monta o item formatado para a estrutura do CartContext
    addToCart({
      variantId: activeVariant.id,
      productId: product.id,
      name: product.name,
      sku: activeVariant.sku,
      attributes: selectedAttributes,
      priceCents: activeVariant.priceCents,
      image: product.images[0]?.url || "",
      weightGrams: product.weightGrams,
      stockQuantity: activeVariant.stockQuantity,
    }, quantity);

    alert(`${product.name} adicionado ao carrinho!`);
  };

  // 4. Estados do Simulador de Frete
  const [zip, setZip] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [shippingResults, setShippingResults] = useState<any[] | null>(null);
  const [isShippingLoading, setIsShippingLoading] = useState(false);

  const handleSimulateShipping = async (e: FormEvent) => {
    e.preventDefault();
    if (!zip || zip.replace(/\D/g, "").length !== 8) {
      alert("Por favor, digite um CEP válido com 8 dígitos.");
      return;
    }

    setIsShippingLoading(true);
    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: zip.replace(/\D/g, ""),
          weightGrams: product.weightGrams * quantity,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShippingResults(data.options);
      } else {
        alert("Erro ao calcular frete para este CEP.");
      }
    } catch (error) {
      console.error("Erro no fetch de frete:", error);
      alert("Erro ao conectar com o serviço de frete.");
    } finally {
      setIsShippingLoading(false);
    }
  };

  // 5. Configurações de Preço dinâmico da variante selecionada
  const activePriceCents = activeVariant ? activeVariant.priceCents : product.priceCents;
  const formattedPrice = (activePriceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const formattedComparePrice = product.comparePriceCents
    ? (product.comparePriceCents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : null;

  // Parcela simulada em até 10x sem juros no cartão (Cielo/Pagar.me)
  const installmentValue = (activePriceCents / 100 / 10).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className={styles.layout}>
      {/* Coluna Esquerda: Galeria Interativa */}
      <div className={styles.gallery}>
        <div className={styles.mainImageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[activeImageIndex]?.url || "./planejamento.avif"}
            alt={product.images[activeImageIndex]?.altText || product.name}
            className={styles.mainImage}
          />
        </div>
        {product.images.length > 1 && (
          <div className={styles.thumbnails}>
            {product.images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                className={`${styles.thumbnailButton} ${index === activeImageIndex ? styles.thumbnailButtonActive : ""}`}
                onClick={() => setActiveImageIndex(index)}
                aria-label={`Ver imagem ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText || ""} className={styles.thumbnailImage} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coluna Direita: Informações e Compra */}
      <div className={styles.info}>
        <div>
          <span className={styles.brand}>{product.brand || "DNT Virtual"}</span>
          <h1 className={styles.title}>{product.name}</h1>
        </div>

        {/* Resumo da Avaliação por Estrelas */}
        <div className={styles.ratingSummary}>
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                fill={i < Math.round(product.ratingAverage) ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span>
            {product.ratingAverage > 0
              ? `${product.ratingAverage} (${product.reviewsCount} avaliações)`
              : "Sem avaliações ainda"}
          </span>
        </div>

        {/* Bloco de Preços */}
        <div className={styles.priceSection}>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formattedPrice}</span>
            {formattedComparePrice && (
              <span className={styles.comparePrice}>{formattedComparePrice}</span>
            )}
          </div>
          <p className={styles.installments}>
            ou em até <strong>10x de {installmentValue}</strong> sem juros no cartão de crédito
          </p>
        </div>

        {/* Exibição e Seletores de Variantes (Cor/Tamanho) */}
        {attributeKeys.length > 0 && (
          <div className={styles.variants}>
            {attributeKeys.map((key) => (
              <div key={key} className={styles.variantGroup}>
                <span className={styles.variantLabel}>Selecione {key}:</span>
                <div className={styles.optionsGrid}>
                  {getUniqueAttributeValues(key).map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.optionButton} ${selectedAttributes[key] === val ? styles.optionButtonActive : ""}`}
                      onClick={() => handleSelectAttribute(key, val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantidade e CTA de Adicionar ao Carrinho */}
        <div>
          {activeVariant && activeVariant.stockQuantity > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className={styles.purchaseSection}>
                {/* Seletor de Quantidade */}
                <select
                  className={styles.qtySelect}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  aria-label="Quantidade do produto"
                >
                  {[...Array(Math.min(10, activeVariant.stockQuantity))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                {/* Botão Adicionar ao Carrinho */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={styles.addToCartButton}
                >
                  <ShoppingCart size={20} />
                  <span>Adicionar ao Carrinho</span>
                </button>
              </div>

              {/* Status de estoque e SKU */}
              <span className={styles.stockStatus}>
                Disponível em estoque ({activeVariant.stockQuantity} unidades) - SKU: {activeVariant.sku}
              </span>
            </div>
          ) : (
            <div className={styles.stockStatus} style={{ color: "var(--error)" }}>
              Produto indisponível para a combinação selecionada.
            </div>
          )}
        </div>

        {/* Simulador de Frete Correios / Local (Ananindeua) */}
        <div className={styles.shippingSimulator}>
          <span className={styles.variantLabel}>Calcular Frete e Prazo</span>
          <form onSubmit={handleSimulateShipping} className={styles.shippingForm}>
            <input
              type="text"
              className={styles.shippingInput}
              placeholder="Digite seu CEP (Ex: 67113970)"
              maxLength={9}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              aria-label="CEP para simulação de frete"
            />
            <button type="submit" className={styles.shippingButton} disabled={isShippingLoading}>
              {isShippingLoading ? "Calculando..." : "Calcular"}
            </button>
          </form>

          {/* Resultados da Simulação de Frete */}
          {shippingResults && (
            <div className={styles.shippingResults}>
              {shippingResults.map((opt) => (
                <div key={opt.id} className={styles.shippingRow}>
                  <div>
                    <strong>{opt.name}</strong>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {opt.description}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", fontWeight: "600" }}>
                    <span style={{ color: opt.priceCents === 0 ? "var(--success)" : "inherit" }}>
                      {opt.priceCents === 0 ? "Grátis" : (opt.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {opt.estimatedDays} {opt.estimatedDays === 1 ? "dia útil" : "dias úteis"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
