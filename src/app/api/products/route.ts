import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Rota de Listagem e Filtragem de Produtos (GET /api/products)
 * 
 * Permite buscar produtos no catálogo aplicando filtros de categoria, faixa de preço,
 * termo de busca textual (SEO/busca) e critérios de ordenação (menor/maior preço, novidades).
 * Inclui os relacionamentos de imagens e variantes no retorno.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {

    // 1. Captura os parâmetros de consulta da URL
    const categorySlug = searchParams.get("category");
    const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : null;
    const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : null;
    const searchQuery = searchParams.get("search");
    const sort = searchParams.get("sort"); // "price-asc" | "price-desc" | "newest"

    // 2. Monta o objeto de condições do Prisma dinamicamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      isActive: true, // Apenas produtos ativos no catálogo
    };

    // Filtro por Categoria
    if (categorySlug) {
      whereClause.categories = {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      };
    }

    // Filtro por Faixa de Preço (baseado no preço base do produto em centavos)
    if (minPrice !== null || maxPrice !== null) {
      whereClause.priceCents = {};
      if (minPrice !== null) {
        whereClause.priceCents.gte = minPrice;
      }
      if (maxPrice !== null) {
        whereClause.priceCents.lte = maxPrice;
      }
    }

    // Filtro por termo de busca (no nome ou na descrição)
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery } },
        { description: { contains: searchQuery } },
        { brand: { contains: searchQuery } },
      ];
    }

    // 3. Monta a ordenação dos resultados
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderByClause: any = { createdAt: "desc" }; // Padrão: Mais recentes primeiro

    if (sort === "price-asc") {
      orderByClause = { priceCents: "asc" };
    } else if (sort === "price-desc") {
      orderByClause = { priceCents: "desc" };
    }

    // 4. Executa a consulta com carregamento de relacionamentos essenciais
    const products = await db.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        images: {
          orderBy: { sortOrder: "asc" }, // Traz a galeria ordenada
        },
        variants: true, // Traz todas as variantes (cores/tamanhos e estoques)
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // 5. Retorna a lista de produtos processada
    return NextResponse.json({
      products: products.map((prod) => ({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        richDescription: prod.richDescription,
        priceCents: prod.priceCents,
        comparePriceCents: prod.comparePriceCents,
        weightGrams: prod.weightGrams,
        brand: prod.brand,
        images: prod.images,
        variants: prod.variants,
        categories: prod.categories.map((c) => c.category.name),
      })),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao carregar catálogo." },
      { status: 500 }
    );
  }
}
