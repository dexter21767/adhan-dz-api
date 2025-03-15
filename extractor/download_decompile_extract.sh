#!/bin/bash

# Configuration
APP_ID="com.issolah.marwalarm" 
DOWNLOAD_DIR="downloaded_apks"
TEMP_DIR="$DOWNLOAD_DIR/temp"
DECOMPILE_DIR="$DOWNLOAD_DIR/decompiled"
DB_DESTINATION_DIR="${DB_DIR:-/output}"
METADATA_FILE="$DB_DESTINATION_DIR/metadata.json"  # JSON file to store metadata

# Ensure directories exist
mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$DB_DESTINATION_DIR"
mkdir -p "$TEMP_DIR"

# Function to calculate MD5 hash of a file
calculate_md5() {
    md5sum "$1" | awk '{print $1}'
}

# Function to get the current metadata (if available)
get_current_metadata() {
    if [[ -f "$METADATA_FILE" ]]; then
        cat "$METADATA_FILE"
    else
        echo "{}"
    fi
}

# Function to check if the APK is newer
is_apk_newer() {
    local current_metadata
    current_metadata=$(get_current_metadata)

    local current_version
    current_version=$(echo "$current_metadata" | jq -r '.version')

    local latest_version
    latest_version=$(apkeep -a "$APP_ID" --version)

    if [[ "$latest_version" != "$current_version" ]]; then
        echo "New version available: $latest_version (current: $current_version)"
        return 0  # APK is newer
    else
        echo "No new version available."
        return 1  # APK is not newer
    fi
}

# Function to download the APK using apkeep
download_apk() {
    echo "Downloading APK for $APP_ID..."
    if apkeep -a "$APP_ID" "$DOWNLOAD_DIR"; then
        echo "APK downloaded successfully to $DOWNLOAD_DIR"
    else
        echo "Failed to download APK"
        exit 1
    fi
}

# Function to handle .apk files
handle_apk() {
    local apk_file="$1"
    echo "Handling .apk file: $apk_file"

    # Decompile the APK
    decompile_apk "$apk_file"

    # Search for .db files, copy them, and generate metadata directly
    copy_db_files_and_generate_metadata "$apk_file"
}

# Function to handle .xapk files
handle_xapk() {
    local xapk_file="$1"
    echo "Handling .xapk file: $xapk_file"

    # Extract the .xapk file
    echo "Extracting .xapk file..."
    unzip "$xapk_file" -d "$TEMP_DIR"

    # Find the main APK file
    local main_apk="$TEMP_DIR/$APP_ID.apk"

    # If not found with above path, find the largest APK file
    if [[ ! -f "$main_apk" ]]; then
        echo "APK not found at expected path, looking for largest APK file..."
        main_apk=$(find "$TEMP_DIR" -name "*.apk" -type f -exec du -b {} \; | sort -nr | head -1 | cut -f2)
    fi

    if [[ -z "$main_apk" || ! -f "$main_apk" ]]; then
        echo "No APK file found in .xapk archive."
        exit 1
    fi

    echo "Found main APK file: $main_apk"

    # Decompile the main APK
    decompile_apk "$main_apk"

    # Search for .db files, copy them, and generate metadata directly
    copy_db_files_and_generate_metadata "$main_apk"
}

# Function to decompile the APK using apktool
decompile_apk() {
    local apk_file="$1"
    echo "Decompiling APK: $apk_file..."
    if apktool d "$apk_file" -o "$DECOMPILE_DIR"; then
        echo "APK decompiled successfully to $DECOMPILE_DIR"
    else
        echo "Failed to decompile APK"
        exit 1
    fi
}

# Function to find and copy the largest .db file and generate metadata
copy_db_files_and_generate_metadata() {
    local apk_file="$1"
    echo "Searching for .db files in $DECOMPILE_DIR/assets..."
    
    local db_files
    db_files=$(find "$DECOMPILE_DIR/assets" -type f -name "*.db")

    if [[ -n "$db_files" ]]; then
        echo "Found .db files:"
        echo "$db_files"
        
        # Find the largest DB file
        local largest_db
        largest_db=$(echo "$db_files" | xargs -I{} du -b "{}" | sort -nr | head -1 | cut -f2)
        
        if [[ -n "$largest_db" ]]; then
            local db_filename
            db_filename=$(basename "$largest_db")
            
            echo "Copying largest DB file: $largest_db to $DB_DESTINATION_DIR"
            cp "$largest_db" "$DB_DESTINATION_DIR/$db_filename"
            
            # Generate metadata with the clean db filename
            generate_metadata "$apk_file" "$db_filename"
            return 0
        fi
    else
        echo "No .db files found."
        generate_metadata "$apk_file" ""  # Empty filename if no DB found
        return 1
    fi
}

# Function to generate metadata JSON
generate_metadata() {
    local apk_file="$1"
    local db_filename="$2"
    local version
    version=$(apkeep -a "$APP_ID" --version)

    local md5_hash
    md5_hash=$(calculate_md5 "$apk_file")

    local metadata
    metadata=$(jq -n \
        --arg app_id "$APP_ID" \
        --arg version "$version" \
        --arg md5_hash "$md5_hash" \
        --arg db_filename "$db_filename" \
        '{app_id: $app_id, version: $version, md5_hash: $md5_hash, db_filename: $db_filename}')

    echo "$metadata" > "$METADATA_FILE"
    echo "Metadata saved to $METADATA_FILE with database filename: $db_filename"
}

# Function to delete the outputdir
cleanup() {
    echo "Deleting $DECOMPILE_DIR and $TEMP_DIR..."
    rm -rf "$DECOMPILE_DIR"
    rm -rf "$TEMP_DIR"
    echo "Cleanup complete."
}

# Main script
if is_apk_newer; then
    download_apk

    # Find the downloaded file (either .apk or .xapk)
    downloaded_file=$(find "$DOWNLOAD_DIR" -type f \( -name "*.apk" -o -name "*.xapk" \) | head -n 1)

    if [[ -z "$downloaded_file" ]]; then
        echo "No APK or XAPK file found in $DOWNLOAD_DIR."
        exit 1
    fi

    echo "Found downloaded file: $downloaded_file"

    # Handle the file based on its extension
    if [[ "$downloaded_file" == *.apk ]]; then
        handle_apk "$downloaded_file"
    elif [[ "$downloaded_file" == *.xapk ]]; then
        handle_xapk "$downloaded_file"
    else
        echo "Unsupported file format: $downloaded_file"
        exit 1
    fi

    cleanup
else
    echo "Skipping download and decompilation. APK is up to date."
fi