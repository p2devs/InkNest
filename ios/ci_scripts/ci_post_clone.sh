#!/bin/sh

# Install Node, CocoaPods, and yarn using Homebrew.
brew install node
brew install cocoapods
brew install yarn

# Install dependencies
yarn
pod install