const { query, connectDatabase } = require('./src/database/connection');

async function checkCertificationsField() {
    try {
        await connectDatabase();

        const result = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tutor_profiles' 
            AND column_name = 'certifications'
        `);

        console.log('Certifications field info:', JSON.stringify(result.rows, null, 2));

        // Also check existing data to see the format
        const existing = await query('SELECT certifications FROM tutor_profiles LIMIT 1');
        console.log('Existing certifications data:', JSON.stringify(existing.rows, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkCertificationsField();