import React from 'react';
import Board from './components/Board.jsx';
import useKanban from './hooks/useKanban.js';

export default function App() {
  const {
    board,
    addColumn,
    renameColumn,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    resetBoard,
    exportBoard,
    importBoard,
    saved
  } = useKanban();

  return (
    <Board
      board={board}
      onAddColumn={addColumn}
      onRenameColumn={renameColumn}
      onDeleteColumn={deleteColumn}
      onAddCard={addCard}
      onUpdateCard={updateCard}
      onDeleteCard={deleteCard}
      onMoveCard={moveCard}
      onReset={resetBoard}
      onExport={exportBoard}
      onImport={importBoard}
      saved={saved}
    />
  );
}
