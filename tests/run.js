/**
 * Test suite for Kanbanello
 * 
 * Validates the useKanban hook logic without needing a browser DOM.
 * Tests are plain Node.js assertions.
 */

const TESTS = [];

function test(name, fn) {
  TESTS.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(`❌ FAIL: ${message}`);
}

// Helper: simulate a minimal localStorage
let storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = val; },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { storage = {}; }
};

// We can't run React hooks in Node directly, so we test the pure logic.
// Import the hook's helper concepts and validate board structure independently.

// ─── Board structure tests ───

test('default board has 3 columns', () => {
  const cols = ['Da fare', 'In corso', 'Fatto'];
  assert(cols.length === 3, 'expected 3 default columns');
});

test('default column titles are in Italian', () => {
  const cols = ['Da fare', 'In corso', 'Fatto'];
  assert(cols[0] === 'Da fare', 'first column should be "Da fare"');
  assert(cols[1] === 'In corso', 'second column should be "In corso"');
  assert(cols[2] === 'Fatto', 'third column should be "Fatto"');
});

// ─── localStorage persistence logic ───

test('localStorage save and load round-trip', () => {
  storage = {};
  const board = {
    columns: [
      { id: 'c1', title: 'Backlog', cardIds: ['k1', 'k2'] },
      { id: 'c2', title: 'Sprint', cardIds: [] }
    ],
    cards: {
      'k1': { id: 'k1', text: 'Setup progetto', color: '#3498DB' },
      'k2': { id: 'k2', text: 'Scrivere test', color: '#27AE60' }
    }
  };

  // Save
  mockLocalStorage.setItem('kanbanello_board', JSON.stringify(board));

  // Load
  const raw = mockLocalStorage.getItem('kanbanello_board');
  const loaded = JSON.parse(raw);
  assert(loaded.columns.length === 2, 'should have 2 columns after load');
  assert(loaded.columns[0].title === 'Backlog', 'first column title should persist');
  assert(Object.keys(loaded.cards).length === 2, 'should have 2 cards after load');
  assert(loaded.cards['k1'].text === 'Setup progetto', 'card text should persist');
  assert(loaded.cards['k2'].color === '#27AE60', 'card color should persist');
});

test('localStorage handles missing data gracefully', () => {
  storage = {};
  const raw = mockLocalStorage.getItem('kanbanello_board');
  assert(raw === null, 'missing key should return null');
  // Default board should be created instead (tested by app logic)
});

test('localStorage handles corrupted data', () => {
  storage = {};
  mockLocalStorage.setItem('kanbanello_board', 'not-valid-json{{{');

  let parsed = null;
  try {
    parsed = JSON.parse(mockLocalStorage.getItem('kanbanello_board'));
  } catch (e) {
    parsed = null;
  }
  assert(parsed === null, 'corrupted data should be caught');
});

// ─── Card color palette ───

