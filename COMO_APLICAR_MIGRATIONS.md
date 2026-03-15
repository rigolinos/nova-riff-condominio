# 🚀 Como Aplicar as Migrations no Supabase

## ⚡ Método Rápido: Copiar e Colar no Dashboard

### 📍 Passo 1: Acessar o SQL Editor
1. Vá para: https://app.supabase.com
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Clique em **+ New query**

---

### 🔧 Migration 1: Corrigir Constraint de Status

**Cole este código e clique em RUN:**

```sql
-- Fix event status constraint to support different status values
-- Remove old constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add new constraint with all needed options
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('active', 'cancelled', 'completed', 'paused'));

-- Add comment to clarify status options
COMMENT ON COLUMN public.events.status IS 'Event status: active=aberto, cancelled=cancelado, completed=finalizado, paused=pausado';
```

**✅ Resultado esperado:** "Success. No rows returned"

---

### 🤖 Migration 2: Criar Função de Finalização Automática

**Cole este código e clique em RUN:**

```sql
-- Create function to automatically finalize events 6 hours after start time
CREATE OR REPLACE FUNCTION public.auto_finalize_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update event status to 'completed' 6 hours after event start
  UPDATE events
  SET status = 'completed'
  WHERE status NOT IN ('completed', 'cancelled')
  AND (date + time + INTERVAL '6 hours') <= NOW();
END;
$function$;

-- Add comment explaining the function
COMMENT ON FUNCTION public.auto_finalize_events() IS 'Automatically marks events as completed 6 hours after their start time. Should be called periodically via cron or scheduled task.';
```

**✅ Resultado esperado:** "Success. No rows returned"

---

### 🧪 Migration 3: Testar a Função (OPCIONAL)

**Cole este código para verificar se tudo funcionou:**

```sql
-- 1. Verificar se a função foi criada
SELECT 
    proname as nome_funcao,
    pg_get_function_result(oid) as tipo_retorno
FROM pg_proc 
WHERE proname = 'auto_finalize_events';

-- 2. Testar a função manualmente (não vai afetar eventos recentes)
SELECT public.auto_finalize_events();

-- 3. Ver quantos eventos seriam afetados (SEM EXECUTAR a finalização)
SELECT COUNT(*) as eventos_para_finalizar
FROM events
WHERE status NOT IN ('completed', 'cancelled')
AND (date + time + INTERVAL '6 hours') <= NOW();
```

---

## ⏰ Configurar Execução Automática (CRON JOB)

### Opção A: Usando pg_cron (Se disponível no seu plano)

**Cole este código:**

```sql
-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar para executar a cada hora
SELECT cron.schedule(
  'auto-finalize-events',  -- nome do job
  '0 * * * *',             -- todo dia, toda hora
  'SELECT public.auto_finalize_events();'
);

-- Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'auto-finalize-events';
```

### Opção B: Chamar manualmente quando precisar

Se pg_cron não estiver disponível, você pode executar manualmente:

```sql
SELECT public.auto_finalize_events();
```

Ou criar uma Supabase Edge Function para chamar periodicamente.

---

## ✅ Checklist Final

Após executar as migrations:

- [ ] ✅ Migration 1 executada: Constraint atualizado
- [ ] ✅ Migration 2 executada: Função criada
- [ ] ✅ Migration 3 executada: Função testada
- [ ] ⏰ Cron job configurado (opcional)

---

## 🐛 Troubleshooting

### Erro: "constraint events_status_check does not exist"
**✅ Normal!** Significa que vamos criar o constraint pela primeira vez.

### Erro: "function auto_finalize_events already exists"
**✅ Use:** `CREATE OR REPLACE FUNCTION` (já está no código acima)

### Erro: "permission denied for extension pg_cron"
**✅ Solução:** pg_cron pode não estar disponível no seu plano. Use a Opção B (chamar manualmente).

### Erro: "column status does not exist"
**❌ Problema sério!** Execute para verificar:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events';
```

---

## 📞 Precisa de Ajuda?

1. Verifique os logs no Supabase Dashboard
2. Execute: `SELECT version();` para ver a versão do PostgreSQL
3. Documente o erro completo para debug

---

**🎉 Pronto! Suas migrations estão prontas para serem aplicadas!**


