// Load environment variables
require('dotenv').config();

const { query } = require('./src/database/connection');
const { connectDatabase } = require('./src/database/connection');

async function fixPaymentsTable() {
    try {
        console.log('Fixing payments table structure for mock payments...');

        // Initialize database connection
        await connectDatabase();

        // First, let's see what we have
        console.log('\nCurrent payments table structure:');
        const currentStructure = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'payments' 
            ORDER BY ordinal_position
        `);

        currentStructure.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
        });

        // Add missing columns if they don't exist
        console.log('\nAdding missing columns...');

        // Add recipient_id if missing
        try {
            await query('ALTER TABLE payments ADD COLUMN recipient_id UUID');
            console.log('✓ Added recipient_id column');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠ recipient_id column already exists');
            } else {
                console.log(`❌ Error adding recipient_id: ${error.message}`);
            }
        }

        // Add currency if missing
        try {
            await query("ALTER TABLE payments ADD COLUMN currency VARCHAR(3) DEFAULT 'USD'");
            console.log('✓ Added currency column');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠ currency column already exists');
            } else {
                console.log(`❌ Error adding currency: ${error.message}`);
            }
        }

        // Add description if missing
        try {
            await query("ALTER TABLE payments ADD COLUMN description TEXT DEFAULT 'Mock payment'");
            console.log('✓ Added description column');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠ description column already exists');
            } else {
                console.log(`❌ Error adding description: ${error.message}`);
            }
        }

        // Rename payment_status to status if needed
        try {
            await query('ALTER TABLE payments RENAME COLUMN payment_status TO status');
            console.log('✓ Renamed payment_status to status');
        } catch (error) {
            if (error.message.includes('does not exist')) {
                console.log('⚠ payment_status column does not exist (may already be renamed)');
            } else {
                console.log(`❌ Error renaming column: ${error.message}`);
            }
        }

        // Set default payment method to mock
        try {
            await query("ALTER TABLE payments ALTER COLUMN payment_method SET DEFAULT 'mock'");
            console.log('✓ Set payment_method default to mock');
        } catch (error) {
            console.log(`❌ Error setting payment_method default: ${error.message}`);
        }

        // Set default status to completed
        try {
            await query("ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'completed'");
            console.log('✓ Set status default to completed');
        } catch (error) {
            console.log(`❌ Error setting status default: ${error.message}`);
        }

        // Remove unnecessary columns
        const columnsToRemove = [
            'transaction_id', 'platform_fee', 'net_amount',
            'processed_at', 'refunded_at', 'payment_intent',
            'payment_provider', 'refund_amount'
        ];

        for (const column of columnsToRemove) {
            try {
                await query(`ALTER TABLE payments DROP COLUMN IF EXISTS ${column}`);
                console.log(`✓ Removed ${column} column`);
            } catch (error) {
                console.log(`⚠ Could not remove ${column}: ${error.message}`);
            }
        }

        // Make session_id nullable (for general payments not tied to sessions)
        try {
            await query('ALTER TABLE payments ALTER COLUMN session_id DROP NOT NULL');
            console.log('✓ Made session_id nullable');
        } catch (error) {
            console.log(`❌ Error making session_id nullable: ${error.message}`);
        }

        // Add foreign key constraints if missing
        try {
            await query('ALTER TABLE payments ADD CONSTRAINT fk_payments_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE');
            console.log('✓ Added recipient_id foreign key constraint');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠ Foreign key constraint already exists');
            } else {
                console.log(`❌ Error adding foreign key: ${error.message}`);
            }
        }

        // Final structure
        console.log('\nFinal payments table structure:');
        const finalStructure = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'payments' 
            ORDER BY ordinal_position
        `);

        finalStructure.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
        });

        console.log('\n✅ Payments table is now ready for mock payments!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the migration
fixPaymentsTable();