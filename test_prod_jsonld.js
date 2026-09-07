async function checkUrl(url, name) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    console.log('\n=== JSON-LD for ' + name + ' ===');
    const regex = /<script\s+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
    let found = false;
    let match;
    while ((match = regex.exec(html)) !== null) {
      console.log(match[1]);
      found = true;
    }
    if (!found) console.log('No JSON-LD found');
  } catch (e) {
    console.log('Error fetching ' + url + ': ' + e.message);
  }
}

async function runRegression(url, expectedStatus) {
  try {
    const res = await fetch(url);
    console.log(`[Regression] ${url} -> ${res.status} (Expected: ${expectedStatus})`);
    if (url.includes('sitemap.xml')) {
       const text = await res.text();
       const count = (text.match(/<loc>/g) || []).length;
       console.log(`[Sitemap] <loc> count: ${count}`);
    }
  } catch(e) {
    console.log(`[Regression Error] ${url} -> ${e.message}`);
  }
}

async function run() {
  await checkUrl('https://usa-crown-front.vercel.app', 'Homepage');
  await checkUrl('https://usa-crown-front.vercel.app/products/a-11-5mm-die-struck-block-initial', 'PDP');
  await checkUrl('https://usa-crown-front.vercel.app/categories/pendants', '/categories/pendants');
  await checkUrl('https://usa-crown-front.vercel.app/categories/pendants?page=2', '/categories/pendants?page=2');

  console.log('\n=== REGRESSIONS ===');
  await runRegression('https://usa-crown-front.vercel.app/products/a-11-5mm-die-struck-block-initial', 200);
  await runRegression('https://usa-crown-front.vercel.app/products/zzz-does-not-exist-999', 404);
  await runRegression('https://usa-crown-front.vercel.app/categories/pendants', 200);
  await runRegression('https://usa-crown-front.vercel.app/categories/pendants?page=2', 200);
  await runRegression('https://usa-crown-front.vercel.app/products', 200);
  await runRegression('https://usa-crown-front.vercel.app/', 200);
  await runRegression('https://usa-crown-front.vercel.app/sitemap.xml', 200);
  await runRegression('https://usa-crown-front.vercel.app/robots.txt', 200);
}

run();
