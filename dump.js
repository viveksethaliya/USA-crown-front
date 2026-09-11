const fs = require('fs');
const html = fs.readFileSync('sample.html', 'utf8');

const imageLinks = [];
const imageLinkRegex = /<a[^>]*class="[^"]*productImageWrap[^"]*"[^>]*href="([^"]+)"[^>]*>/g;
let match;
while ((match = imageLinkRegex.exec(html)) !== null) {
  imageLinks.push(match[1]);
}

const titleLinks = [];
const titleLinkRegex = /<a[^>]*class="[^"]*productNameLink[^"]*"[^>]*href="([^"]+)"[^>]*>/g;
while ((match = titleLinkRegex.exec(html)) !== null) {
  titleLinks.push(match[1]);
}

console.log(`Image Links Count: ${imageLinks.length}`);
console.log(`Title Links Count: ${titleLinks.length}`);

if (imageLinks.length > 0 && imageLinks.length === titleLinks.length) {
  console.log(`\nSample Pairs:`);
  for (let i = 0; i < Math.min(3, imageLinks.length); i++) {
    console.log(`Pair ${i+1}: Image Href: ${imageLinks[i]} | Title Href: ${titleLinks[i]}`);
  }
}

const cardStartIdx = html.indexOf('class="products_productCard__');
if (cardStartIdx !== -1) {
  const divStart = html.lastIndexOf('<div', cardStartIdx);
  const divEnd = html.indexOf('</a></div></div></div>', divStart);
  if (divEnd !== -1) {
     console.log(`\nSample Card Markup:\n${html.substring(divStart, divEnd + 22)}`);
  }
}
