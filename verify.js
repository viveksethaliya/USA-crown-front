const http = require('http');
const https = require('https');
const { JSDOM } = require('jsdom'); // May not be installed, we can just use regex

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetchUrl('http://localhost:3000/categories/settings');
  
  // Very simple regex parsing for demonstration
  // We want to find product cards and see if they have the image link and title link
  // Let's just find the <a class="products_productImageWrap... href="...">
  // and <a class="products_productNameLink... href="...">
  const imageLinkRegex = /<a[^>]*class="[^"]*productImageWrap[^"]*"[^>]*href="([^"]+)"[^>]*>/g;
  const titleLinkRegex = /<a[^>]*class="[^"]*productNameLink[^"]*"[^>]*href="([^"]+)"[^>]*>/g;
  
  let match;
  const imageLinks = [];
  while ((match = imageLinkRegex.exec(html)) !== null) {
    imageLinks.push(match[1]);
  }
  
  const titleLinks = [];
  while ((match = titleLinkRegex.exec(html)) !== null) {
    titleLinks.push(match[1]);
  }
  
  console.log(`Image Links Count: ${imageLinks.length}`);
  console.log(`Title Links Count: ${titleLinks.length}`);
  
  if (imageLinks.length === titleLinks.length && imageLinks.length > 0) {
    console.log(`\nSample Pairs:`);
    for (let i = 0; i < Math.min(3, imageLinks.length); i++) {
      console.log(`Pair ${i+1}: Image Href: ${imageLinks[i]} | Title Href: ${titleLinks[i]}`);
    }
  }
  
  // Also check for nested <a> tags in ProductCard
  // We'll search for <div class="products_productCard..." and capture up to the closing div
  // But regex for HTML is hard. Let's just find if there is an <a ...> inside another <a ...>
  const nestedARegex = /<a[^>]*>(?:(?!<\/a>).)*?<a[^>]*>/is;
  if (nestedARegex.test(html)) {
    console.log("WARNING: Nested <a> tag found!");
  } else {
    console.log("No nested <a> tags found (regex check).");
  }

  // Get full card markup for V5
  const cardStartIdx = html.indexOf('class="products_productCard__');
  if (cardStartIdx !== -1) {
    // find nearest <div before it
    const divStart = html.lastIndexOf('<div', cardStartIdx);
    // rough ending
    const divEnd = html.indexOf('</a></div></div></div>', divStart);
    if (divEnd !== -1) {
       console.log(`\nSample Card Markup:\n${html.substring(divStart, divEnd + 22)}`);
    }
  }
}

run().catch(console.error);
