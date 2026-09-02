const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://wwzlxdqcuxjywpwmpllt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emx4ZHFjdXhqeXdwd21wbGx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY5MTUyNCwiZXhwIjoyMDk4MjY3NTI0fQ.gq0eHDoind3YEqVxQLt0WhskyF2tUMXVZXkED1KDyvk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  let all = [];
  let from = 0;
  while (true) {
    const res = await supabase.from('products').select('id').eq('is_published', true).range(from, from + 999);
    if (!res.data || res.data.length === 0) break;
    all.push(...res.data);
    from += 1000;
  }
  console.log('Fetched via pagination length:', all.length);
  const ids = new Set(all.map(p => p.id));
  console.log('Unique IDs:', ids.size);
}
testQuery().catch(console.error);
