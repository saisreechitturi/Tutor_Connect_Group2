#!/bin/bash

# Script to apply session payment triggers to the database
# This ensures that payments are automatically created when sessions are completed

echo "Applying session payment triggers..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL environment variable not set. Using local database parameters."
    
    # Use local database parameters (adjust as needed)
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-tutor_connect}
    DB_USER=${DB_USER:-postgres}
    
    # Apply the triggers
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$(dirname "$0")/../src/database/session_payment_triggers.sql"
else
    # Use DATABASE_URL
    psql "$DATABASE_URL" -f "$(dirname "$0")/../src/database/session_payment_triggers.sql"
fi

echo "Session payment triggers applied successfully!"
echo ""
echo "The following triggers have been created:"
echo "1. session_completion_payment_trigger - Creates payments when sessions are completed"
echo "2. session_creation_payment_trigger - Creates payments for sessions created as completed"
echo "3. payment_completion_stats_trigger - Updates tutor statistics when payments are completed"
echo ""
echo "These triggers ensure that:"
echo "- Payment records are automatically created when sessions are marked as completed"
echo "- Tutor earnings statistics are updated in real-time"
echo "- Performance metrics are kept up-to-date"