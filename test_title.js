function generateSEOTitle(name) {
  const defaultTitle = `${name} | Crown Findings`;
  if (defaultTitle.length > 60) return name;
  return defaultTitle;
}

// "call it directly with strings of 55, 60, 61, and 80 characters and paste the output"
// The prompt means strings representing full default title lengths? Or product names?
// "with strings of 55, 60... characters" likely refers to the product name strings, OR the generated defaultTitle. Let's just create names that are 55, 60, 61, 80 characters long and print the result.

const lengths = [55, 60, 61, 80];
console.log('Testing generateSEOTitle with product names of specific lengths:\n');

lengths.forEach(len => {
  const name = 'A'.repeat(len);
  const result = generateSEOTitle(name);
  console.log(`Input Name Length: ${len}`);
  console.log(`Input Name:        ${name.substring(0, 20)}...`);
  console.log(`Output Length:     ${result.length}`);
  console.log(`Output Title:      ${result.substring(0, 40)}... (truncated for display)`);
  console.log(`Has Suffix?:       ${result.includes(' | Crown Findings') ? 'Yes' : 'No'}\n`);
});

// Also test names that result in a default title exactly equal to 60, 61, etc.
// suffix length is 17 chars: " | Crown Findings"
console.log('Testing generateSEOTitle with names that result in specific full title lengths:\n');
const targetTitleLengths = [55, 60, 61, 80];
targetTitleLengths.forEach(targetLen => {
  const nameLen = targetLen - 17;
  if (nameLen <= 0) return;
  const name = 'B'.repeat(nameLen);
  const result = generateSEOTitle(name);
  console.log(`Target Full Title Length: ${targetLen}`);
  console.log(`Input Name Length:        ${nameLen}`);
  console.log(`Output Length:            ${result.length}`);
  console.log(`Has Suffix?:              ${result.includes(' | Crown Findings') ? 'Yes' : 'No'}\n`);
});
