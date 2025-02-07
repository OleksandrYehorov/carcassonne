import { useServerLogs } from '@/hooks/useServerLogs';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

const Root = () => {
  useServerLogs();

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRoute({
  component: Root,
});
