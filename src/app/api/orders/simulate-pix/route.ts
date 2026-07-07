import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Rota de Simulação de Pagamento via PIX (POST /api/orders/simulate-pix)
 * 
 * Permite que o usuário simule a leitura do QR Code PIX na tela de sucesso.
 * Altera o status do pagamento para "APPROVED", data de pagamento "paidAt" para agora,
 * atualiza o status do pedido correspondente para "PAID" e registra o evento no AuditLog.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "ID do pedido não informado." }, { status: 400 });
    }

    // 1. Busca o pedido e seus relacionamentos
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    // 2. Executa a atualização do pagamento e pedido em uma transação do Prisma
    await db.$transaction(async (tx) => {
      // Atualiza o pagamento pendente para APROVADO
      await tx.payment.updateMany({
        where: { orderId, status: "PENDING" },
        data: {
          status: "APPROVED",
          paidAt: new Date(),
        },
      });

      // Atualiza o pedido para PAGO (PAID)
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
        },
      });

      // Registra a auditoria
      await tx.auditLog.create({
        data: {
          userId: order.userId,
          action: "PAYMENT_SIMULATED",
          details: `Simulação de pagamento PIX aprovada para o pedido ${orderId}.`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Pagamento via PIX simulado e aprovado com sucesso!",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro na simulação do pagamento PIX:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar a simulação de pagamento." },
      { status: 500 }
    );
  }
}
