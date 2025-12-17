"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bomb, Flag, Smile, Frown, RotateCw, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import {
  type CellData,
  type GameState,
  type Difficulty,
  DIFFICULTY_SETTINGS,
  createGrid,
  placeMines,
  revealCells,
  revealAllMines,
} from '@/lib/minesweeper';

interface CellProps {
  data: CellData;
  gameState: GameState;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const numberColors = [
  'text-chart-1', // 1
  'text-chart-2', // 2
  'text-chart-3', // 3
  'text-chart-4', // 4
  'text-chart-5', // 5
  'text-foreground', // 6
  'text-muted-foreground', // 7
  'text-accent', // 8
];

const Cell: React.FC<CellProps> = React.memo(({ data, gameState, onClick, onContextMenu }) => {
  const { isRevealed, isMine, isFlagged, adjacentMines } = data;

  const revealedClickedMine = isRevealed && isMine && gameState === 'lost';

  const renderContent = () => {
    if (gameState === 'lost' && isMine && !isFlagged) {
      return <Bomb className="size-4/5" />;
    }
    if (gameState === 'lost' && !isMine && isFlagged) {
      return (
        <div className="relative flex items-center justify-center">
            <Flag className="size-4/5 text-muted-foreground" />
            <X className="absolute size-full text-destructive" />
        </div>
      )
    }
    if (isFlagged) {
      return <Flag className="size-4/5 text-accent-foreground" />;
    }
    if (isRevealed) {
      if (isMine) return <Bomb className="size-4/5" />;
      if (adjacentMines > 0) {
        return <span className={cn("font-bold text-lg", numberColors[adjacentMines - 1])}>{adjacentMines}</span>;
      }
    }
    return null;
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      onContextMenu={onContextMenu}
      disabled={isRevealed && gameState !== 'ready'}
      className={cn(
        'flex items-center justify-center aspect-square h-full w-full rounded-sm transition-all duration-200',
        isRevealed
          ? 'bg-muted/50 border-muted/60'
          : 'bg-primary/80 hover:bg-primary border-primary',
        revealedClickedMine && 'bg-destructive animate-pulse'
      )}
      aria-label={`Cell ${data.row}, ${data.col}`}
    >
      {renderContent()}
    </Button>
  );
});

Cell.displayName = 'Cell';

export function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [timer, setTimer] = useState(0);

  const { rows, cols, mines } = useMemo(() => DIFFICULTY_SETTINGS[difficulty], [difficulty]);

  const flagCount = useMemo(() => grid.flat().filter(cell => cell.isFlagged).length, [grid]);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setGrid(createGrid(rows, cols));
    setTimer(0);
  }, [rows, cols]);

  useEffect(resetGame, [resetGame]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost' || grid[row][col].isFlagged) {
      return;
    }

    let currentGrid = grid;
    if (gameState === 'ready') {
      currentGrid = placeMines(grid, rows, cols, mines, { row, col });
      setGameState('playing');
    }
    
    if (currentGrid[row][col].isMine) {
      setGameState('lost');
      setGrid(revealAllMines(currentGrid));
      return;
    }

    const newGrid = revealCells(currentGrid, row, col, rows, cols);

    const revealedCount = newGrid.flat().filter(cell => cell.isRevealed).length;
    if (revealedCount === rows * cols - mines) {
      setGameState('won');
      setGrid(revealAllMines(newGrid));
    } else {
      setGrid(newGrid);
    }
  }, [grid, gameState, rows, cols, mines]);

  const handleContextMenu = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameState !== 'playing' && gameState !== 'ready') return;
    
    const newGrid = [...grid];
    const cell = newGrid[row][col];

    if (!cell.isRevealed) {
      cell.isFlagged = !cell.isFlagged;
      setGrid(newGrid);
    }
  }, [grid, gameState]);

  const SmileyIcon = useMemo(() => {
    if (gameState === 'lost') return Frown;
    if (gameState === 'won') return <RotateCw className="text-green-400" />;
    return Smile;
  }, [gameState]);

  return (
    <Card className="w-full max-w-fit border-2 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between p-3 bg-muted/50 rounded-t-lg">
        <div className="flex items-center gap-2 font-mono text-lg font-bold bg-background/50 border px-3 py-1 rounded">
          <Flag className="size-5 text-destructive" />
          <span>{String(mines - flagCount).padStart(3, '0')}</span>
        </div>

        <Button variant="ghost" size="icon" onClick={resetGame}>
          <SmileyIcon className="size-8" />
        </Button>

        <div className="flex items-center gap-2 font-mono text-lg font-bold bg-background/50 border px-3 py-1 rounded">
          <span>{String(timer).padStart(3, '0')}</span>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <Cell
                key={`${rIdx}-${cIdx}`}
                data={cell}
                gameState={gameState}
                onClick={() => handleCellClick(rIdx, cIdx)}
                onContextMenu={(e) => handleContextMenu(e, rIdx, cIdx)}
              />
            ))
          )}
        </div>
      </CardContent>
      <div className="flex items-center justify-center p-3 border-t bg-muted/50 rounded-b-lg">
        <div className="flex items-center gap-2">
            <Settings className="size-4" />
            <Select onValueChange={(value: Difficulty) => setDifficulty(value)} defaultValue={difficulty}>
                <SelectTrigger className="w-[150px] h-8">
                    <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      <AlertDialog open={gameState === 'won' || gameState === 'lost'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-3xl">
              {gameState === 'won' ? '🎉 You Win! 🎉' : '💥 Game Over 💥'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              {gameState === 'won'
                ? `You cleared the board in ${timer} seconds!`
                : 'You hit a mine. Better luck next time!'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button className="w-full" onClick={resetGame}>
              Play Again
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
