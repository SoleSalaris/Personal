import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatters = {
  dni: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    return digits.replace(/(\d{2})(\d{3})?(\d{3})?/, (_, p1, p2, p3) => {
      let res = p1;
      if (p2) res += '.' + p2;
      if (p3) res += '.' + p3;
      return res;
    });
  },
  cuil: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    return digits.replace(/(\d{2})(\d{8})?(\d{1})?/, (_, p1, p2, p3) => {
      let res = p1;
      if (p2) res += '-' + p2;
      if (p3) res += '-' + p3;
      return res;
    });
  },
  date: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    return digits.replace(/(\d{2})(\d{2})?(\d{4})?/, (_, p1, p2, p3) => {
      let res = p1;
      if (p2) res += '/' + p2;
      if (p3) res += '/' + p3;
      return res;
    });
  },
  phone: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    return digits.replace(/(\d{4})(\d{4})?/, (_, p1, p2) => {
      let res = p1;
      if (p2) res += '-' + p2;
      return res;
    });
  },
};
