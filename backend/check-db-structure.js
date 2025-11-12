const { query, connectDatabase } = require('./src/database/connection');

async function checkDatabase() {
    try {
        await connectDatabase();

        console.log('🔍 Checking tutor_profiles table structure...');
        const tableStructure = await query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'tutor_profiles' 
            ORDER BY ordinal_position
        `);

        console.log('📋 Tutor Profiles Table Structure:');
        tableStructure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        console.log('\n🔍 Checking if tutor_profiles records exist...');
        const profileCount = await query('SELECT COUNT(*) as count FROM tutor_profiles');
        console.log(`📊 Found ${profileCount.rows[0].count} tutor profiles in database`);

        console.log('\n🔍 Checking tutor_availability_slots table...');
        const slotsCount = await query('SELECT COUNT(*) as count FROM tutor_availability_slots');
        console.log(`📊 Found ${slotsCount.rows[0].count} availability slots in database`);

        console.log('\n🔍 Checking tutor_subjects table...');
        const subjectsCount = await query('SELECT COUNT(*) as count FROM tutor_subjects');
        console.log(`📊 Found ${subjectsCount.rows[0].count} tutor-subject mappings in database`);

    } catch (error) {
        console.error('❌ Database check failed:', error);
    } finally {
        process.exit(0);
    }
}

checkDatabase();