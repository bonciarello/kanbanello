import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from './Card.jsx';

export default function Column({
  column,
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onRenameColumn,
  onDeleteColumn,
  onCardDragStart,
  onCardDragEnd,
  onDrop,
  onDragOver,
  draggingCardId
}) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(column.title);
  const addInputRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (adding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [adding]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    setTitleText(column.title);
  }, [column.title]);

  const commitTitle = useCallback(() => {
    const trimmed = titleText.trim();
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(column.id, trimmed);
    } else {
      setTitleText(column.title);
    }
    setEditingTitle(false);
  }, [titleText, column.title, column.id, onRenameColumn]);

  const commitNewCard = useCallback(() => {
    const trimmed = newText.trim();
    if (trimmed) {
      onAddCard(column.id, trimmed);
    }
    setNewText('');
    setAdding(false);
  }, [newText, column.id, onAddCard]);

  const handleDrop = (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onDrop(cardId, column.id);
    }
    e.currentTarget.classList.remove('column--drag-over');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(column.id);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('column--drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('column--drag-over');
  };

  return (
    <div
      className="column"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      role="region"
      aria-label={`Colonna: ${column.title}`}
    >
      <div className="column__header">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            className="column__title-input"
            type="text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') { setTitleText(column.title); setEditingTitle(false); }
            }}
            aria-label="Modifica nome colonna"
          />
        ) : (
          <h2
            className="column__title"
            onClick={() => setEditingTitle(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(true); }}
            tabIndex={0}
            role="button"
            aria-label={`Rinomina "${column.title}"`}
          >
            {column.title}
          </h2>
        )}

        <div className="column__badge">{column.cardIds.length}</div>

        <div className="column__header-actions">
          <button
            className="column__icon-btn"
            onClick={() => onDeleteColumn(column.id)}
            aria-label={`Elimina colonna "${column.title}"`}
            title="Elimina colonna"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="column__cards" role="list">
        {column.cardIds.map((cardId, idx) => (
          cards[cardId] ? (
            <Card
              key={cardId}
              card={cards[cardId]}
              index={idx}
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
              isDragging={draggingCardId === cardId}
            />
          ) : null
        ))}
      </div>

      <div className="column__footer">
        {adding ? (
          <div className="column__add-form">
            <input
              ref={addInputRef}
              className="column__add-input"
              type="text"
              placeholder="Scrivi il titolo della carta…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onBlur={commitNewCard}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNewCard();
                if (e.key === 'Escape') { setNewText(''); setAdding(false); }
              }}
              aria-label="Titolo della nuova carta"
            />
          </div>
        ) : (
          <button
            className="column__add-btn"
            onClick={() => setAdding(true)}
            aria-label={`Aggiungi carta a "${column.title}"`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Aggiungi carta</span>
          </button>
        )}
      </div>
    </div>
  );
}
