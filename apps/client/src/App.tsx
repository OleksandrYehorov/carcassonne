import { FC } from 'react';
import { Field } from './Field';
import { Toaster } from '@/components/ui/sonner';

export const App: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Field />
      <Toaster visibleToasts={2} expand={true} />
    </div>
  );
};
