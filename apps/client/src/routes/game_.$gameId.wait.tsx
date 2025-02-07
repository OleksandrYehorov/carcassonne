import { ConnectedPlayers } from '@/components/ConnectedPlayers';
import { UrlCopyInput } from '@/components/UrlCopyInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/game_/$gameId/wait')({
  component: GameWaitView,
});

function GameWaitView() {
  const { gameId } = Route.useParams();

  console.log(document.cookie);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting for the game to start</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="mb-2">Share the invite link with other players:</p>
        <UrlCopyInput url={`${window.location.origin}/game/${gameId}/join`} />
      </CardContent>

      <Separator />

      <CardContent className="pt-6">
        <ConnectedPlayers gameId={gameId} />
      </CardContent>
    </Card>
  );
}
