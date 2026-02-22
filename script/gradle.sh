#!/bin/bash

# This script is used to copy the gradle.properties file from the src/InkNest-Externals to the android project.
# It is used to set the gradle properties for the android project.

# Get the project root directory (where the script is executed from)
PROJECT_ROOT=$(pwd)

# Check if the gradle.properties file exists
if [ ! -f "${PROJECT_ROOT}/src/InkNest-Externals/gradle.properties" ]; then
    echo "The gradle.properties file does not exist in the src/InkNest-Externals directory."
    exit 1
fi

# Check if the android project directory exists
if [ ! -d "${PROJECT_ROOT}/android" ]; then
    echo "The android project directory does not exist."
    exit 1
fi

# Copy the gradle.properties file to the android project
cp "${PROJECT_ROOT}/src/InkNest-Externals/gradle.properties" "${PROJECT_ROOT}/android/gradle.properties"
if [ $? -ne 0 ]; then
    echo "Failed to copy the gradle.properties file to the android project."
    exit 1
fi
echo "Successfully copied the gradle.properties file to the android project."
