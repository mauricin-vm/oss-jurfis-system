import { z } from 'zod';

// Schema para email
export const emailSchema = z.string()
  .min(1, 'Email é obrigatório')
  .email('Email inválido');

// Schema para email opcional
export const emailOptionalSchema = z.string()
  .email('Email inválido')
  .optional()
  .or(z.literal(''));

// Schema para CPF (11 dígitos)
export const cpfSchema = z.string()
  .min(1, 'CPF é obrigatório')
  .refine((value) => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.length === 11;
  }, {
    message: 'CPF deve ter 11 dígitos'
  });

// Schema para CNPJ (14 dígitos)
export const cnpjSchema = z.string()
  .min(1, 'CNPJ é obrigatório')
  .refine((value) => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.length === 14;
  }, {
    message: 'CNPJ deve ter 14 dígitos'
  });

// Schema para CPF ou CNPJ
export const cpfCnpjSchema = z.string()
  .min(1, 'CPF/CNPJ é obrigatório')
  .refine((value) => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.length === 11 || onlyNumbers.length === 14;
  }, {
    message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
  });

// Schema para valores monetários (R$)
export const currencySchema = z.string()
  .min(1, 'Valor é obrigatório')
  .refine((value) => {
    // Aceita formatos como "R$ 1.234,56" ou "1234,56" ou "1234.56"
    const numericValue = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const parsed = parseFloat(numericValue);
    return !isNaN(parsed) && parsed >= 0;
  }, {
    message: 'Valor inválido'
  });

// Schema para porcentagem
export const percentageSchema = z.string()
  .min(1, 'Porcentagem é obrigatória')
  .refine((value) => {
    const numericValue = value.replace('%', '').replace(',', '.');
    const parsed = parseFloat(numericValue);
    return !isNaN(parsed) && parsed >= 0 && parsed <= 100;
  }, {
    message: 'Porcentagem deve estar entre 0 e 100'
  });

// Schema para data (ISO string)
export const dateSchema = z.string()
  .min(1, 'Data é obrigatória')
  .refine((value) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }, {
    message: 'Data inválida'
  });

// Schema para horário (HH:MM)
export const timeSchema = z.string()
  .min(1, 'Horário é obrigatório')
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido. Use o formato HH:MM');
