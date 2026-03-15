/**
 * Profanity Filter - Content Moderation System
 * 
 * This module provides content moderation functionality to prevent
 * inappropriate language in user-generated content.
 */

// Lista de palavras inapropriadas em português (exemplo básico)
// Em produção, essa lista deveria ser muito mais extensa e atualizada regularmente
const INAPPROPRIATE_WORDS = [
  // Palavrões comuns
  'porra', 'caralho', 'cacete', 'merda', 'puta', 'viado', 'bicha',
  'cu', 'cuzao', 'cuzão', 'buceta', 'pinto', 'pau', 'piroca', 'penis',
  'ppk', 'ppka', 'fdp', 'pqp', 'vsf',
  
  // Variações com caracteres especiais
  'p0rra', 'c4ralho', 'm3rda', 'put4', 'v1ado', 'b1cha',
  'p1nto', 'p4u', 'p3nis',
  
  // Termos ofensivos
  'imbecil', 'idiota', 'burro', 'otario', 'otário', 'babaca',
  'corno', 'vagabundo', 'vagabunda', 'prostituta', 'prostituto',
  
  // Spam e conteúdo promocional indesejado
  'compre', 'click aqui', 'clique aqui', 'ganhe dinheiro', 
  'trabalhe em casa', 'renda extra', 'bitcoin', 'forex',
];

/**
 * Normaliza texto para facilitar detecção de palavras proibidas
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiais exceto espaços
    .replace(/\s+/g, ' ') // Normalizar espaços
    .trim();
}

/**
 * Verifica se o texto contém palavras inapropriadas
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');
  
  // Verificar palavras individuais
  for (const word of words) {
    if (INAPPROPRIATE_WORDS.some(inappropriate => word.includes(inappropriate))) {
      return true;
    }
  }
  
  // Verificar texto completo (para frases)
  if (INAPPROPRIATE_WORDS.some(inappropriate => normalizedText.includes(inappropriate))) {
    return true;
  }
  
  return false;
}

/**
 * Valida conteúdo e retorna resultado com mensagem
 */
export interface ContentValidation {
  isValid: boolean;
  message?: string;
}

export function validateContent(text: string, fieldName: string = 'conteúdo'): ContentValidation {
  if (!text || !text.trim()) {
    return {
      isValid: false,
      message: `O ${fieldName} não pode estar vazio.`
    };
  }
  
  if (containsProfanity(text)) {
    return {
      isValid: false,
      message: `O ${fieldName} contém linguagem inapropriada. Por favor, mantenha um ambiente respeitoso.`
    };
  }
  
  return { isValid: true };
}

/**
 * Censura palavras inapropriadas substituindo por asteriscos
 * (Útil para exibir conteúdo moderado ao invés de bloquear completamente)
 */
export function censorText(text: string): string {
  if (!text) return text;
  
  let censoredText = text;
  const normalizedOriginal = normalizeText(text);
  
  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (normalizedOriginal.includes(word)) {
      const replacement = '*'.repeat(word.length);
      censoredText = censoredText.replace(regex, replacement);
    }
  });
  
  return censoredText;
}

/**
 * Lista os campos que devem ser validados em diferentes contextos
 */
export const VALIDATION_CONTEXTS = {
  EVENT_CREATION: ['title', 'description', 'location'],
  USER_PROFILE: ['full_name', 'nickname', 'bio'],
  COMMENT: ['content'],
  SPORT_SUGGESTION: ['sport_name', 'description'],
} as const;

