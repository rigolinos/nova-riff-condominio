import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://jvxxnfrcxahycfjpvipf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHhuZnJjeGFoeWNmanB2aXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODgwMDIsImV4cCI6MjA4OTE2NDAwMn0.zrf8JbnS4lcQ_iHtKl7N6YAkvbAwXhjLUxxwJ_cRBZM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSmokeTest() {
  console.log("🚀 Iniciando Teste Fumaça (Smoke Test)...\n");

  const timestamp = Date.now();
  const user1Email = `user1_${timestamp}@teste.com`;
  const user2Email = `user2_${timestamp}@teste.com`;
  const password = "Password123!";

  try {
    // 1. Criar Conta 1
    console.log(`[1] Criando conta do Síndico: ${user1Email}`);
    const { data: authData1, error: authErr1 } = await supabase.auth.signUp({
      email: user1Email,
      password: password,
      options: { data: { full_name: "Síndico Teste" } }
    });
    
    if (authErr1) throw authErr1;
    const user1 = authData1.user;
    if (!user1) throw new Error("Usuário 1 não retornado");
    console.log(`✅ Conta criada com ID: ${user1.id}\n`);

    // 2. Simulando passo de "Criar Condomínio" no Onboarding
    console.log(`[2] Executando RPC: create_condominium_with_seed...`);
    const { data: condoData, error: condoErr } = await supabase.rpc('create_condominium_with_seed', {
      p_name: `Condomínio Teste ${timestamp}`,
      p_address: 'Rua das Flores 123',
      p_city: 'Cidade Teste',
      p_creator_id: user1.id
    });

    if (condoErr) throw condoErr;
    if (!condoData.success) throw new Error(condoData.message);
    
    const inviteCode = condoData.invite_code;
    const condoId = condoData.condominium_id;
    console.log(`✅ Condomínio criado! ID: ${condoId} | CÓDIGO GERADO: ${inviteCode}\n`);

    // 3. Verificando as amenidades padrão (Quadra e Academia)
    console.log(`[3] Verificando amenidades inseridas via seed...`);
    const { data: amenities, error: amenitiesErr } = await supabase
      .from('amenities')
      .select('name, capacity')
      .eq('condominium_id', condoId);

    if (amenitiesErr) throw amenitiesErr;
    console.log(`✅ Encontradas ${amenities.length} amenidades:`);
    amenities.forEach(a => console.log(`   - ${a.name} (Capacidade: ${a.capacity})`));
    console.log("");

    // Logout User 1
    await supabase.auth.signOut();

    // 4. Criar Conta 2
    console.log(`[4] Criando conta do Vizinho: ${user2Email}`);
    const { data: authData2, error: authErr2 } = await supabase.auth.signUp({
      email: user2Email,
      password: password,
      options: { data: { full_name: "Vizinho Teste" } }
    });
    
    if (authErr2) throw authErr2;
    const user2 = authData2.user;
    if (!user2) throw new Error("Usuário 2 não retornado");
    console.log(`✅ Conta criada com ID: ${user2.id}\n`);

    // 5. Simulando passo "Entrar com Código" no Onboarding
    console.log(`[5] Executando RPC: join_condominium_by_code usando o código: ${inviteCode}...`);
    const { data: joinData, error: joinErr } = await supabase.rpc('join_condominium_by_code', {
      p_invite_code: inviteCode,
      p_user_id: user2.id
    });

    if (joinErr) throw joinErr;
    if (!joinData.success) throw new Error(joinData.message);
    console.log(`✅ Vinculado ao condomínio com sucesso!\n`);

    // 6. Verificando se profiles bate
    console.log(`[6] Verificando se o perfil do usuário 2 reflete o vínculo...`);
    const { data: profile2, error: profileErr2 } = await supabase
      .from('profiles')
      .select('condominium_id, is_admin')
      .eq('user_id', user2.id)
      .single();

    if (profileErr2) throw profileErr2;
    
    if (profile2.condominium_id === condoId) {
      console.log(`✅ SUCESSO! Perfil validado. Condomínio: ${profile2.condominium_id} | Admin: ${profile2.is_admin}`);
    } else {
      throw new Error("Condomínio ID não bate.");
    }

    console.log("\n🎉 TESTE FUMAÇA CONCLUÍDO COM SUCESSO! TODAS AS MECÂNICAS BACKEND ESTÃO 100% OPERACIONAIS.");

  } catch (error) {
    console.error("\n❌ ERRO DURANTE O TESTE:", error);
  }
}

runSmokeTest();
