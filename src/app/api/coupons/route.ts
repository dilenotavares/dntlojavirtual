import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Endpoint de Validação de Cupons (POST /api/coupons)
 * 
 * Recebe o código do cupom no corpo da requisição, valida suas regras de vigência,
 * status ativo e limites de uso no banco de dados e retorna o tipo e valor de desconto.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Código do cupom não informado." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Busca o cupom no banco de dados
    const coupon = await db.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Cupom inválido ou inexistente." },
        { status: 404 }
      );
    }

    // 2. Verifica se o cupom está ativo
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "Este cupom não está mais ativo." },
        { status: 400 }
      );
    }

    // 3. Verifica se o cupom expirou
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Este cupom expirou." },
        { status: 400 }
      );
    }

    // 4. Verifica o limite de usos
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Este cupom atingiu o limite máximo de usos." },
        { status: 400 }
      );
    }

    // Retorna o cupom validado com sucesso
    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      valueCents: coupon.valueCents,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro na validação do cupom:", error);
    return NextResponse.json(
      { error: "Erro interno ao validar o cupom." },
      { status: 500 }
    );
  }
}
