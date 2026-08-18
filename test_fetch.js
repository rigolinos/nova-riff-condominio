import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jvxxnfrcxahycfjpvipf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_CEWTn5h4NpVJglvICX6ieg_krQYaj2B';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFetch() {
  console.log('Testing signup...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_user_nova_riff_99@gmail.com',
    password: 'Password123!',
    options: {
      data: {
        full_name: 'Test User',
        condominium_id: null,
        block_number: '',
        apt_number: ''
      }
    }
  });
  
  if (error) {
    console.error('Signup error:', error);
  } else {
    console.log('Signup success:', data.user?.id);
  }
}

testFetch();
