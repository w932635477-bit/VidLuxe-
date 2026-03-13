import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lklgluxnloqmyelxtpfi.supabase.co';
const supabaseKey = 'sb_publishable_QLmkAw7q4haVO0fjItq04w_YGmShvjP';

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Attempting login...');
const startTime = Date.now();

const { data, error } = await supabase.auth.signInWithPassword({
  email: '932635477@qq.com',
  password: 'test123456',
});

const elapsed = Date.now() - startTime;
console.log(`Login took ${elapsed}ms`);

if (error) {
  console.error('Login error:', error);
} else {
  console.log('Login successful!');
  console.log('User ID:', data.user?.id);
}
