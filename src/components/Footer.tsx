import React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Sparkles, AlertCircle } from "lucide-react";
import CurrentYear from "./CurrentYear";
import styles from "./Footer.module.css";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

/**
 * Componente do Rodapé (Footer)
 * 
 * Exibe dados legais da empresa, endereço físico de distribuição em Ananindeua/PA,
 * selos de métodos de pagamento suportados no Brasil (PIX, Boleto, Cartões) e links
 * para as políticas institucionais obrigatórias (CDC e LGPD).
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          {/* Coluna 1: Branding e Descrição */}
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <Sparkles size={24} className={styles.logoAccent} />
              <span>DNT<span className={styles.logoAccent}>Loja</span></span>
            </div>
            <p className={styles.description}>
              A melhor experiência de e-commerce da região metropolitana de Belém. 
              Compre online de forma rápida e segura com entrega garantida.
            </p>
            {/* Formas de Pagamento e Redes Sociais */}
            <div className={styles.paymentSocialRow}>
              <div>
                <div className={styles.sectionLabel}>Formas de Pagamento</div>
                <div className={styles.paymentBadges}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/01-pix.png" alt="Pix" className={`${styles.paymentImg} ${styles.pixBoleto}`} title="Pix" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/02-boleto.png" alt="Boleto" className={`${styles.paymentImg} ${styles.pixBoleto}`} title="Boleto Bancário" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/03-visa-1.png" alt="Visa" className={`${styles.paymentImg} ${styles.visaCard}`} title="Visa" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/04-mastercard.png" alt="Mastercard" className={styles.paymentImg} title="Mastercard" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/05-elo.png" alt="Elo" className={styles.paymentImg} title="Elo" />
                </div>
              </div>
              
              <div className={styles.socialContainer}>
                <div className={styles.sectionLabel}>Siga-nos</div>
                <div className={styles.socialLinks}>
                  <a href="https://www.facebook.com/profile.php?id=100092165346174" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                    <FacebookIcon />
                  </a>
                  <a href="https://www.instagram.com/dilenotavares/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                    <InstagramIcon />
                  </a>
                  <a href="https://www.linkedin.com/in/dileno-n-tavares-32336ba7/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="LinkedIn">
                    <LinkedinIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Links Institucionais */}
          <div>
            <h3 className={styles.title}>Institucional</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="/catalog" className={styles.link}>
                  Nosso Catálogo
                </Link>
              </li>
              <li>
                <Link href="/account" className={styles.link}>
                  Minha Conta
                </Link>
              </li>
              <li>
                <Link href="/cart" className={styles.link}>
                  Meu Carrinho
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Políticas e Segurança (CDC / LGPD) */}
          <div>
            <h3 className={styles.title}>Políticas</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="/trocas-e-devolucoes" className={styles.link}>
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidade" className={styles.link}>
                  Privacidade (LGPD)
                </Link>
              </li>
              <li>
                <Link href="/termos-de-servico" className={styles.link}>
                  Termos de Serviço
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Contato e Endereço Físico de Ananindeua, PA */}
          <div>
            <h3 className={styles.title}>Contato</h3>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <MapPin size={18} className={styles.logoAccent} style={{ flexShrink: 0 }} />
                <span>
                  Rua Rosa Vermelha, 302 - Guanabara<br />
                  Ananindeua - PA, CEP: 67010-320
                </span>
              </div>
              <div className={styles.contactItem}>
                <Phone size={18} className={styles.logoAccent} />
                <span>(91) 98560-5052</span>
              </div>
              <div className={styles.contactItem}>
                <Mail size={18} className={styles.logoAccent} />
                <span>dileno.tavares@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior com Copyright e Detalhes de Regulamento (Código de Defesa do Consumidor - CDC) */}
        <div className={styles.bottomBar}>
          <span>
            &copy; <CurrentYear /> DNT Loja Virtual Ltda. Todos os direitos reservados.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={16} />
            <span>Site 100% Seguro e em Conformidade com a LGPD</span>
          </div>
        </div>
        <div className={styles.legalText}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "12px" }}>
            DNT LOJA VIRTUAL LTDA - CNPJ: 99.999.999/0001-99. Os preços, promoções e condições de frete
            são válidos exclusivamente para compras via internet. Vendas sujeitas a análise e confirmação de dados.
            Conformidade com o Decreto Federal nº 7.962/13 (Lei do E-commerce no Brasil).
          </p>
        </div>
      </div>
    </footer>
  );
}
