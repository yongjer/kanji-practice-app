// src/db.js
import Dexie from 'dexie';

export const db = new Dexie('KanjiPracticeAppDB');

db.version(1).stores({
  lists: '++id, name', // Primary key 'id' auto-incrementing, index 'name'
  items: '++id, listId, kanji, furigana, meaning, exampleSentence, correctCount, incorrectCount, lastTestedTimestamp, [listId+kanji+furigana]', // index listId for easy lookup, composite index for uniqueness per list
});

// --- List Operations ---

export async function addList(name) {
  try {
    const existingList = await db.lists.where('name').equals(name).first();
    if (existingList) {
      console.warn(`List with name "${name}" already exists.`);
      return existingList.id; // Return existing list ID
    }
    const id = await db.lists.add({ name });
    console.log(`List "${name}" added with id: ${id}`);
    return id;
  } catch (error) {
    console.error("Failed to add list:", error);
    throw error; // Re-throw error to be handled by caller
  }
}

export async function getAllLists() {
  return await db.lists.toArray();
}

export async function deleteList(listId) {
  // Use a transaction to delete list and its items atomically
  return db.transaction('rw', db.lists, db.items, async () => {
    // Delete items associated with the list
    await db.items.where('listId').equals(listId).delete();
    // Delete the list itself
    await db.lists.delete(listId);
    console.log(`List with id ${listId} and its items deleted.`);
  });
}

// --- Item Operations ---

export async function addItems(listId, items) {
    // Ensure counts and timestamp are initialized
    const itemsToAdd = items.map(item => ({
        ...item,
        listId,
        correctCount: item.correctCount || 0,
        incorrectCount: item.incorrectCount || 0,
        lastTestedTimestamp: item.lastTestedTimestamp || null,
    }));

    try {
        // Using bulkAdd for efficiency
        await db.items.bulkAdd(itemsToAdd);
        console.log(`Added ${itemsToAdd.length} items to list ${listId}`);
    } catch (error) {
        console.error(`Failed to add items to list ${listId}:`, error);
        // Handle potential constraint errors if trying to add duplicates
        if (error.name === 'BulkError') {
            console.error("Some items might have failed due to constraints (e.g., duplicates).");
            // You could potentially retry failed ones individually if needed
        }
        // Don't re-throw here unless the caller needs to know about partial failures
    }
}


export async function getItemsForList(listId) {
  return await db.items.where('listId').equals(listId).toArray();
}

export async function updateItemStats(itemId, isCorrect) {
  const now = new Date().toISOString();
  try {
    await db.items.update(itemId, {
      ...(isCorrect
        ? { correctCount: Dexie.increment(1) }
        : { incorrectCount: Dexie.increment(1) }),
      lastTestedTimestamp: now,
    });
  } catch (error) {
    console.error(`Failed to update stats for item ${itemId}:`, error);
  }
}

export async function getItem(itemId) {
    return await db.items.get(itemId);
}