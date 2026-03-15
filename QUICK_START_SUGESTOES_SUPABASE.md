# 🚀 QUICK START - Sugestões pelo Supabase

## ⚡ GUIA RÁPIDO (2 minutos)

### 📍 **1. Ver sugestões pendentes:**
```
https://supabase.com/dashboard/project/tzvuzruustalqqbkanat/editor
→ Tabela: sport_suggestions
→ Filtro: status = pending
```

### ✅ **2. Aprovar (copie e mude só o nome):**
```sql
DO $$
DECLARE v_sport TEXT := 'Beach Tennis'; -- 👈 MUDE AQUI
        v_id UUID; v_user UUID;
BEGIN
  SELECT id, user_id INTO v_id, v_user 
  FROM sport_suggestions 
  WHERE sport_name = v_sport AND status = 'pending';
  
  INSERT INTO sports (name) VALUES (v_sport);
  
  UPDATE sport_suggestions 
  SET status = 'approved', reviewed_at = NOW() 
  WHERE id = v_id;
  
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user, 
    'Sugestão aprovada! 🎉',
    format('Sua sugestão "%s" foi aprovada!', v_sport),
    'suggestion_approved',
    jsonb_build_object('sport_name', v_sport),
    false
  );
  
  RAISE NOTICE '✅ % aprovado!', v_sport;
END $$;
```

### ❌ **3. Rejeitar (mude nome + motivo):**
```sql
DO $$
DECLARE v_sport TEXT := 'Futebol de Areia'; -- 👈 MUDE AQUI
        v_reason TEXT := 'Já existe como Beach Soccer'; -- 👈 MUDE AQUI
        v_id UUID; v_user UUID;
BEGIN
  SELECT id, user_id INTO v_id, v_user 
  FROM sport_suggestions 
  WHERE sport_name = v_sport AND status = 'pending';
  
  UPDATE sport_suggestions 
  SET status = 'rejected', 
      rejection_reason = v_reason, 
      reviewed_at = NOW() 
  WHERE id = v_id;
  
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user,
    'Sugestão de modalidade',
    format('Sua sugestão "%s" não foi aprovada. Motivo: %s', v_sport, v_reason),
    'suggestion_rejected',
    jsonb_build_object('sport_name', v_sport, 'rejection_reason', v_reason),
    false
  );
  
  RAISE NOTICE '❌ % rejeitado', v_sport;
END $$;
```

---

## 📖 DOCUMENTAÇÃO COMPLETA:
Ver: `GERENCIAR_SUGESTOES_SUPABASE.md`

## 🎯 ONDE USUÁRIOS SUGEREM:
- `/onboarding/step3` (Cadastro)
- `/create-event/step3` (Criar evento)

**Pronto!** 🚀