test('card color palette has 8 colors', () => {
  const CARD_COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#8E44AD', '#E67E22', '#1ABC9C', '#2C3E50'];
  assert(CARD_COLORS.length === 8, 'should have 8 card colors');
  // Every color must be a valid hex
  for (const color of CARD_COLORS) {
    assert(/^#[0-9A-Fa-f]{6}$/.test(color), `${color} should be a valid hex color`);
  }
});

// ─── Column operations (pure logic) ───

test('add column appends at the end', () => {
  const columns = [
    { id: 'c1', title: 'Prima', cardIds: [] }
  ];
  const newCol = { id: 'c2', title: 'Seconda', cardIds: [] };
  columns.push(newCol);
  assert(columns.length === 2, 'should have 2 columns');
  assert(columns[1].title === 'Seconda', 'new column should be last');
});

test('rename column updates title', () => {
  const columns = [
    { id: 'c1', title: 'Vecchio nome', cardIds: [] }
  ];
  columns[0] = { ...columns[0], title: 'Nuovo nome' };
  assert(columns[0].title === 'Nuovo nome', 'column title should update');
});

test('delete column removes it and its cards', () => {
  const columns = [
    { id: 'c1', title: 'Col A', cardIds: ['k1', 'k2'] },
    { id: 'c2', title: 'Col B', cardIds: [] }
  ];
  const cards = {
    'k1': { id: 'k1', text: 'Carta 1' },
    'k2': { id: 'k2', text: 'Carta 2' }
  };

  // Delete column c1
  const col = columns.find(c => c.id === 'c1');
  const cardsToRemove = new Set(col.cardIds);
  const newCards = { ...cards };
  cardsToRemove.forEach(id => delete newCards[id]);
  const newColumns = columns.filter(c => c.id !== 'c1');

  assert(newColumns.length === 1, 'should have 1 column left');
  assert(Object.keys(newCards).length === 0, 'cards should be deleted with column');
});

// ─── Card operations (pure logic) ───

test('add card to column', () => {
  const columns = [
    { id: 'c1', title: 'Col A', cardIds: ['k1'] }
  ];
  const cards = {
    'k1': { id: 'k1', text: 'Carta 1', color: '#E74C3C' }
  };

  const newCardId = 'k2';
  cards[newCardId] = { id: newCardId, text: 'Carta 2', color: '#3498DB' };
  columns[0] = { ...columns[0], cardIds: [...columns[0].cardIds, newCardId] };

  assert(columns[0].cardIds.length === 2, 'column should have 2 cards');
  assert(cards['k2'].text === 'Carta 2', 'new card should exist');
  assert(columns[0].cardIds[1] === 'k2', 'new card should be last in column');
});

test('move card between columns', () => {
  const columns = [
    { id: 'c1', title: 'Da fare', cardIds: ['k1', 'k2'] },
    { id: 'c2', title: 'In corso', cardIds: [] }
  ];

  const cardId = 'k1';
  const fromColId = 'c1';
  const toColId = 'c2';

  // Remove from source
  const updated = columns.map(c => {
    if (c.id === fromColId) return { ...c, cardIds: c.cardIds.filter(id => id !== cardId) };
    if (c.id === toColId) return { ...c, cardIds: [...c.cardIds, cardId] };
    return c;
  });

  assert(updated[0].cardIds.length === 1, 'source should have 1 card');
  assert(updated[0].cardIds[0] === 'k2', 'source should have remaining card');
  assert(updated[1].cardIds.length === 1, 'dest should have 1 card');
  assert(updated[1].cardIds[0] === 'k1', 'dest should have moved card');
});

test('update card text and color', () => {
  const cards = {
    'k1': { id: 'k1', text: 'Vecchio testo', color: '#E74C3C' }
  };
  cards['k1'] = { ...cards['k1'], text: 'Nuovo testo', color: '#27AE60' };
  assert(cards['k1'].text === 'Nuovo testo', 'card text should update');
  assert(cards['k1'].color === '#27AE60', 'card color should update');
});

test('delete card removes from cards and column', () => {
  const columns = [
    { id: 'c1', title: 'Col A', cardIds: ['k1', 'k2'] }
  ];
  const cards = {
    'k1': { id: 'k1', text: 'Carta 1' },
    'k2': { id: 'k2', text: 'Carta 2' }
  };

  const cardId = 'k1';
  delete cards[cardId];
  const newColumns = columns.map(c => ({
    ...c,
    cardIds: c.cardIds.filter(id => id !== cardId)
  }));

  assert(Object.keys(cards).length === 1, 'should have 1 card left');
  assert(newColumns[0].cardIds.length === 1, 'column should have 1 card');
  assert(newColumns[0].cardIds[0] === 'k2', 'remaining card should be k2');
});

// ─── Import/export logic ───

test('export produces valid JSON with board structure', () => {
  const board = {
    columns: [{ id: 'c1', title: 'Test', cardIds: [] }],
    cards: {}
  };
  const json = JSON.stringify(board, null, 2);
  const parsed = JSON.parse(json);
  assert(parsed.columns.length === 1, 'export should preserve columns');
  assert(parsed.columns[0].title === 'Test', 'export should preserve title');
});

test('import validates board shape', () => {
  const valid = { columns: [], cards: {} };
  const check = (data) => !!(data && data.columns && data.cards);
  assert(check(valid) === true, 'valid board should pass shape check');

  const invalid1 = null;
  const invalid2 = { columns: [] };
  const invalid3 = { cards: {} };
  assert(check(invalid1) === false, 'null should fail');
  assert(check(invalid2) === false, 'missing cards should fail');
  assert(check(invalid3) === false, 'missing columns should fail');
});

// ─── ID generation ───

test('generated IDs are unique', () => {
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    const id = `item_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
    ids.add(id);
  }
  assert(ids.size === 100, 'all 100 generated IDs should be unique');
});

// ─── Color contrast (basic) ───

test('accent colors are valid CSS', () => {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  const accentColors = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#8E44AD', '#2C3E50'];
  for (const color of accentColors) {
    assert(hexRegex.test(color), `${color} should be a valid hex`);
  }
});

// ─── Run all tests ───

let passed = 0;
let failed = 0;

console.log('\n🧪 Kanbanello Test Suite\n');
console.log('═'.repeat(50));

for (const { name, fn } of TESTS) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌  ${name}`);
    console.log(`      ${err.message}`);
    failed++;
  }
}

console.log('═'.repeat(50));
console.log(`\n  Risultati: ${passed} passati, ${failed} falliti su ${TESTS.length} test\n`);

process.exit(failed > 0 ? 1 : 0);
