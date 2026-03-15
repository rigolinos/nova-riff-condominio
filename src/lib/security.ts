import DOMPurify from 'dompurify';
import validator from 'validator';

// **PHASE 2: INPUT VALIDATION & XSS PREVENTION**

// ===========================================
// INPUT SANITIZATION UTILITIES
// ===========================================

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  // Configure DOMPurify to be strict but allow basic formatting
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true
  });
  
  return clean;
}

/**
 * Sanitizes plain text input by removing/escaping dangerous characters
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .substring(0, 1000); // Limit length to prevent DoS
}

/**
 * Sanitizes comment text with more lenient rules for user content
 * @param comment - Comment text
 * @returns Sanitized comment
 */
export function sanitizeComment(comment: string): string {
  if (!comment || typeof comment !== 'string') return '';
  
  // Allow basic text with line breaks but remove scripts and dangerous content
  const clean = DOMPurify.sanitize(comment, {
    ALLOWED_TAGS: ['br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
  });
  
  return clean.substring(0, 2000).trim(); // Limit comment length
}

// ===========================================
// INPUT VALIDATION UTILITIES
// ===========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email é obrigatório');
    return { isValid: false, errors };
  }
  
  const sanitizedEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(sanitizedEmail)) {
    errors.push('Formato de email inválido');
  }
  
  if (sanitizedEmail.length > 320) {
    errors.push('Email muito longo');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Senha é obrigatória');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (password.length > 128) {
    errors.push('Senha muito longa (máximo 128 caracteres)');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['12345678', 'password', 'senha123', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Senha muito comum. Escolha uma senha mais segura');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates event name
 */
export function validateEventName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Nome do evento é obrigatório');
    return { isValid: false, errors };
  }
  
  const sanitizedName = sanitizeText(name);
  
  if (sanitizedName.length < 3) {
    errors.push('Nome do evento deve ter pelo menos 3 caracteres');
  }
  
  if (sanitizedName.length > 100) {
    errors.push('Nome do evento muito longo (máximo 100 caracteres)');
  }
  
  // Check for potentially harmful content
  if (/<script|javascript:|on\w+=/i.test(name)) {
    errors.push('Nome do evento contém conteúdo não permitido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates comment content
 */
export function validateComment(comment: string): ValidationResult {
  const errors: string[] = [];
  
  if (!comment || typeof comment !== 'string') {
    errors.push('Comentário não pode estar vazio');
    return { isValid: false, errors };
  }
  
  const trimmed = comment.trim();
  
  if (trimmed.length < 1) {
    errors.push('Comentário não pode estar vazio');
  }
  
  if (trimmed.length > 2000) {
    errors.push('Comentário muito longo (máximo 2000 caracteres)');
  }
  
  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /https?:\/\/[^\s]+.*https?:\/\/[^\s]+.*https?:\/\/[^\s]+/i, // Multiple URLs
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(trimmed)) {
      errors.push('Conteúdo parece ser spam');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates full name
 */
export function validateFullName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Nome completo é obrigatório');
    return { isValid: false, errors };
  }
  
  const sanitizedName = sanitizeText(name);
  
  if (sanitizedName.length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }
  
  if (sanitizedName.length > 100) {
    errors.push('Nome muito longo (máximo 100 caracteres)');
  }
  
  // Check if it contains at least 2 words
  if (sanitizedName.split(' ').filter(word => word.length > 0).length < 2) {
    errors.push('Por favor, insira seu nome completo');
  }
  
  // Only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-ZÀ-ÿ\u00C0-\u017F\s\-']+$/.test(sanitizedName)) {
    errors.push('Nome deve conter apenas letras, espaços, hífens e apostrofes');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates phone number (Brazilian format)
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phone || typeof phone !== 'string') {
    errors.push('Telefone é obrigatório');
    return { isValid: false, errors };
  }
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Brazilian phone number should have 10 or 11 digits
  if (digits.length < 10 || digits.length > 11) {
    errors.push('Telefone deve ter 10 ou 11 dígitos');
  }
  
  // Check for valid mobile number pattern (9 in the 3rd position for mobile)
  if (digits.length === 11 && digits[2] !== '9') {
    errors.push('Número de celular inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===========================================
// FILE UPLOAD VALIDATION
// ===========================================

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedFile?: File;
}

/**
 * Validates uploaded image files
 */
export function validateImageFile(file: File): FileValidationResult {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('Arquivo é obrigatório');
    return { isValid: false, errors };
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Apenas arquivos JPG, PNG e WebP são permitidos');
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('Arquivo muito grande (máximo 5MB)');
  }
  
  // Check filename for potentially dangerous content
  const filename = file.name.toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  for (const ext of dangerousExtensions) {
    if (filename.endsWith(ext)) {
      errors.push('Tipo de arquivo não permitido');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFile: errors.length === 0 ? file : undefined
  };
}

// ===========================================
// RATE LIMITING UTILITIES
// ===========================================

interface RateLimitEntry {
  count: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple client-side rate limiting for authentication attempts
 * @param key - Unique identifier (usually email or IP)
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded
 */
export function isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 900000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    rateLimitStore.set(key, { count: 1, lastAttempt: now });
    return false;
  }
  
  // Reset counter if window has passed
  if (now - entry.lastAttempt > windowMs) {
    rateLimitStore.set(key, { count: 1, lastAttempt: now });
    return false;
  }
  
  // Increment counter
  entry.count++;
  entry.lastAttempt = now;
  
  return entry.count > maxAttempts;
}

/**
 * Reset rate limit for a key (useful after successful authentication)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}