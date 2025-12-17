import { MinesweeperGame } from '@/components/minesweeper-game';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-2 sm:p-4">
      <h1 className="text-4xl font-bold font-headline mb-4 tracking-wider">DeMine</h1>
      <MinesweeperGame />
    </main>
  );
}
