const { query } = require('./connection');

async function createSettingsTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                category VARCHAR(50) NOT NULL DEFAULT 'general',
                data_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
                is_public BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes
        await query('CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);');
        await query('CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);');

        // Create trigger
        await query(`
            CREATE TRIGGER IF NOT EXISTS update_settings_updated_at 
            BEFORE UPDATE ON settings 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('Settings table created successfully');

        // Insert default settings
        const defaultSettings = [
            { key: 'site_name', value: 'TutorConnect', description: 'Platform name', category: 'general' },
            { key: 'site_description', value: 'Connect with expert tutors for personalized learning', description: 'Platform description', category: 'general' },
            { key: 'contact_email', value: 'admin@tutorconnect.com', description: 'Contact email', category: 'general' },
            { key: 'support_email', value: 'support@tutorconnect.com', description: 'Support email', category: 'general' },
            { key: 'timezone', value: 'America/New_York', description: 'Default timezone', category: 'general' },
            { key: 'language', value: 'en', description: 'Default language', category: 'general' },

            { key: 'require_email_verification', value: 'true', description: 'Require email verification for new users', category: 'security', data_type: 'boolean' },
            { key: 'enable_two_factor', value: 'false', description: 'Enable two-factor authentication', category: 'security', data_type: 'boolean' },
            { key: 'session_timeout', value: '24', description: 'Session timeout in hours', category: 'security', data_type: 'number' },
            { key: 'max_login_attempts', value: '5', description: 'Maximum login attempts', category: 'security', data_type: 'number' },
            { key: 'password_min_length', value: '8', description: 'Minimum password length', category: 'security', data_type: 'number' },
            { key: 'require_strong_passwords', value: 'true', description: 'Require strong passwords', category: 'security', data_type: 'boolean' },

            { key: 'commission_rate', value: '15', description: 'Platform commission rate in percentage', category: 'payment', data_type: 'number' },
            { key: 'minimum_payout', value: '50', description: 'Minimum payout amount', category: 'payment', data_type: 'number' },
            { key: 'payout_schedule', value: 'weekly', description: 'Payout schedule', category: 'payment' },

            { key: 'auto_approval_tutors', value: 'false', description: 'Auto-approve new tutors', category: 'user_management', data_type: 'boolean' },
            { key: 'require_tutor_verification', value: 'true', description: 'Require tutor verification', category: 'user_management', data_type: 'boolean' },
            { key: 'max_students_per_tutor', value: '50', description: 'Maximum students per tutor', category: 'user_management', data_type: 'number' },
            { key: 'allow_public_profiles', value: 'true', description: 'Allow public tutor profiles', category: 'user_management', data_type: 'boolean' }
        ];

        for (const setting of defaultSettings) {
            await query(`
                INSERT INTO settings (key, value, description, category, data_type)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (key) DO NOTHING
            `, [setting.key, setting.value, setting.description, setting.category, setting.data_type || 'string']);
        }

        console.log('Default settings inserted successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error creating settings table:', err);
        process.exit(1);
    }
}

createSettingsTable();