// src/components/ListManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { getAllLists, deleteList } from '../db';
import ImportButton from './ImportButton';

function ListManager({ onSelectList }) {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLists = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedLists = await getAllLists();
            setLists(fetchedLists);
        } catch (err) {
            console.error("Error fetching lists:", err);
            setError("Failed to load lists.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    const handleDelete = async (listId, listName) => {
        if (window.confirm(`Are you sure you want to delete the list "${listName}" and all its items?`)) {
            try {
                await deleteList(listId);
                await fetchLists(); // Refresh the list after deletion
            } catch (err) {
                console.error("Error deleting list:", err);
                alert(`Failed to delete list: ${err.message}`);
            }
        }
    };

    const handleImportComplete = () => {
        fetchLists(); // Refresh lists after a successful import
    };

    if (loading) return <div>Loading lists...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div>
            <h2>Your Kanji Lists</h2>
            <ImportButton onImportComplete={handleImportComplete} />
            {lists.length === 0 ? (
                <p>No lists imported yet. Import a CSV file to get started.</p>
            ) : (
                <ul>
                    {lists.map(list => (
                        <li key={list.id} style={{ margin: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{list.name}</span>
                            <div>
                                <button onClick={() => onSelectList(list.id, list.name)} style={{ marginRight: '10px' }}>
                                    Practice
                                </button>
                                <button onClick={() => handleDelete(list.id, list.name)}>
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ListManager;