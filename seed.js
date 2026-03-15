import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tzvuzruustalqqbkanat.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('Seeding Database...');

  // 1. Insert Condominium
  console.log('Inserting Condominium...');
  const { data: condo, error: condoErr } = await supabase
    .from('condominiums')
    .upsert({
      name: 'Condomínio Riff Sports',
      invite_code: 'RIFFCODE2026'
    }, { onConflict: 'invite_code' })
    .select()
    .single();

  if (condoErr) {
    console.error('Error inserting Condo (might need RLS bypass):', condoErr.message);
    if (condoErr.message.includes('row-level security')) {
       console.log('\n❌ RLS Blocking. Needs Service Key or SQL execution manually.');
       process.exit(1);
    }
  }

  const condoId = condo?.id;
  if (!condoId) return;
  console.log(`✅ Condo added with ID: ${condoId}`);

  // 2. Insert Amenities
  const amenitiesToInsert = [
    { condominium_id: condoId, name: 'Quadra de Tênis', capacity: 4, type: 'Quartos' },
    { condominium_id: condoId, name: 'Academia', capacity: 15, type: 'Fitness' },
    { condominium_id: condoId, name: 'Piscina', capacity: 30, type: 'Clube' },
    { condominium_id: condoId, name: 'Quadra de Futebol', capacity: 14, type: 'Campo' },
    { condominium_id: condoId, name: 'Churrasqueira 1', capacity: 20, type: 'Lazer' }
  ];

  for (const amenity of amenitiesToInsert) {
    const { error: amErr } = await supabase.from('amenities').insert(amenity);
    if (amErr) {
       console.error(`Error inserting Amenity ${amenity.name}:`, amErr.message);
    } else {
       console.log(`✅ Amenity added: ${amenity.name}`);
    }
  }

  // 3. Insert specific Users
  const users = [
    { email: 'joao.silva@teste.com', pass: 'Test1234!', name: 'João Silva', block: 'A', apt: '101' },
    { email: 'maria.souza@teste.com', pass: 'Test1234!', name: 'Maria Souza', block: 'B', apt: '202' },
    { email: 'carlos.pereira@teste.com', pass: 'Test1234!', name: 'Carlos Pereira', block: 'A', apt: '305' },
    { email: 'ana.julia@teste.com', pass: 'Test1234!', name: 'Ana Júlia', block: 'C', apt: '410' }
  ];

  const userIds = [];
  
  for (const u of users) {
    console.log(`Creating user ${u.name}...`);
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: u.email,
      password: u.pass,
      options: {
        data: {
          full_name: u.name,
          condominium_id: condoId,
          block_number: u.block,
          apt_number: u.apt,
          status: 'approved'
        }
      }
    });

    if (authErr) {
      if (authErr.message.includes('already registered')) {
         console.log(`User ${u.email} already exists, skipping creation.`);
         // To get the ID, we'd need to log in
         const { data: loginData } = await supabase.auth.signInWithPassword({ email: u.email, password: u.pass });
         if (loginData.user) userIds.push(loginData.user.id);
      } else {
         console.error(`Auth Error for ${u.email}:`, authErr.message);
      }
    } else if (authData.user) {
      userIds.push(authData.user.id);
      console.log(`✅ User created: ${authData.user.id}`);
    }
  }

  if (userIds.length === 0) {
      console.log('No users created/found. Exiting mock events creation.');
      return;
  }

  // Use the first user's session to insert events/matchmaking so RLS allows it (they belong to that condo)
  await supabase.auth.signInWithPassword({ email: users[0].email, password: users[0].pass });
  const uid = userIds[0];

  // 4. Matchmaking Requests
  const { error: mmErr } = await supabase.from('matchmaking_requests').insert([
    { user_id: uid, condominium_id: condoId, sport_name: 'Futebol Society', time_preference: 'Hoje às 19h', status: 'active' },
    { user_id: uid, condominium_id: condoId, sport_name: 'Tênis de Quadra', time_preference: 'Amanhã de manhã', status: 'active' },
    { user_id: uid, condominium_id: condoId, sport_name: 'Padel', time_preference: 'Disponível hoje o dia todo', status: 'active' }
  ]);
  if (mmErr) console.error('Error Matchmaking:', mmErr.message);
  else console.log('✅ Matchmaking requests added');

  // 5. Amenity check-ins
  // Fetch amenities to get their actual IDs
  const { data: amList } = await supabase.from('amenities').select('id, name');
  if (amList && amList.length > 0) {
      const academia = amList.find(a => a.name === 'Academia');
      const piscina = amList.find(a => a.name === 'Piscina');
      
      const checkins = [];
      if (academia) checkins.push({ user_id: uid, amenity_id: academia.id, status: 'active' });
      if (piscina && userIds.length > 1) checkins.push({ user_id: userIds[1], amenity_id: piscina.id, status: 'active' });
      
      if (checkins.length > 0) {
          const { error: chkErr } = await supabase.from('amenity_checkins').insert(checkins);
          if (chkErr) console.error('Error Checkins:', chkErr.message);
          else console.log('✅ Check-ins added');
      }
  }

  // 6. Events (Games happening/scheduled)
  if (amList && amList.length > 0) {
      const quadraTenis = amList.find(a => a.name === 'Quadra de Tênis');
      if (quadraTenis) {
          const { error: evErr } = await supabase.from('events').insert([
              { 
                  title: 'Torneio Interno de Tênis', 
                  condominium_id: condoId, 
                  amenity_id: quadraTenis.id,
                  location: 'Quadra de Tênis',
                  date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                  time: '18:00',
                  max_participants: 4,
                  created_by: uid,
                  status: 'active'
              }
          ]);
          if (evErr) console.error('Error Events:', evErr.message);
          else console.log('✅ Event (Reservation) added');
      }
  }

  console.log('🏆 Seeding completed!');
}

seed().catch(console.error);
