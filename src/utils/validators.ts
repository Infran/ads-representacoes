/**
 * Validadores de documentos brasileiros (SEG S2.2 / SEG-08).
 *
 * Diferente das máscaras de `Masks.ts` (que só formatam), estes conferem os
 * dígitos verificadores pelo algoritmo módulo-11 e rejeitam sequências repetidas
 * (ex.: "111.111.111-11"), que passam na conta mas nunca são documentos reais.
 *
 * Aceitam a string com ou sem máscara — só os dígitos importam.
 */

/**
 * Valida um CPF (11 dígitos) pelos dois dígitos verificadores (módulo-11).
 * @returns `true` se o CPF for estruturalmente válido.
 */
export const isValidCpf = (value: string | undefined | null): boolean => {
  if (!value) return false;
  const cpf = value.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  // Rejeita sequências de um único dígito (todas passariam no módulo-11).
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
};

/**
 * Valida um CNPJ (14 dígitos) pelos dois dígitos verificadores (módulo-11).
 * @returns `true` se o CNPJ for estruturalmente válido.
 */
export const isValidCnpj = (value: string | undefined | null): boolean => {
  if (!value) return false;
  const cnpj = value.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;
  // Rejeita sequências de um único dígito.
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const digits = cnpj.split("").map(Number);

  const checkDigit = (length: number): number => {
    // Pesos do CNPJ: 5,4,3,2,9,8,7,6,5,4,3,2 (deslocados para o 2º dígito).
    let weight = length - 7;
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return checkDigit(12) === digits[12] && checkDigit(13) === digits[13];
};
