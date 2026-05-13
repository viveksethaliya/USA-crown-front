const fs = require('fs');
const path = require('path');

const directory = 't:\\USA\\crown\\frontend\\src';
const oldUrl = /http:\/\/localhost:5000/g;
const newUrl = 'https://usa-crown-back.vercel.app';

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (stat.isFile()) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('localhost:5000')) {
                const newContent = content.replace(oldUrl, newUrl).replace(/localhost:5000/g, 'usa-crown-back.vercel.app');
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        }
    });
}

walk(directory);
