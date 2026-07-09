import React, { useState, useCallback, useRef } from 'react';
import Column from './Column.jsx';
import { CARD_COLORS } from '../hooks/useKanban.js';

export default function Board({
  board,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onReset,
  onExport,
  onImport,
  saved
}) {
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const addColInputRef = useRef(null);

  React.useEffect(() => {
    if (addingColumn && addColInputRef.current) {
      addColInputRef.current.focus();
    }
  }, [addingColumn]);

  const commitNewColumn = useCallback(() => {
    const trimmed = newColTitle.trim();
    if (trimmed) {
      onAddColumn(trimmed);
    }
    setNewColTitle('');
    setAddingColumn(false);
  }, [newColTitle, onAddColumn]);

  const handleCardDragStart = useCallback((cardId) => {
    setDraggingCardId(cardId);
  }, []);

  const handleCardDragEnd = useCallback(() => {
    setDraggingCardId(null);
  }, []);

  const handleDrop = useCallback((cardId, toColId) => {
    // Find which column the card is currently in
    let fromColId = null;
    for (const col of board.columns) {
      if (col.cardIds.includes(cardId)) {
        fromColId = col.id;
        break;
      }
    }
    if (fromColId && fromColId !== toColId) {
      const toCol = board.columns.find(c => c.id === toColId);
      const insertIndex = toCol ? toCol.cardIds.length : 0;
      onMoveCard(cardId, fromColId, toColId, insertIndex);
    }
    setDraggingCardId(null);
  }, [board.columns, onMoveCard]);

  const handleDragOver = useCallback(() => {
    // handled by column
  }, []);

  return (
    <div className="board-container">
      <header className="board__header">
        <div className="board__header-left">
          <h1 className="board__app-title">Kanbanello</h1>
          <p className="board__subtitle">La tua bacheca Kanban personale</p>
        </div>
        <div className="board__header-right">
          {saved ? (
            <span className="board__save-status board__save-status--saved" aria-live="polite">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Salvato
            </span>
          ) : null}

          <button className="board__tool-btn" onClick={onImport} title="Importa bacheca">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importa
          </button>

          <button className="board__tool-btn" onClick={onExport} title="Esporta bacheca">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Esporta
          </button>

          {showConfirmReset ? (
            <div className="board__confirm-reset">
              <span>Sicuro?</span>
              <button className="board__tool-btn board__tool-btn--danger" onClick={() => { onReset(); setShowConfirmReset(false); }}>
                Sì, azzera
              </button>
              <button className="board__tool-btn" onClick={() => setShowConfirmReset(false)}>
                Annulla
              </button>
            </div>
          ) : (
            <button className="board__tool-btn" onClick={() => setShowConfirmReset(true)} title="Azzera bacheca">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              Azzera
            </button>
          )}
        </div>
      </header>

      <main className="board" role="main" aria-label="Bacheca Kanban">
        <div className="board__columns">
          {board.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              cards={board.cards}
              onAddCard={onAddCard}
              onUpdateCard={onUpdateCard}
              onDeleteCard={onDeleteCard}
              onRenameColumn={onRenameColumn}
              onDeleteColumn={onDeleteColumn}
              onCardDragStart={handleCardDragStart}
              onCardDragEnd={handleCardDragEnd}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              draggingCardId={draggingCardId}
            />
          ))}

          {addingColumn ? (
            <div className="column column--adding">
              <div className="column__add-form column__add-form--new">
                <label htmlFor="new-col-title" className="column__add-label">
                  Nuova colonna
                </label>
                <input
                  ref={addColInputRef}
                  id="new-col-title"
                  className="column__add-input"
                  type="text"
                  placeholder="Nome della colonna…"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onBlur={commitNewColumn}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitNewColumn();
                    if (e.key === 'Escape') { setNewColTitle(''); setAddingColumn(false); }
                  }}
                  aria-label="Nome della nuova colonna"
                />
              </div>
            </div>
          ) : (
            <button
              className="board__add-col-btn"
              onClick={() => setAddingColumn(true)}
              aria-label="Aggiungi una nuova colonna"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Aggiungi colonna</span>
            </button>
          )}
        </div>
      </main>

      <footer className="board__footer">
        <p>
          Trascina le carte tra le colonne per organizzarle. Clicca sul testo per modificarlo. I dati sono salvati nel tuo browser — nessun account richiesto.
        </p>
      </footer>
    </div>
  );
}
