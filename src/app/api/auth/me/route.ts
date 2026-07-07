import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";

export async function GET() {
  const cookieStore = await cookies();
  try {
    // 1. Obtém o token JWT a partir dos cookies
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    // 2. Verifica a assinatura e validade do token JWT
    const payload = await verifyJWT(token);

    if (!payload || !payload.userId) {
      // Se o token for inválido ou estiver expirado, limpa o cookie
      const response = NextResponse.json(
        { authenticated: false, error: "Sessão expirada. Faça login novamente." },
        { status: 401 }
      );
      response.cookies.delete("auth_token");
      return response;
    }

    // 3. Busca os dados atualizados do usuário no banco relacional
    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      include: {
        profile: true,
        addresses: {
          orderBy: {
            isDefault: "desc", // Retorna o endereço padrão primeiro
          },
        },
        wishlist: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "Usuário não localizado no banco de dados." },
        { status: 404 }
      );
    }

    // Busca as informações dos produtos favoritados separadamente,
    // já que não existe chave estrangeira explícita configurada no Prisma Schema.
    const productIds = user.wishlist.map(w => w.productId);
    const wishlistProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        images: {
          where: { sortOrder: 0 },
          take: 1,
        },
      },
    });

    // Retorna os dados completos necessários para a área do cliente e checkout
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profile: user.profile ? {
          cpf: user.profile.cpf,
          birthdate: user.profile.birthdate,
        } : null,
        addresses: user.addresses,
        wishlist: user.wishlist.map(w => {
          const prod = wishlistProducts.find(p => p.id === w.productId);
          return {
            id: w.id,
            productId: w.productId,
            product: prod || null,
          };
        }),
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao verificar sessão do usuário:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao verificar a sessão." },
      { status: 500 }
    );
  }
}
