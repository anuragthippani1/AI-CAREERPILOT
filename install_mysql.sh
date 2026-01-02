#!/bin/bash

echo "🗄️  Installing MySQL for CareerPilot..."
echo ""

# Check if MySQL is already installed
if command -v mysql &> /dev/null; then
    echo "✅ MySQL is already installed!"
    mysql --version
    echo ""
else
    echo "📦 Installing MySQL via Homebrew..."
    brew install mysql
    
    echo ""
    echo "🚀 Starting MySQL service..."
    brew services start mysql
    
    echo ""
    echo "⏳ Waiting for MySQL to start..."
    sleep 5
fi

echo ""
echo "📊 Creating CareerPilot database..."
echo "Enter MySQL root password (press Enter if no password):"
read -s MYSQL_PASSWORD

cd "/Users/anuragthippani/Documents/programs/AI CareerPilot"

if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -u root < database/schema.sql
else
    mysql -u root -p"$MYSQL_PASSWORD" < database/schema.sql
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database created successfully!"
    echo ""
    echo "📋 Verifying tables..."
    if [ -z "$MYSQL_PASSWORD" ]; then
        mysql -u root -e "USE careerpilot; SHOW TABLES;"
    else
        mysql -u root -p"$MYSQL_PASSWORD" -e "USE careerpilot; SHOW TABLES;"
    fi
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update .env file with your MySQL password (if you set one)"
    echo "2. Restart backend: npm run dev"
    echo "3. Test at: http://localhost:3000"
else
    echo ""
    echo "❌ Database creation failed"
    echo "Please run manually:"
    echo "  mysql -u root -p < database/schema.sql"
fi




