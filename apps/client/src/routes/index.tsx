import { Button } from '@/components/ui/button/button';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-xl font-bold mb-6">
        Welcome to the Carcassonne Game
      </h1>
      <Button asChild>
        <Link to="/game/create">Create Game</Link>
      </Button>
    </div>
  );
}
