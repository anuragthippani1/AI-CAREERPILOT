#!/bin/bash

echo "🚀 Setting up CareerPilot..."

# Create uploads directory
mkdir -p uploads

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration (database, Gemini API key)"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up MySQL database: mysql -u root -p < database/schema.sql"
echo "2. Edit .env with your configuration"
echo "3. Run: npm run dev"




