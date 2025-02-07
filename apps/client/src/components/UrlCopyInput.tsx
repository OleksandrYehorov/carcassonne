import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button/button';

interface UrlCopyInputProps {
  url: string;
  className?: string;
}

export function UrlCopyInput({ url, className }: UrlCopyInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  }, [url]);

  return (
    <div
      className={cn('flex w-full max-w-sm items-center space-x-2', className)}
    >
      <Input type="text" value={url} readOnly aria-label="URL to copy" />
      <Button
        onClick={handleCopy}
        variant="secondary"
        size="icon"
        className="w-10 shrink-0"
        aria-label={copied ? 'Copied' : 'Copy URL'}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
