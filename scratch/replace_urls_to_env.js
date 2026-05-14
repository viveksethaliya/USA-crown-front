const fs = require('fs');
const path = require('path');

const directory = 't:\\USA\\crown\\frontend\\src';

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (stat.isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.jsx'))) {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            // Replace single/double quoted strings
            // Example: "https://usa-crown-back.vercel.app/api/foo" -> `${process.env.NEXT_PUBLIC_API_URL}/api/foo`
            const quoteRegex = /['"]https:\/\/usa-crown-back\.vercel\.app([^'"]*)['"]/g;
            if (quoteRegex.test(content)) {
                content = content.replace(quoteRegex, '`${process.env.NEXT_PUBLIC_API_URL}$1`');
                modified = true;
            }

            // Replace within existing template literals
            // Example: `https://usa-crown-back.vercel.app/api/foo/${id}` -> `${process.env.NEXT_PUBLIC_API_URL}/api/foo/${id}`
            const backtickRegex = /`https:\/\/usa-crown-back\.vercel\.app([^`]+)`/g;
            if (backtickRegex.test(content)) {
                content = content.replace(backtickRegex, '`${process.env.NEXT_PUBLIC_API_URL}$1`');
                modified = true;
            }
            
            // Also replace cases where the domain is hardcoded as a constant string not in a fetch
            // Example: const API = "https://usa-crown-back.vercel.app/api/admin";
            // The quoteRegex already covers this.

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        }
    });
}

walk(directory);
