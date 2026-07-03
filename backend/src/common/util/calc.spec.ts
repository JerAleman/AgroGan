import { computeAdg, grossMarginPerHa, headDelta } from './calc';

describe('calc util', () => {
  describe('computeAdg', () => {
    it('devuelve 0 sin pesada previa', () => {
      expect(computeAdg({ weight: 300, date: new Date() }, null)).toBe(0);
    });

    it('calcula la ganancia diaria correctamente', () => {
      const prev = { weight: 300, date: new Date('2026-06-01') };
      const curr = { weight: 315, date: new Date('2026-07-01') }; // 30 días
      expect(computeAdg(curr, prev)).toBeCloseTo(0.5, 3);
    });

    it('evita división por cero con misma fecha', () => {
      const d = new Date('2026-07-01');
      expect(computeAdg({ weight: 310, date: d }, { weight: 300, date: d })).toBe(10);
    });
  });

  describe('grossMarginPerHa', () => {
    it('calcula margen por hectárea', () => {
      expect(grossMarginPerHa(96000, 57600, 120)).toBeCloseTo(320, 2);
    });
    it('devuelve 0 si el área es 0', () => {
      expect(grossMarginPerHa(1000, 500, 0)).toBe(0);
    });
  });

  describe('headDelta', () => {
    it('suma en compras y nacimientos', () => {
      expect(headDelta('purchase', 10)).toBe(10);
      expect(headDelta('birth', 5)).toBe(5);
    });
    it('resta en ventas, muertes y traslados', () => {
      expect(headDelta('sale', 10)).toBe(-10);
      expect(headDelta('death', 3)).toBe(-3);
      expect(headDelta('transfer', 4)).toBe(-4);
    });
    it('no cambia en cambio de categoría', () => {
      expect(headDelta('category_change', 10)).toBe(0);
    });
  });
});
