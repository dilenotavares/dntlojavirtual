import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";



// 1. Auxiliar para autenticar usuário a partir do token nos cookies
async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = await verifyJWT(token);
    return (payload?.userId as string) || null;
  } catch {
    return null;
  }
}

// GET /api/customer/wishlist: Listar produtos favoritados
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Busca os registros da wishlist
    const wishlistRecords = await db.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const productIds = wishlistRecords.map((item) => item.productId);

    // Busca as informações completas dos produtos correspondentes
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Erro ao listar wishlist:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// POST /api/customer/wishlist: Adicionar produto aos favoritos
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "ID do produto obrigatório." }, { status: 400 });
    }

    // Verifica se o produto existe
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    // Verifica se já está na wishlist
    const existing = await db.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Produto já favoritado." });
    }

    // Cria o registro na wishlist
    const newWishItem = await db.wishlist.create({
      data: {
        userId,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      wishlist: newWishItem,
      message: "Produto adicionado à lista de desejos!",
    });
  } catch (error) {
    console.error("Erro ao favoritar produto:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// DELETE /api/customer/wishlist: Remover produto dos favoritos
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "ID do produto não informado." }, { status: 400 });
    }

    // Remove da wishlist
    await db.wishlist.deleteMany({
      where: { userId, productId },
    });

    return NextResponse.json({
      success: true,
      message: "Produto removido da lista de desejos.",
    });
  } catch (error) {
    console.error("Erro ao remover da wishlist:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
