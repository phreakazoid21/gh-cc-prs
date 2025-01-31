#!/bin/bash

# Script to bump the version in a userscript, taking an argument for the component

# Get the latest tag (assuming semantic versioning like v1.2.3)
latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")

# Extract the version number
version="${latest_tag#v}"
IFS='.' read -r major minor patch <<< "$version"

# Get the component to bump from the argument
component="$1"

# Bump the version based on the component argument
case "$component" in
    patch)
        patch=$((patch + 1))
      ;;
    minor)
        minor=$((minor + 1))
        patch=0  # Reset patch
      ;;
    major)
        major=$((major + 1))
        minor=0    # Reset minor
        patch=0    # Reset patch
      ;;
    *)
        echo "Invalid component: $component.  Use 'patch', 'minor', or 'major'."
        exit 1
      ;;
esac

new_version="v${major}.${minor}.${patch}"

# Update the userscript (replace your-script-name.user.js with the actual filename)
sed -i '' -E "s#(\/\/ @version[ ]+).+#\1${major}.${minor}.${patch}#g" gh-cc-prs.user.js

# Commit the change (optional)
git add gh-cc-prs.user.js
git commit -m "Bump version to ${major}.${minor}.${patch}"

# Create the new tag (optional)
git tag "$new_version"

echo "Version bumped to ${major}.${minor}.${patch}"
echo "Remember to push the changes and the tag: git push origin main && git push origin $new_version"

