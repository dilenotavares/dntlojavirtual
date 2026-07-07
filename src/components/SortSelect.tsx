"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../app/catalog/page.module.css";

/**
 * Interface das propriedades de SortSelect
 */
interface SortSelectProps {
  currentSort?: string;
}

/**
 * Componente SortSelect
 * 
 * Renderiza um elemento select do HTML estilizado para ordenar os produtos.
 * Trata o evento de alteração atualizando a query "sort" na URL sem recarregar a página.
 */
export default function SortSelect({ currentSort = "newest" }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Executado sempre que a ordenação for trocada
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;

    if (val && val !== "newest") {
      params.set("sort", val);
    } else {
      params.delete("sort");
    }

    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <select
      className={styles.sortSelect}
      value={currentSort}
      onChange={handleSortChange}
      aria-label="Ordenar produtos"
    >
      <option value="newest">Mais Recentes</option>
      <option value="price-asc">Menor Preço</option>
      <option value="price-desc">Maior Preço</option>
    </select>
  );
}
