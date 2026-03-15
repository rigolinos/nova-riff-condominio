import { z } from 'zod';

// Validation schema for event creation
export const eventValidationSchema = z.object({
  title: z.string()
    .min(3, 'O nome do evento deve ter pelo menos 3 caracteres')
    .max(100, 'O nome do evento deve ter no máximo 100 caracteres')
    .trim(),
  description: z.string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres')
    .optional(),
  location: z.string()
    .min(3, 'A localização deve ter pelo menos 3 caracteres')
    .max(200, 'A localização deve ter no máximo 200 caracteres')
    .trim(),
  date: z.string()
    .refine((date) => {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }, 'A data do evento deve ser hoje ou no futuro'),
  time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  maxParticipants: z.number()
    .min(2, 'O evento deve ter pelo menos 2 participantes')
    .max(100, 'O evento não pode ter mais de 100 participantes')
    .optional(),
  skillLevel: z.enum(['Iniciante/Diversão', 'Intermediário/Casual', 'Avançado/Competitivo'])
});

export type EventFormData = z.infer<typeof eventValidationSchema>;

export function useEventValidation() {
  const validateEvent = (data: Partial<EventFormData>) => {
    try {
      eventValidationSchema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const field = err.path[0] as string;
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Erro de validação' } };
    }
  };

  const validateField = (field: keyof EventFormData, value: any) => {
    try {
      const fieldSchema = eventValidationSchema.shape[field];
      fieldSchema.parse(value);
      return { isValid: true, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message || 'Valor inválido' };
      }
      return { isValid: false, error: 'Erro de validação' };
    }
  };

  return { validateEvent, validateField };
}