"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Carousel.module.css";

/**
 * Interface do Slide do Banner
 */
interface Slide {
  id: number;
  tag: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

// Lista de slides de promoção do e-commerce (focados no público nacional e regional do PA)
const SLIDES: Slide[] = [
  {
    id: 1,
    tag: "Lançamento Exclusivo",
    title: "Smartphone DNT Pro Max",
    description: "Conheça o smartphone definitivo com câmera profissional de 108MP e tela AMOLED de 120Hz. Parcele em até 12x sem juros.",
    image: "/smartphone256.avif",
    ctaText: "Comprar Agora",
    ctaLink: "/product/smartphone-dnt-pro-max-256gb",
  },
  {
    id: 2,
    tag: "Áudio de Alta Fidelidade",
    title: "Fone Sem Fio DNT Buds Pro",
    description: "Cancelamento de ruído ativo, som Hi-Fi imersivo e bateria de até 30 horas. Garanta o seu com frete expresso local.",
    image: "/fone-sem-fio.avif",
    ctaText: "Comprar Buds Pro",
    ctaLink: "/product/fone-sem-fio-dnt-buds-pro",
  },
  {
    id: 3,
    tag: "Alta Performance Gamer",
    title: "Notebook Gamer DNT Nitro",
    description: "Equipado com a potente GPU RTX 4060 e SSD NVMe de alta velocidade. Domine suas gameplays e renderizações 3D.",
    image: "/notebook-gamer.avif",
    ctaText: "Ver Notebook",
    ctaLink: "/product/notebook-gamer-dnt-nitro-15-6",
  },
  {
    id: 4,
    tag: "Acessório Essencial",
    title: "Carregador USB-C DNT",
    description: "Carregamento rápido e seguro com tecnologia USB-C. Ideal para dispositivos compatíveis.",
    image: "/carregador-usbc.avif",
    ctaText: "Ver Carregador",
    ctaLink: "/product/carregador-usbc-dnt",
  }
];

/**
 * Componente Carousel (Carrossel Rotativo)
 * 
 * Exibe banners em rotação automática (a cada 5 segundos) com controles manuais.
 * Incorpora efeito de glassmorphism no container de texto e transição de fade suave.
 */
export default function Carousel() {
  const [current, setCurrent] = useState(0);

  // Avança para o próximo slide
  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  // Retrocede para o slide anterior
  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  // Efeito de rotação automática temporizada
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000); // Rotaciona a cada 6 segundos
    return () => clearInterval(timer); // Limpa o timer ao desmontar o componente
  }, [nextSlide]);

  return (
    <div className={styles.carousel} role="region" aria-label="Banners promocionais">
      {SLIDES.map((slide, index) => {
        const isActive = index === current;

        return (
          <div
            key={slide.id}
            className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
            hidden={!isActive}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.backgroundImage}
            />

            <div className={`${styles.content} glass animate-fade-in`}>
              <span className={styles.tag}>{slide.tag}</span>
              <h2 className={styles.title}>{slide.title}</h2>
              <p className={styles.description}>{slide.description}</p>
              <Link href={slide.ctaLink} className={styles.cta}>
                <span>{slide.ctaText}</span>
              </Link>
            </div>
          </div>
        );
      })}

      {/* Botões de Navegação Lateral */}
      <button
        type="button"
        onClick={prevSlide}
        className={`${styles.navButton} ${styles.prev}`}
        aria-label="Slide anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        className={`${styles.navButton} ${styles.next}`}
        aria-label="Próximo slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicadores / Pontos de Posição */}
      <div className={styles.indicators}>
        {SLIDES.map((_, index) => (
          <button
            type="button"
            key={index}
            onClick={() => setCurrent(index)}
            className={`${styles.indicator} ${index === current ? styles.indicatorActive : ""}`}
            aria-label={`Ir para banner ${index + 1}`}
            aria-current={index === current ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
