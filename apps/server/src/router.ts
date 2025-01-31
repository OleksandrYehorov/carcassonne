import { publicProcedure, router } from './trpc';
import { gameRouter } from './gameRouter';
import { z } from 'zod';

export const appRouter = router({
  hello: publicProcedure.input(z.string().optional()).query(({ input }) => {
    return `Hello ${input ?? 'World'}!`;
  }),
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
