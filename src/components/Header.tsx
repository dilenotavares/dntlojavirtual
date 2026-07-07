"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User, Sun, Moon, Heart, Sparkles, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";

/**
 * Componente de Cabeçalho (Header)
 * 
 * Renderiza o logotipo premium, os links principais de navegação (Home, Catálogo),
 * a alternância de temas Claro/Escuro (persistida no localStorage) e atalhos para
 * Lista de Desejos, Carrinho (com contador reativo) e Área do Cliente.
 */
export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 1. Inicializa o tema a partir das preferências salvas no navegador
  useEffect(() => {
    const savedTheme = (localStorage.getItem("dnt_theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // 2. Alterna o tema e salva a nova configuração
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("dnt_theme", newTheme);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logotipo Premium com ícone de brilho */}
        <Link href="/" className={styles.logo} aria-label="DNT Loja Virtual Home" onClick={() => setIsMenuOpen(false)}>
          <Sparkles size={24} className={styles.logoAccent} />
          <span>DNT<span className={styles.logoAccent}>Loja</span></span>
        </Link>

        {/* Links de navegação principais com indicador de página ativa */}
        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${pathname === "/" ? styles.active : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Início
          </Link>
          <Link 
            href="/categories" 
            className={`${styles.navLink} ${pathname === "/categories" ? styles.active : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Categorias
          </Link>
          <Link 
            href="/catalog" 
            className={`${styles.navLink} ${pathname === "/catalog" ? styles.active : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Produtos
          </Link>
          <Link 
            href="/contact" 
            className={`${styles.navLink} ${pathname === "/contact" ? styles.active : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Contato
          </Link>
          <Link 
            href="/about" 
            className={`${styles.navLink} ${pathname === "/about" ? styles.active : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Quem Somos
          </Link>
        </nav>

        {/* Área de ações do cliente (Tema, Wishlist, Conta e Carrinho) */}
        <div className={styles.actions}>
          {/* Botão de Menu Hambúrguer para Mobile */}
          <button 
            onClick={toggleMenu} 
            className={styles.menuToggle}
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Alternador de Tema Escuro / Claro */}
          <button 
            onClick={toggleTheme} 
            className={`${styles.actionButton} ${styles.themeToggle}`}
            title={theme === "light" ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
            aria-label="Alternar tema visual"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Atalho para Wishlist (apenas para logados) */}
          {isAuthenticated && (
            <Link 
              href="/account?tab=wishlist" 
              className={styles.actionButton}
              title="Minha Lista de Desejos"
              aria-label="Lista de desejos"
            >
              <Heart size={20} />
            </Link>
          )}

          {/* Atalho para Conta do Usuário / Login */}
          <Link 
            href={isAuthenticated ? "/account" : "/account"} // Aponta para a mesma rota que gerencia login/perfil
            className={styles.profileMenu}
            title={isAuthenticated ? "Minha Conta" : "Fazer Login"}
            aria-label="Área do cliente"
          >
            <User size={20} />
            <span style={{ display: "none" }}>Perfil</span>
            <span style={{ display: "inline", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isAuthenticated ? user?.name?.split(" ")[0] : "Entrar"}
            </span>
          </Link>

          {/* Botão de Carrinho com badge dinâmico */}
          <Link 
            href="/cart" 
            className={styles.actionButton}
            title="Carrinho de Compras"
            aria-label={`Carrinho com ${cartCount} itens`}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className={styles.badge} aria-hidden="true">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
