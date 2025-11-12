const { query, connectDatabase } = require('./src/database/connection');

async function checkConstraints() {
    try {
        await connectDatabase();

        console.log('🔍 Checking constraints for tutor_profiles...');
        const constraints = await query(`
            SELECT 
                tc.constraint_name, 
                tc.constraint_type,
                cc.check_clause
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.check_constraints cc 
                ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'tutor_profiles' 
            AND tc.constraint_type = 'CHECK'
        `);

        console.log('📋 Check constraints:');
        constraints.rows.forEach(constraint => {
            console.log(`  - ${constraint.constraint_name}:`);
            console.log(`    ${constraint.check_clause}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkConstraints();