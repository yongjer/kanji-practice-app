// src/components/ImportButton.js
import React, { useRef } from 'react';
import Papa from 'papaparse';
import { addList, addItems } from '../db';

function ImportButton({ onImportComplete }) {
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.replace(/\.csv$/i, ''); // Use filename as list name

        Papa.parse(file, {
            header: false, // Assuming no header row as per spec
            skipEmptyLines: true,
            complete: async (results) => {
                console.log("Parsing complete:", results);
                const parsedItems = [];
                let parseError = false;

                results.data.forEach((row, index) => {
                    // Expecting: Kanji, Furigana, Meaning, ExampleSentence (Optional)
                    if (row.length < 3) {
                        console.error(`Skipping row ${index + 1}: Not enough columns (found ${row.length}, expected at least 3). Row:`, row);
                        // Optionally alert the user about skipped rows
                        return; // Skip this row
                    }

                    // Basic validation - ensure required fields aren't empty
                    if (!row[0]?.trim() || !row[1]?.trim() || !row[2]?.trim()) {
                        console.error(`Skipping row ${index + 1}: Kanji, Furigana, or Meaning is empty. Row:`, row);
                        return; // Skip this row
                    }


                    // Handle potential commas within quoted fields (PapaParse does this automatically)
                    parsedItems.push({
                        kanji: row[0].trim(),
                        furigana: row[1].trim(),
                        meaning: row[2].trim(),
                        exampleSentence: row[3]?.trim() || '', // Handle optional field
                        // Stats initialized in addItems
                    });
                });

                if (parsedItems.length === 0) {
                   alert("No valid items found in the CSV file. Please check the format (Kanji, Furigana, Meaning, [Example]).");
                   parseError = true;
                }

                if (!parseError) {
                     try {
                        const listId = await addList(fileName);
                        if (listId) { // Make sure list was added (or existed)
                            await addItems(listId, parsedItems);
                            alert(`List "${fileName}" imported successfully with ${parsedItems.length} items!`);
                            if (onImportComplete) {
                                onImportComplete(); // Notify parent component to refresh lists
                            }
                        } else {
                           alert(`Could not create or find list "${fileName}". Import failed.`);
                        }
                    } catch (error) {
                        console.error("Error during import process:", error);
                        alert(`An error occurred during import: ${error.message}`);
                    }
                }


                // Reset file input to allow importing the same file again
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
            error: (error) => {
                console.error("CSV Parsing Error:", error);
                alert(`Failed to parse CSV file: ${error.message}`);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        });
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <button onClick={handleClick}>Import New List (.csv)</button>
        </div>
    );
}

export default ImportButton;