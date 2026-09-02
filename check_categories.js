const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://wwzlxdqcuxjywpwmpllt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emx4ZHFjdXhqeXdwd21wbGx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY5MTUyNCwiZXhwIjoyMDk4MjY3NTI0fQ.gq0eHDoind3YEqVxQLt0WhskyF2tUMXVZXkED1KDyvk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  const ids = [1339, 1385, 1388, 1390, 1392, 1395, 1396, 1397, 1398, 1401];
  
  const { data: catLinks, error } = await supabase
    .from('product_categories')
    .select('product_id')
    .in('product_id', ids);

  if (error) console.error(error);
  
  const linkedIds = new Set(catLinks.map(c => c.product_id));
  console.log(`Of the 10 products, ${linkedIds.size} have categories linked.`);
  ids.forEach(id => {
    if (!linkedIds.has(id)) console.log(`Product ${id} has NO categories.`);
  });
}

checkCategories().catch(console.error);
