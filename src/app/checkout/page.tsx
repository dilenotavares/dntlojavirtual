"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Truck, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Copy, Check, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  priceCents: number;
  estimatedDays: number;
  description: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { cart, clearCart, cartSubtotalCents, cartWeightGrams, coupon } = useCart();

  // Fluxo de passos (1: Endereço, 2: Frete, 3: Pagamento)
  const [step, setStep] = useState(1);

  // Passo 1: Endereço
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Campos do novo endereço
  const [addrStreet, setAddrStreet] = useState("");
  const [addrNumber, setAddrNumber] = useState("");
  const [addrComplement, setAddrComplement] = useState("");
  const [addrNeighborhood, setAddrNeighborhood] = useState("");
  const [addrCity, setAddrCity] = useState("Ananindeua");
  const [addrState, setAddrState] = useState("PA");
  const [addrZip, setAddrZip] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Passo 2: Frete
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  // Passo 3: Pagamento
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | "BOLETO">("PIX");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardInstallments, setCardInstallments] = useState("1");
  const [cardError, setCardError] = useState("");

  // Estado Geral de Processamento do Checkout
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Tela de Sucesso
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING");
  const [copiedPix, setCopiedPix] = useState(false);
  const [pixSimulating, setPixSimulating] = useState(false);

  // Valores Finais recalculados no Frontend
  const [discountCents, setDiscountCents] = useState(0);

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/account?tab=login");
    }
  }, [isLoading, isAuthenticated]);

  // Se o carrinho estiver vazio e não finalizou a compra, volta ao carrinho
  useEffect(() => {
    if (!isLoading && cart.length === 0 && !orderCreatedId) {
      router.push("/cart");
    }
  }, [isLoading, cart.length, orderCreatedId]);

  // Inicializa dados e endereços do cliente
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
      loadCheckoutValues();
    }
  }, [isAuthenticated]);

  const loadCheckoutValues = () => {
    // Carrega o desconto calculado na página do carrinho para exibição inicial
    const savedDiscount = localStorage.getItem("dnt_checkout_discount");
    if (savedDiscount) {
      setDiscountCents(parseInt(savedDiscount));
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await fetch("/api/customer/address");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
        
        // Seleciona o endereço padrão ou o primeiro da lista
        const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (data.addresses.length > 0) {
          setSelectedAddressId(data.addresses[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Cadastro rápido de CEP (Preenchimento automático do formulário)
  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setAddrZip(e.target.value);

    if (val.length === 8) {
      if (val.startsWith("670") || val.startsWith("671")) {
        setAddrCity("Ananindeua");
        setAddrState("PA");
        if (val === "67113970") {
          setAddrStreet("Rodovia Mário Covas");
          setAddrNeighborhood("Coqueiro");
        } else if (val === "67130280") {
          setAddrStreet("Avenida Três Corações");
          setAddrNeighborhood("Cidade Nova");
        }
      } else {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
          if (res.ok) {
            const data = await res.json();
            if (!data.erro) {
              setAddrStreet(data.logradouro || "");
              setAddrNeighborhood(data.bairro || "");
              setAddrCity(data.localidade || "");
              setAddrState(data.uf || "");
            }
          }
        } catch {}
      }
    }
  };

  // Salvar novo endereço direto do checkout
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");
    setAddressSaving(true);

    try {
      const res = await fetch("/api/customer/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: addrStreet,
          number: addrNumber,
          complement: addrComplement,
          neighborhood: addrNeighborhood,
          city: addrCity,
          state: addrState,
          zip: addrZip,
          isDefault: true, // Adiciona e já seleciona como padrão
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddressForm(false);
        setAddrStreet("");
        setAddrNumber("");
        setAddrComplement("");
        setAddrNeighborhood("");
        setAddrZip("");
        
        // Recarrega endereços e seleciona o recém-criado
        await fetchAddresses();
        setSelectedAddressId(data.address.id);
      } else {
        setAddressError(data.error || "Erro ao salvar endereço.");
      }
    } catch (err) {
      setAddressError("Erro ao conectar com o servidor.");
    } finally {
      setAddressSaving(false);
    }
  };

  // Avançar para o Passo 2: Calcula o frete com base no CEP do endereço selecionado
  const handleAdvanceToShipping = async () => {
    if (!selectedAddressId) return;

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) return;

    setStep(2);
    setShippingLoading(true);
    setShippingError("");

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: selectedAddr.zip,
          weightGrams: cartWeightGrams,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShippingOptions(data.options || []);
        
        // Seleciona a primeira opção de frete por padrão
        if (data.options.length > 0) {
          setSelectedShipping(data.options[0]);
        }
      } else {
        setShippingError("Não foi possível calcular as opções de envio.");
      }
    } catch (e) {
      setShippingError("Erro de comunicação logística.");
    } finally {
      setShippingLoading(false);
    }
  };

  // Avançar para o Passo 3: Pagamento e Revisão
  const handleAdvanceToPayment = () => {
    if (!selectedShipping) return;
    setStep(3);
  };

  // Finalização do Pedido
  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !selectedShipping) return;

    // Validação específica do cartão se for o caso
    if (paymentMethod === "CREDIT_CARD") {
      if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        setCardError("Por favor, preencha todos os campos do cartão.");
        return;
      }
      setCardError("");
    }

    setIsSubmitting(true);
    setCheckoutError("");

    try {
      const itemsPayload = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload,
          addressId: selectedAddressId,
          shippingCostCents: selectedShipping.priceCents,
          shippingMethod: selectedShipping.id,
          paymentMethod,
          couponCode: coupon,
          cardDetails: paymentMethod === "CREDIT_CARD" ? {
            name: cardName,
            number: cardNumber.slice(-4), // Apenas dados não sensíveis no log
            installments: parseInt(cardInstallments),
          } : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderCreatedId(data.orderId);
        setPaymentStatus(data.paymentStatus);
        
        // Limpa carrinho local e persistências de checkout
        clearCart();
        localStorage.removeItem("dnt_checkout_subtotal");
        localStorage.removeItem("dnt_checkout_discount");
        localStorage.removeItem("dnt_checkout_shipping");
        localStorage.removeItem("dnt_shipping_option");
      } else {
        setCheckoutError(data.error || "Ocorreu um erro ao processar o seu pedido.");
      }
    } catch (err) {
      setCheckoutError("Erro de comunicação ao fechar pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simular pagamento via PIX na tela de sucesso
  const handleSimulatePixPayment = async () => {
    if (!orderCreatedId) return;
    setPixSimulating(true);

    try {
      const res = await fetch("/api/orders/simulate-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderCreatedId }),
      });

      if (res.ok) {
        setPaymentStatus("APPROVED");
      } else {
        alert("Erro na simulação do pagamento.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPixSimulating(false);
    }
  };

  // Formatação de valores
  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const shippingCostCents = selectedShipping ? selectedShipping.priceCents : 0;
  const totalCents = Math.max(0, cartSubtotalCents - discountCents + shippingCostCents);

  // --- RENDER DE CARREGAMENTO (Evita flashes de tela e redirecionamentos abruptos) ---
  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={`${styles.content} container`} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="loader"></div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- RENDER DE SUCESSO PÓS-COMPRA ---
  if (orderCreatedId) {
    const isPaid = paymentStatus === "APPROVED";
    return (
      <div className={styles.page}>
        <Header />
        <main className={`${styles.content} container`}>
          <div className={`${styles.successContainer} glass`}>
            <div className={styles.successIcon}>
              <CheckCircle size={48} />
            </div>
            
            <h1 className={styles.successTitle}>
              {isPaid ? "Compra Confirmada!" : "Pedido Recebido!"}
            </h1>
            
            <p className={styles.successDesc}>
              {isPaid
                ? "Seu pagamento foi aprovado com sucesso. Estamos preparando seu pedido para envio rápido!"
                : "Seu pedido foi registrado no sistema. Aguardamos a confirmação do pagamento para prosseguir."}
            </p>

            <div className={styles.orderNumberBox}>
              Pedido Nº: <span style={{ color: "var(--primary)" }}>{orderCreatedId.slice(0, 8).toUpperCase()}</span>
            </div>

            {/* Instruções do PIX */}
            {paymentMethod === "PIX" && !isPaid && (
              <div className={styles.pixContainer}>
                <div style={{ fontWeight: "700" }}>Pague com PIX para aprovação imediata</div>
                
                {/* QR Code de teste */}
                <div className={styles.qrCodePlaceholder}>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020126580014br.gov.bcb.pix0136dnt-loja-virtual-pix-ananindeua-pa520400005303986540500.005802BR5924DNT%20LOJA%20VIRTUAL%20LTDA6009ANANINDEUA62070503***6304abcd"
                    alt="QR Code PIX para pagamento simulado"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>

                <p className={styles.pixInstructions}>
                  Escaneie o QR Code acima pelo app do seu banco ou copie a linha de pagamento abaixo.
                </p>

                <div className={styles.pixCodeBox}>
                  00020126580014br.gov.bcb.pix0136dnt-loja-virtual-pix-ananindeua-pa520400005303986540500.005802BR5924DNT%20LOJA%20VIRTUAL%20LTDA6009ANANINDEUA62070503***6304abcd
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136dnt-loja-virtual-pix-ananindeua-pa520400005303986540500.005802BR5924DNT%20LOJA%20VIRTUAL%20LTDA6009ANANINDEUA62070503***6304abcd");
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2000);
                  }}
                  className={styles.btnBack}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
                >
                  {copiedPix ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                  <span>{copiedPix ? "Código Copiado!" : "Copiar Código PIX"}</span>
                </button>

                {/* Simulador de webhook PIX (Botão Premium) */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px dashed var(--border)", width: "100%" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                    <Info size={12} style={{ marginRight: "4px", display: "inline" }} />
                    Ambiente de testes: Clique no botão abaixo para simular o banco enviando a confirmação do PIX.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulatePixPayment}
                    className={styles.btnNext}
                    style={{ width: "100%", justifyContent: "center", background: "var(--success)" }}
                    disabled={pixSimulating}
                  >
                    {pixSimulating ? "Processando..." : "Simular Confirmação do PIX"}
                  </button>
                </div>
              </div>
            )}

            {/* Instruções do Boleto */}
            {paymentMethod === "BOLETO" && !isPaid && (
              <div className={styles.boletoContainer}>
                <div style={{ fontWeight: "700" }}>Linha Digitável do Boleto</div>
                <div className={styles.pixCodeBox}>
                  34191.79001 01043.513184 91020.150008 7 93070000015000
                </div>
                <p className={styles.pixInstructions}>
                  O boleto bancário leva de 1 a 2 dias úteis para compensação após o pagamento.
                </p>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert("Boleto PDF gerado ficticiamente."); }}
                  className={styles.btnBack}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  Visualizar Boleto PDF
                </a>
              </div>
            )}

            <div style={{ marginTop: "40px" }}>
              <Link href="/account?tab=orders" className={styles.btnHome}>
                Acompanhar Pedidos
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- RENDER DO FLUXO DO CHECKOUT ---
  return (
    <div className={styles.page}>
      <Header />
      <main className={`${styles.content} container`}>
        {/* Barra de Progresso de Passos */}
        <div className={styles.stepsBar}>
          <div className={`${styles.stepIndicator} ${step >= 1 ? styles.stepActive : ""} ${step > 1 ? styles.stepCompleted : ""}`}>
            <div className={styles.stepCircle}>1</div>
            <div className={styles.stepLabel}>Entrega</div>
          </div>
          <div className={`${styles.stepIndicator} ${step >= 2 ? styles.stepActive : ""} ${step > 2 ? styles.stepCompleted : ""}`}>
            <div className={styles.stepCircle}>2</div>
            <div className={styles.stepLabel}>Envio</div>
          </div>
          <div className={`${styles.stepIndicator} ${step >= 3 ? styles.stepActive : ""}`}>
            <div className={styles.stepCircle}>3</div>
            <div className={styles.stepLabel}>Pagamento</div>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Coluna 1: Conteúdo do Passo Ativo */}
          <div>
            {checkoutError && <div className={styles.errorMessage}>{checkoutError}</div>}

            {/* PASSO 1: Seleção ou Cadastro de Endereço */}
            {step === 1 && (
              <div className={`${styles.panelCard} glass animate-scale-in`}>
                <h2 className={styles.panelTitle}>
                  <MapPin size={22} color="var(--primary)" />
                  <span>Escolha o Endereço de Entrega</span>
                </h2>

                {addressesLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}><span className="loader"></span></div>
                ) : !showAddressForm ? (
                  <div>
                    {addresses.length > 0 ? (
                      <div className={styles.addressGrid}>
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`${styles.addressOption} ${selectedAddressId === addr.id ? styles.addressOptionActive : ""}`}
                          >
                            <input
                              type="radio"
                              name="addr_select"
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              style={{ marginTop: "4px" }}
                            />
                            <div className={styles.addressInfo}>
                              <strong>{addr.street}, Nº {addr.number}</strong>
                              {addr.complement && <p>{addr.complement}</p>}
                              <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                              <p>CEP: {addr.zip}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
                        Você não possui nenhum endereço cadastrado.
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className={styles.addAddressBtn}
                      >
                        Cadastrar Novo Endereço
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleAdvanceToShipping}
                        disabled={!selectedAddressId}
                        className={styles.btnNext}
                      >
                        <span>Avançar para Envio</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Form de novo endereço direto no checkout
                  <div className="animate-scale-in">
                    {addressError && <div className={styles.errorMessage}>{addressError}</div>}
                    <form onSubmit={handleSaveAddress}>
                      <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>CEP</label>
                          <input
                            type="text"
                            required
                            maxLength={9}
                            className={styles.input}
                            placeholder="67113970"
                            value={addrZip}
                            onChange={handleZipChange}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Rua / Avenida</label>
                          <input
                            type="text"
                            required
                            className={styles.input}
                            value={addrStreet}
                            onChange={(e) => setAddrStreet(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Número</label>
                          <input
                            type="text"
                            required
                            className={styles.input}
                            value={addrNumber}
                            onChange={(e) => setAddrNumber(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Complemento (Apto, bloco...)</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={addrComplement}
                            onChange={(e) => setAddrComplement(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Bairro</label>
                          <input
                            type="text"
                            required
                            className={styles.input}
                            value={addrNeighborhood}
                            onChange={(e) => setAddrNeighborhood(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Cidade</label>
                          <input
                            type="text"
                            required
                            className={styles.input}
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Estado (UF)</label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            className={styles.input}
                            value={addrState}
                            onChange={(e) => setAddrState(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.actionButtons}>
                        <button type="button" onClick={() => setShowAddressForm(false)} className={styles.btnBack}>
                          Cancelar
                        </button>
                        <button type="submit" className={styles.btnNext} disabled={addressSaving}>
                          {addressSaving ? "Salvar..." : "Salvar e Usar"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* PASSO 2: Seleção de Método de Envio (Logística) */}
            {step === 2 && (
              <div className={`${styles.panelCard} glass animate-scale-in`}>
                <h2 className={styles.panelTitle}>
                  <Truck size={22} color="var(--primary)" />
                  <span>Selecione a Opção de Envio</span>
                </h2>

                {shippingLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}><span className="loader"></span></div>
                ) : shippingError ? (
                  <div>
                    <div className={styles.errorMessage}>{shippingError}</div>
                    <button type="button" onClick={() => setStep(1)} className={styles.btnBack}>
                      Voltar para endereço
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                      {shippingOptions.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedShipping(opt)}
                          className={`${styles.addressOption} ${selectedShipping?.id === opt.id ? styles.addressOptionActive : ""}`}
                          style={{ cursor: "pointer" }}
                        >
                          <input
                            type="radio"
                            name="shipping_opt"
                            checked={selectedShipping?.id === opt.id}
                            onChange={() => setSelectedShipping(opt)}
                            style={{ marginTop: "4px" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "700" }}>{opt.name}</div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                              {opt.description}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: "700", color: opt.priceCents === 0 ? "var(--success)" : "inherit" }}>
                              {opt.priceCents === 0 ? "Grátis" : formatCurrency(opt.priceCents)}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {opt.estimatedDays} {opt.estimatedDays === 1 ? "dia útil" : "dias úteis"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.actionButtons}>
                      <button type="button" onClick={() => setStep(1)} className={styles.btnBack}>
                        <ArrowLeft size={16} style={{ marginRight: "4px", display: "inline" }} />
                        <span>Voltar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAdvanceToPayment}
                        disabled={!selectedShipping}
                        className={styles.btnNext}
                      >
                        <span>Avançar para Pagamento</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASSO 3: Forma de Pagamento */}
            {step === 3 && (
              <div className={`${styles.panelCard} glass animate-scale-in`}>
                <h2 className={styles.panelTitle}>
                  <CreditCard size={22} color="var(--primary)" />
                  <span>Método de Pagamento</span>
                </h2>

                {/* Seleção do Método */}
                <div className={styles.paymentGrid}>
                  <div
                    onClick={() => setPaymentMethod("PIX")}
                    className={`${styles.paymentOption} ${paymentMethod === "PIX" ? styles.paymentOptionActive : ""}`}
                  >
                    <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>PIX</div>
                    <span>Aprovação instantânea</span>
                  </div>
                  <div
                    onClick={() => setPaymentMethod("CREDIT_CARD")}
                    className={`${styles.paymentOption} ${paymentMethod === "CREDIT_CARD" ? styles.paymentOptionActive : ""}`}
                  >
                    <CreditCard size={20} />
                    <span>Cartão de Crédito</span>
                  </div>
                  <div
                    onClick={() => setPaymentMethod("BOLETO")}
                    className={`${styles.paymentOption} ${paymentMethod === "BOLETO" ? styles.paymentOptionActive : ""}`}
                  >
                    <div style={{ fontWeight: "700" }}>BOLETO</div>
                    <span>1 a 2 dias úteis</span>
                  </div>
                </div>

                {/* Conteúdo dinâmico dependendo da forma de pagamento */}
                {paymentMethod === "PIX" && (
                  <div className="animate-scale-in" style={{ padding: "16px 0", color: "var(--text-secondary)" }}>
                    <p>Ao clicar em "Confirmar Pedido", o QR Code PIX e o código copia e cola correspondentes serão gerados para finalização do pagamento.</p>
                  </div>
                )}

                {paymentMethod === "BOLETO" && (
                  <div className="animate-scale-in" style={{ padding: "16px 0", color: "var(--text-secondary)" }}>
                    <p>Ao confirmar, o boleto bancário será gerado. Você poderá imprimir ou copiar a linha digitável para pagamento pelo internet banking do seu banco.</p>
                  </div>
                )}

                {paymentMethod === "CREDIT_CARD" && (
                  <div className={`${styles.creditCardForm} animate-scale-in`}>
                    {cardError && <div className={styles.errorMessage} style={{ marginBottom: "16px" }}>{cardError}</div>}
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup} style={{ gridColumn: "span 4" }}>
                        <label className={styles.label}>Número do Cartão</label>
                        <input
                          type="text"
                          required
                          className={styles.input}
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: "span 4" }}>
                        <label className={styles.label}>Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          required
                          className={styles.input}
                          placeholder="JOSÉ DA SILVA"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                        <label className={styles.label}>Expiração (MM/AA)</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          className={styles.input}
                          placeholder="12/29"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                        <label className={styles.label}>CVV</label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          className={styles.input}
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: "span 4" }}>
                        <label className={styles.label}>Opções de Parcelamento</label>
                        <select
                          className={styles.input}
                          value={cardInstallments}
                          onChange={(e) => setCardInstallments(e.target.value)}
                        >
                          {[...Array(10)].map((_, i) => {
                            const months = i + 1;
                            const value = totalCents / months;
                            return (
                              <option key={months} value={months}>
                                {months}x de {formatCurrency(value)} sem juros
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.actionButtons} style={{ marginTop: "32px" }}>
                  <button type="button" onClick={() => setStep(2)} className={styles.btnBack}>
                    <ArrowLeft size={16} style={{ marginRight: "4px", display: "inline" }} />
                    <span>Voltar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className={styles.btnNext}
                  >
                    <span>{isSubmitting ? "Finalizando..." : "Confirmar Pedido"}</span>
                    <CheckCircle size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coluna 2: Resumo Financeiro Fixo */}
          <div className={`${styles.summaryCard} glass`}>
            <h2 className={styles.summaryTitle}>Resumo da Compra</h2>
            
            {/* Lista resumida de itens */}
            <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "16px", paddingRight: "8px" }}>
              {cart.map((item) => (
                <div key={item.variantId} className={styles.itemSummaryRow}>
                  <span style={{ maxWidth: "70%", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                    {item.quantity}x {item.name}
                  </span>
                  <strong>{formatCurrency(item.priceCents * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(cartSubtotalCents)}</span>
            </div>

            {discountCents > 0 && (
              <div className={styles.summaryRow} style={{ color: "var(--success)" }}>
                <span>Desconto Cupom</span>
                <span>- {formatCurrency(discountCents)}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span>Envio / Frete</span>
              <span>
                {selectedShipping ? (
                  selectedShipping.priceCents === 0 ? (
                    <span style={{ color: "var(--success)" }}>Grátis</span>
                  ) : (
                    formatCurrency(selectedShipping.priceCents)
                  )
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Não selecionado</span>
                )}
              </span>
            </div>

            <div className={styles.summaryRowTotal}>
              <span>Total Geral</span>
              <span>{formatCurrency(totalCents)}</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
