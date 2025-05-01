// src/components/PracticeSession.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getItemsForList, updateItemStats, getItem } from '../db';

// --- Simple Weighted Item Selection ---
function selectNextItem(items) {
    if (!items || items.length === 0) return null;

    // Calculate weights - prioritizing incorrect items and less recently tested items
    const now = Date.now();
    const weights = items.map(item => {
        const incorrectRatio = (item.incorrectCount + 1) / (item.correctCount + 1);
        // Give a slight boost to items not seen recently (e.g., older than a day)
        const timeFactor = item.lastTestedTimestamp
            ? Math.max(1, (now - new Date(item.lastTestedTimestamp).getTime()) / (1000 * 60 * 60 * 24)) // Days since last tested
            : 5; // Boost unseen items significantly

        // Combine factors (adjust multipliers as needed)
        return (incorrectRatio * 2) + timeFactor;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight <= 0) { // Should only happen if all weights are 0
        return items[Math.floor(Math.random() * items.length)]; // Fallback to random
    }

    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
        if (random < weights[i]) {
            return items[i];
        }
        random -= weights[i];
    }

    // Fallback if something goes wrong (shouldn't happen with correct logic)
    return items[items.length - 1];
}


function PracticeSession({ listId, listName, onExitSession }) {
    const [sessionItems, setSessionItems] = useState([]);
    const [currentItem, setCurrentItem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [feedbackItem, setFeedbackItem] = useState(null); // Store the item used for feedback
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAndSetItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const items = await getItemsForList(listId);
            if (items.length === 0) {
                setError("This list has no items to practice.");
                setSessionItems([]);
                setCurrentItem(null);
            } else {
                setSessionItems(items);
                // Select the first item *after* items are loaded
                setCurrentItem(selectNextItem(items));
            }
        } catch (err) {
            console.error("Error fetching items for practice:", err);
            setError("Failed to load practice items.");
            setSessionItems([]);
            setCurrentItem(null);
        } finally {
            setLoading(false);
        }
    }, [listId]);

    useEffect(() => {
        fetchAndSetItems();
    }, [fetchAndSetItems]); // Depend only on the memoized fetch function

    const loadNextItem = useCallback(() => {
        // Reset state for the next item
        setUserAnswer('');
        setShowFeedback(false);
        setIsCorrect(null);
        setFeedbackItem(null);

        // Select the next item using the weighted algorithm
        const nextItem = selectNextItem(sessionItems);
        setCurrentItem(nextItem);
    }, [sessionItems]); // Re-run if sessionItems changes


    const handleCheckAnswer = useCallback(async (e) => {
        if (e) e.preventDefault(); // Prevent form submission if used in a form
        if (!currentItem || showFeedback) return; // Don't check if no item or already showing feedback

        const correct = userAnswer.trim() === currentItem.furigana;
        setIsCorrect(correct);
        setFeedbackItem(currentItem); // Store item for feedback display
        setShowFeedback(true);

        // Update stats in the database
        await updateItemStats(currentItem.id, correct);

        // Update the item stats *in the local state* immediately
        // This ensures the *next* selection considers the latest result
        setSessionItems(prevItems =>
            prevItems.map(item =>
                item.id === currentItem.id
                    ? {
                        ...item,
                        correctCount: correct ? item.correctCount + 1 : item.correctCount,
                        incorrectCount: !correct ? item.incorrectCount + 1 : item.incorrectCount,
                        lastTestedTimestamp: new Date().toISOString(),
                    }
                    : item
            )
        );

    }, [userAnswer, currentItem, showFeedback]); // Dependencies for checking

    // Handle 'Enter' key press in input field
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            if (showFeedback) {
                loadNextItem();
            } else {
                handleCheckAnswer();
            }
        }
    };


    // Memoize the feedback section to avoid re-rendering unnecessarily
    const feedbackSection = useMemo(() => {
        if (!showFeedback || !feedbackItem) return null;

        return (
            <div style={{ marginTop: '20px', padding: '15px', border: `2px solid ${isCorrect ? 'green' : 'red'}`, borderRadius: '5px' }}>
                <h3 style={{ color: isCorrect ? 'green' : 'red', marginTop: 0 }}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                <p><strong>Reading:</strong> {feedbackItem.furigana}</p>
                {feedbackItem.exampleSentence && (
                    <p><strong>Example:</strong> {feedbackItem.exampleSentence}</p>
                )}
                {/* Optional: Add TTS button here */}
                <button onClick={loadNextItem} style={{ marginTop: '10px' }}>
                    Next
                </button>
            </div>
        );
    }, [showFeedback, isCorrect, feedbackItem, loadNextItem]); // Dependencies for feedback memo

    if (loading) return <div>Loading practice session...</div>;
    if (error) return <div><p style={{ color: 'red' }}>{error}</p><button onClick={onExitSession}>Back to Lists</button></div>;
    if (!currentItem && !loading) return <div><p>No more items to practice in this session or list is empty.</p><button onClick={onExitSession}>Back to Lists</button></div>;


    return (
        <div>
            <button onClick={onExitSession} style={{ float: 'right' }}>Exit Session</button>
            <h2>Practicing: {listName}</h2>

            {!showFeedback && currentItem && (
               <>
                   <div style={{ fontSize: '3em', margin: '20px 0', textAlign: 'center' }}>
                       {currentItem.kanji}
                   </div>
                   <div style={{ marginBottom: '20px', textAlign: 'center', fontStyle: 'italic', color: '#555' }}>
                       ({currentItem.meaning})
                   </div>

                   <form onSubmit={handleCheckAnswer} style={{ textAlign: 'center' }}>
                       <label htmlFor="furiganaInput">Enter Furigana (Hiragana):</label><br />
                       <input
                           id="furiganaInput"
                           type="text"
                           value={userAnswer}
                           onChange={(e) => setUserAnswer(e.target.value)}
                           onKeyPress={handleKeyPress} // Handle Enter key
                           lang="ja" // Helps browsers/OS suggest Japanese IME
                           autoCapitalize="none"
                           autoComplete="off"
                           autoCorrect="off"
                           spellCheck="false"
                           style={{ margin: '10px 0', padding: '8px', width: '200px' }}
                           autoFocus
                       />
                       <br />
                       <button type="submit" disabled={!userAnswer.trim()}>
                           Check Answer
                       </button>
                   </form>
               </>
             )}


            {feedbackSection}

        </div>
    );
}

export default PracticeSession;