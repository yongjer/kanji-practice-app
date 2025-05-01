# App Design Brief: Kanji Pronunciation Practice App

## 1. Overview

A web application designed to help users practice associating Japanese Kanji characters with their correct readings (Furigana). The app imports user-provided lists in CSV format and utilizes a simple spaced repetition system (SRS) to focus practice on items the user finds difficult.

## 2. Target User & Goals

*   **Target User:** Intermediate Japanese language learners who are actively expanding their vocabulary and need to solidify their knowledge of Kanji readings (including multiple readings for the same Kanji).
*   **User Need:** A convenient and effective tool to practice recalling the correct Furigana for known Kanji, especially differentiating readings based on context (meaning).
*   **Primary Goal:** Improve the speed and accuracy of recalling Furigana for learned Kanji.
*   **Secondary Goal:** Reinforce the connection between Kanji, its meaning, and its pronunciation through contextual examples.

## 3. Core Functionality

### 3.1. File Handling & List Management

*   **Import Format:** Users import lists via **CSV files**.
*   **CSV Structure:**
    *   Column 1: `Kanji` (e.g., `漢字`)
    *   Column 2: `Furigana` (e.g., `ふりがな`)
    *   Column 3: `Meaning` (e.g., `Meaning in English`)
    *   Column 4: `ExampleSentence` (Optional, e.g., `例文`)
    *   *Note:* Commas within fields must be handled using standard CSV quoting (e.g., enclosing the field in double quotes).
*   **Handling Multiple Readings:** Users should create separate rows in the CSV for different readings of the same Kanji they wish to practice (e.g., one row for `人` with `ひと`, another for `人` with `ジン`).
*   **Import Process:**
    *   User selects a `.csv` file via the OS file browser (macOS Finder / Android Files).
    *   The app parses the file.
    *   The content is imported into the app's internal storage/database.
*   **List Storage:** Imported lists are stored persistently and locally on the device. The app should allow users to view and delete imported lists. Each list should retain its association (e.g., filename or user-assigned name).

### 3.2. Practice Session & Learning Loop

*   **Session Start:** User selects an imported list to practice. User can configure session length (e.g., 10, 20, 50 items, or continuous).
*   **Item Selection Algorithm:**
    *   The app selects items (rows) from the chosen list to present to the user.
    *   Selection prioritizes items the user has previously answered incorrectly. A simple weighting system based on `incorrectCount` vs `correctCount` and potentially `lastTestedTimestamp` should be used. Items with more errors appear more frequently.
*   **Information Display:** For each item, the app displays:
    *   The `Kanji`.
    *   The `Meaning`.
*   **User Input:**
    *   An input field is provided.
    *   The user types the corresponding `Furigana` using a **Japanese IME (Hiragana input)**.
    *   *(Optional Enhancement):* Consider adding a setting for Romaji-to-Hiragana conversion input.
*   **Checking & Feedback:**
    *   The app compares the user's input against the correct `Furigana` stored for that item.
    *   **Correct Answer:**
        *   Display clear visual confirmation (e.g., green checkmark).
        *   Show the correct `Furigana`.
        *   Show the `ExampleSentence` (if available).
        *   *(Audio Enhancement):* Play audio of the correct `Furigana` via TTS (or allow user to trigger it).
        *   Update statistics: Increment `correctCount`, update `lastTestedTimestamp`.
    *   **Incorrect Answer:**
        *   Display clear visual confirmation (e.g., red X).
        *   **Crucially, display the correct `Furigana`**.
        *   Show the `ExampleSentence` (if available).
        *   *(Audio Enhancement):* Play audio of the correct `Furigana` via TTS (or allow user to trigger it).
        *   Update statistics: Increment `incorrectCount`, update `lastTestedTimestamp`.
*   **Progression:** A **"Next" / "Continue" button** allows the user to proceed to the next item after reviewing the feedback and example.

### 3.3. Error Tracking & Statistics

*   **Per Item Tracking:** For each unique item (row) within each list, the app must store:
    *   `correctCount` (integer)
    *   `incorrectCount` (integer)
    *   `lastTestedTimestamp` (date/time)
*   **Storage:** This data must be stored locally and persistently in a structured format (e.g., SQLite database).

## 4. Data Management

*   **Local Storage:** All imported lists and user statistics are stored locally on the device.
*   **Data Structure:** A database schema is required to manage lists, list items (Kanji, Furigana, Meaning, Example), and their associated statistics (`correctCount`, `incorrectCount`, `lastTestedTimestamp`).

## 5. User Interface / Experience (UX) Flow

1.  **Launch App:** User opens the app.
2.  **List Management Screen:** Shows imported lists. Options to `Import New List` or `Delete List`. User selects a list to practice.
3.  **(Optional) Session Setup:** User potentially selects session length or mode.
4.  **Practice Screen:**
    *   Displays `Kanji` and `Meaning`.
    *   Provides `Furigana` input field.
    *   User types input and submits.
    *   Feedback Area displays: Correct/Incorrect indicator, Correct `Furigana`, `ExampleSentence`, Audio playback control (optional).
    *   `Next` button is visible.
5.  **Loop:** User taps `Next`, app selects the next item based on the algorithm, and the Practice Screen updates.
6.  **(Optional) Session Summary:** After a fixed-length session, potentially show a summary (e.g., X out of Y correct).

## 6. Non-Functional Requirements

*   **Platform:** macOS web and Android web.
*   **Performance:** App should handle reasonably large CSV lists (e.g., thousands of entries) without significant slowdown during parsing or item selection. Practice interaction should feel instant.
*   **Offline Access:** Core functionality (practicing existing lists) must work entirely offline. Internet access might only be needed for potential future features like cloud sync or downloading pre-made lists.
*   **Data Integrity:** Ensure statistics are saved correctly, especially if the app is closed mid-session.

## 7. Future Considerations / Optional Features

*   **Audio:** Integrate Text-to-Speech (TTS) for Furigana pronunciation.
*   **Input:** Add Romaji-to-Hiragana input option.
*   **Practice Modes:** Add specific modes like "Review difficult items", "Practice new items".
*   **Advanced SRS:** Implement a more sophisticated SRS algorithm (e.g., based on Leitner boxes or SuperMemo intervals).
*   **List Editing:** Allow users to edit or add entries to imported lists directly within the app.
*   **Pre-loaded Lists:** Include built-in lists (e.g., JLPT levels, common radicals).
*   **Cloud Sync:** Allow users to sync lists and progress between devices (requires user accounts and backend).
*   **Alternative Practice Modes:** Reading -> Kanji recall, Meaning -> Kanji/Reading recall.
*   **Visualizations:** Show progress charts or graphs.