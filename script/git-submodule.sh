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

# Initialize submodules
setup_submodules() {
    print_status "Setting up Git submodules..."
    
    if [ ! -f "src/InkNest-Externals/gradle.properties" ]; then
        print_warning "InkNest Externals app submodule not found. Initializing..."
        git submodule update --init --recursive
        
        if [ $? -eq 0 ]; then
            print_success "Submodules initialized successfully!"
        else
            print_error "Failed to initialize submodules. Please check your Git configuration."
            print_status "Make sure you have access to the submodule repository: git@github.com:p2devs/InkNest-Externals.git"
            exit 1
        fi
    else
        print_status "Submodules already exist. Updating to latest..."
        git submodule update --init --recursive
        print_success "Submodules updated!"
    fi
}

# Run setup_submodules function
setup_submodules
