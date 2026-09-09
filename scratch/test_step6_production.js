const BASE_URL = 'https://usa-crown-front.vercel.app';

const routes = [
  '/',
  '/products/a-11-5mm-die-struck-block-initial',
  '/cart',
  '/categories/pendants',
  '/categories/numbers-numbers',
  '/categories/bracelets',
  '/robots.txt'
];

async function runTest() {
  console.log('Fetching production routes from:', BASE_URL);
  
  for (const path of routes) {
    const url = `${BASE_URL}${path}?_t=${Date.now()}`;
    console.log(`\n=== FETCHING ${path} ===`);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const text = await res.text();
      
      if (path === '/robots.txt') {
        console.log('--- RAW ROBOTS.TXT ---');
        console.log(text);
        console.log('----------------------');
      } else {
        const matches = text.match(/<meta[^>]*name=["']robots["'][^>]*>/gi) || [];
        console.log(`Tag count for <meta name="robots">: ${matches.length}`);
        matches.forEach((tag, idx) => {
          console.log(`  Tag #${idx + 1}: ${tag}`);
        });
        if (matches.length === 0) {
          console.log('  NO <meta name="robots"> tag found.');
        }
      }
    } catch (err) {
      console.error(`Error fetching ${path}:`, err.message);
    }
  }
}

runTest();
