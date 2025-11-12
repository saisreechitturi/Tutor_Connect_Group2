const { query, connectDatabase } = require('./src/database/connection');

async function checkAvailabilityTable() {
    try {
        await connectDatabase();

        console.log('🔍 Checking tutor_availability_slots table structure...');
        const structure = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tutor_availability_slots'
            ORDER BY ordinal_position
        `);

        console.log('📋 Tutor Availability Slots Table Structure:');
        structure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // Also check if table exists or is named differently
        console.log('\n🔍 Checking for availability-related tables...');
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%availability%'
        `);

        console.log('📋 Availability-related tables:');
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkAvailabilityTable();