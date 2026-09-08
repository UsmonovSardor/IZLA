import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sk, VendorGridSkeleton, VendorCardSkeleton } from './skeletons';

describe('Skeleton primitivlari (CLS 0 uchun)', () => {
  it('Sk bazaviy + qo‘shilgan className qo‘llaydi', () => {
    const { container } = render(<Sk className="h-4 w-10" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('skeleton');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-10');
  });

  it('VendorCardSkeleton skeleton shimmer elementlarini render qiladi', () => {
    const { container } = render(<VendorCardSkeleton />);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('VendorGridSkeleton berilgan count qadar karta chizadi', () => {
    const { container } = render(<VendorGridSkeleton count={5} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.children.length).toBe(5);
  });

  it('count standarti = 8', () => {
    const { container } = render(<VendorGridSkeleton />);
    expect((container.firstChild as HTMLElement).children.length).toBe(8);
  });
});
