import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function ExchangePage() {
  const policies = [
    {
      title: "Prazo para Solicitação",
      description: "O cliente tem até 7 dias corridos após o recebimento para solicitar a devolução ou troca, em total conformidade com o Código de Defesa do Consumidor (CDC) para compras online."
    },
    {
      title: "Condições de Aceite",
      description: "O produto deve ser devolvido sem qualquer sinal de uso, em sua embalagem original lacrada, acompanhado de todos os manuais, acessórios e da nota fiscal correspondente."
    },
    {
      title: "Procedimento de Envio",
      description: "Entre em contato através do nosso canal de atendimento (E-mail ou formulário de Contato) informando o número do seu pedido e o motivo detalhado da solicitação para receber o código de postagem."
    },
    {
      title: "Custos de Envio (Frete)",
      description: "Em caso de defeito de fabricação ou erro no envio, todos os custos de frete são inteiramente por nossa conta. Para trocas por escolha ou arrependimento do cliente, o custo de envio do frete é de responsabilidade do comprador."
    },
    {
      title: "Prazo de Reembolso",
      description: "O valor pago será devolvido na mesma forma de pagamento utilizada na compra em até 10 dias úteis após a chegada e análise de conformidade do produto em nosso centro de distribuição."
    }
  ];

  return (
    <div className={styles.page}>
      <Header />
      <main className="container animate-fade-in" style={{ padding: "40px 24px", flexGrow: 1 }}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Política de Trocas e Devoluções</h1>
          <p className={styles.subtitle}>
            Nosso compromisso é garantir sua total satisfação e transparência de acordo com a legislação do consumidor.
          </p>
        </div>

        <div className={`${styles.contentCard} glass`}>
          <div className={styles.list}>
            {policies.map((item, index) => (
              <div key={index} className={styles.listItem}>
                <div className={styles.numberBadge}>{index + 1}</div>
                <div className={styles.itemText}>
                  <h2 className={styles.itemTitle}>{item.title}</h2>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
