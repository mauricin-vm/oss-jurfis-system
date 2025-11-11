import { z } from 'zod';

// ============================================
// Funções de Formatação de Telefone
// ============================================

//função para remover toda formatação do telefone (retorna apenas números)
export const formatPhoneToRaw = (phone: string): string => {
  return phone.replace(/\D/g, ``);
};

//função para formatar o telefone para o banco de dados
//entrada: qualquer formato de telefone (com ou sem código do país/DDD)
//saída: apenas números no formato '5567992757049' ou '556792757049'
//DDD padrão: 67 (Mato Grosso do Sul)
export const formatPhoneToDatabase = (phone: string, defaultDDD: string = '67') => {
  const onlyNumbers = formatPhoneToRaw(phone);

  // Validação mínima
  if (onlyNumbers.length < 8) {
    return { formated: false, message: `O número de telefone digitado é muito curto!` };
  }

  const countryCode = `55`; // Brasil
  let remainingDigits = onlyNumbers;
  let detectedCountryCode = countryCode;

  // Detectar e remover código do país se presente
  if (onlyNumbers.length >= 12) {
    // Pode ter código do país (ex: 5567992757049 ou 15551234567)
    const possibleCountryCode = onlyNumbers.slice(0, 2);
    if (possibleCountryCode === '55') {
      detectedCountryCode = '55';
      remainingDigits = onlyNumbers.slice(2);
    } else if (onlyNumbers.length >= 13) {
      // Código de país de outro país (ex: +1, +44, etc)
      detectedCountryCode = onlyNumbers.slice(0, 1);
      remainingDigits = onlyNumbers.slice(1);
    }
  }

  // Detectar DDD
  let phoneDDD = defaultDDD.padStart(2, `0`);
  let phoneNumber = remainingDigits;

  if (remainingDigits.length >= 10) {
    // Tem DDD incluído (ex: 67992757049)
    phoneDDD = remainingDigits.slice(0, 2);
    phoneNumber = remainingDigits.slice(2);
  }

  // Validar número de telefone
  if (phoneNumber.length !== 8 && phoneNumber.length !== 9) {
    return { formated: false, message: `O número de telefone deve ter 8 ou 9 dígitos!` };
  }

  // Construir telefone final
  const finalPhone = `${detectedCountryCode}${phoneDDD}${phoneNumber}`;

  // Validação final de comprimento
  if (finalPhone.length < 12 || finalPhone.length > 14) {
    return { formated: false, message: `O formato do telefone é inválido!` };
  }

  return { formated: true, phone: finalPhone };
};

//função para formatar telefone para exibição
//se código do país for 55 (Brasil): mostra apenas (DDD) NÚMERO
//se código do país for diferente: mostra +CÓDIGO (DDD) NÚMERO
export const formatPhoneForDisplay = (phone: string): string => {
  const onlyNumbers = formatPhoneToRaw(phone);

  if (!onlyNumbers) return '';

  // Detectar se tem código do país
  let countryCode = '';
  let remainingDigits = onlyNumbers;

  // Telefone com 13-14 dígitos provavelmente tem código do país
  if (onlyNumbers.length >= 13) {
    const possibleCC = onlyNumbers.slice(0, 2);
    if (possibleCC === '55') {
      // Brasil - não mostrar código do país
      countryCode = '';
      remainingDigits = onlyNumbers.slice(2);
    } else {
      // Outro país - mostrar código do país
      countryCode = `+${onlyNumbers.slice(0, 2)} `;
      remainingDigits = onlyNumbers.slice(2);
    }
  } else if (onlyNumbers.length === 12) {
    // Pode ser Brasil sem o 9 inicial do celular
    const possibleCC = onlyNumbers.slice(0, 2);
    if (possibleCC === '55') {
      countryCode = '';
      remainingDigits = onlyNumbers.slice(2);
    }
  }

  // Formatar baseado no comprimento do restante
  const length = remainingDigits.length;

  if (length === 11) {
    // (DD) 9XXXX-XXXX (celular)
    return `${countryCode}(${remainingDigits.slice(0, 2)}) ${remainingDigits.slice(2, 7)}-${remainingDigits.slice(7)}`;
  } else if (length === 10) {
    // (DD) XXXX-XXXX (fixo)
    return `${countryCode}(${remainingDigits.slice(0, 2)}) ${remainingDigits.slice(2, 6)}-${remainingDigits.slice(6)}`;
  } else if (length === 9) {
    // 9XXXX-XXXX (sem DDD)
    return `${countryCode}${remainingDigits.slice(0, 5)}-${remainingDigits.slice(5)}`;
  } else if (length === 8) {
    // XXXX-XXXX (sem DDD)
    return `${countryCode}${remainingDigits.slice(0, 4)}-${remainingDigits.slice(4)}`;
  }

  // Se não se encaixar em nenhum formato, retornar os números
  return onlyNumbers;
};

// ============================================
// Schemas de Validação
// ============================================

// Schema para validação de telefone brasileiro
// Aceita diversos formatos e valida se é um telefone válido
export const phoneSchema = z.string()
  .min(1, 'Telefone é obrigatório')
  .refine((value) => {
    // Remove caracteres não numéricos
    const onlyNumbers = value.replace(/\D/g, '');

    // Validar comprimento mínimo
    if (onlyNumbers.length < 8) {
      return false;
    }

    // Tentar converter para formato do banco
    const result = formatPhoneToDatabase(onlyNumbers, '67');

    return result.formated;
  }, {
    message: 'Telefone inválido. Use o formato (DD) XXXXX-XXXX'
  });

// Schema opcional de telefone (pode ser vazio)
export const phoneOptionalSchema = z.string()
  .optional()
  .refine((value) => {
    if (!value || value.trim() === '') return true;

    const onlyNumbers = value.replace(/\D/g, '');
    if (onlyNumbers.length < 8) return false;

    const result = formatPhoneToDatabase(onlyNumbers, '67');
    return result.formated;
  }, {
    message: 'Telefone inválido. Use o formato (DD) XXXXX-XXXX'
  });

// ============================================
// Função de Máscara para Input
// ============================================

// Aplica máscara de telefone conforme o usuário digita
// (DD) XXXXX-XXXX para celular ou (DD) XXXX-XXXX para fixo
export const applyPhoneMask = (value: string): string => {
  const onlyNumbers = value.replace(/\D/g, '');

  if (!onlyNumbers) return '';

  // Aplicar máscara baseado no comprimento
  if (onlyNumbers.length <= 2) {
    return `(${onlyNumbers}`;
  } else if (onlyNumbers.length <= 6) {
    return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2)}`;
  } else if (onlyNumbers.length <= 10) {
    return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 6)}-${onlyNumbers.slice(6, 10)}`;
  } else {
    // Celular com 9 dígitos
    return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 7)}-${onlyNumbers.slice(7, 11)}`;
  }
};
