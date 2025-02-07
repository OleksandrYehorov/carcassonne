import { Button } from '@/components/ui/button/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form/form';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
});

export const Route = createFileRoute('/game_/$gameId/join')({
  component: JoinGame,
});

function JoinGame() {
  const navigate = useNavigate();
  const { gameId } = Route.useParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const joinGameMutation = trpc.game.joinGame.useMutation();

  const handleJoinGame = async (data: z.infer<typeof formSchema>) => {
    try {
      const response = await joinGameMutation.mutateAsync({
        gameId,
        playerName: data.name,
      });

      navigate({
        to: '/game/$gameId/wait',
        params: { gameId: response.gameId },
      });
    } catch (error) {
      form.setError('name', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Game</CardTitle>
        <CardDescription>Enter your name to join the game.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleJoinGame)}>
          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Submit</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
