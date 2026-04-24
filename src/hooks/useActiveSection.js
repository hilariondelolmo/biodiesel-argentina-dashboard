import { useEffect, useState } from 'react';

/**
 * Hook de scroll-spy: detecta qué sección está visible en viewport
 * y devuelve su id. Recalcula en scroll + resize.
 *
 * @param {string[]} ids - lista de ids de secciones a observar
 * @returns {string} id de la sección activa
 */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    function update() {
      const y = window.scrollY + 200;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) current = id;
      }
      setActive(current);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ids]);

  return active;
}
