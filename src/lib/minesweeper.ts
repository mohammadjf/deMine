
export type CellData = {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

export type GameState = 'ready' | 'playing' | 'won' | 'lost';

export type Difficulty = 'beginner' | 'intermediate' | 'expert';

export const DIFFICULTY_SETTINGS: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export function createGrid(rows: number, cols: number): CellData[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

export function placeMines(grid: CellData[][], rows: number, cols: number, mines: number, firstClick: { row: number; col: number }): CellData[][] {
  const newGrid = JSON.parse(JSON.stringify(grid));
  
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    const isFirstClickCell = row === firstClick.row && col === firstClick.col;

    if (!newGrid[row][col].isMine && !isFirstClickCell) {
      newGrid[row][col].isMine = true;
      minesPlaced++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newGrid[r][c].isMine) {
        let adjacentMines = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const newRow = r + i;
            const newCol = c + j;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && newGrid[newRow][newCol].isMine) {
              adjacentMines++;
            }
          }
        }
        newGrid[r][c].adjacentMines = adjacentMines;
      }
    }
  }

  return newGrid;
}

export function revealCells(grid: CellData[][], row: number, col: number, rows: number, cols: number): CellData[][] {
  const newGrid = JSON.parse(JSON.stringify(grid));
  const stack: { row: number, col: number }[] = [{ row, col }];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const { row, col } = stack.pop()!;
    const cellKey = `${row}-${col}`;

    if (visited.has(cellKey)) continue;
    visited.add(cellKey);

    const cell = newGrid[row][col];
    if (cell.isFlagged) continue;
    
    cell.isRevealed = true;

    if (cell.adjacentMines === 0 && !cell.isMine) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const newRow = row + i;
          const newCol = col + j;
          if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            if (!newGrid[newRow][newCol].isRevealed) {
              stack.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    }
  }
  return newGrid;
}

export function revealAllMines(grid: CellData[][]): CellData[][] {
    const newGrid = JSON.parse(JSON.stringify(grid));
    for (const row of newGrid) {
        for (const cell of row) {
            if (cell.isMine) {
                cell.isRevealed = true;
            }
        }
    }
    return newGrid;
}

export function flagAllMines(grid: CellData[][]): CellData[][] {
    const newGrid = JSON.parse(JSON.stringify(grid));
    for (const row of newGrid) {
        for (const cell of row) {
            if (cell.isMine && !cell.isRevealed) {
                cell.isFlagged = true;
            }
        }
    }
    return newGrid;
}
