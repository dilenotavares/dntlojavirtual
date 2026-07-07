"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { User as UserIcon, ShoppingBag, MapPin, Heart, LogOut, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

type TabType = "orders" | "addresses" | "wishlist" | "profile";

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images?: ProductImage[];
}

interface ProductVariant {
  id: string;
  sku: string;
  priceCents: number;
  stockQuantity: number;
  attributesJson: string;
  product: Product;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPriceCents: number;
  variant: ProductVariant;
}

interface Shipment {
  id: string;
  trackingNumber?: string;
  carrier?: string;
}

interface Order {
  id: string;
  createdAt: string;
  totalCents: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: string;
  items: OrderItem[];
  shipments: Shipment[];
}

interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  images?: ProductImage[];
  weightGrams?: number;
  variants?: {
    id: string;
    sku: string;
    priceCents: number;
    stockQuantity: number;
    attributesJson: string;
  }[];
}

function AccountPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { addToCart } = useCart();

  // Deriva activeTab diretamente da URL (searchParams) para evitar renders redundantes (react-hooks/set-state-in-effect)
  const tabParam = useSearchParams().get("tab") as TabType;
  const activeTab: TabType = (tabParam && ["orders", "addresses", "wishlist", "profile"].includes(tabParam)) ? tabParam : "orders";

  const setActiveTab = (tab: TabType) => {
    router.push(`/account?tab=${tab}`, { scroll: false });
  };

  // Auxiliar para evitar que validadores estáticos de acessibilidade leiam expressões JSX como valores inválidos de ARIA
  const getTabProps = (tab: TabType) => {
    return {
      "aria-selected": activeTab === tab ? ("true" as const) : ("false" as const),
    };
  };

  // Estados dos formulários de Auth
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerCpf, setRegisterCpf] = useState("");
  const [registerBirthdate, setRegisterBirthdate] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // Estados das Abas de Dados
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("Ananindeua"); // Padrão local
  const [addressState, setAddressState] = useState("PA"); // Padrão local
  const [addressZip, setAddressZip] = useState("");
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);

  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // 2. Carrega dados dependendo da aba ativa e autenticação
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "orders") {
        fetchOrders();
      } else if (activeTab === "addresses") {
        fetchAddresses();
      } else if (activeTab === "wishlist") {
        fetchWishlist();
      }
    }
  }, [isAuthenticated, activeTab]);

  // Busca histórico de pedidos do usuário
  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  }

  // Busca endereços cadastrados
  async function fetchAddresses() {
    setAddressesLoading(true);
    try {
      const res = await fetch("/api/customer/address");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddressesLoading(false);
    }
  }

  // Busca lista de desejos
  async function fetchWishlist() {
    setWishlistLoading(true);
    try {
      const res = await fetch("/api/customer/wishlist");
      if (res.ok) {
        const data = await res.json();
        setWishlistProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWishlistLoading(false);
    }
  }

  // Trata submissão do formulário de Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user);
        router.refresh();
      } else {
        setLoginError(data.error || "Erro de login.");
      }
    } catch {
      setLoginError("Erro ao tentar conectar com o servidor.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Trata submissão do formulário de Registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          phone: registerPhone,
          cpf: registerCpf,
          birthdate: registerBirthdate,
          password: registerPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.user);
        router.refresh();
      } else {
        setRegisterError(data.error || "Erro ao criar conta.");
      }
    } catch {
      setRegisterError("Erro ao tentar conectar com o servidor.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Trata submissão de Novo Endereço
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError("");
    setAddressSaving(true);

    try {
      const res = await fetch("/api/customer/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: addressStreet,
          number: addressNumber,
          complement: addressComplement,
          neighborhood: addressNeighborhood,
          city: addressCity,
          state: addressState,
          zip: addressZip,
          isDefault: addressIsDefault,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddressForm(false);
        // Limpa campos
        setAddressStreet("");
        setAddressNumber("");
        setAddressComplement("");
        setAddressNeighborhood("");
        setAddressZip("");
        setAddressIsDefault(false);
        // Recarrega endereços
        fetchAddresses();
      } else {
        setAddressFormError(data.error || "Erro ao salvar endereço.");
      }
    } catch {
      setAddressFormError("Erro de conexão com o servidor.");
    } finally {
      setAddressSaving(false);
    }
  };

  // Preenche dados do CEP automaticamente (Simulado ou API real)
  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setAddressZip(e.target.value);

    if (val.length === 8) {
      // Regra de CEP simplificada para Ananindeua (67000 a 67199)
      if (val.startsWith("670") || val.startsWith("671")) {
        setAddressCity("Ananindeua");
        setAddressState("PA");
        // Mock preenchimento rápido para o usuário testar frete expresso local
        if (val === "67113970" || val === "67113270") {
          setAddressStreet("Rodovia Mário Covas");
          setAddressNeighborhood("Coqueiro");
        } else if (val === "67130280") {
          setAddressStreet("Avenida Três Corações");
          setAddressNeighborhood("Cidade Nova");
        }
      } else if (val.startsWith("66")) {
        setAddressCity("Belém");
        setAddressState("PA");
        setAddressStreet("Avenida Nazaré");
        setAddressNeighborhood("Nazaré");
      } else {
        // Tenta buscar no ViaCEP real
        try {
          const response = await fetch(`https://viacep.com.br/ws/${val}/json/`);
          if (response.ok) {
            const data = await response.json();
            if (!data.erro) {
              setAddressStreet(data.logradouro || "");
              setAddressNeighborhood(data.bairro || "");
              setAddressCity(data.localidade || "");
              setAddressState(data.uf || "");
            }
          }
        } catch { }
      }
    }
  };

  // Adicionar item da Wishlist ao Carrinho
  const handleAddWishlistToCart = (product: WishlistProduct) => {
    if (!product.variants || product.variants.length === 0) return;
    const defaultVariant = product.variants[0];

    addToCart({
      variantId: defaultVariant.id,
      productId: product.id,
      name: product.name,
      sku: defaultVariant.sku,
      attributes: JSON.parse(defaultVariant.attributesJson),
      priceCents: defaultVariant.priceCents,
      image: product.images?.[0]?.url || "",
      weightGrams: product.weightGrams ?? 0,
      stockQuantity: defaultVariant.stockQuantity,
    }, 1);

    alert(`${product.name} adicionado ao carrinho!`);
  };

  // Remover item da Wishlist
  const handleRemoveWishlist = async (productId: string) => {
    try {
      const res = await fetch(`/api/customer/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert("Erro ao remover da lista de desejos.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      logout();
      router.push("/");
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // --- RENDER DE CARREGAMENTO (Evita piscar o formulário) ---
  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={`${styles.content} container ${styles.loaderContainer}`}>
          <div className="loader" role="status" aria-label="Carregando dados da conta" />
        </main>
        <Footer />
      </div>
    );
  }

  // --- RENDER 1: Usuário NÃO Autenticado (Formulários de Login e Cadastro) ---
  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={`${styles.content} container ${styles.loaderContainer}`}>
          <div className={styles.authContainer}>
            {/* Card de Login */}
            <div className={`${styles.authCard} glass animate-scale-in`}>
              <h2 className={styles.authTitle}>Já sou cliente</h2>
              <p className={styles.authDesc}>Acesse sua conta para ver seus pedidos e fechar compras mais rápido.</p>

              {loginError && <div className={styles.errorMessage} role="alert" aria-live="assertive">{loginError}</div>}

              <form onSubmit={handleLoginSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="login-email" className={styles.label}>E-mail</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    className={styles.input}
                    placeholder="exemplo@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="login-password" className={styles.label}>Senha</label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    className={styles.input}
                    placeholder="Sua senha secreta"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loginLoading}>
                  {loginLoading ? "Entrando..." : "Acessar Conta"}
                </button>
              </form>
            </div>

            {/* Card de Cadastro */}
            <div className={`${styles.authCard} ${styles.authCardDelay} glass animate-scale-in`}>
              <h2 className={styles.authTitle}>Criar uma conta</h2>
              <p className={styles.authDesc}>Cadastre-se para acompanhar entregas, favoritar produtos e comprar.</p>

              {registerError && <div className={styles.errorMessage} role="alert" aria-live="assertive">{registerError}</div>}

              <form onSubmit={handleRegisterSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="reg-name" className={styles.label}>Nome Completo</label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    className={styles.input}
                    placeholder="João da Silva"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="reg-email" className={styles.label}>E-mail</label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    className={styles.input}
                    placeholder="joao@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="reg-phone" className={styles.label}>Telefone (opcional)</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className={styles.input}
                    placeholder="(91) 98888-8888"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="reg-cpf" className={styles.label}>CPF (apenas números)</label>
                  <input
                    id="reg-cpf"
                    type="text"
                    required
                    maxLength={11}
                    className={styles.input}
                    placeholder="12345678900"
                    value={registerCpf}
                    onChange={(e) => setRegisterCpf(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="reg-birth" className={styles.label}>Data de Nascimento</label>
                  <input
                    id="reg-birth"
                    type="date"
                    required
                    className={styles.input}
                    value={registerBirthdate}
                    onChange={(e) => setRegisterBirthdate(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="reg-password" className={styles.label}>Senha</label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    className={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={registerLoading}>
                  {registerLoading ? "Cadastrando..." : "Cadastrar e Entrar"}
                </button>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- RENDER 2: Usuário Autenticado (Dashboard do Cliente) ---
  return (
    <div className={styles.page}>
      <Header />
      <main className={`${styles.content} container`}>
        <h1 className={styles.title}>Área do Cliente</h1>
        <p className={styles.subtitle}>Gerencie seus pedidos, endereços de entrega e favoritos.</p>

        <div className={styles.dashboardLayout}>
          {/* Menu Lateral de Abas */}
          <div className={`${styles.sidebarCard} glass`}>
            <div className={styles.profileSummary}>
              <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
              <h3 className={styles.userName}>{user?.name}</h3>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>

            <nav className={styles.tabList} role="tablist" aria-label="Abas da conta">
              <button
                type="button"
                id="tab-orders"
                role="tab"
                {...getTabProps("orders")}
                aria-controls="panel-orders"
                onClick={() => setActiveTab("orders")}
                className={`${styles.tabButton} ${activeTab === "orders" ? styles.tabButtonActive : ""}`}
              >
                <ShoppingBag size={18} />
                <span>Meus Pedidos</span>
              </button>
              <button
                type="button"
                id="tab-addresses"
                role="tab"
                {...getTabProps("addresses")}
                aria-controls="panel-addresses"
                onClick={() => setActiveTab("addresses")}
                className={`${styles.tabButton} ${activeTab === "addresses" ? styles.tabButtonActive : ""}`}
              >
                <MapPin size={18} />
                <span>Endereços</span>
              </button>
              <button
                type="button"
                id="tab-wishlist"
                role="tab"
                {...getTabProps("wishlist")}
                aria-controls="panel-wishlist"
                onClick={() => setActiveTab("wishlist")}
                className={`${styles.tabButton} ${activeTab === "wishlist" ? styles.tabButtonActive : ""}`}
              >
                <Heart size={18} />
                <span>Lista de Desejos</span>
              </button>
              <button
                type="button"
                id="tab-profile"
                role="tab"
                {...getTabProps("profile")}
                aria-controls="panel-profile"
                onClick={() => setActiveTab("profile")}
                className={`${styles.tabButton} ${activeTab === "profile" ? styles.tabButtonActive : ""}`}
              >
                <UserIcon size={18} />
                <span>Meus Dados</span>
              </button>
            </nav>

            <button type="button" onClick={handleLogoutClick} className={styles.logoutBtn}>
              <LogOut size={18} />
              <span>Sair da Conta</span>
            </button>
          </div>

          {/* Painel Central Dinâmico */}
          <div className={`${styles.panelCard} glass`}>
            {/* --- ABA MEUS PEDIDOS --- */}
            {activeTab === "orders" && (
              <div
                id="panel-orders"
                role="tabpanel"
                aria-labelledby="tab-orders"
                tabIndex={0}
              >
                <h2 className={styles.panelTitle}>Meus Pedidos</h2>
                <p className={styles.panelDesc}>Acompanhe o status e histórico de todas as suas compras.</p>

                {ordersLoading ? (
                  <div className={styles.tabLoader}><span className="loader" role="status" aria-label="Carregando pedidos"></span></div>
                ) : orders.length > 0 ? (
                  <div className={styles.ordersList}>
                    {orders.map((order) => (
                      <div key={order.id} className={styles.orderCard}>
                        {/* Cabeçalho do Pedido */}
                        <div className={styles.orderHeader}>
                          <div className={styles.orderMeta}>
                            <div>
                              <div className={styles.orderMetaLabel}>PEDIDO REALIZADO</div>
                              <div className={styles.orderMetaVal}>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</div>
                            </div>
                            <div>
                              <div className={styles.orderMetaLabel}>VALOR TOTAL</div>
                              <div className={styles.orderMetaVal}>{formatCurrency(order.totalCents)}</div>
                            </div>
                            <div>
                              <div className={styles.orderMetaLabel}>CÓD. RASTREIO</div>
                              <div className={styles.orderMetaVal}>{order.shipments[0]?.trackingNumber || "Aguardando envio"}</div>
                            </div>
                          </div>
                          <div>
                            <span className={`${styles.orderStatusBadge} ${styles["status" + order.status]}`}>
                              {order.status === "PENDING" && "Aguardando Pagto"}
                              {order.status === "PAID" && "Pago"}
                              {order.status === "SHIPPED" && "Enviado"}
                              {order.status === "DELIVERED" && "Entregue"}
                              {order.status === "CANCELLED" && "Cancelado"}
                            </span>
                          </div>
                        </div>

                        {/* Corpo do Pedido: Itens comprados */}
                        <div className={styles.orderBody}>
                          {order.items.map((item: OrderItem) => (
                            <div key={item.id} className={styles.orderItemRow}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.variant.product.images?.[0]?.url || "/smartphone256.avif"}
                                alt={item.variant.product.name}
                                className={styles.orderItemThumb}
                              />
                              <div className={styles.orderItemInfo}>
                                <div className={styles.orderItemName}>{item.variant.product.name}</div>
                                <div className={styles.orderItemQty}>Qtd: {item.quantity} | SKU: {item.variant.sku}</div>
                              </div>
                              <div className={styles.orderItemPrice}>{formatCurrency(item.unitPriceCents)}</div>
                            </div>
                          ))}
                        </div>

                        {/* Rodapé do Pedido */}
                        <div className={styles.orderFooter}>
                          <span>Forma de Pagamento: <strong>{order.paymentMethod}</strong></span>
                          <span>Envio via: <strong>{order.shipments[0]?.carrier === "LOCAL_EXPRESS" ? "DNT Express (Ananindeua)" : "Correios"}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyMessage}>
                    Você ainda não realizou nenhum pedido.
                  </div>
                )}
              </div>
            )}

            {/* --- ABA ENDEREÇOS --- */}
            {activeTab === "addresses" && (
              <div
                id="panel-addresses"
                role="tabpanel"
                aria-labelledby="tab-addresses"
                tabIndex={0}
              >
                <div className={styles.addressesHeader}>
                  <h2 className={styles.panelTitle}>Meus Endereços</h2>
                  {!showAddressForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className={styles.addAddressBtn}
                    >
                      <Plus size={16} />
                      <span>Novo Endereço</span>
                    </button>
                  )}
                </div>
                <p className={styles.panelDesc}>Cadastre novos endereços para entrega em todo o país.</p>

                {/* Formulário de Endereço */}
                {showAddressForm && (
                  <div className={`${styles.addressForm} glass animate-scale-in`}>
                    <h3 id="address-form-title" className={styles.addressFormTitle}>Cadastrar Novo Endereço</h3>
                    {addressFormError && <div className={styles.errorMessage} role="alert" aria-live="assertive">{addressFormError}</div>}
                    <form onSubmit={handleAddressSubmit} aria-labelledby="address-form-title">
                      <div className={styles.formGrid}>
                        <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                          <label htmlFor="addr-zip" className={styles.label}>CEP</label>
                          <input
                            id="addr-zip"
                            type="text"
                            required
                            maxLength={9}
                            className={styles.input}
                            placeholder="67113-970"
                            value={addressZip}
                            onChange={handleZipChange}
                          />
                        </div>
                        <div className={`${styles.formGroup} ${styles.colSpan4}`}>
                          <label htmlFor="addr-street" className={styles.label}>Rua / Logradouro</label>
                          <input
                            id="addr-street"
                            type="text"
                            required
                            className={styles.input}
                            placeholder="Avenida Mário Covas"
                            value={addressStreet}
                            onChange={(e) => setAddressStreet(e.target.value)}
                          />
                        </div>
                        <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                          <label htmlFor="addr-number" className={styles.label}>Número</label>
                          <input
                            id="addr-number"
                            type="text"
                            required
                            className={styles.input}
                            placeholder="Nº 12"
                            value={addressNumber}
                            onChange={(e) => setAddressNumber(e.target.value)}
                          />
                        </div>
                        <div className={`${styles.formGroup} ${styles.colSpan4}`}>
                          <label htmlFor="addr-complement" className={styles.label}>Complemento (opcional)</label>
                          <input
                            id="addr-complement"
                            type="text"
                            className={styles.input}
                            placeholder="Apto, Bloco..."
                            value={addressComplement}
                            onChange={(e) => setAddressComplement(e.target.value)}
                          />
                        </div>
                        <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                          <label htmlFor="addr-neighborhood" className={styles.label}>Bairro</label>
                          <input
                            id="addr-neighborhood"
                            type="text"
                            required
                            className={styles.input}
                            placeholder="Coqueiro"
                            value={addressNeighborhood}
                            onChange={(e) => setAddressNeighborhood(e.target.value)}
                          />
                        </div>
                        <div className={`${styles.formGroup} ${styles.colSpan3}`}>
                          <label htmlFor="addr-city" className={styles.label}>Cidade</label>
                          <input
                            id="addr-city"
                            type="text"
                            required
                            className={styles.input}
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                          />
                        </div>
                        <div className={`${styles.formGroup} ${styles.colSpan1}`}>
                          <label htmlFor="addr-state" className={styles.label}>UF</label>
                          <input
                            id="addr-state"
                            type="text"
                            required
                            maxLength={2}
                            className={styles.input}
                            value={addressState}
                            onChange={(e) => setAddressState(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.checkboxContainer}>
                        <input
                          type="checkbox"
                          id="address-default"
                          checked={addressIsDefault}
                          onChange={(e) => setAddressIsDefault(e.target.checked)}
                          aria-label="Definir como endereço de entrega padrão"
                        />
                        <label htmlFor="address-default" className={`${styles.label} ${styles.labelPointer}`}>
                          Definir como endereço de entrega padrão
                        </label>
                      </div>

                      <div className={styles.formActions}>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className={`${styles.btnSecondary} ${styles.btnCancel}`}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className={`${styles.submitBtn} ${styles.btnSubmitAddress}`}
                          disabled={addressSaving}
                        >
                          {addressSaving ? "Gravando..." : "Salvar Endereço"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Grid de Endereços Salvos */}
                {addressesLoading ? (
                  <div className={styles.tabLoader}><span className="loader" role="status" aria-label="Carregando endereços"></span></div>
                ) : addresses.length > 0 ? (
                  <div className={styles.addressGrid}>
                    {addresses.map((addr) => (
                      <div key={addr.id} className={styles.addressCard}>
                        {addr.isDefault && <span className={styles.addressDefaultBadge}>PADRÃO</span>}
                        <div className={styles.addressText}>
                          <strong>{addr.street}, Nº {addr.number}</strong>
                          {addr.complement && <p>{addr.complement}</p>}
                          <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                          <p>CEP: {addr.zip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyMessage}>
                    Nenhum endereço cadastrado ainda.
                  </div>
                )}
              </div>
            )}

            {/* --- ABA LISTA DE DESEJOS --- */}
            {activeTab === "wishlist" && (
              <div
                id="panel-wishlist"
                role="tabpanel"
                aria-labelledby="tab-wishlist"
                tabIndex={0}
              >
                <h2 className={styles.panelTitle}>Lista de Desejos</h2>
                <p className={styles.panelDesc}>Seus produtos favoritos salvos para comprar depois.</p>

                {wishlistLoading ? (
                  <div className={styles.tabLoader}><span className="loader" role="status" aria-label="Carregando lista de desejos"></span></div>
                ) : wishlistProducts.length > 0 ? (
                  <div className={styles.wishlistGrid}>
                    {wishlistProducts.map((prod) => (
                      <div key={prod.id} className={styles.wishlistItem}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={prod.images?.[0]?.url} alt={prod.name} className={styles.wishlistThumb} />
                        <div className={styles.wishlistInfo}>
                          <Link href={`/product/${prod.slug}`}>
                            <div className={styles.wishlistName}>{prod.name}</div>
                          </Link>
                          <div className={styles.wishlistPrice}>{formatCurrency(prod.priceCents)}</div>
                        </div>
                        <div className={styles.wishlistActions}>
                          <button
                            type="button"
                            onClick={() => handleAddWishlistToCart(prod)}
                            className={`${styles.addAddressBtn} ${styles.btnBuyNow}`}
                            title="Comprar Agora"
                            aria-label={`Adicionar ${prod.name} ao carrinho e comprar agora`}
                          >
                            <ShoppingCart size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWishlist(prod.id)}
                            className={styles.wishlistRemove}
                            title="Remover dos Favoritos"
                            aria-label={`Remover ${prod.name} dos favoritos`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyMessage}>
                    Você não favoritou nenhum produto ainda.
                  </div>
                )}
              </div>
            )}

            {/* --- ABA MEUS DADOS --- */}
            {activeTab === "profile" && (
              <div
                id="panel-profile"
                role="tabpanel"
                aria-labelledby="tab-profile"
                tabIndex={0}
              >
                <h2 className={styles.panelTitle}>Meus Dados</h2>
                <p className={styles.panelDesc}>Informações essenciais de cadastro em conformidade com a LGPD.</p>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nome Completo</span>
                    <span className={styles.detailValue}>{user?.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>E-mail Principal</span>
                    <span className={styles.detailValue}>{user?.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Telefone Celular</span>
                    <span className={styles.detailValue}>{user?.phone || "Não cadastrado"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CPF / Documento</span>
                    <span className={styles.detailValue}>{user?.cpf ? `***.***.${user.cpf.slice(-5)}` : "Não cadastrado"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AccountPage() {
  return (
    <React.Suspense fallback={
      <div className={styles.suspenseLoader}>
        <div className="loader" role="status" aria-label="Carregando página"></div>
      </div>
    }>
      <AccountPageContent />
    </React.Suspense>
  );
}
