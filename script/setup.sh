#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Copy google-services.json if it exists
if [ ! -f "android/app/google-services.json" ]; then
    print_status "Copying google-services.json from src/InkNest-Externals root to InkNest android/app directory..."
    cp src/InkNest-Externals/google-services.json android/app/
    print_success "google-services.json copied successfully!"
else
    print_warning "google-services.json already exists in android/app directory. Skipping copy."
fi

# Copy GoogleService-Info.plist if it exists
if [ ! -f "ios/GoogleService-Info.plist" ]; then
    print_status "Copying GoogleService-Info.plist from src/InkNest-Externals root to InkNest ios directory..."
    cp src/InkNest-Externals/GoogleService-Info.plist ios/
    print_success "GoogleService-Info.plist copied successfully!"
else
    print_warning "GoogleService-Info.plist already exists in ios directory. Skipping copy."
fi

# Copy .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Copying .env from src/InkNest-Externals root to InkNest root directory..."
    cp src/InkNest-Externals/.env .env
    print_success ".env copied successfully!"
else
    print_warning ".env file already exists. Skipping copy."
fi

# Copy app.json file if it doesn't exist
if [ ! -f "app.json" ]; then
    print_status "Copying app.json from src/InkNest-Externals root to InkNest root directory..."
    cp src/InkNest-Externals/app.json app.json
    print_success "app.json copied successfully!"
else
    print_warning "app.json file already exists. Skipping copy."
fi

# Copy global.jks file if it doesn't exist
if [ ! -f "android/app/global.jks" ]; then
    print_status "Copying global.jks from src/InkNest-Externals root to InkNest android/app directory..."
    cp src/InkNest-Externals/global.jks android/app/
    print_success "global.jks copied successfully!"
else
    print_warning "global.jks already exists in android/app directory. Skipping copy."
fi