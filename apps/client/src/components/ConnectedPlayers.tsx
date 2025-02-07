import { Spinner } from '@/components/Spinner';
import { trpc } from '@/utils/trpc';
import { useNavigate } from '@tanstack/react-router';
import { FC } from 'react';

type ConnectedPlayersProps = {
  gameId: string;
};

export const ConnectedPlayers: FC<ConnectedPlayersProps> = ({ gameId }) => {
  const navigate = useNavigate();

  const gameUpdateSubscription = trpc.game.onGameUpdate.useSubscription({
    gameId,
  });

  trpc.game.onGameStart.useSubscription(
    { gameId },
    {
      onData(data) {
        if (data?.canStart) {
          navigate({ to: '/game/$gameId', params: { gameId } });
        }
      },
    }
  );

  if (
    gameUpdateSubscription.status !== 'pending' ||
    !gameUpdateSubscription.data
  ) {
    return <Spinner />;
  }

  const emptySlotsCount =
    gameUpdateSubscription.data.data.state.playersCount -
    gameUpdateSubscription.data.data.state.players.length;

  return (
    <>
      <div className=" mb-3">
        <h3 className="text-sm font-medium">
          Players joined:{' '}
          {gameUpdateSubscription.data?.data.state.players.length}/
          {gameUpdateSubscription.data?.data.state.playersCount}
        </h3>
        <p className="text-xs text-muted-foreground">
          Waiting for more players...
        </p>
      </div>

      <ul className="space-y-2">
        {gameUpdateSubscription.data?.data.state.players.map((player) => {
          const isYou =
            player.id ===
            gameUpdateSubscription.data?.data.state.currentPlayer.id;
          const isHost = player.isHost;

          return (
            <li
              className="flex items-center rounded-md border p-2"
              key={player.id}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: player.color }}
              />
              <span className="ml-2 text-sm">
                {player.name} {isYou && '(You)'} {isHost && '(Host)'}
              </span>
            </li>
          );
        })}
        {Array.from({ length: emptySlotsCount }, (_, i) => (
          <li
            key={i}
            className="flex items-center rounded-md border border-dashed p-2"
          >
            <div className="h-8 w-8 rounded-full  flex items-center justify-center">
              <Spinner className="text-muted-foreground" />
            </div>
            <span className="ml-2 text-sm text-muted-foreground">
              Waiting for player...
            </span>
          </li>
        ))}
      </ul>
    </>
  );
};
