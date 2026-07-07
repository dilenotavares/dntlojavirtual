"use client";

import { useEffect, useState } from "react";

/**
 * Componente cliente leve para renderizar o ano atual sem causar erros de
 * pré-renderização estática de tempo atual em Server Components.
 */
export default function CurrentYear() {
  const [year, setYear] = useState<number>(2026); // Ano atual como fallback para hidratação estática segura

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
  }, []);

  return <>{year}</>;
}
