# 🗄️ Instruções para Aplicar Migrations do Banco de Dados

Este documento explica como aplicar as migrations necessárias para as mudanças implementadas.

## 📋 Mudanças no Banco de Dados

### 1. **Finalização Automática de Eventos** ⏰
- **Arquivo:** `20251004220000_auto_finalize_events.sql`
- **O que faz:** Cria função que marca eventos como "completed" 6 horas após o horário de início
- **Status:** ✅ Criada, aguardando aplicação

### 2. **Correção do Constraint de Status** 🔧
- **Arquivo:** `20251004220100_fix_event_status_constraint.sql`
- **O que faz:** Atualiza o constraint da coluna `status` para suportar valores em português
- **Status:** ✅ Criada, aguardando aplicação

### 3. **Configuração do Cron Job** ⚙️
- **Arquivo:** `20251004220200_setup_event_finalization_cron.sql`
- **O que faz:** Configura execução periódica da função de finalização
- **Status:** ✅ Criada, aguardando aplicação (requer configuração manual)

---

## 🚀 Como Aplicar as Migrations

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Navegar para o diretório do projeto
cd figma-pixel-perfect-clone-3447

# 2. Fazer login no Supabase (se ainda não estiver logado)
npx supabase login

# 3. Linkar o projeto local com o projeto Supabase
npx supabase link --project-ref YOUR_PROJECT_REF

# 4. Aplicar as migrations
npx supabase db push

# 5. Verificar se as migrations foram aplicadas
npx supabase migration list
```

### Opção 2: Via Dashboard do Supabase

1. Acesse: https://app.supabase.com/project/YOUR_PROJECT/editor
2. Vá para **SQL Editor**
3. Cole e execute cada migration na ordem:
   - `20251004220000_auto_finalize_events.sql`
   - `20251004220100_fix_event_status_constraint.sql`
   - `20251004220200_setup_event_finalization_cron.sql`

---

## ⚙️ Configuração do Cron Job

### Opção A: Usando pg_cron (Mais Simples)

O arquivo `20251004220200_setup_event_finalization_cron.sql` já configura o cron automaticamente.

**Verificar se está funcionando:**
```sql
-- Verificar jobs agendados
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-finalize-events-job')
ORDER BY start_time DESC 
LIMIT 10;
```

**Remover o job (se necessário):**
```sql
SELECT cron.unschedule('auto-finalize-events-job');
```

### Opção B: Usando Supabase Edge Functions (Alternativa)

Se pg_cron não estiver disponível:

1. **Criar Edge Function:**
```bash
npx supabase functions new finalize-events
```

2. **Adicionar código** em `supabase/functions/finalize-events/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabaseClient.rpc('auto_finalize_events')

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Events finalized successfully' }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

3. **Deploy da função:**
```bash
npx supabase functions deploy finalize-events
```

4. **Configurar Cron via Dashboard:**
   - Dashboard → Edge Functions → finalize-events
   - Enable Cron
   - Schedule: `0 * * * *` (toda hora)

---

## ✅ Checklist de Verificação

Após aplicar as migrations:

- [ ] ✅ Função `auto_finalize_events()` criada
- [ ] ✅ Constraint de status atualizado
- [ ] ✅ Cron job configurado (pg_cron ou Edge Function)
- [ ] ✅ Testar finalização manual:
  ```sql
  -- Executar manualmente para testar
  SELECT public.auto_finalize_events();
  
  -- Verificar eventos finalizados
  SELECT id, title, status, date, time 
  FROM events 
  WHERE status = 'completed'
  ORDER BY updated_at DESC;
  ```

---

## 🐛 Troubleshooting

### Erro: "permission denied for extension pg_cron"
**Solução:** Use a Opção B (Edge Functions) ou contate o suporte do Supabase para habilitar pg_cron.

### Erro: "constraint violation on status"
**Solução:** Execute a migration `20251004220100_fix_event_status_constraint.sql` primeiro.

### Cron job não está executando
**Solução:** 
1. Verificar se pg_cron está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Verificar logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

---

## 📝 Outras Mudanças (Não Requerem Migration)

### ✅ Campo `gender` na tabela `profiles`
- **Mudança:** Simplificado para 3 opções (Masculino, Feminino, Prefiro não informar)
- **Migration necessária?** ❌ NÃO - Campo é TEXT sem constraint, aceita qualquer valor
- **Compatibilidade:** Valores antigos continuam funcionando

### ✅ Campo `age_group` removido do frontend
- **Mudança:** Filtro de idade removido da criação de eventos
- **Migration necessária?** ❌ NÃO - Campo continua no banco mas não é mais usado
- **Impacto:** Zero - Eventos antigos com idade continuam funcionando

### ✅ Navegação para perfil de participante
- **Mudança:** Apenas frontend
- **Migration necessária?** ❌ NÃO

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase Dashboard
2. Execute `SELECT * FROM pg_stat_activity WHERE query LIKE '%auto_finalize%';`
3. Consulte a documentação: https://supabase.com/docs/guides/database/extensions/pg_cron


