const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if file contains localhost:5001
    if (content.includes('localhost:5001')) {
        console.log(`Fixing ${file}...`);

        // Add import if not present
        if (!content.includes("from '../config'")) {
            const importMatch = content.match(/(import.*from.*['"]\.\.\/utils\/auth['"];?\n)/);
            if (importMatch) {
                content = content.replace(
                    importMatch[1],
                    importMatch[1] + "import { API_BASE_URL } from '../config';\n"
                );
            }
        }

        // Replace all localhost:5001 URLs
        content = content.replace(/['"]http:\/\/localhost:5001\//g, '`${API_BASE_URL}/');
        content = content.replace(/(['"]http:\/\/localhost:5001\/api\/[^'"]+)(['"

])/g, (match, p1, p2) => {
            return p1.replace(/^['"]/, '`${API_BASE_URL}/').replace(/$/, '`');
        });

        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed ${file}`);
    }
});

console.log('Done!');
