#!/bin/bash

# Get current date and time in format: DD-MM-YYYY / HH:MM AM/PM
TIMESTAMP=$(date +"%d-%m-%Y / %I:%M%p")

git add .
git commit -m "$TIMESTAMP"
git push origin main