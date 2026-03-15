# 🗄️ GERENCIAR SUGESTÕES DE MODALIDADES - SUPABASE

## 📋 VISÃO GERAL

Usuários sugerem novas modalidades durante:
- **Cadastro** (Onboarding - Passo 3)
- **Criação de eventos** (Passo 3)

Você gerencia **tudo direto no Supabase Dashboard** - sem precisar de painel na plataforma.

---

## 🔗 ACESSAR SUPABASE

### **Link direto para a tabela:**
```
https://supabase.com/dashboard/project/tzvuzruustalqqbkanat/editor/28553
```

### **Ou navegue:**
1. Acesse: https://supabase.com/dashboard
2. Projeto: `tzvuzruustalqqbkanat`
3. Menu lateral: **Table Editor**
4. Selecione: `sport_suggestions`

---

## 📊 1. VER TODAS AS SUGESTÕES PENDENTES

**Cole este SQL no SQL Editor:**

```sql
SELECT 
  ss.id,
  ss.sport_name,
  ss.status,
  ss.suggested_at,
  p.full_name as sugerido_por,
  au.email
FROM sport_suggestions ss
LEFT JOIN profiles p ON p.user_id = ss.user_id
LEFT JOIN auth.users au ON au.id = ss.user_id
WHERE ss.status = 'pending'
ORDER BY ss.suggested_at DESC;
```

**Resultado:**
```
id                                   | sport_name      | status  | suggested_at        | sugerido_por | email
-------------------------------------|-----------------|---------|---------------------|--------------|------------------
abc123...                            | Beach Tennis    | pending | 2025-10-09 14:30:00 | João Silva   | joao@email.com
def456...                            | Frescobol       | pending | 2025-10-09 15:45:00 | Maria Costa  | maria@email.com
```

---

## ✅ 2. APROVAR UMA SUGESTÃO

**Copia este SQL e MUDA apenas o nome da modalidade:**

```sql
-- ⚠️ MUDE AQUI: Substitua 'Beach Tennis' pelo nome da modalidade
DO $$
DECLARE
  v_suggestion_id UUID;
  v_sport_name TEXT := 'Beach Tennis'; -- 👈 MUDE AQUI
  v_user_id UUID;
BEGIN
  -- Buscar a sugestão
  SELECT id, user_id INTO v_suggestion_id, v_user_id
  FROM sport_suggestions
  WHERE sport_name = v_sport_name AND status = 'pending';

  IF v_suggestion_id IS NULL THEN
    RAISE NOTICE '❌ Sugestão não encontrada ou já processada';
    RETURN;
  END IF;

  -- Adicionar à tabela sports
  INSERT INTO sports (name) VALUES (v_sport_name);

  -- Atualizar status da sugestão
  UPDATE sport_suggestions
  SET status = 'approved', reviewed_at = NOW()
  WHERE id = v_suggestion_id;

  -- Notificar usuário
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user_id,
    'Sugestão aprovada! 🎉',
    format('Sua sugestão "%s" foi aprovada e agora está disponível na plataforma!', v_sport_name),
    'suggestion_approved',
    jsonb_build_object('sport_name', v_sport_name),
    false
  );

  RAISE NOTICE '✅ Modalidade "%" aprovada e adicionada com sucesso!', v_sport_name;
END $$;
```

**O que acontece:**
1. ✅ Adiciona a modalidade à tabela `sports`
2. ✅ Marca a sugestão como `approved`
3. ✅ Envia notificação ao usuário
4. ✅ Modalidade fica disponível para todos imediatamente

---

## ❌ 3. REJEITAR UMA SUGESTÃO

**Copia este SQL e MUDA o nome da modalidade + motivo:**

