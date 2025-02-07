import { cn } from '@/lib/utils';
import { FC } from 'react';

export const Spinner: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900',
        className
      )}
    />
  );
};
