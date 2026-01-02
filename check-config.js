const fs = require('fs');
const path = require('path');
const keyPath = path.join(__dirname, 'functions', 'serviceAccountKey.json');
try {
    const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    console.log(`CHECKING_CONFIG: Project=${keyFile.project_id} | Email=${keyFile.client_email}`);
} catch (e) {
    console.error(e.message);
}
