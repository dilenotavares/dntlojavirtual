"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingCart, Truck, ArrowRight, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  priceCents: number;
  estimatedDays: number;
  description: string;
}

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotalCents,
    cartWeightGrams,
    coupon,
    applyCoupon,
  } = useCart();

  // Estados locais
  const [zip, setZip] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponDiscountCents, setCouponDiscountCents] = useState(0);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");

  // 1. Carrega opções e cupons persistidos nas sessões locais se existirem
  useEffect(() => {
    const savedOption = localStorage.getItem("dnt_shipping_option");
    if (savedOption) {
      try {
        setSelectedOption(JSON.parse(savedOption));
      } catch (e) {
        console.error(e);
      }
    }

    const savedZip = localStorage.getItem("dnt_zip");
    if (savedZip) {
      setZip(savedZip);
      // Auto-calcular se o cep estiver preenchido e tiver itens
      if (cart.length > 0) {
        calculateShipping(savedZip);
      }
    }
  }, [cart.length]);

  // Recalcula o frete se os itens ou pesos do carrinho mudarem
  useEffect(() => {
    if (zip.replace(/\D/g, "").length === 8 && cart.length > 0) {
      calculateShipping(zip);
    } else {
      setShippingOptions([]);
      setSelectedOption(null);
      localStorage.removeItem("dnt_shipping_option");
    }
  }, [cartSubtotalCents, cartWeightGrams]);

  // Efeito para validar e recalcular desconto do cupom ativo
  useEffect(() => {
    if (coupon) {
      validateAndApplyCoupon(coupon, false);
    } else {
      setCouponDiscountCents(0);
      setCouponSuccessMsg("");
    }
  }, [coupon, cartSubtotalCents]);

  // Função para simular o frete
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zip.replace(/\D/g, "");
    if (cleanZip.length !== 8) {
      setShippingError("Digite um CEP válido com 8 números.");
      return;
    }
    setShippingError("");
    localStorage.setItem("dnt_zip", cleanZip);
    calculateShipping(cleanZip);
  };

  const calculateShipping = async (targetZip: string) => {
    setIsShippingLoading(true);
    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: targetZip,
          weightGrams: cartWeightGrams,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShippingOptions(data.options);
        
        // Mantém a opção previamente selecionada se ainda disponível
        if (selectedOption) {
          const stillAvailable = data.options.find((o: ShippingOption) => o.id === selectedOption.id);
          if (stillAvailable) {
            setSelectedOption(stillAvailable);
            localStorage.setItem("dnt_shipping_option", JSON.stringify(stillAvailable));
          } else {
            setSelectedOption(data.options[0]);
            localStorage.setItem("dnt_shipping_option", JSON.stringify(data.options[0]));
          }
        } else {
          // Seleciona a primeira por padrão
          setSelectedOption(data.options[0]);
          localStorage.setItem("dnt_shipping_option", JSON.stringify(data.options[0]));
        }
      } else {
        const errorData = await response.json();
        setShippingError(errorData.error || "Erro ao calcular frete.");
      }
    } catch (err) {
      console.error(err);
      setShippingError("Erro de comunicação ao calcular o frete.");
    } finally {
      setIsShippingLoading(false);
    }
  };

  const handleSelectShipping = (option: ShippingOption) => {
    setSelectedOption(option);
    localStorage.setItem("dnt_shipping_option", JSON.stringify(option));
  };

  // Função para aplicar cupom de desconto
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    validateAndApplyCoupon(couponCodeInput.trim(), true);
  };

  const validateAndApplyCoupon = async (code: string, showFeedbackAlert: boolean) => {
    setCouponLoading(true);
    setCouponError("");
    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        let discount = 0;

        if (data.discountType === "PERCENTAGE") {
          // data.valueCents = 1000 representa 10% (1000 basis points)
          discount = Math.round(cartSubtotalCents * (data.valueCents / 10000));
          setCouponSuccessMsg(`Cupom ${data.code} aplicado: ${data.valueCents / 100}% de desconto!`);
        } else if (data.discountType === "FIXED_AMOUNT") {
          discount = Math.min(data.valueCents, cartSubtotalCents);
          setCouponSuccessMsg(
            `Cupom ${data.code} aplicado: - ${(data.valueCents / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}`
          );
        }

        setCouponDiscountCents(discount);
        applyCoupon(data.code);
        if (showFeedbackAlert) {
          setCouponCodeInput("");
        }
      } else {
        const errorData = await response.json();
        setCouponError(errorData.error || "Erro ao aplicar cupom.");
        setCouponDiscountCents(0);
        applyCoupon(null);
      }
    } catch (err) {
      console.error(err);
      setCouponError("Erro ao validar cupom.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    setCouponCodeInput("");
    setCouponDiscountCents(0);
    setCouponSuccessMsg("");
    setCouponError("");
    localStorage.removeItem("dnt_coupon");
  };

  // Navegar para o Checkout
  const handleGoToCheckout = () => {
    if (cart.length === 0) return;
    
    // Salva o total calculado para consistência
    localStorage.setItem("dnt_checkout_subtotal", cartSubtotalCents.toString());
    localStorage.setItem("dnt_checkout_discount", couponDiscountCents.toString());
    localStorage.setItem("dnt_checkout_shipping", (selectedOption?.priceCents || 0).toString());
    
    router.push("/checkout");
  };

  // Cálculos financeiros finais
  const shippingCostCents = selectedOption ? selectedOption.priceCents : 0;
  const totalCents = Math.max(0, cartSubtotalCents - couponDiscountCents + shippingCostCents);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Se o carrinho estiver vazio
  if (cart.length === 0) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={`${styles.content} container`}>
          <div className={`${styles.emptyCart} glass animate-scale-in`}>
            <ShoppingCart size={64} className={styles.emptyIcon} />
            <h1 className={styles.emptyTitle}>Seu carrinho está vazio</h1>
            <p className={styles.emptyDesc}>
              Parece que você ainda não adicionou produtos. Explore nosso catálogo e encontre as melhores ofertas para você!
            </p>
            <Link href="/catalog" className={styles.btnPrimary}>
              Ir para o Catálogo
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={`${styles.content} container`}>
        <h1 className={styles.title}>Meu Carrinho</h1>
        <p className={styles.subtitle}>Confira os itens selecionados e avance para a finalização.</p>

        <div className={styles.layout}>
          {/* Coluna 1: Lista de Itens do Carrinho */}
          <div className={styles.cartList}>
            {cart.map((item) => (
              <div key={item.variantId} className={`${styles.cartItem} glass`}>
                {/* Imagem do Produto */}
                <div className={styles.itemImageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className={styles.itemImage} />
                </div>

                {/* Detalhes do Produto */}
                <div className={styles.itemDetails}>
                  <Link href={`/product/${item.productId}`}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                  </Link>
                  <p className={styles.itemSku}>SKU: {item.sku}</p>
                  
                  {/* Atributos da Variante */}
                  <div className={styles.itemAttributes}>
                    {Object.entries(item.attributes).map(([key, value]) => (
                      <span key={key} className={styles.attributeTag}>
                        {key}: {value}
                      </span>
                    ))}
                  </div>

                  <p className={styles.itemPrice}>{formatCurrency(item.priceCents)}</p>
                </div>

                {/* Ações: Qtd e Remover */}
                <div className={styles.itemActions}>
                  <div className={styles.qtyWrapper}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className={styles.qtyButton}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.qtyInput} aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className={styles.qtyButton}
                      disabled={item.quantity >= item.stockQuantity}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.variantId)}
                    className={styles.removeButton}
                    title="Remover item do carrinho"
                    aria-label={`Remover ${item.name} do carrinho`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna 2: Resumo e Cálculos */}
          <div className={styles.summarySidebar}>
            {/* Bloco de Resumo de Valores */}
            <div className={`${styles.summaryCard} glass`}>
              <h2 className={styles.summaryTitle}>Resumo da Compra</h2>
              
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotalCents)}</span>
              </div>

              {couponDiscountCents > 0 && (
                <div className={styles.summaryRow} style={{ color: "var(--success)" }}>
                  <span>Desconto Cupom</span>
                  <span>- {formatCurrency(couponDiscountCents)}</span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Frete</span>
                <span>
                  {selectedOption ? (
                    selectedOption.priceCents === 0 ? (
                      <span style={{ color: "var(--success)" }}>Grátis</span>
                    ) : (
                      formatCurrency(selectedOption.priceCents)
                    )
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Não calculado</span>
                  )}
                </span>
              </div>

              <div className={styles.summaryRowTotal}>
                <span>Total Geral</span>
                <span>{formatCurrency(totalCents)}</span>
              </div>

              {/* Botão de Checkout */}
              <button
                type="button"
                onClick={handleGoToCheckout}
                className={styles.checkoutButton}
                disabled={cart.length === 0}
              >
                <span>Finalizar Compra</span>
                <ArrowRight size={18} />
              </button>

              <Link href="/catalog" className={styles.continueShopping}>
                Continuar Comprando
              </Link>
            </div>

            {/* Simulador de Frete */}
            <div className={`${styles.shippingCard} glass`}>
              <h3 className={styles.shippingTitle}>
                <Truck size={18} color="var(--primary)" />
                <span>Calcular Entrega</span>
              </h3>
              <form onSubmit={handleShippingSubmit} className={styles.shippingForm}>
                <input
                  type="text"
                  placeholder="CEP (ex: 67113970)"
                  className={styles.inputField}
                  maxLength={9}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
                <button type="submit" className={styles.btnSecondary} disabled={isShippingLoading}>
                  {isShippingLoading ? "..." : "Calcular"}
                </button>
              </form>

              {shippingError && <p className={`${styles.couponStatus} ${styles.couponError}`}>{shippingError}</p>}

              {shippingOptions.length > 0 && (
                <div className={styles.shippingResults}>
                  {shippingOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectShipping(opt)}
                      className={`${styles.shippingOption} ${selectedOption?.id === opt.id ? styles.shippingOptionActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="shipping_opt"
                        checked={selectedOption?.id === opt.id}
                        onChange={() => handleSelectShipping(opt)}
                        style={{ marginTop: "4px" }}
                      />
                      <div className={styles.shippingOptionInfo}>
                        <div className={styles.shippingOptionName}>{opt.name}</div>
                        <div className={styles.shippingOptionDesc}>{opt.description}</div>
                      </div>
                      <div>
                        <div className={styles.shippingOptionPrice}>
                          {opt.priceCents === 0 ? (
                            <span style={{ color: "var(--success)" }}>Grátis</span>
                          ) : (
                            formatCurrency(opt.priceCents)
                          )}
                        </div>
                        <div className={styles.shippingOptionDays}>
                          {opt.estimatedDays} {opt.estimatedDays === 1 ? "dia" : "dias"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campo de Cupons de Desconto */}
            <div className={`${styles.shippingCard} glass`}>
              <h3 className={styles.shippingTitle}>
                <Sparkles size={18} color="var(--primary)" />
                <span>Cupom de Desconto</span>
              </h3>
              <form onSubmit={handleCouponSubmit} className={styles.couponForm}>
                <input
                  type="text"
                  placeholder="Código do cupom"
                  className={styles.inputField}
                  style={{ textTransform: "uppercase" }}
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  disabled={couponLoading || !!coupon}
                />
                <button type="submit" className={styles.btnSecondary} disabled={couponLoading || !!coupon}>
                  {couponLoading ? "..." : "Aplicar"}
                </button>
              </form>

              {couponError && <p className={`${styles.couponStatus} ${styles.couponError}`}>{couponError}</p>}
              
              {couponSuccessMsg && (
                <div className={styles.couponStatus}>
                  <span className={styles.couponSuccess}>{couponSuccessMsg}</span>
                  <span onClick={handleRemoveCoupon} className={styles.couponRemove}>
                    Remover
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
