import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jvxxnfrcxahycfjpvipf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eHhuZnJjeGFoeWNmanB2aXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODgwMDIsImV4cCI6MjA4OTE2NDAwMn0.zrf8JbnS4lcQ_iHtKl7N6YAkvbAwXhjLUxxwJ_cRBZM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestSummary {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestSummary[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ [PASS] ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message || String(err) });
    console.error(`❌ [FAIL] ${name}:`, err.message || err);
  }
}

async function main() {
  console.log('🚀 Iniciando Smoke Test do Nova Riff Condomínio...\n');

  let testCondoId = ''; 
  let testSpaceId = '';
  let moradorAId = '';
  let testBookingId = '';

  await runTest('0. Setup de Autenticação (Morador A)', async () => {
    // Usando o email já cadastrado para evitar Rate Limit
    const email = `test.novariff.12026@gmail.com`;
    const password = 'testpassword123';
    
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authErr) {
      throw authErr;
    }
    if (!authData.user) throw new Error("No user returned");
    moradorAId = authData.user.id;
  });

  await runTest('1. Busca de Condomínio e Espaço de Teste', async () => {
    // Busca explicitamente o condomínio injetado
    const { data: condos, error: condoErr } = await supabase
      .from('condominiums')
      .select('id')
      .eq('invite_code', 'PILOTO123')
      .limit(1);
    if (condoErr) throw condoErr;
    
    if (condos && condos.length > 0) {
      testCondoId = condos[0].id;
    } else {
      throw new Error("Nenhum condomínio encontrado para testar. Cadastre um manualmente pelo painel.");
    }

    const { data: spaces, error: spaceErr } = await supabase
      .from('amenities')
      .select('id')
      .eq('condominium_id', testCondoId)
      .limit(1);
      
    if (spaceErr) throw spaceErr;
    if (spaces && spaces.length > 0) {
      testSpaceId = spaces[0].id;
    } else {
      throw new Error("Nenhuma amenidade (espaço) encontrada para este condomínio. Crie uma no painel.");
    }
  });

  await runTest('2. Onboarding Simplificado (Atualizar Profile Morador A)', async () => {
    const { error: errA } = await supabase
      .from('profiles')
      .update({
        condominium_id: testCondoId,
        full_name: 'Morador Teste A',
        block_number: 'Bloco A',
        apt_number: '101',
        phone: '51999990001'
      })
      .eq('id', moradorAId);
    if (errA) throw errA;
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  const timeStr = "18:00";

  await runTest('3. Criação de Reserva Válida (Morador A)', async () => {
    const { data: booking, error } = await supabase
      .from('events')
      .insert({
        condominium_id: testCondoId,
        amenity_id: testSpaceId,
        created_by: moradorAId,
        title: 'Tênis de Teste',
        date: dateStr,
        time: timeStr,
        status: 'active'
      })
      .select('id')
      .single();
    if (error) throw error;
    testBookingId = booking.id;
  });

  await runTest('4. Cadastro de Lista de Convidados em Massa', async () => {
    const convidados = ['Carlos Silva', 'Renata Souza', 'Felipe Santos'];
    const payload = convidados.map((name) => ({
      event_id: testBookingId,
      guest_name: name,
      status: 'pending'
    }));

    const { error } = await supabase.from('guest_lists').insert(payload);
    if (error) throw error;
  });

  await runTest('5. Portaria (Busca de Convidado e Check-in Operacional)', async () => {
    const { data: guests, error: searchErr } = await supabase
      .from('guest_lists')
      .select('id, guest_name, status, event_id')
      .eq('event_id', testBookingId)
      .ilike('guest_name', '%Carlos%');
    
    if (searchErr || !guests || guests.length === 0) {
      throw new Error('Portaria: Não foi possível encontrar o convidado na busca.');
    }

    const guestId = guests[0].id;
    const { error: checkinErr } = await supabase
      .from('guest_lists')
      .update({ status: 'checked_in', checkin_time: new Date().toISOString() })
      .eq('id', guestId);

    if (checkinErr) throw checkinErr;
  });

  await runTest('6. Matchmaking "Tô Disponível" (Criação de Status Ativo)', async () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);

    const { error } = await supabase.from('matchmaking_requests').insert({
      condominium_id: testCondoId,
      user_id: moradorAId,
      sport_name: 'Tênis',
      expires_at: expiresAt.toISOString(),
      status: 'active'
    });
    if (error) throw error;
  });

  console.log('\n=========================================');
  console.log('📊 RESUMO DO SMOKE TEST');
  console.log('=========================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Total de Testes: ${results.length}`);
  console.log(`Sucessos: ${passedCount}`);
  console.log(`Falhas: ${results.length - passedCount}`);
  console.log('=========================================\n');
}

main();
