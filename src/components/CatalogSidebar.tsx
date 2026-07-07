"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./CatalogSidebar.module.css";

/**
 * Interface do Filtro Categoria
 */
interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

/**
 * Interface das propriedades de CatalogSidebar
 */
interface CatalogSidebarProps {
  categories: CategoryItem[];
  currentCategory?: string;
  currentSearch?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentSort?: string;
}

/**
 * Componente CatalogSidebar (Barra Lateral do Catálogo)
 * 
 * Permite filtrar os produtos por termos digitados, categoria do banco de dados
 * e valores mínimo/máximo de preço (formatados/convertidos de centavos para exibição).
 * Empurra as novas consultas de filtro para a URL de forma reativa.
 */
export default function CatalogSidebar({
  categories,
  currentCategory = "",
  currentSearch = "",
  currentMinPrice = "",
  currentMaxPrice = "",
  }: CatalogSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  

  // Estados locais dos formulários de entrada
  const [search, setSearch] = useState(currentSearch);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  // Sincroniza os estados locais caso a URL mude externamente
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(currentSearch);
    setMinPrice(currentMinPrice);
    setMaxPrice(currentMaxPrice);
  }, [currentCategory, currentSearch, currentMinPrice, currentMaxPrice]);

  // Executa a navegação gerando os novos parâmetros de busca
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    if (minPrice) {
      // Converte o valor digitado (Ex: 100) para centavos (10000)
      const cents = Math.round(parseFloat(minPrice) * 100);
      params.set("minPrice", cents.toString());
    } else {
      params.delete("minPrice");
    }

    if (maxPrice) {
      const cents = Math.round(parseFloat(maxPrice) * 100);
      params.set("maxPrice", cents.toString());
    } else {
      params.delete("maxPrice");
    }

    // Reseta para a primeira página caso existisse paginação
    router.push(`/catalog?${params.toString()}`);
  };

  // Trata cliques diretos em categorias
  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`/catalog?${params.toString()}`);
  };

  // Limpa todos os filtros e recarrega o catálogo limpo
  const handleResetFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/catalog");
  };

  return (
    <aside className={styles.sidebar}>
      {/* Formulário Principal de Filtros */}
      <form onSubmit={handleApplyFilters} className={styles.filterGroup}>
        <div className={styles.filterGroup}>
          <label htmlFor="searchInput" className={styles.title}>Buscar Produto</label>
          <input
            id="searchInput"
            type="text"
            className={styles.input}
            placeholder="Digite sua busca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Faixa de Preço */}
        <div className={styles.filterGroup}>
          <span className={styles.title}>Faixa de Preço (R$)</span>
          <div className={styles.priceRange}>
            <input
              type="number"
              className={styles.input}
              placeholder="Mín"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              aria-label="Preço mínimo"
            />
            <span>-</span>
            <input
              type="number"
              className={styles.input}
              placeholder="Máx"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              aria-label="Preço máximo"
            />
          </div>
        </div>

        {/* Ações de Formulário */}
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.applyButton}>
            Aplicar Filtros
          </button>
          <button type="button" onClick={handleResetFilters} className={styles.resetButton}>
            Limpar Tudo
          </button>
        </div>
      </form>

      {/* Lista de Categorias do Banco */}
      <div className={styles.filterGroup}>
        <span className={styles.title}>Categorias</span>
        <nav className={styles.categoryList} aria-label="Navegação por categorias">
          <button
            type="button"
            className={`${styles.categoryLink} ${!currentCategory ? styles.categoryLinkActive : ""}`}
            onClick={() => handleCategoryClick("")}
          >
            Todas as Categorias
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.categoryLink} ${currentCategory === cat.slug ? styles.categoryLinkActive : ""}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
