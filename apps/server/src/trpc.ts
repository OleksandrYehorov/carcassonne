import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { parse } from 'cookie';

export function createContext({
  req,
  resHeaders,
  info,
}: FetchCreateContextFnOptions) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);

  const playerSession = cookies['playerSession'];
  console.log({ cookies, playerSession });

  return { req, resHeaders, info, playerSession };
}

export type Context = ReturnType<typeof createContext>;

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
  sse: {
    maxDurationMs: 5 * 60 * 1_000, // 5 minutes
    ping: {
      enabled: true,
      intervalMs: 3_000,
    },
    client: {
      reconnectAfterInactivityMs: 5_000,
    },
  },
});

export const createCallerFactory = t.createCallerFactory;

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  async function isAuthenticated(options) {
    console.log(1, {
      options,
      'options.ctx.playerSession': options.ctx.playerSession,
    });

    if (!options.ctx.playerSession) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    console.log(2, { 'options.ctx': options.ctx });

    return options.next({
      ctx: options.ctx,
    });
  }
);
