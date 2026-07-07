import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

/**
 * Script de Semente (Seed) do Banco de Dados
 * 
 * Este script popula o banco de dados SQLite com dados de teste de tecnologia:
 * 1. Categorias tecnológicas (Smartphones, Informática, Fones & Áudio e Acessórios).
 * 2. Usuários padrão (Administrador e Cliente teste) com perfis (CPF) e senhas seguras.
 * 3. 16 Produtos completos com descrições detalhadas, pesos (para frete) e múltiplas imagens.
 * 4. Variantes de produtos (cores e especificações) com controle individual de preço e estoque.
 * 5. Cupons de desconto ativos para simulações no carrinho.
 * 6. Avaliações de produtos fictícias para compor a UX da página do produto.
 */

async function main() {
  console.log("=== Iniciando a Semeadura do Banco de Dados (Tecnologia) ===");

  // 1. Limpando dados antigos para garantir consistência
  console.log("Limpando tabelas existentes...");
  await db.auditLog.deleteMany();
  await db.review.deleteMany();
  await db.coupon.deleteMany();
  await db.shipment.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.image.deleteMany();
  await db.productCategory.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.profile.deleteMany();
  await db.address.deleteMany();
  await db.wishlist.deleteMany();
  await db.user.deleteMany();

  // 2. Criando Usuários
  console.log("Criando usuários de teste...");
  const passwordHash = await bcrypt.hash("senha123", 10);

  // Cliente Comum para Testes Locais (com endereço em Ananindeua, PA)
  const customer = await db.user.create({
    data: {
      email: "cliente@dnt.com.br",
      passwordHash,
      name: "Dileno Nogueira de Ananindeua",
      phone: "(91) 98765-4321",
      profile: {
        create: {
          cpf: "123.456.789-00",
          birthdate: new Date("1995-10-15T00:00:00.000Z"),
          preferences: JSON.stringify({ theme: "dark", favoriteCategory: "smartphones" }),
        },
      },
      addresses: {
        create: [
          {
            street: "Rodovia Mário Covas",
            number: "1500",
            complement: "Apto 302 Bloco B",
            neighborhood: "Coqueiro",
            city: "Ananindeua",
            state: "PA",
            zip: "67113-970",
            isDefault: true,
          },
          {
            street: "Avenida Três Corações",
            number: "250",
            neighborhood: "Cidade Nova",
            city: "Ananindeua",
            state: "PA",
            zip: "67130-280",
            isDefault: false,
          }
        ],
      },
    },
  });

  // Usuário Administrador
  const admin = await db.user.create({
    data: {
      email: "admin@dnt.com.br",
      passwordHash,
      name: "Administrador DNT",
      phone: "(91) 99999-9999",
    },
  });

  console.log(`Usuários criados: ${customer.name} (Cliente) e ${admin.name} (Admin)`);

  // 3. Criando Categorias
  console.log("Criando categorias tecnológicas...");
  const catSmartphones = await db.category.create({
    data: { name: "Smartphones", slug: "smartphones" },
  });

  const catInformatica = await db.category.create({
    data: { name: "Informática", slug: "informatica" },
  });

  const catAudio = await db.category.create({
    data: { name: "Fones & Áudio", slug: "fones-e-audio" },
  });

  const catAcessorios = await db.category.create({
    data: { name: "Acessórios", slug: "acessorios" },
  });

  console.log("Categorias estruturadas com sucesso.");

  // 4. Criando Cupons de Desconto
  console.log("Criando cupons de desconto...");
  await db.coupon.createMany({
    data: [
      {
        code: "ANANIN10",
        discountType: "PERCENTAGE",
        valueCents: 1000, // 10%
        isActive: true,
        usageLimit: 100,
      },
      {
        code: "DNTFRETE",
        discountType: "FIXED_AMOUNT",
        valueCents: 1500, // R$ 15,00
        isActive: true,
        usageLimit: 50,
      },
      {
        code: "BOASVINDAS",
        discountType: "PERCENTAGE",
        valueCents: 1500, // 15%
        isActive: true,
        usageLimit: 200,
      }
    ],
  });

  // 5. Criando Produtos e Variantes (Mínimo de 4 produtos por categoria)
  console.log("Inserindo produtos e variantes de catálogo...");

  // ==================== CATEGORIA: SMARTPHONES ====================

  const prodPhone1 = await db.product.create({
    data: {
      name: "Smartphone DNT Pro Max 256GB",
      slug: "smartphone-dnt-pro-max-256gb",
      description: "O smartphone definitivo com câmera profissional de 108MP, tela AMOLED de 120Hz e processador octa-core de última geração.",
      richDescription: "<h3>Experiência Visual Incrível</h3><p>Equipado com uma tela AMOLED de 6.7 polegadas e taxa de atualização de 120Hz, o DNT Pro Max oferece transições fluidas e cores ultra vibrantes.</p>",
      priceCents: 459900, // R$ 4.599,00
      comparePriceCents: 499900, // R$ 4.999,00
      weightGrams: 220,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catSmartphones.id }] },
      images: {
        create: [
          { entityType: "product", url: "/smartphone256.avif", altText: "Smartphone DNT Pro Max cor Grafite", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-PHONE-PRO-GRAF", attributesJson: JSON.stringify({ cor: "Grafite", armazenamento: "256GB" }), priceCents: 459900, stockQuantity: 15 },
        ],
      },
    },
  });

  const prodPhone2 = await db.product.create({
    data: {
      name: "Smartphone DNT Play 128GB",
      slug: "smartphone-dnt-play-128gb",
      description: "Perfeito para gamers casuais. Bateria de longa duração com 6000mAh e processador com refrigeração otimizada.",
      richDescription: "<h3>Energia Para o Dia Inteiro</h3><p>Bateria robusta de 6000mAh que garante até 2 dias de uso contínuo, perfeito para quem ama jogar ou assistir vídeos sem se preocupar.</p>",
      priceCents: 199900, // R$ 1.999,00
      comparePriceCents: 249900, // R$ 2.499,00
      weightGrams: 200,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catSmartphones.id }] },
      images: {
        create: [
          { entityType: "product", url: "/smartphoneplay128.avif", altText: "Smartphone DNT Play Azul", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-PHONE-PLAY-BLUE", attributesJson: JSON.stringify({ cor: "Azul", armazenamento: "128GB" }), priceCents: 199900, stockQuantity: 20 },
        ],
      },
    },
  });

  const prodPhone3 = await db.product.create({
    data: {
      name: "Smartphone DNT Lite 128GB",
      slug: "smartphone-dnt-lite-128gb",
      description: "Design ultrafino e leve com ótima câmera de 48MP. O melhor custo-benefício para o seu dia a dia.",
      richDescription: "<h3>Leveza e Praticidade</h3><p>Com apenas 7.2mm de espessura e acabamento fosco, cabe confortavelmente em qualquer bolso sem perder a elegância.</p>",
      priceCents: 129900, // R$ 1.299,00
      comparePriceCents: 149900, // R$ 1.499,00
      weightGrams: 165,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catSmartphones.id }] },
      images: {
        create: [
          { entityType: "product", url: "/smartphone128.avif", altText: "Smartphone DNT Lite Verde", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-PHONE-LITE-GREEN", attributesJson: JSON.stringify({ cor: "Verde", armazenamento: "128GB" }), priceCents: 129900, stockQuantity: 25 },
        ],
      },
    },
  });

  const prodPhone4 = await db.product.create({
    data: {
      name: "Smartphone DNT Ultra 5G 512GB",
      slug: "smartphone-dnt-ultra-5g-512gb",
      description: "Processador topo de linha, conexões 5G ultra-rápidas e tela curva com brilho de até 2000 nits. Pronto para o futuro.",
      richDescription: "<h3>Poder Absoluto e Conectividade</h3><p>Desfrute da velocidade do 5G integrada ao hardware mais potente do mercado, permitindo downloads instantâneos e streaming sem engasgos.</p>",
      priceCents: 379900, // R$ 3.799,00
      comparePriceCents: 419900, // R$ 4.199,00
      weightGrams: 215,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catSmartphones.id }] },
      images: {
        create: [
          { entityType: "product", url: "/smartphoneultra.avif", altText: "Smartphone DNT Ultra cor Prata", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-PHONE-ULTRA-SILVER", attributesJson: JSON.stringify({ cor: "Prateado", armazenamento: "512GB" }), priceCents: 379900, stockQuantity: 10 },
        ],
      },
    },
  });

  // ==================== CATEGORIA: INFORMÁTICA ====================

  const prodLaptop1 = await db.product.create({
    data: {
      name: "Notebook Gamer DNT Nitro 15.6\"",
      slug: "notebook-gamer-dnt-nitro-15-6",
      description: "Leve suas gameplays e produtividade ao extremo com a GPU dedicada RTX 4060, processador Ryzen 7 e SSD NVMe ultra-rápido.",
      richDescription: "<h3>Gráficos de Próxima Geração</h3><p>Equipado com a placa de vídeo NVIDIA GeForce RTX 4060 de 8GB GDDR6, você desfruta de ray tracing em tempo real.</p>",
      priceCents: 629900, // R$ 6.299,00
      comparePriceCents: 699900, // R$ 6.999,00
      weightGrams: 2400,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catInformatica.id }] },
      images: {
        create: [
          { entityType: "product", url: "/notebook-gamer.avif", altText: "Notebook Gamer DNT Nitro", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-LAP-NITRO-R7", attributesJson: JSON.stringify({ processador: "Ryzen 7", ram: "16GB" }), priceCents: 629900, stockQuantity: 8 },
        ],
      },
    },
  });

  const prodLaptop2 = await db.product.create({
    data: {
      name: "Notebook DNT Slim Ultra 14\"",
      slug: "notebook-dnt-slim-ultra-14",
      description: "Ultrafino em alumínio aeronáutico, processador Core i5, 16GB de RAM e SSD de 512GB. Ideal para trabalho e viagens.",
      richDescription: "<h3>Leveza e Elegância</h3><p>Com chassi premium de metal e peso de apenas 1.2kg, o Slim Ultra redefine o conceito de portabilidade para executivos e estudantes.</p>",
      priceCents: 329900, // R$ 3.299,00
      comparePriceCents: 359900, // R$ 3.599,00
      weightGrams: 1200,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catInformatica.id }] },
      images: {
        create: [
          { entityType: "product", url: "/notebookslimultra.avif", altText: "Notebook DNT Slim Ultra", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-LAP-SLIM-I5", attributesJson: JSON.stringify({ processador: "Core i5", ram: "16GB" }), priceCents: 329900, stockQuantity: 12 },
        ],
      },
    },
  });

  const prodLaptop3 = await db.product.create({
    data: {
      name: "Notebook DNT Workstation Pro 16\"",
      slug: "notebook-dnt-workstation-pro-16",
      description: "Potência absoluta para arquitetos, designers e programadores. Processador Core i9 com 32GB de RAM e 1TB SSD.",
      richDescription: "<h3>Criação Sem Limites</h3><p>Desenvolvido para lidar com simulações pesadas, renderização 3D rápida e compilação de código complexo sem hesitar.</p>",
      priceCents: 849900, // R$ 8.499,00
      comparePriceCents: 899900, // R$ 8.999,00
      weightGrams: 2100,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catInformatica.id }] },
      images: {
        create: [
          { entityType: "product", url: "/notebook-workstation-pro.avif", altText: "Notebook DNT Workstation Pro", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-LAP-WORK-I9", attributesJson: JSON.stringify({ processador: "Core i9", ram: "32GB" }), priceCents: 849900, stockQuantity: 5 },
        ],
      },
    },
  });

  const prodLaptop4 = await db.product.create({
    data: {
      name: "Notebook DNT Student Lite 15.6\"",
      slug: "notebook-dnt-student-lite-15-6",
      description: "Excelente para estudos e navegar na internet. Equipado com processador Intel Quad-Core e 8GB de RAM.",
      richDescription: "<h3>Foco nos Seus Estudos</h3><p>Uma tela confortável de 15.6 polegadas e teclado numérico completo para você digitar e estudar com a melhor ergonomia.</p>",
      priceCents: 179900, // R$ 1.799,00
      comparePriceCents: 199900, // R$ 1.999,00
      weightGrams: 1800,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catInformatica.id }] },
      images: {
        create: [
          { entityType: "product", url: "/notebookstudent.avif", altText: "Notebook DNT Student Lite", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-LAP-STUDENT", attributesJson: JSON.stringify({ processador: "Intel Celeron", ram: "8GB" }), priceCents: 179900, stockQuantity: 18 },
        ],
      },
    },
  });

  // ==================== CATEGORIA: FONES & ÁUDIO ====================

  const prodAudio1 = await db.product.create({
    data: {
      name: "Fone Sem Fio DNT Buds Pro",
      slug: "fone-sem-fio-dnt-buds-pro",
      description: "Cancelamento de ruído ativo (ANC), som Hi-Fi imersivo e estojo de carregamento com carregamento sem fio.",
      richDescription: "<h3>Isolamento Acústico Inteligente</h3><p>Elimine até 98% do ruído externo com o nosso cancelamento de ruído ativo adaptativo e concentre-se apenas na música.</p>",
      priceCents: 29900, // R$ 299,00
      comparePriceCents: 34900, // R$ 349,00
      weightGrams: 55,
      brand: "DNT Audio",
      categories: { create: [{ categoryId: catAudio.id }] },
      images: {
        create: [
          { entityType: "product", url: "/fone-sem-fio.avif", altText: "Fone Sem Fio DNT Buds Pro", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-EAR-BUDSPRO-BLACK", attributesJson: JSON.stringify({ cor: "Preto" }), priceCents: 29900, stockQuantity: 40 },
        ],
      },
    },
  });

  const prodAudio2 = await db.product.create({
    data: {
      name: "Headphone DNT Bass Boost",
      slug: "headphone-dnt-bass-boost",
      description: "Drivers de 40mm para graves profundos, almofadas de couro sintético macio e bateria para até 45 horas.",
      richDescription: "<h3>Graves Que Você Pode Sentir</h3><p>Com a tecnologia exclusiva Bass Boost da DNT, cada batida ganha vida com uma clareza excepcional de som.</p>",
      priceCents: 45900, // R$ 459,00
      comparePriceCents: 49900, // R$ 499,00
      weightGrams: 280,
      brand: "DNT Audio",
      categories: { create: [{ categoryId: catAudio.id }] },
      images: {
        create: [
          { entityType: "product", url: "/headphonebassboost.avif", altText: "Headphone DNT Bass Boost", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-HEAD-BASS-BLACK", attributesJson: JSON.stringify({ cor: "Grafite" }), priceCents: 45900, stockQuantity: 22 },
        ],
      },
    },
  });

  const prodAudio3 = await db.product.create({
    data: {
      name: "Caixa de Som Bluetooth DNT Wave",
      slug: "caixa-de-som-bluetooth-dnt-wave",
      description: "Totalmente à prova d'água (IPX7), 30W de potência RMS e até 12 horas de reprodução contínua.",
      richDescription: "<h3>Som Potente na Piscina</h3><p>Leve sua música para qualquer aventura. A DNT Wave resiste a quedas acidentais na água e oferece som em 360 graus.</p>",
      priceCents: 39900, // R$ 399,00
      comparePriceCents: 44900, // R$ 449,00
      weightGrams: 620,
      brand: "DNT Audio",
      categories: { create: [{ categoryId: catAudio.id }] },
      images: {
        create: [
          { entityType: "product", url: "/caixadesom bluetooth.avif", altText: "Caixa de Som DNT Wave", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-SPK-WAVE-RED", attributesJson: JSON.stringify({ cor: "Vermelho" }), priceCents: 39900, stockQuantity: 15 },
        ],
      },
    },
  });

  const prodAudio4 = await db.product.create({
    data: {
      name: "Fone Esportivo DNT FitSport",
      slug: "fone-esportivo-dnt-fitsport",
      description: "Ganchos confortáveis de orelha antiderrapantes, resistência ao suor IPX5 e conexão Bluetooth estável.",
      richDescription: "<h3>Foco no Seu Treino</h3><p>Com design ergonômico projetado para ficar firme no lugar durante treinos de alta intensidade e corrida de rua.</p>",
      priceCents: 18900, // R$ 189,00
      comparePriceCents: 21900, // R$ 219,00
      weightGrams: 35,
      brand: "DNT Audio",
      categories: { create: [{ categoryId: catAudio.id }] },
      images: {
        create: [
          { entityType: "product", url: "/foneesportivo.avif", altText: "Fone Esportivo DNT FitSport", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-EAR-FIT-GREEN", attributesJson: JSON.stringify({ cor: "Verde Esportivo" }), priceCents: 18900, stockQuantity: 30 },
        ],
      },
    },
  });

  // ==================== CATEGORIA: ACESSÓRIOS ====================

  const prodAccessory1 = await db.product.create({
    data: {
      name: "Adaptador Wi-Fi DNT Link AC1200",
      slug: "adaptador-wi-fi-dnt-link-ac1200",
      description: "Conexão de alta velocidade USB 3.0 dual-band (2.4GHz / 5GHz) com duas antenas de alto ganho integradas.",
      richDescription: "<h3>Sinal Estável e Veloz</h3><p>Elimine problemas de lag e queda de conexão no seu computador desktop com antenas externas ajustáveis de alto rendimento.</p>",
      priceCents: 9900, // R$ 99,00
      comparePriceCents: 12900, // R$ 129,00
      weightGrams: 90,
      brand: "DNT Link",
      categories: { create: [{ categoryId: catAcessorios.id }] },
      images: {
        create: [
          { entityType: "product", url: "adaptadorwifi.avif", altText: "Adaptador Wi-Fi DNT Link", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-WIFI-AC1200", attributesJson: JSON.stringify({ conexao: "USB 3.0" }), priceCents: 9900, stockQuantity: 50 },
        ],
      },
    },
  });

  const prodAccessory2 = await db.product.create({
    data: {
      name: "Teclado Mecânico Gamer DNT RGB",
      slug: "teclado-mecanico-gamer-dnt-rgb",
      description: "Switches mecânicos táteis Outemu Blue, retroiluminação RGB personalizável com software dedicado e layout ABNT2.",
      richDescription: "<h3>Precisão Mecânica</h3><p>Sinta o feedback e escute o clique clássico dos switches Outemu, projetados para durabilidade extrema de até 50 milhões de toques.</p>",
      priceCents: 34900, // R$ 349,00
      comparePriceCents: 39900, // R$ 399,00
      weightGrams: 950,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catAcessorios.id }] },
      images: {
        create: [
          { entityType: "product", url: "tecladogamer.avif", altText: "Teclado Mecânico DNT RGB", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-KB-MECHANICAL", attributesJson: JSON.stringify({ switch: "Outemu Blue" }), priceCents: 34900, stockQuantity: 20 },
        ],
      },
    },
  });

  const prodAccessory3 = await db.product.create({
    data: {
      name: "Mouse Óptico Gamer DNT Strike 12K DPI",
      slug: "mouse-optico-gamer-dnt-strike-12k-dpi",
      description: "Sensor óptico PixArt 3327 de alta precisão, 7 botões programáveis e iluminação RGB de até 16.8 milhões de cores.",
      richDescription: "<h3>Mira Perfeita</h3><p>Ergonomia superior com pegada texturizada antiderrapante e cliques de ativação super rápidos para melhorar seus reflexos.</p>",
      priceCents: 14900, // R$ 149,00
      comparePriceCents: 17900, // R$ 179,00
      weightGrams: 110,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catAcessorios.id }] },
      images: {
        create: [
          { entityType: "product", url: "mousegamer.avif", altText: "Mouse Gamer DNT Strike", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-MS-STRIKE", attributesJson: JSON.stringify({ switch: "Huatano" }), priceCents: 14900, stockQuantity: 35 },
        ],
      },
    },
  });

  const prodAccessory4 = await db.product.create({
    data: {
      name: "Carregador Rápido DNT Duo USB-C 65W",
      slug: "carregador-rapido-dnt-duo-usb-c-65w",
      description: "Tecnologia de nitreto de gálio (GaN) com duas portas (USB-C + USB-A) de carregamento super rápido para celulares e laptops.",
      richDescription: "<h3>Carregamento Eficiente e Compacto</h3><p>Graças à tecnologia GaN, tenha um carregador 40% menor que não esquenta e entrega potência total para recarregar seu notebook e celular juntos.</p>",
      priceCents: 19900, // R$ 199,00
      comparePriceCents: 24900, // R$ 249,00
      weightGrams: 130,
      brand: "DNT Tech",
      categories: { create: [{ categoryId: catAcessorios.id }] },
      images: {
        create: [
          { entityType: "product", url: "/carregador-rapido.avif", altText: "Carregador GaN DNT 65W", sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "DNT-CHG-GAN65W", attributesJson: JSON.stringify({ conexao: "Duo USB-C/A" }), priceCents: 19900, stockQuantity: 40 },
        ],
      },
    },
  });

  console.log("Produtos e variantes cadastrados.");

  // 6. Criando Avaliações fictícias (Reviews)
  console.log("Adicionando avaliações aos produtos...");
  await db.review.createMany({
    data: [
      {
        productId: prodPhone1.id,
        userName: "Renan Silva",
        rating: 5,
        comment: "Smartphone sensacional! A câmera é incrível e a bateria dura mais de um dia inteiro de uso pesado. A entrega expressa em Ananindeua levou menos de 2 horas. Muito satisfeito!",
      },
      {
        productId: prodPhone1.id,
        userName: "Ana Julia Lima",
        rating: 4,
        comment: "O telefone é excelente, tela super fluida. Apenas o carregador que poderia vir incluso na caixa, mas o produto in si é nota 10.",
      },
      {
        productId: prodLaptop1.id,
        userName: "Carlos André",
        rating: 5,
        comment: "Monstro demais! Roda todos os meus softwares de render 3D e jogos em 1080p/1440p sem engasgar. Excelente refrigeração.",
      },
      {
        productId: prodAudio1.id,
        userName: "Maria de Nazaré",
        rating: 5,
        comment: "Isolamento muito bom, perfeito para trabalhar ouvindo música. Chegou super rápido no meu endereço no bairro do Coqueiro.",
      },
      {
        productId: prodAccessory1.id,
        userName: "José Roberto",
        rating: 5,
        comment: "Meu computador de mesa ficava longe do roteador e o sinal caía toda hora. Esse adaptador Wi-Fi resolveu totalmente o problema!",
      }
    ],
  });

  console.log("Avaliações populadas.");

  // 7. Criando Log de Auditoria
  await db.auditLog.create({
    data: {
      action: "SYSTEM_SEED",
      details: "Banco de dados inicializado com sucesso usando novos produtos de tecnologia.",
    },
  });

  console.log("=== Semeadura Concluída com Sucesso! ===");
}

main()
  .catch((e) => {
    console.error("Erro durante o processo de seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
