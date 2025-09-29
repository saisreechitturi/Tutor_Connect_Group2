// Load environment variables
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Creates a database backup using pg_dump
 * @param {string} outputPath - Path where backup file will be saved
 * @param {string} format - Backup format ('sql' or 'custom')
 * @returns {Promise<string>} - Path to the created backup file
 */
const createBackup = async (outputPath = null, format = 'sql') => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, '..', '..', '..', 'backups');

        // Create backups directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const extension = format === 'sql' ? 'sql' : 'backup';
        const filename = outputPath || `tutorconnect_backup_${timestamp}.${extension}`;
        const fullPath = path.isAbsolute(filename) ? filename : path.join(backupDir, filename);

        logger.info(`[INFO] Starting database backup to: ${fullPath}`);

        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'TutorConnect',
            username: process.env.DB_USER || 'postgres'
        };

        // Build pg_dump command
        const args = [
            '-h', dbConfig.host,
            '-p', dbConfig.port.toString(),
            '-U', dbConfig.username,
            '-d', dbConfig.database,
            '--verbose',
            '--clean',
            '--if-exists',
            '--no-owner',
            '--no-privileges'
        ];

        if (format === 'sql') {
            args.push('--inserts', '--column-inserts');
        } else {
            args.push('-Fc'); // Custom format
        }

        args.push('-f', fullPath);

        return new Promise((resolve, reject) => {
            const pgDump = spawn('pg_dump', args, {
                env: {
                    ...process.env,
                    PGPASSWORD: process.env.DB_PASSWORD
                }
            });

            let stderr = '';

            pgDump.stderr.on('data', (data) => {
                stderr += data.toString();
                // pg_dump writes progress info to stderr, so we log it as info
                logger.info(`[BACKUP] ${data.toString().trim()}`);
            });

            pgDump.on('close', (code) => {
                if (code === 0) {
                    logger.info(`[SUCCESS] Database backup completed successfully: ${fullPath}`);
                    resolve(fullPath);
                } else {
                    logger.error(`[ERROR] Backup failed with code ${code}: ${stderr}`);
                    reject(new Error(`Backup failed: ${stderr}`));
                }
            });

            pgDump.on('error', (error) => {
                logger.error(`[ERROR] Failed to start pg_dump: ${error.message}`);
                reject(error);
            });
        });

    } catch (error) {
        logger.error('[ERROR] Database backup failed:', error);
        throw error;
    }
};

/**
 * Restore database from backup file
 * @param {string} backupPath - Path to backup file
 * @param {string} targetDatabase - Target database name (optional)
 * @returns {Promise<void>}
 */
const restoreBackup = async (backupPath, targetDatabase = null) => {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }

        logger.info(`[INFO] Starting database restore from: ${backupPath}`);

        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: targetDatabase || process.env.DB_NAME || 'TutorConnect',
            username: process.env.DB_USER || 'postgres'
        };

        // Determine if it's SQL or custom format
        const isSqlFormat = path.extname(backupPath).toLowerCase() === '.sql';
        const command = isSqlFormat ? 'psql' : 'pg_restore';

        const args = [
            '-h', dbConfig.host,
            '-p', dbConfig.port.toString(),
            '-U', dbConfig.username,
            '-d', dbConfig.database,
            '--verbose'
        ];

        if (!isSqlFormat) {
            args.push('--clean', '--if-exists');
        }

        if (isSqlFormat) {
            args.push('-f', backupPath);
        } else {
            args.push(backupPath);
        }

        return new Promise((resolve, reject) => {
            const restoreProcess = spawn(command, args, {
                env: {
                    ...process.env,
                    PGPASSWORD: process.env.DB_PASSWORD
                }
            });

            let stderr = '';

            restoreProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                logger.info(`[RESTORE] ${data.toString().trim()}`);
            });

            restoreProcess.on('close', (code) => {
                if (code === 0) {
                    logger.info('[SUCCESS] Database restore completed successfully');
                    resolve();
                } else {
                    logger.error(`[ERROR] Restore failed with code ${code}: ${stderr}`);
                    reject(new Error(`Restore failed: ${stderr}`));
                }
            });

            restoreProcess.on('error', (error) => {
                logger.error(`[ERROR] Failed to start ${command}: ${error.message}`);
                reject(error);
            });
        });

    } catch (error) {
        logger.error('[ERROR] Database restore failed:', error);
        throw error;
    }
};

// CLI usage
if (require.main === module) {
    const action = process.argv[2];
    const filePath = process.argv[3];
    const format = process.argv[4] || 'sql';

    if (action === 'backup') {
        createBackup(filePath, format)
            .then(path => {
                console.log(`✅ Backup created successfully: ${path}`);
                process.exit(0);
            })
            .catch(error => {
                console.error(`❌ Backup failed: ${error.message}`);
                process.exit(1);
            });
    } else if (action === 'restore') {
        if (!filePath) {
            console.error('❌ Please provide backup file path');
            console.log('Usage: node backup.js restore <backup-file-path>');
            process.exit(1);
        }
        restoreBackup(filePath)
            .then(() => {
                console.log('✅ Restore completed successfully');
                process.exit(0);
            })
            .catch(error => {
                console.error(`❌ Restore failed: ${error.message}`);
                process.exit(1);
            });
    } else {
        console.log('TutorConnect Database Backup/Restore Tool');
        console.log('');
        console.log('Usage:');
        console.log('  node backup.js backup [filename] [format]');
        console.log('  node backup.js restore <backup-file-path>');
        console.log('');
        console.log('Examples:');
        console.log('  node backup.js backup                           # Creates timestamped SQL backup');
        console.log('  node backup.js backup my_backup.sql sql         # Creates SQL format backup');
        console.log('  node backup.js backup my_backup.backup custom   # Creates binary format backup');
        console.log('  node backup.js restore ./backups/backup.sql     # Restores from SQL backup');
        console.log('');
    }
}

module.exports = {
    createBackup,
    restoreBackup
};