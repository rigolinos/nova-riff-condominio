import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tzvuzruustalqqbkanat.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFetch() {
  console.log('Fetching condominiums as anonymous user...');
  const { data, error } = await supabase.from('condominiums').select('*');
  
  if (error) {
    console.error('Fetch error:', error);
  } else {
    console.log('Fetched data:', data);
    console.log(`Found ${data?.length || 0} condominiums.`);
  }
}

testFetch();
