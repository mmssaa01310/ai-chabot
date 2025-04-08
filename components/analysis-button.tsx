'use client';

import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type AnalysisButtonProps = {
  onClick: () => void;
};

export function AnalysisButton({ onClick }: AnalysisButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      aria-label="分析"
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
