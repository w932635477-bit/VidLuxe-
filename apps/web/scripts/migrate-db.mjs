import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://lklgluxnloqmyelxtpfi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrate() {
  console.log('Testing database connection...');

  // 直接尝试插入测试数据看表结构
  const testData = {
    out_trade_no: 'TEST_MIGRATE_' + Date.now(),
    user_id: 'test-user',
    package_id: 'small',
    amount: 100,
    credits: 10,
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('payment_orders')
    .insert(testData)
    .select();

  if (error) {
    console.log('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success! Table has correct columns.');
    // 删除测试数据
    await supabase.from('payment_orders').delete().eq('out_trade_no', testData.out_trade_no);
  }
}

migrate();
