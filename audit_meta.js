const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const files = [];
walkDir('t:/USA/crown2/frontend/src/app/(main)/(with-loading)', (filePath) => {
  if (filePath.endsWith('page.tsx')) files.push(filePath);
});

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let route = '/' + path.basename(path.dirname(f));
  if (route === '/(with-loading)') route = '/';
  
  const hasMetadata = content.includes('export const metadata') || content.includes('export async function generateMetadata');
  let titleStr = 'Fallback (layout)';
  let descStr = 'Fallback (layout)';
  
  if (hasMetadata) {
    const titleMatch = content.match(/title:\s*(['"`].*?['"`])/s);
    if (titleMatch) titleStr = titleMatch[1].trim().replace(/\n/g, ' ');
    const descMatch = content.match(/description:\s*(['"`].*?['"`])/s);
    if (descMatch) descStr = descMatch[1].trim().replace(/\n/g, ' ');
  }
  
  console.log(`${route.padEnd(25)} | ${hasMetadata ? 'Yes' : 'No'} | ${titleStr.substring(0, 45).padEnd(45)} | ${descStr.substring(0, 50)}`);
});