```sql
-- ⚠️ MUDE AQUI: Substitua o nome e o motivo
DO $$
DECLARE
  v_suggestion_id UUID;
  v_sport_name TEXT := 'Futebol de Areia'; -- 👈 MUDE AQUI
  v_rejection_reason TEXT := 'Já existe como "Beach Soccer"'; -- 👈 MUDE AQUI
  v_user_id UUID;
BEGIN
  -- Buscar a sugestão
  SELECT id, user_id INTO v_suggestion_id, v_user_id
  FROM sport_suggestions
  WHERE sport_name = v_sport_name AND status = 'pending';

  IF v_suggestion_id IS NULL THEN
    RAISE NOTICE '❌ Sugestão não encontrada ou já processada';
    RETURN;
  END IF;

  -- Atualizar status para rejeitada
  UPDATE sport_suggestions
  SET 
    status = 'rejected',
    rejection_reason = v_rejection_reason,
    reviewed_at = NOW()
  WHERE id = v_suggestion_id;

  -- Notificar usuário
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user_id,
    'Sugestão de modalidade',
    format('Sua sugestão "%s" não foi aprovada. Motivo: %s', v_sport_name, v_rejection_reason),
    'suggestion_rejected',
    jsonb_build_object('sport_name', v_sport_name, 'rejection_reason', v_rejection_reason),
    false
  );

  RAISE NOTICE '❌ Modalidade "%" rejeitada. Motivo: %', v_sport_name, v_rejection_reason;
END $$;
```

**O que acontece:**
1. ❌ Marca a sugestão como `rejected`
2. 📝 Salva o motivo da rejeição
3. 🔔 Envia notificação ao usuário com o motivo
4. ⛔ Modalidade NÃO é adicionada

---

## 📊 4. VER HISTÓRICO (TODAS AS SUGESTÕES)

```sql
SELECT 
  ss.id,
  ss.sport_name,
  ss.status,
  ss.suggested_at,
  ss.reviewed_at,
  ss.rejection_reason,
  p.full_name as sugerido_por,
  au.email
FROM sport_suggestions ss
LEFT JOIN profiles p ON p.user_id = ss.user_id
LEFT JOIN auth.users au ON au.id = ss.user_id
ORDER BY ss.suggested_at DESC;
```

---

## 🔍 5. VERIFICAR SE MODALIDADE FOI ADICIONADA

**Depois de aprovar, verifique se foi adicionada:**

```sql
SELECT * FROM sports 
WHERE name ILIKE '%Beach%' -- Mude aqui para buscar
ORDER BY created_at DESC;
```

---

## 📈 6. ESTATÍSTICAS

### **Contar sugestões por status:**
```sql
SELECT 
  status,
  COUNT(*) as total
FROM sport_suggestions
GROUP BY status
ORDER BY status;
```

**Resultado:**
```
status    | total
----------|------
pending   | 5
approved  | 12
rejected  | 3
```

### **Top usuários sugerindo:**
```sql
SELECT 
  p.full_name,
  COUNT(*) as total_sugestoes,
  COUNT(*) FILTER (WHERE ss.status = 'approved') as aprovadas,
  COUNT(*) FILTER (WHERE ss.status = 'rejected') as rejeitadas
FROM sport_suggestions ss
LEFT JOIN profiles p ON p.user_id = ss.user_id
GROUP BY p.full_name, p.user_id
ORDER BY total_sugestoes DESC
LIMIT 10;
```

---

## 🧪 WORKFLOW COMPLETO - EXEMPLO PRÁTICO

### **Cenário: Usuário sugeriu "Padel"**

#### **1️⃣ Ver a sugestão:**
```sql
SELECT * FROM sport_suggestions 
WHERE sport_name = 'Padel' AND status = 'pending';
```

#### **2️⃣ Verificar se já existe:**
```sql
SELECT * FROM sports WHERE name ILIKE '%Padel%';
```

#### **3️⃣ Decidir:**

**Se NÃO existe → APROVAR:**
```sql
DO $$
DECLARE
  v_suggestion_id UUID;
  v_sport_name TEXT := 'Padel';
  v_user_id UUID;
BEGIN
  SELECT id, user_id INTO v_suggestion_id, v_user_id
  FROM sport_suggestions
  WHERE sport_name = v_sport_name AND status = 'pending';

  INSERT INTO sports (name) VALUES (v_sport_name);
  
  UPDATE sport_suggestions
  SET status = 'approved', reviewed_at = NOW()
  WHERE id = v_suggestion_id;
  
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user_id,
    'Sugestão aprovada! 🎉',
    format('Sua sugestão "%s" foi aprovada e agora está disponível na plataforma!', v_sport_name),
    'suggestion_approved',
    jsonb_build_object('sport_name', v_sport_name),
    false
  );
  
  RAISE NOTICE '✅ Padel aprovado!';
END $$;
```

