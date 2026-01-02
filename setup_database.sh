#!/bin/bash

echo "🗄️  Setting up CareerPilot Database..."
echo ""

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL command not found in PATH"
    echo ""
    echo "Please run this manually:"
    echo "  mysql -u root -p < database/schema.sql"
    echo ""
    echo "Or if MySQL is installed but not in PATH, find it and run:"
    echo "  /path/to/mysql -u root -p < database/schema.sql"
    exit 1
fi

# Get MySQL password
echo "Enter MySQL root password (press Enter if no password):"
read -s MYSQL_PASSWORD

if [ -z "$MYSQL_PASSWORD" ]; then
    MYSQL_CMD="mysql -u root"
else
    MYSQL_CMD="mysql -u root -p$MYSQL_PASSWORD"
fi

echo ""
echo "Creating database..."

# Create database
$MYSQL_CMD << EOF
CREATE DATABASE IF NOT EXISTS careerpilot;
USE careerpilot;
SOURCE database/schema.sql;
SHOW TABLES;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Tables created:"
    $MYSQL_CMD -e "USE careerpilot; SHOW TABLES;" 2>/dev/null
    echo ""
    echo "Next: Update .env with your MySQL password (if you have one)"
else
    echo ""
    echo "❌ Database setup failed"
    echo "Please run manually:"
    echo "  mysql -u root -p"
    echo "  CREATE DATABASE careerpilot;"
    echo "  USE careerpilot;"
    echo "  SOURCE database/schema.sql;"
fi




