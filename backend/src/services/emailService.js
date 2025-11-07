const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    init() {
        try {
            // Create nodemailer transporter based on environment
            if (process.env.NODE_ENV === 'production') {
                // Production email service (use actual SMTP)
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD,
                    },
                });
            } else {
                // Development - use nodemailer test account (creates temporary account automatically)
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'ethereal.user@ethereal.email',
                        pass: 'ethereal.pass'
                    }
                });
            }

            logger.info('Email service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize email service:', error);
        }
    }

    async sendPasswordResetEmail(to, resetToken, firstName) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/reset-password/${resetToken}`;

            // In development, just log the reset URL instead of sending actual email
            if (process.env.NODE_ENV !== 'production') {
                logger.info('='.repeat(80));
                logger.info('📧 PASSWORD RESET EMAIL (Development Mode)');
                logger.info('='.repeat(80));
                logger.info(`To: ${to}`);
                logger.info(`Name: ${firstName}`);
                logger.info(`Reset URL: ${resetUrl}`);
                logger.info('='.repeat(80));
                logger.info('💡 Copy the URL above and paste it in your browser to reset the password');
                logger.info('='.repeat(80));

                return { success: true, messageId: 'dev-mode-' + Date.now() };
            }

            // Production: send actual email
            const mailOptions = {
                from: process.env.FROM_EMAIL || 'TutorConnect <noreply@tutorconnect.com>',
                to,
                subject: 'Password Reset Request - TutorConnect',
                html: this.getPasswordResetTemplate(firstName, resetUrl),
                text: this.getPasswordResetTextTemplate(firstName, resetUrl)
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to: ${to}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    } getPasswordResetTemplate(firstName, resetUrl) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - TutorConnect</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #2563eb;
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f8fafc;
                    padding: 30px 20px;
                    border-radius: 0 0 8px 8px;
                }
                .button {
                    display: inline-block;
                    background-color: #2563eb;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-weight: 600;
                }
                .warning {
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    color: #92400e;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #6b7280;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>TutorConnect</h1>
                <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>We received a request to reset your password for your TutorConnect account. If you made this request, please click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Your Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                    ${resetUrl}
                </p>
                
                <div class="warning">
                    <strong>Important:</strong> This link will expire in 15 minutes for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.
                </div>
                
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                
                <p>For security reasons, never share this email or the reset link with anyone.</p>
                
                <p>Best regards,<br>The TutorConnect Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>If you have questions, contact us at support@tutorconnect.com</p>
            </div>
        </body>
        </html>
        `;
    }

    getPasswordResetTextTemplate(firstName, resetUrl) {
        return `
TutorConnect - Password Reset Request

Hi ${firstName},

We received a request to reset your password for your TutorConnect account. If you made this request, please visit the following link to reset your password:

${resetUrl}

IMPORTANT: This link will expire in 15 minutes for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, never share this email or the reset link with anyone.

Best regards,
The TutorConnect Team

---
This is an automated email. Please do not reply to this message.
If you have questions, contact us at support@tutorconnect.com
        `;
    }
}

// Export singleton instance
module.exports = new EmailService();