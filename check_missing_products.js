const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://wwzlxdqcuxjywpwmpllt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emx4ZHFjdXhqeXdwd21wbGx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY5MTUyNCwiZXhwIjoyMDk4MjY3NTI0fQ.gq0eHDoind3YEqVxQLt0WhskyF2tUMXVZXkED1KDyvk';
const supabase = createClient(supabaseUrl, supabaseKey);

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      // drain
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode));
    }).on('error', reject);
  });
}

async function findDiscrepancy() {
  console.log("Fetching all published products from DB...");
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, slug, is_published, stock_status, visibility')
    .eq('is_published', true);
  
  if (error) {
    console.error("DB error:", error);
    return;
  }
  console.log(`DB returned ${dbProducts.length} published products.`);

  console.log("Fetching all products from storefront catalog API...");
  // Using limit 2000 to get them all
  const apiRes = await get('http://localhost:5000/api/store/catalog/products?limit=2000');
  const apiProducts = apiRes.data.products || [];
  console.log(`API returned ${apiProducts.length} products.`);

  const apiSlugs = new Set(apiProducts.map(p => p.slug));
  const missing = dbProducts.filter(p => !apiSlugs.has(p.slug));

  console.log(`\nFound ${missing.length} products in DB but missing from API:`);
  
  for (const p of missing) {
    console.log(`ID: ${p.id}, Slug: ${p.slug}, Stock: ${p.stock_status}, Vis: ${p.visibility}`);
    // Fetch from storefront unauthenticated
    const status = await fetchUrl(`http://localhost:3000/products/${encodeURIComponent(p.slug)}`);
    console.log(`  -> Unauthenticated PDP fetch status: ${status}`);
  }
}

findDiscrepancy().catch(console.error);
