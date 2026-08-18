/**
 * @file schemas.ts
 * @description Schemas de validação Zod centralizados.
 * Sprint 1 – Segurança e Integridade.
 * 
 * Regra de Timezone: Todas as datas de reserva são normalizadas para UTC (TIMESTAMPTZ)
 * antes de serem enviadas ao banco, prevenindo conflitos de fuso horário.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Utilitários de Data/Hora (Timezone-safe)
// ---------------------------------------------------------------------------

/**
 * Converte uma data local (YYYY-MM-DD) + horário local (HH:MM) em ISO 8601 UTC.
 * Isso evita o bug clássico de reservas "trocadas" por diferença de UTC vs. horário local.
 */
export function toUtcIso(dateStr: string, timeStr: string): string {
  // Cria um objeto Date no timezone local do dispositivo
  const localDate = new Date(`${dateStr}T${timeStr}:00`);
  return localDate.toISOString(); // sempre UTC
}

// ---------------------------------------------------------------------------
// Schema: Reserva / Criação de Evento
// ---------------------------------------------------------------------------

export const reservationSchema = z.object({
  title: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo (máximo 100 caracteres)")
    .regex(/^[^<>]*$/, "Caracteres inválidos no nome"),

  date: z
    .string()
    .min(1, "Data é obrigatória")
    .refine((val) => {
      const d = new Date(val + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, "A data não pode ser no passado"),

  time: z.string().min(1, "Horário é obrigatório"),

  amenityId: z.string().uuid("Espaço inválido"),

  maxParticipants: z
    .number()
    .int()
    .min(1, "Mínimo 1 participante")
    .max(200, "Máximo 200 participantes"),
});

export type ReservationFormData = z.infer<typeof reservationSchema>;

// ---------------------------------------------------------------------------
// Schema: Matchmaking ("Tô Disponível")
// ---------------------------------------------------------------------------

export const matchmakingSchema = z.object({
  sportName: z
    .string()
    .min(2, "Informe o esporte")
    .max(50, "Nome do esporte muito longo"),

  timePreference: z
    .string()
    .min(2, "Informe sua disponibilidade")
    .max(100, "Disponibilidade muito longa"),

  condominiumId: z.string().uuid("Condomínio inválido"),

  // Expiração automática: por padrão 4 horas a partir de agora (em UTC)
  expiresAt: z
    .string()
    .optional()
    .default(() => {
      const d = new Date();
      d.setHours(d.getHours() + 4);
      return d.toISOString();
    }),
});

export type MatchmakingFormData = z.infer<typeof matchmakingSchema>;

// ---------------------------------------------------------------------------
// Schema: Perfil do usuário
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nome muito curto")
    .max(100, "Nome muito longo")
    .regex(
      /^[a-zA-ZÀ-ÿ\u00C0-\u017F\s\-']+$/,
      "Use apenas letras, espaços e hífens"
    ),

  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 11;
    }, "Telefone inválido (10 ou 11 dígitos)"),

  city: z.string().max(100, "Cidade muito longa").optional(),

  birthDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - d.getFullYear();
      return age >= 13 && age <= 120;
    }, "Idade inválida"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Schema: Convidado (Portaria)
// ---------------------------------------------------------------------------

export const guestSchema = z.object({
  guestName: z
    .string()
    .min(2, "Nome do convidado é obrigatório")
    .max(100, "Nome muito longo")
    .regex(/^[^<>]*$/, "Caracteres inválidos"),

  guestDocument: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const digits = val.replace(/\D/g, "");
      return digits.length === 11 || digits.length === 14; // CPF ou CNPJ
    }, "Documento inválido"),

  eventId: z.string().uuid("Evento inválido"),
});

export type GuestFormData = z.infer<typeof guestSchema>;
