import React, { useState, useRef, useEffect } from 'react';
import { CARD_COLORS } from '../hooks/useKanban.js';

export default function Card({ card, onUpdate, onDelete, onDragStart, onDragEnd, isDragging, index }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [editing]);

  const commitText = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== card.text) {
      onUpdate(card.id, { text: trimmed });
    } else {
      setText(card.text);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitText();
    }
    if (e.key === 'Escape') {
      setText(card.text);
      setEditing(false);
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(card.id);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const colorLabels = {
    '#E74C3C': 'Rosso vermiglio',
    '#3498DB': 'Blu indaco',
    '#27AE60': 'Verde bambù',
    '#F39C12': 'Giallo oro',
    '#8E44AD': 'Viola glicine',
    '#E67E22': 'Arancio terracotta',
    '#1ABC9C': 'Turchese mare',
    '#2C3E50': 'Blu inchiostro'
  };

  return (
    <div
      className={`card ${isDragging ? 'card--dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ '--card-color': card.color }}
      role="listitem"
      aria-label={`Carta: ${card.text}`}
    >
      <div className="card__stripe" aria-hidden="true" />

      <div className="card__body">
        {editing ? (
          <input
            ref={textRef}
            className="card__input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={handleKeyDown}
            aria-label="Modifica testo della carta"
          />
        ) : (
          <span
            className="card__text"
            onClick={() => setEditing(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true); }}
            tabIndex={0}
            role="button"
            aria-label={`Modifica "${card.text}"`}
          >
            {card.text}
          </span>
        )}

        <div className="card__actions">
          <button
            className="card__action-btn"
            onClick={() => setShowColorPicker(!showColorPicker)}
            aria-label={`Cambia colore della carta "${card.text}"`}
            aria-expanded={showColorPicker}
            title="Cambia colore"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          </button>

          <button
            className="card__action-btn card__action-btn--danger"
            onClick={() => onDelete(card.id)}
            aria-label={`Elimina carta "${card.text}"`}
            title="Elimina carta"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {showColorPicker && (
        <div className="color-picker" role="listbox" aria-label="Tavolozza colori">
          {CARD_COLORS.map((color) => (
            <button
              key={color}
              className={`color-picker__swatch ${color === card.color ? 'color-picker__swatch--active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                onUpdate(card.id, { color });
                setShowColorPicker(false);
              }}
              aria-label={colorLabels[color] || color}
              role="option"
              aria-selected={color === card.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
