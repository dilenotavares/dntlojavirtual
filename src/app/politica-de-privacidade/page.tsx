import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function PrivacyPolicyPage() {
  const policies = [
    {
      title: "Coleta de Dados Pessoais",
      description: "Coletamos informações essenciais como seu nome completo, CPF (obrigatório para faturamento nacional), endereço de entrega, número de telefone e e-mail com a finalidade exclusiva de processar seus pedidos e estabelecer comunicação."
    },
    {
      title: "Finalidade e Uso das Informações",
      description: "Utilizamos as informações coletadas para processamento logístico de entrega, emissão de notas fiscais eletrônicas de venda e envio de atualizações e notificações operacionais sobre o andamento da sua compra."
    },
    {
      title: "Compartilhamento com Terceiros",
      description: "Não comercializamos nem compartilhamos seus dados com terceiros, com exceção exclusiva de parceiros logísticos (transportadoras/Correios) e financeiras/gateways de pagamento estritamente necessários para finalizar o faturamento e transporte."
    },
    {
      title: "Direitos do Titular dos Dados",
      description: "Em total conformidade com a LGPD, o titular possui o direito de solicitar a qualquer momento o acesso, a retificação, a portabilidade ou a exclusão permanente dos seus dados do nosso sistema de forma simplificada."
    },
    {
      title: "Segurança da Informação",
      description: "Adotamos robustas medidas técnicas, administrativas e criptográficas de segurança (incluindo HTTPS e hashes seguros) para proteger suas informações pessoais contra acessos não autorizados, perdas ou uso indevido."
    }
  ];

  return (
    <div className={styles.page}>
      <Header />
      <main className="container animate-fade-in" style={{ padding: "40px 24px", flexGrow: 1 }}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Política de Privacidade (LGPD)</h1>
          <p className={styles.subtitle}>
            A sua privacidade é nossa total prioridade. Conheça as diretrizes de proteção aos seus dados pessoais de acordo com a Lei nº 13.709/2018.
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
