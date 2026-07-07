"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Interface do Item do Carrinho de Compras
 */
export interface CartItem {
  variantId: string;      // ID único da variante (SKU)
  productId: string;      // ID do produto principal
  name: string;           // Nome do produto
  sku: string;            // Código SKU
  attributes: Record<string, string>; // Ex: { cor: "Vermelho", tamanho: "41" }
  priceCents: number;     // Preço em centavos
  image: string;          // URL da imagem de exibição
  quantity: number;       // Quantidade selecionada
  weightGrams: number;    // Peso em gramas
  stockQuantity: number;  // Limite de estoque para validação de UI
}

/**
 * Tipagem do Contexto do Carrinho
 */
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotalCents: number;
  cartWeightGrams: number;
  coupon: string | null;
  applyCoupon: (code: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Provider do Carrinho de Compras (CartProvider)
 * 
 * Centraliza e sincroniza a persistência do carrinho no localStorage do navegador.
 * Oferece as funções de inserção, remoção, alteração de quantidade e aplicação de cupom.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Carrega o carrinho salvo no localStorage ao inicializar e valida se os itens ainda existem no banco
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("dnt_cart");
      const savedCoupon = localStorage.getItem("dnt_coupon");
      if (savedCoupon) {
        setCoupon(savedCoupon);
      }

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        setCart(parsedCart);
      }
    } catch (error) {
      console.error("Erro ao ler carrinho do localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  // 2. Salva o carrinho no localStorage sempre que houver alteração
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("dnt_cart", JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  // 3. Salva o cupom no localStorage sempre que houver alteração
  useEffect(() => {
    if (isInitialized) {
      if (coupon) {
        localStorage.setItem("dnt_coupon", coupon);
      } else {
        localStorage.removeItem("dnt_coupon");
      }
    }
  }, [coupon, isInitialized]);

  // Adiciona item ou atualiza quantidade se já existente
  const addToCart = (newItem: Omit<CartItem, "quantity">, quantityToAdd = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.variantId === newItem.variantId);

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const newQty = updatedCart[existingItemIndex].quantity + quantityToAdd;
        // Valida contra o estoque disponível no banco
        updatedCart[existingItemIndex].quantity = Math.min(newQty, newItem.stockQuantity);
        return updatedCart;
      }

      return [...prevCart, { ...newItem, quantity: Math.min(quantityToAdd, newItem.stockQuantity) }];
    });
  };

  // Remove item do carrinho
  const removeFromCart = (variantId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.variantId !== variantId));
  };

  // Atualiza quantidade específica de um SKU no carrinho
  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(quantity, item.stockQuantity) }
          : item
      )
    );
  };

  // Limpa todos os itens do carrinho e remove cupom
  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const applyCoupon = (code: string | null) => {
    setCoupon(code);
  };

  // Cálculos dinâmicos derivados do estado do carrinho
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotalCents = cart.reduce((total, item) => total + item.priceCents * item.quantity, 0);
  const cartWeightGrams = cart.reduce((total, item) => total + item.weightGrams * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotalCents,
        cartWeightGrams,
        coupon,
        applyCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Custom Hook para consumir as funcionalidades do carrinho
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart deve ser usado de dentro de um CartProvider");
  }
  return context;
}
