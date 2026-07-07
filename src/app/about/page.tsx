import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Eye, ShieldCheck, Compass } from "lucide-react";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className="container animate-fade-in" style={{ padding: "40px 24px", flexGrow: 1 }}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Quem Somos</h1>
          <p className={styles.subtitle}>
            Conectando você ao futuro da tecnologia de maneira rápida, segura e com a melhor experiência.
          </p>
        </div>

        {/* Seção 1: História e Apresentação */}
        <div className={styles.aboutGrid}>
          <div className={styles.storyContent}>
            <h2>Nossa História</h2>
            <p>
              Nascida com a missão de aproximar o melhor em produtos tecnológicos das pessoas, a <strong>DNT Tech</strong> começou como um projeto ambicioso para se tornar a loja referência em e-commerce nacional e no estado do Pará.
            </p>
            <p>
              Ao longo do tempo, focamos em estruturar um catálogo altamente selecionado de smartphones, notebooks, fones de ouvido e acessórios que realmente entregam performance no dia a dia. Também estabelecemos nosso centro de logística com entrega expressa grátis para Ananindeua (PA), fortalecendo nossa conexão local.
            </p>
            <p>
              Acreditamos que a tecnologia deve ser acessível e de confiança, por isso trabalhamos apenas com marcas renomadas, processos auditados sob a LGPD e suporte focado no cliente.
            </p>
          </div>
          <div className={styles.imageWrapper}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/planejamento.avif" 
              alt="Equipe DNT Tech trabalhando com tecnologia" 
            />
          </div>
        </div>

        {/* Seção 2: Missão, Visão, Valores */}
        <div className={styles.valuesSection}>
          <h2 className={styles.valuesTitle}>Nossos Pilares</h2>
          <div className={styles.valuesGrid}>
            {/* Missão */}
            <div className={`${styles.valueCard} glass`}>
              <div className={styles.iconWrapper}>
                <Compass size={24} />
              </div>
              <h3>Missão</h3>
              <p>
                Prover o acesso rápido e qualificado a produtos de alta tecnologia, descomplicando a compra online com transparência e segurança.
              </p>
            </div>

            {/* Visão */}
            <div className={`${styles.valueCard} glass`}>
              <div className={styles.iconWrapper}>
                <Eye size={24} />
              </div>
              <h3>Visão</h3>
              <p>
                Ser a marca líder em e-commerce de eletrônicos e informática na região metropolitana de Belém, expandindo nossa presença nacional digital.
              </p>
            </div>

            {/* Valores */}
            <div className={`${styles.valueCard} glass`}>
              <div className={styles.iconWrapper}>
                <ShieldCheck size={24} />
              </div>
              <h3>Valores</h3>
              <p>
                Respeito e privacidade do cliente (conformidade com LGPD), atendimento humanizado e honestidade em todas as etapas da venda.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
