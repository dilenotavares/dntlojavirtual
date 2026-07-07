import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Rota de Detalhes do Produto (GET /api/products/[slug])
 * 
 * Retorna todas as informações detalhadas de um produto específico baseado em seu slug (URL amigável).
 * Inclui variantes (SKUs), galeria completa de imagens, lista de avaliações dos clientes
 * e calcula dinamicamente a nota média (1 a 5 estrelas) do produto.
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;

    if (!slug) {
      return NextResponse.json(
        { error: "O slug do produto é obrigatório." },
        { status: 400 }
      );
    }

    // Busca o produto pelo slug único
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
        reviews: {
          orderBy: { createdAt: "desc" },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: "Produto não localizado ou indisponível no catálogo." },
        { status: 404 }
      );
    }

    // Calcula a nota média das avaliações do produto
    const reviewsCount = product.reviews.length;
    const ratingAverage =
      reviewsCount > 0
        ? parseFloat(
            (
              product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviewsCount
            ).toFixed(1)
          )
        : 0;

    // Retorna a estrutura higienizada do produto
    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        richDescription: product.richDescription,
        priceCents: product.priceCents,
        comparePriceCents: product.comparePriceCents,
        weightGrams: product.weightGrams,
        brand: product.brand,
        images: product.images,
        variants: product.variants,
        categories: product.categories.map((c) => c.category.name),
        reviews: product.reviews,
        ratingAverage,
        reviewsCount,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`Erro ao carregar detalhes do produto:`, error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao carregar dados do produto." },
      { status: 500 }
    );
  }
}
