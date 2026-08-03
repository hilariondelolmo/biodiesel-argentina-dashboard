// Formateadores numéricos localizados a es-AR

export const fmt = {
  /** 1234567 → "1.234.567" */
  int: (n) => {
    if (n === null || n === undefined || isNaN(n)) return '-';
    return Math.round(n).toLocaleString('es-AR');
  },

  /** 1234567.89 → "1,23 M" */
  compact: (n) => {
    if (n === null || n === undefined || isNaN(n)) return '-';
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2).replace('.', ',') + ' M';
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace('.', ',') + ' K';
    return Math.round(n).toString();
  },

  /** 45.67 → "45,7%" */
  pct: (n, digits = 1) => {
    if (n === null || n === undefined || isNaN(n)) return '-';
    return n.toFixed(digits).replace('.', ',') + '%';
  },

  /** "2024-01" → "ene 2024" */
  monthShort: (iso) => {
    if (!iso) return '';
    const [y, m] = iso.split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${meses[parseInt(m, 10) - 1]} ${y}`;
  },

  /** "2024-01" → "ene" */
  monthOnly: (iso) => {
    if (!iso) return '';
    const m = iso.split('-')[1];
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return meses[parseInt(m, 10) - 1];
  },

  /** Truncar nombre de empresa largo */
  truncate: (s, max = 32) => {
    if (!s) return '';
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  },
};
