const http = require('http');

async function run() {
  const html = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/categories/settings', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
  
  const cardStartIdx = html.indexOf('class="products_productCard__');
  if (cardStartIdx !== -1) {
    const divStart = html.lastIndexOf('<div', cardStartIdx);
    const divEnd = html.indexOf('</a></div></div></div>', divStart);
    if (divEnd !== -1) {
       console.log(`\nSample Card Markup:\n${html.substring(divStart, divEnd + 22)}`);
    } else {
       console.log(html.substring(divStart, divStart + 500));
    }
  }
}

run().catch(console.error);
