#!/bin/bash

# Sync thoughts from Apple Notes "Thinking About" folder to thoughts.xml
# Usage: ./sync-thoughts.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_FILE="$SCRIPT_DIR/thoughts.xml"

echo "📝 Syncing thoughts from Apple Notes..."

# Run the JXA script to read notes and generate XML
osascript -l JavaScript <<'ENDSCRIPT' > "$OUTPUT_FILE"
const Notes = Application('Notes');
const colors = ['yellow', 'pink', 'green', 'blue', 'white', 'orange', 'purple'];

// Find the "Thinking About" folder
let targetFolder = null;
const folders = Notes.folders();

for (const folder of folders) {
    if (folder.name() === 'Thinking About') {
        targetFolder = folder;
        break;
    }
}

if (!targetFolder) {
    console.log('ERROR: Could not find folder "Thinking About" in Apple Notes');
    $.exit(1);
}

const allNotes = targetFolder.notes();

if (allNotes.length === 0) {
    console.log('ERROR: No notes found in "Thinking About" folder');
    $.exit(1);
}

// Limit to the 6 most recent notes
const notes = allNotes.slice(0, 6);

// Build XML content
let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<thoughts>\n';
xml += '    <!-- Available colors: yellow, pink, green, blue, white, orange, purple -->\n';
xml += '    <!-- Generated from Apple Notes "Thinking About" folder -->\n';

for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const color = colors[i % colors.length];
    
    // Get the plain text body of the note
    let body = note.plaintext();
    
    // Escape XML special characters
    body = body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    
    // Trim whitespace
    body = body.trim();
    
    if (body.length > 0) {
        xml += '    <thought color="' + color + '">\n';
        xml += '        <text>' + body + '</text>\n';
        xml += '    </thought>\n';
    }
}

xml += '</thoughts>\n';

xml;
ENDSCRIPT

# Check if the script succeeded
if [ $? -ne 0 ]; then
    echo "❌ Failed to sync thoughts"
    exit 1
fi

# Check for errors in output
if grep -q "^ERROR:" "$OUTPUT_FILE" 2>/dev/null; then
    cat "$OUTPUT_FILE"
    exit 1
fi

# Count thoughts
THOUGHT_COUNT=$(grep -c "<thought" "$OUTPUT_FILE" 2>/dev/null || echo "0")

echo "✅ Synced $THOUGHT_COUNT thoughts to thoughts.xml"
echo ""
echo "To publish:"
echo "  git add thoughts.xml"
echo "  git commit -m 'Update thoughts'"
echo "  git push"
