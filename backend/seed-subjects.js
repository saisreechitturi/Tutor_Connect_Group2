const { query, connectDatabase } = require('./src/database/connection');

async function seedSubjects() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDatabase();

        console.log('🌱 Seeding subjects...');

        // Check if subjects already exist
        const existingSubjects = await query('SELECT COUNT(*) FROM subjects');
        const count = parseInt(existingSubjects.rows[0].count);

        if (count > 0) {
            console.log(`📚 Found ${count} existing subjects. Skipping seed.`);
            return;
        }

        // Insert test subjects
        const subjects = [
            {
                id: '5300be37-5643-4372-98c7-3c468655c838',
                name: 'Mathematics',
                description: 'Basic to advanced mathematics including algebra, calculus, and statistics',
                category: 'academics'
            },
            {
                id: '886240f2-186d-4f7c-8a6a-89b41d11adca',
                name: 'Physics',
                description: 'Physics concepts from basic mechanics to advanced quantum physics',
                category: 'science'
            },
            {
                id: 'b59cf17e-6bdf-4de9-b775-7a55609eb1c6',
                name: 'Computer Science',
                description: 'Programming, algorithms, data structures, and software development',
                category: 'technology'
            }
        ];

        for (const subject of subjects) {
            await query(`
                INSERT INTO subjects (id, name, description, category, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [subject.id, subject.name, subject.description, subject.category, true]);

            console.log(`✅ Added subject: ${subject.name}`);
        }

        console.log('🎉 Successfully seeded subjects!');

        // Verify the insert
        const result = await query('SELECT id, name, category FROM subjects ORDER BY name');
        console.log('\n📋 Current subjects in database:');
        result.rows.forEach(row => {
            console.log(`  - ${row.name} (${row.category})`);
        });

    } catch (error) {
        console.error('❌ Error seeding subjects:', error);
    }
}

// Run the seed function
seedSubjects()
    .then(() => {
        console.log('\n✨ Seed process completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Seed process failed:', error);
        process.exit(1);
    });