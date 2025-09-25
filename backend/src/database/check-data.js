require('dotenv').config();
const { query, connectDatabase } = require('./connection');

async function checkDatabaseData() {
    try {
        // Connect to database first
        await connectDatabase();

        console.log('🔍 Checking database data...\n');

        // Check users
        const users = await query('SELECT email, first_name, last_name, role FROM users ORDER BY role, first_name');
        console.log('👥 Users:');
        users.rows.forEach(user => {
            console.log(`  ${user.role.toUpperCase()}: ${user.first_name} ${user.last_name} (${user.email})`);
        });

        // Check subjects
        const subjects = await query('SELECT name, category FROM subjects ORDER BY category, name');
        console.log('\n📚 Subjects:');
        subjects.rows.forEach(subject => {
            console.log(`  ${subject.category}: ${subject.name}`);
        });

        // Check tutor-subject relationships
        const tutorSubjects = await query(`
            SELECT u.first_name, u.last_name, s.name as subject, ts.proficiency_level
            FROM tutor_subjects ts
            JOIN users u ON ts.tutor_id = u.id
            JOIN subjects s ON ts.subject_id = s.id
            ORDER BY u.first_name, s.name
        `);
        console.log('\n🎓 Tutor Specializations:');
        tutorSubjects.rows.forEach(ts => {
            console.log(`  ${ts.first_name} ${ts.last_name} - ${ts.subject} (${ts.proficiency_level})`);
        });

        // Check table counts
        const tables = ['users', 'subjects', 'tutor_profiles', 'student_profiles', 'tutor_subjects'];
        console.log('\n📊 Table Counts:');
        for (const table of tables) {
            const result = await query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`  ${table}: ${result.rows[0].count} records`);
        }

        console.log('\n✅ Database check completed successfully!');

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        process.exit(0);
    }
}

checkDatabaseData();