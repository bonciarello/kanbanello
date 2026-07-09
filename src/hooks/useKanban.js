import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kanbanello_board';
const CARD_COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#8E44AD', '#E67E22', '#1ABC9C', '#2C3E50'];

let nextId = 1;

function generateId() {
  return `item_${Date.now()}_${nextId++}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultBoard() {
  const colId1 = generateId();
  const colId2 = generateId();
  const colId3 = generateId();
  return {
    columns: [
      { id: colId1, title: 'Da fare', cardIds: [] },
      { id: colId2, title: 'In corso', cardIds: [] },
      { id: colId3, title: 'Fatto', cardIds: [] }
    ],
    cards: {}
  };
}

function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.columns && parsed.cards) {
        return parsed;
      }
    }
  } catch (e) {
    /* corrupted data — fall through to default */
  }
  return createDefaultBoard();
}

function saveBoard(board) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (e) {
    /* quota exceeded — silently ignore */
  }
}

export default function useKanban() {
  const [board, setBoard] = useState(() => loadBoard());
  const [saved, setSaved] = useState(true);

  // persist on every change
  useEffect(() => {
    saveBoard(board);
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(t);
  }, [board]);

  // ---- Column operations ----

  const addColumn = useCallback((title) => {
    const id = generateId();
    setBoard(prev => ({
      ...prev,
      columns: [...prev.columns, { id, title: title.trim() || 'Nuova colonna', cardIds: [] }]
    }));
  }, []);

  const renameColumn = useCallback((colId, newTitle) => {
    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(c =>
        c.id === colId ? { ...c, title: newTitle.trim() || c.title } : c
      )
    }));
  }, []);

  const deleteColumn = useCallback((colId) => {
    setBoard(prev => {
      const col = prev.columns.find(c => c.id === colId);
      if (!col) return prev;
      const cardsToRemove = new Set(col.cardIds);
      const newCards = { ...prev.cards };
      cardsToRemove.forEach(id => delete newCards[id]);
      return {
        ...prev,
        columns: prev.columns.filter(c => c.id !== colId),
        cards: newCards
      };
    });
  }, []);

  const moveColumn = useCallback((fromIndex, toIndex) => {
    setBoard(prev => {
      const cols = [...prev.columns];
      const [moved] = cols.splice(fromIndex, 1);
      cols.splice(toIndex, 0, moved);
      return { ...prev, columns: cols };
    });
  }, []);

  // ---- Card operations ----

  const addCard = useCallback((columnId, text, color) => {
    const id = generateId();
    setBoard(prev => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: {
          id,
          text: text.trim() || 'Nuova carta',
          color: color || CARD_COLORS[0]
        }
      },
      columns: prev.columns.map(c =>
        c.id === columnId ? { ...c, cardIds: [...c.cardIds, id] } : c
      )
    }));
  }, []);

  const updateCard = useCallback((cardId, updates) => {
    setBoard(prev => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], ...updates }
      }
    }));
  }, []);

  const deleteCard = useCallback((cardId) => {
    setBoard(prev => {
      const newCards = { ...prev.cards };
      delete newCards[cardId];
      return {
        ...prev,
        cards: newCards,
        columns: prev.columns.map(c => ({
          ...c,
          cardIds: c.cardIds.filter(id => id !== cardId)
        }))
      };
    });
  }, []);

  const moveCard = useCallback((cardId, fromColId, toColId, toIndex) => {
    setBoard(prev => {
      const fromCol = prev.columns.find(c => c.id === fromColId);
      const toCol = prev.columns.find(c => c.id === toColId);
      if (!fromCol || !toCol) return prev;

      const columns = prev.columns.map(c => {
        if (c.id === fromColId) {
          return { ...c, cardIds: c.cardIds.filter(id => id !== cardId) };
        }
        if (c.id === toColId) {
          const newCardIds = [...c.cardIds];
          newCardIds.splice(toIndex, 0, cardId);
          return { ...c, cardIds: newCardIds };
        }
        return c;
      });

      return { ...prev, columns };
    });
  }, []);

  const reorderCard = useCallback((colId, fromIndex, toIndex) => {
    setBoard(prev => {
      const col = prev.columns.find(c => c.id === colId);
      if (!col) return prev;
      const cardIds = [...col.cardIds];
      const [moved] = cardIds.splice(fromIndex, 1);
      cardIds.splice(toIndex, 0, moved);
      return {
        ...prev,
        columns: prev.columns.map(c =>
          c.id === colId ? { ...c, cardIds } : c
        )
      };
    });
  }, []);

  // ---- Reset ----

  const resetBoard = useCallback(() => {
    setBoard(createDefaultBoard());
  }, []);

  // ---- Export / Import ----

  const exportBoard = useCallback(() => {
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanbanello_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [board]);

  const importBoard = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data && data.columns && data.cards) {
            setBoard(data);
          }
        } catch (_) { /* invalid file */ }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return {
    board,
    addColumn,
    renameColumn,
    deleteColumn,
    moveColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
    resetBoard,
    exportBoard,
    importBoard,
    saved
  };
}

export { CARD_COLORS };
