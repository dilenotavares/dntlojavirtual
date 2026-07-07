import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function TermsOfServicePage() {
  const terms = [
    {
      title: "Cadastro do Cliente",
      description: "Para realizar compras em nossa loja virtual, o cliente deve fornecer informações pessoais verdadeiras, corretas e atualizadas. A responsabilidade pela guarda das credenciais de acesso é exclusiva do usuário."
    },
    {
      title: "Informações sobre Produtos",
      description: "As imagens dos produtos são meramente ilustrativas, podendo ocorrer pequenas variações visuais. Informações de preços, condições e disponibilidade de estoque estão sujeitas a alterações sem aviso prévio."
    },
    {
      title: "Formas e Confirmação de Pagamentos",
      description: "Aceitamos pagamentos via PIX, cartão de crédito e boleto bancário. O pedido só será processado e enviado após a confirmação e aprovação do respectivo pagamento pelas operadoras financeiras."
    },
    {
      title: "Política e Prazo de Entrega",
      description: "O prazo estimado de entrega varia conforme a região do endereço e a transportadora escolhida. O código de rastreamento do objeto será enviado por e-mail logo após a postagem da encomenda."
    },
    {
      title: "Responsabilidades e Isenções",
      description: "Não nos responsabilizamos por eventuais atrasos logísticos decorrentes de fatores de força maior ou externos à nossa operação, como greves, catástrofes naturais ou restrições governamentais."
    },
    {
      title: "Atualizações de Termos",
      description: "Reservamo-nos o direito de atualizar ou modificar estes termos de serviço a qualquer momento sem aviso prévio, cabendo ao cliente consultá-los periodicamente ou sempre que julgar conveniente."
    }
  ];

  return (
    <div className={styles.page}>
      <Header />
      <main className="container animate-fade-in" style={{ padding: "40px 24px", flexGrow: 1 }}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Termos de Serviço</h1>
          <p className={styles.subtitle}>
            Ao utilizar os serviços e realizar compras em nossa loja virtual, você declara estar ciente e de acordo com os seguintes termos.
          </p>
        </div>

        <div className={`${styles.contentCard} glass`}>
          <div className={styles.list}>
            {terms.map((item, index) => (
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
