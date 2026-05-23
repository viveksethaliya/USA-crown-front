const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'app', 'crown-admin');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk(targetDir);
let replacedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace API constant declaration
    // e.g. const API = `${process.env.NEXT_PUBLIC_API_URL}/api/admin`;
    let newContent = content.replace(/const\s+API\s*=\s*`\$\{process\.env\.NEXT_PUBLIC_API_URL\}\/api\/admin`;/g, "const API = '/api/admin';");
    
    // Replace inline fetch strings
    // e.g. `${process.env.NEXT_PUBLIC_API_URL}/api/...`
    newContent = newContent.replace(/\$\{process\.env\.NEXT_PUBLIC_API_URL\}\/api/g, '/api');
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        replacedCount++;
        console.log('Updated: ' + file.replace(targetDir, ''));
    }
});

console.log(`\nReplacement complete! Updated ${replacedCount} files.`);
