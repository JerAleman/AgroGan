/** Utilidades de cálculo agropecuario (puras, testeables). */

const MS_PER_DAY = 86_400_000;

/**
 * Ganancia diaria de peso (ADG, kg/día) entre dos pesadas.
 * Devuelve 0 si no hay pesada previa o si el intervalo es inválido.
 */
export function computeAdg(current: { weight: number; date: Date }, previous?: { weight: number; date: Date } | null): number {
  if (!previous) return 0;
  const days = Math.max(1, (current.date.getTime() - previous.date.getTime()) / MS_PER_DAY);
  return Number(((current.weight - previous.weight) / days).toFixed(3));
}

/** Margen bruto por hectárea. */
export function grossMarginPerHa(revenue: number, directCost: number, areaHa: number): number {
  const margin = revenue - directCost;
  return areaHa > 0 ? Number((margin / areaHa).toFixed(2)) : 0;
}

/** Delta de existencias según el tipo de movimiento ganadero. */
export function headDelta(type: string, head: number): number {
  switch (type) {
    case 'purchase':
    case 'birth':
      return head;
    case 'sale':
    case 'death':
    case 'transfer':
      return -head;
    default:
      return 0;
  }
}
