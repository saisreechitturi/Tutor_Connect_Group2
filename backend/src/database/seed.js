// Load environment variables
require('dotenv').config();

const { connectDatabase, query } = require('./connection');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

const seedData = async () => {
    try {
        logger.info('[INFO] Starting database seeding...');

        // Initialize database connection first
        await connectDatabase();

        // Insert sample subjects
        const subjectsData = [
            { name: 'Mathematics', description: 'Algebra, Calculus, Geometry, Statistics', category: 'STEM' },
            { name: 'Physics', description: 'Classical mechanics, Thermodynamics, Electromagnetism', category: 'STEM' },
            { name: 'Chemistry', description: 'Organic, Inorganic, Physical Chemistry', category: 'STEM' },
            { name: 'Biology', description: 'Cell Biology, Genetics, Evolution, Ecology', category: 'STEM' },
            { name: 'Computer Science', description: 'Programming, Data Structures, Algorithms', category: 'STEM' },
            { name: 'English Literature', description: 'Reading comprehension, Essay writing, Literary analysis', category: 'Languages' },
            { name: 'History', description: 'World History, American History, European History', category: 'Social Studies' },
            { name: 'Spanish', description: 'Grammar, Conversation, Literature', category: 'Languages' },
            { name: 'French', description: 'Grammar, Conversation, Literature', category: 'Languages' },
            { name: 'Economics', description: 'Microeconomics, Macroeconomics, International Trade', category: 'Social Studies' }
        ];

        for (const subject of subjectsData) {
            await query(
                'INSERT INTO subjects (name, description, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
                [subject.name, subject.description, subject.category]
            );
        }
        logger.info('[INFO] Subjects seeded successfully');

        // Create sample users
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Sample admin
        await query(`
            INSERT INTO users (email, password_hash, first_name, last_name, role, phone, bio, is_verified, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (email) DO NOTHING
        `, [
            'admin@tutorconnect.com',
            hashedPassword,
            'Admin',
            'User',
            'admin',
            '+1234567890',
            'System administrator for TutorConnect platform',
            true,
            true
        ]);

        // Sample tutors
        const tutorData = [
            {
                email: 'sarah.math@tutorconnect.com',
                firstName: 'Sarah',
                lastName: 'Johnson',
                phone: '+1234567891',
                bio: 'Experienced mathematics tutor with 5+ years of teaching experience',
                hourlyRate: 45.00,
                experienceYears: 5,
                education: 'M.S. in Mathematics, Stanford University',
                languages: 'English, Spanish'
            },
            {
                email: 'david.physics@tutorconnect.com',
                firstName: 'David',
                lastName: 'Chen',
                phone: '+1234567892',
                bio: 'Physics PhD with passion for making complex concepts simple',
                hourlyRate: 50.00,
                experienceYears: 7,
                education: 'Ph.D. in Physics, MIT',
                languages: 'English, Mandarin'
            },
            {
                email: 'maria.spanish@tutorconnect.com',
                firstName: 'Maria',
                lastName: 'Rodriguez',
                phone: '+1234567893',
                bio: 'Native Spanish speaker with teaching certification',
                hourlyRate: 35.00,
                experienceYears: 3,
                education: 'B.A. in Spanish Literature, UC Berkeley',
                languages: 'Spanish, English'
            }
        ];

        for (const tutor of tutorData) {
            // Insert tutor user
            const userResult = await query(`
                INSERT INTO users (email, password_hash, first_name, last_name, role, phone, bio, is_verified, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (email) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name
                RETURNING id
            `, [
                tutor.email,
                hashedPassword,
                tutor.firstName,
                tutor.lastName,
                'tutor',
                tutor.phone,
                tutor.bio,
                true,
                true
            ]);

            const userId = userResult.rows[0].id;

            // Insert tutor profile
            await query(`
                INSERT INTO tutor_profiles (user_id, hourly_rate, experience_years, education, languages, is_available)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id) DO UPDATE SET
                    hourly_rate = EXCLUDED.hourly_rate,
                    experience_years = EXCLUDED.experience_years,
                    education = EXCLUDED.education,
                    languages = EXCLUDED.languages
            `, [
                userId,
                tutor.hourlyRate,
                tutor.experienceYears,
                tutor.education,
                tutor.languages,
                true
            ]);
        }
        logger.info('[INFO] Tutors seeded successfully');

        // Sample students
        const studentData = [
            {
                email: 'john.student@example.com',
                firstName: 'John',
                lastName: 'Smith',
                phone: '+1234567894',
                bio: 'High school student looking to improve in math and science',
                gradeLevel: '11th Grade',
                schoolName: 'Lincoln High School',
                learningGoals: 'Improve SAT scores and prepare for AP Calculus'
            },
            {
                email: 'emma.student@example.com',
                firstName: 'Emma',
                lastName: 'Wilson',
                phone: '+1234567895',
                bio: 'College freshman seeking help with organic chemistry',
                gradeLevel: 'College Freshman',
                schoolName: 'State University',
                learningGoals: 'Pass organic chemistry and maintain GPA'
            }
        ];

        for (const student of studentData) {
            // Insert student user
            const userResult = await query(`
                INSERT INTO users (email, password_hash, first_name, last_name, role, phone, bio, is_verified, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (email) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name
                RETURNING id
            `, [
                student.email,
                hashedPassword,
                student.firstName,
                student.lastName,
                'student',
                student.phone,
                student.bio,
                true,
                true
            ]);

            const userId = userResult.rows[0].id;

            // Insert student profile
            await query(`
                INSERT INTO student_profiles (user_id, grade_level, school_name, learning_goals)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET
                    grade_level = EXCLUDED.grade_level,
                    school_name = EXCLUDED.school_name,
                    learning_goals = EXCLUDED.learning_goals
            `, [
                userId,
                student.gradeLevel,
                student.schoolName,
                student.learningGoals
            ]);
        }
        logger.info('[INFO] Students seeded successfully');

        // Assign subjects to tutors
        const subjectAssignments = [
            { tutorEmail: 'sarah.math@tutorconnect.com', subjects: ['Mathematics'] },
            { tutorEmail: 'david.physics@tutorconnect.com', subjects: ['Physics', 'Mathematics'] },
            { tutorEmail: 'maria.spanish@tutorconnect.com', subjects: ['Spanish'] }
        ];

        for (const assignment of subjectAssignments) {
            // Get tutor ID
            const tutorResult = await query('SELECT id FROM users WHERE email = $1', [assignment.tutorEmail]);
            if (tutorResult.rows.length === 0) continue;
            const tutorId = tutorResult.rows[0].id;

            for (const subjectName of assignment.subjects) {
                // Get subject ID
                const subjectResult = await query('SELECT id FROM subjects WHERE name = $1', [subjectName]);
                if (subjectResult.rows.length === 0) continue;
                const subjectId = subjectResult.rows[0].id;

                // Insert tutor-subject relationship
                await query(`
                    INSERT INTO tutor_subjects (tutor_id, subject_id, proficiency_level)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (tutor_id, subject_id) DO NOTHING
                `, [tutorId, subjectId, 'advanced']);
            }
        }
        logger.info('[INFO] Tutor subjects assigned successfully');

        logger.info('[SUCCESS] Database seeding completed successfully');

    } catch (error) {
        logger.error('[ERROR] Database seeding failed:', error);
        throw error;
    }
};

// Main seed function
const seed = async () => {
    try {
        logger.info('[INFO] Database seeding started');
        await seedData();
        logger.info('[SUCCESS] Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('[ERROR] Seeding failed:', error);
        process.exit(1);
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seed();
}

module.exports = {
    seedData,
    seed
};