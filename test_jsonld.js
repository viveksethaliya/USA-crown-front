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

async function run() {
  await checkUrl('http://localhost:3000', 'Homepage (Organization)');
  await checkUrl('http://localhost:3000/products/a-11-5mm-die-struck-block-initial', 'PDP (Product)');
  await checkUrl('http://localhost:3000/categories/pendants', 'Category Grid (/categories/pendants)');
  await checkUrl('http://localhost:3000/categories/pendants?page=2', 'Category Grid Page 2');
}

run();
