const fs = require('fs');
const html = fs.readFileSync('sample.html', 'utf8');

// Find a block that looks like a product card
const cardStartRegex = /<div class="[^"]*productCard[^"]*"/;
const match = cardStartRegex.exec(html);

if (match) {
  const startIndex = match.index;
  // find the second </a> and some closing divs
  let endIndex = startIndex;
  let aCount = 0;
  while (aCount < 2 && endIndex < html.length) {
    const nextA = html.indexOf('</a>', endIndex);
    if (nextA !== -1) {
      endIndex = nextA + 4;
      aCount++;
    } else {
      break;
    }
  }
  // add a few closing divs
  const finalIndex = html.indexOf('</div>', endIndex) + 6;
  console.log(`\nSample Card Markup:\n${html.substring(startIndex, finalIndex)}`);
} else {
  console.log("No product card found.");
}
