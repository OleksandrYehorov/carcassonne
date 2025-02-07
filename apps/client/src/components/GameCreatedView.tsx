import { Button } from '@/components/ui/button/button';
import { UrlCopyInput } from '@/components/UrlCopyInput';
import { Link } from '@tanstack/react-router';

export const GameCreatedView = ({ gameId }: { gameId: string }) => {
  const gameUrl = `${window.location.origin}/game/${gameId}/join`;

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-bold text-center">Game Created</h1>

      <UrlCopyInput url={gameUrl} className="mt-2" />

      <Button asChild className="mt-2 w-full">
        <Link to="/game/$gameId" params={{ gameId }}>
          Start Game
        </Link>
      </Button>
    </div>
  );
};
