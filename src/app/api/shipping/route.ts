import { NextResponse } from "next/server";

/**
 * Rota de Cálculo de Frete e Prazo de Entrega (POST /api/shipping)
 * 
 * Simula a integração logística (Correios/Transportadoras) aplicando regras especiais
 * de frete grátis ou reduzido para a Região Metropolitana de Belém (focando em Ananindeua, PA).
 * 
 * Faixas de CEP de Ananindeua, PA: 67000-000 a 67199-999 (Iniciam com 670 ou 671).
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zip, weightGrams } = body;

    // 1. Validação básica de entrada
    if (!zip) {
      return NextResponse.json(
        { error: "O CEP é obrigatório para calcular o frete." },
        { status: 400 }
      );
    }

    // Limpa caracteres especiais do CEP
    const cleanZip = zip.replace(/\D/g, "");
    if (cleanZip.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido. Deve conter exatamente 8 dígitos numéricos." },
        { status: 400 }
      );
    }

    // Peso padrão do carrinho caso não venha informado (em gramas)
    const totalWeight = weightGrams ? parseInt(weightGrams) : 500;
    const weightKg = totalWeight / 1000;

    // 2. Determina se o CEP é local (Ananindeua/PA)
    // CEPs de Ananindeua começam com "670" ou "671"
    const isAnanindeua = cleanZip.startsWith("670") || cleanZip.startsWith("671");
    // CEPs do restante do Estado do Pará começam com "66" ou de "67" a "68"
    const isPara = cleanZip.startsWith("66") || cleanZip.startsWith("67") || cleanZip.startsWith("68");

    const shippingOptions = [];

    if (isAnanindeua) {
      // Regras de frete super otimizadas para o público local de Ananindeua (B2C local)
      shippingOptions.push(
        {
          id: "local_express",
          name: "Entrega Expressa Local (Motoboy)",
          carrier: "DNT Express",
          priceCents: totalWeight > 10000 ? 1500 : 0, // Grátis para pesos comuns, R$ 15 para pesos pesados
          estimatedDays: 1, // 24 horas ou no mesmo dia
          description: "Entregue diretamente na sua casa por nossa frota local.",
        },
        {
          id: "local_pickup",
          name: "Retirada em Mãos (Centro de Ananindeua)",
          carrier: "Retirada Física",
          priceCents: 0, // Sempre Grátis
          estimatedDays: 0, // Pronto em 1 hora
          description: "Retire sem custo no nosso ponto de entrega na Cidade Nova.",
        },
        {
          id: "correios_sedex",
          name: "Correios SEDEX",
          carrier: "Correios",
          priceCents: Math.round(1800 + weightKg * 200), // R$ 18,00 base + R$ 2,00 por kg
          estimatedDays: 2,
          description: "Envio rápido via Correios nacional.",
        }
      );
    } else if (isPara) {
      // Regras regionais (outras cidades do Pará - ex: Castanhal, Marabá, Santarém)
      shippingOptions.push(
        {
          id: "correios_pac",
          name: "Correios PAC Regional",
          carrier: "Correios",
          priceCents: Math.round(1800 + weightKg * 300), // R$ 18,00 base + R$ 3,00 por kg
          estimatedDays: 5,
          description: "Envio econômico estadual.",
        },
        {
          id: "correios_sedex",
          name: "Correios SEDEX Regional",
          carrier: "Correios",
          priceCents: Math.round(2800 + weightKg * 500), // R$ 28,00 base + R$ 5,00 por kg
          estimatedDays: 3,
          description: "Envio rápido estadual.",
        }
      );
    } else {
      // Regras para Frete Nacional (outros Estados brasileiros)
      shippingOptions.push(
        {
          id: "correios_pac",
          name: "Correios PAC Nacional",
          carrier: "Correios",
          priceCents: Math.round(2600 + weightKg * 400), // R$ 26,00 base + R$ 4,00 por kg
          estimatedDays: 8,
          description: "Entrega econômica convencional em todo o Brasil.",
        },
        {
          id: "correios_sedex",
          name: "Correios SEDEX Nacional",
          carrier: "Correios",
          priceCents: Math.round(4800 + weightKg * 800), // R$ 48,00 base + R$ 8,00 por kg
          estimatedDays: 4,
          description: "Entrega expressa nacional.",
        }
      );
    }

    // Retorna as opções de entrega disponíveis para o endereço indicado
    return NextResponse.json({
      zip: cleanZip,
      city: isAnanindeua ? "Ananindeua" : isPara ? "Região Pará" : "Nacional",
      state: isPara || isAnanindeua ? "PA" : "Outro",
      options: shippingOptions,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro no cálculo do frete:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a estimativa de frete." },
      { status: 500 }
    );
  }
}
