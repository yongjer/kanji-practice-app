// src/App.js
import React, { useState } from 'react';
import ListManager from './components/ListManager';
import PracticeSession from './components/PracticeSession';
import './App.css'; // Basic styling

function App() {
  const [currentView, setCurrentView] = useState('listManager'); // 'listManager' or 'practice'
  const [selectedListId, setSelectedListId] = useState(null);
  const [selectedListName, setSelectedListName] = useState('');

  const handleSelectList = (listId, listName) => {
    setSelectedListId(listId);
    setSelectedListName(listName);
    setCurrentView('practice');
  };

  const handleExitSession = () => {
    setCurrentView('listManager');
    setSelectedListId(null);
    setSelectedListName('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Kanji Pronunciation Practice</h1>
      </header>
      <main className="App-main">
        {currentView === 'listManager' && (
          <ListManager onSelectList={handleSelectList} />
        )}
        {currentView === 'practice' && selectedListId && (
          <PracticeSession
            listId={selectedListId}
            listName={selectedListName}
            onExitSession={handleExitSession}
          />
        )}
      </main>
      <footer className="App-footer">
          <p>Kanji Practice App</p>
      </footer>
    </div>
  );
}

export default App;