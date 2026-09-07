const fs = require('fs');

async function testUrl(url, name) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    console.log(`\n=== Testing ${name} (${url}) ===`);

    const titleMatch = html.match(/<title>(.*?)<\/title>/is);
    console.log(`Title: ${titleMatch ? titleMatch[1] : 'Not found'}`);

    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/is);
    console.log(`Canonical: ${canonicalMatch ? canonicalMatch[1] : 'Not found'}`);

    const ldJsonMatches = html.match(/<script\s+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
    if (ldJsonMatches) {
      ldJsonMatches.forEach((script, i) => {
        const innerMatch = script.match(/>(.*?)<\/script>/is);
        console.log(`JSON-LD ${i + 1}: ${innerMatch ? innerMatch[1] : ''}`);
      });
    } else {
      console.log('JSON-LD: Not found');
    }
  } catch (e) {
    console.log(`Error testing ${url}: ${e.message}`);
  }
}

async function run() {
  await testUrl('http://localhost:3000/products/a-11-5mm-die-struck-block-initial', 'PDP');
  await testUrl('http://localhost:3000/categories/pendants', 'Category Grid');
}

run();
