const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://wwzlxdqcuxjywpwmpllt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emx4ZHFjdXhqeXdwd21wbGx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY5MTUyNCwiZXhwIjoyMDk4MjY3NTI0fQ.gq0eHDoind3YEqVxQLt0WhskyF2tUMXVZXkED1KDyvk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  const { count: pub } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_published', true);
  const { count: unpub } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_published', false);
  const { count: all } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log(`Published: ${pub}, Unpublished: ${unpub}, All: ${all}`);
}
checkAll();
