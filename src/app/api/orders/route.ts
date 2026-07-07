import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  try {
    // 1. Autenticação do Usuário
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Faça login para concluir a compra." }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
    }

    const userId = payload.userId as string;
    const body = await request.json();
    const { items, addressId, shippingCostCents, shippingMethod, paymentMethod, cardDetails, couponCode } = body;

    // Validação básica dos dados recebidos
    if (!items || items.length === 0 || !addressId || !paymentMethod || !shippingMethod) {
      return NextResponse.json({ error: "Dados do pedido incompletos." }, { status: 400 });
    }

    // 2. Busca o endereço selecionado
    const address = await db.address.findUnique({
      where: { id: addressId, userId },
    });
    if (!address) {
      return NextResponse.json({ error: "Endereço de entrega não encontrado." }, { status: 400 });
    }

    // 3. Processa a compra dentro de uma Transação do Prisma (garante consistência de ACID)
    const result = await db.$transaction(async (tx) => {
      let subtotalCents = 0;
      const orderItemsToCreate = [];

      // Loop para verificar estoque e somar preços
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new Error(`Variante com SKU ${item.variantId} não encontrada.`);
        }

        // Verifica se há estoque suficiente
        if (variant.stockQuantity < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto: ${variant.product.name} (Disponível: ${variant.stockQuantity}, Solicitado: ${item.quantity}).`);
        }

        // Decrementa o estoque da variante
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        const itemTotal = variant.priceCents * item.quantity;
        subtotalCents += itemTotal;

        orderItemsToCreate.push({
          variantId: variant.id,
          quantity: item.quantity,
          unitPriceCents: variant.priceCents,
        });
      }

      // 4. Validação de Cupom de Desconto
      let discountCents = 0;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode, isActive: true },
        });

        if (coupon) {
          // Verifica expiração
          if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
            // Verifica limite de uso
            if (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit) {
              if (coupon.discountType === "PERCENTAGE") {
                // valueCents guarda a porcentagem multiplicada por 100 (ex: 10% = 1000)
                discountCents = Math.round((subtotalCents * coupon.valueCents) / 10000);
              } else {
                discountCents = coupon.valueCents;
              }
              // Atualiza contador de uso do cupom
              await tx.coupon.update({
                where: { id: coupon.id },
                data: { usageCount: { increment: 1 } },
              });
            }
          }
        }
      }

      // Calcula o total geral do pedido (evitando total negativo)
      const totalCents = Math.max(0, subtotalCents - discountCents + shippingCostCents);

      // 5. Cria o registro do Pedido (Order)
      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING", // Padrão inicial: Aguardando Pagamento
          totalCents,
          shippingCostCents,
          paymentMethod,
          shippingAddressId: `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state} (CEP: ${address.zip})`,
          items: {
            create: orderItemsToCreate,
          },
        },
      });

      // 6. Simulação do Gateway de Pagamento (Pagar.me / Cielo / MercadoPago)
      const transactionId = `TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      let paymentStatus = "PENDING";
      let paidAt: Date | null = null;

      if (paymentMethod === "CREDIT_CARD") {
        // Simulação de Cartão: Aprova automaticamente para fins de teste
        paymentStatus = "APPROVED";
        paidAt = new Date();
      } else if (paymentMethod === "PIX") {
        // PIX simula aprovação rápida, mas inicia como pendente até a "leitura" do QR Code
        paymentStatus = "PENDING";
      } else if (paymentMethod === "BOLETO") {
        // Boleto inicia sempre como pendente
        paymentStatus = "PENDING";
      }

      // Cria a transação de Pagamento
      await tx.payment.create({
        data: {
          orderId: order.id,
          gateway: paymentMethod === "CREDIT_CARD" ? "CIELO" : "PAGARME",
          status: paymentStatus,
          amountCents: totalCents,
          transactionId,
          paidAt,
        },
      });

      // Se o pagamento for aprovado de imediato (ex: cartão), atualiza o status do pedido
      if (paymentStatus === "APPROVED") {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });
      }

      // 7. Registra a Logística de Envio (Shipment)
      const estimatedDelivery = new Date();
      // Define prazo dinâmico simulado com base no método selecionado
      if (shippingMethod === "local_express") {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
      } else if (shippingMethod === "correios_sedex") {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
      } else {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
      }

      await tx.shipment.create({
        data: {
          orderId: order.id,
          carrier: shippingMethod === "local_express" ? "LOCAL_EXPRESS" : "CORREIOS",
          status: "PENDING",
          estimatedDelivery,
        },
      });

      // 8. Grava log de auditoria da transação de checkout (LGPD)
      await tx.auditLog.create({
        data: {
          userId,
          action: "ORDER_CREATED",
          details: `Pedido ${order.id} criado. Total: R$ ${(totalCents / 100).toFixed(2)}. Pagamento: ${paymentMethod}.`,
        },
      });

      return { order, transactionId, paymentStatus };
    });

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      transactionId: result.transactionId,
      paymentStatus: result.paymentStatus,
      message: "Pedido criado com sucesso!",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao fechar pedido:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor ao processar o checkout." },
      { status: 500 }
    );
  }
}

/**
 * Rota de Histórico de Pedidos (GET /api/orders)
 * 
 * Retorna todos os pedidos efetuados pelo usuário autenticado.
 */
export async function GET() {
  const cookieStore = await cookies();
  try {
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Acesso negado. Faça login." }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }

    const userId = payload.userId as string;

    const orders = await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: true,
        shipments: true,
      },
    });

    return NextResponse.json({ orders });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao listar histórico de pedidos:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao obter pedidos." },
      { status: 500 }
    );
  }
}
