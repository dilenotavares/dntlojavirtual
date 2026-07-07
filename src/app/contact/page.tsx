"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, Mail, MapPin, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import styles from "./page.module.css";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsLoading(true);
    // Simula envio de contato
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1200);
  };

  // Abre link do WhatsApp com texto customizado
  const handleWhatsappClick = () => {
    const phone = "5591985605052"; // Telefone fictício da DNT
    const text = encodeURIComponent("Olá DNT Loja! Gostaria de tirar algumas dúvidas sobre os produtos de tecnologia.");
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, "_blank");
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className="container animate-fade-in" style={{ padding: "40px 24px", flexGrow: 1 }}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Fale Conosco</h1>
          <p className={styles.subtitle}>
            Estamos à disposição para ajudar você. Entre em contato por formulário ou fale conosco instantaneamente pelo WhatsApp.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Seção Esquerda: Informações & WhatsApp */}
          <div className={styles.infoSection}>
            {/* Cartão de Informações */}
            <div className={`${styles.infoCard} glass`}>
              <h2>Canais de Contato</h2>
              <div className={styles.contactList}>
                <div className={styles.contactItem}>
                  <div className={styles.iconWrapper}>
                    <MapPin size={20} />
                  </div>
                  <div className={styles.contactDetails}>
                    <h3>Endereço</h3>
                    <p>
                      Rua Rosa Vermelha, 302 - Guanabara<br />
                      Ananindeua - PA, CEP: 67010-320
                    </p>
                  </div>
                </div>

                <div className={styles.contactItem}>
                  <div className={styles.iconWrapper}>
                    <Phone size={20} />
                  </div>
                  <div className={styles.contactDetails}>
                    <h3>Telefone</h3>
                    <p>(91) 98560-5052</p>
                  </div>
                </div>

                <div className={styles.contactItem}>
                  <div className={styles.iconWrapper}>
                    <Mail size={20} />
                  </div>
                  <div className={styles.contactDetails}>
                    <h3>E-mail</h3>
                    <p>dileno.tavares@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cartão WhatsApp */}
            <div className={`${styles.whatsappCard} glass`}>
              <h2>Atendimento Rápido</h2>
              <p>
                Precisa de um retorno imediato? Converse diretamente com nossa equipe de vendas e suporte técnico agora mesmo pelo WhatsApp.
              </p>
              <button onClick={handleWhatsappClick} className={styles.whatsappBtn}>
                <MessageSquare size={20} />
                <span>Conversar no WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Seção Direita: Formulário */}
          <div className={`${styles.formCard} glass`}>
            <h2>Envie uma Mensagem</h2>
            
            {isSubmitted && (
              <div className={styles.successMessage}>
                <CheckCircle2 size={20} />
                <span>Mensagem enviada com sucesso! Entraremos em contato em breve.</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nome Completo *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={styles.input}
                  placeholder="Seu nome"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">E-mail *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={styles.input}
                  placeholder="seu.email@exemplo.com"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject">Assunto (Opcional)</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className={styles.input}
                  placeholder="Ex: Dúvidas sobre frete, produtos..."
                  value={formData.subject}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">Mensagem *</label>
                <textarea
                  id="message"
                  name="message"
                  className={styles.textarea}
                  placeholder="Digite sua mensagem..."
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                />
              </div>

              <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                {isLoading ? (
                  <span className="loader" style={{ width: "20px", height: "20px" }}></span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar Mensagem</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