**Se JÁ existe → REJEITAR:**
```sql
DO $$
DECLARE
  v_suggestion_id UUID;
  v_sport_name TEXT := 'Padel';
  v_rejection_reason TEXT := 'Esta modalidade já existe na plataforma';
  v_user_id UUID;
BEGIN
  SELECT id, user_id INTO v_suggestion_id, v_user_id
  FROM sport_suggestions
  WHERE sport_name = v_sport_name AND status = 'pending';

  UPDATE sport_suggestions
  SET status = 'rejected', rejection_reason = v_rejection_reason, reviewed_at = NOW()
  WHERE id = v_suggestion_id;
  
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user_id,
    'Sugestão de modalidade',
    format('Sua sugestão "%s" não foi aprovada. Motivo: %s', v_sport_name, v_rejection_reason),
    'suggestion_rejected',
    jsonb_build_object('sport_name', v_sport_name, 'rejection_reason', v_rejection_reason),
    false
  );
  
  RAISE NOTICE '❌ Padel rejeitado';
END $$;
```

---

## ⚡ ATALHOS RÁPIDOS

### **Aprovar rapidamente (só muda o nome):**
```sql
DO $$
DECLARE v_sport TEXT := 'NOME_AQUI'; v_id UUID; v_user UUID;
BEGIN
  SELECT id, user_id INTO v_id, v_user FROM sport_suggestions WHERE sport_name = v_sport AND status = 'pending';
  INSERT INTO sports (name) VALUES (v_sport);
  UPDATE sport_suggestions SET status = 'approved', reviewed_at = NOW() WHERE id = v_id;
  INSERT INTO notifications (user_id, title, message, type, data, read) VALUES (v_user, 'Sugestão aprovada! 🎉', format('Sua sugestão "%s" foi aprovada!', v_sport), 'suggestion_approved', jsonb_build_object('sport_name', v_sport), false);
  RAISE NOTICE '✅ % aprovado!', v_sport;
END $$;
```

### **Rejeitar rapidamente:**
```sql
DO $$
DECLARE v_sport TEXT := 'NOME_AQUI'; v_reason TEXT := 'MOTIVO_AQUI'; v_id UUID; v_user UUID;
BEGIN
  SELECT id, user_id INTO v_id, v_user FROM sport_suggestions WHERE sport_name = v_sport AND status = 'pending';
  UPDATE sport_suggestions SET status = 'rejected', rejection_reason = v_reason, reviewed_at = NOW() WHERE id = v_id;
  INSERT INTO notifications (user_id, title, message, type, data, read) VALUES (v_user, 'Sugestão de modalidade', format('Sua sugestão "%s" não foi aprovada. Motivo: %s', v_sport, v_reason), 'suggestion_rejected', jsonb_build_object('sport_name', v_sport, 'rejection_reason', v_reason), false);
  RAISE NOTICE '❌ % rejeitado', v_sport;
END $$;
```

---

## 🆘 TROUBLESHOOTING

### **Erro: "Sugestão não encontrada"**
**Causa:** Status não é `pending` ou nome está errado
**Solução:** Verifique o nome exato:
```sql
SELECT sport_name, status FROM sport_suggestions WHERE sport_name ILIKE '%beach%';
```

### **Erro: "duplicate key value violates unique constraint"**
**Causa:** Modalidade já existe na tabela `sports`
**Solução:** Rejeite a sugestão informando que já existe

### **Notificação não chegou ao usuário**
**Solução:** Verifique:
```sql
SELECT * FROM notifications 
WHERE type IN ('suggestion_approved', 'suggestion_rejected')
ORDER BY created_at DESC
LIMIT 5;
```

---

## ✅ CHECKLIST DIÁRIO

- [ ] Acessar Supabase Dashboard
- [ ] Ver sugestões pendentes
- [ ] Para cada sugestão:
  - [ ] Verificar se já existe
  - [ ] Decidir: Aprovar ou Rejeitar
  - [ ] Executar SQL correspondente
  - [ ] Verificar se notificação foi enviada

---

## 🎯 PRONTO!

Agora você gerencia tudo pelo Supabase sem precisar de painel na plataforma! 

**Mais simples, mais rápido, mais controle!** 🚀


