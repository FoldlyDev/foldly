'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Search, X } from 'lucide-react';

interface ToolbarSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export function ToolbarSearch({
  searchQuery,
  onSearchChange,
  placeholder = 'Search files and folders...',
}: ToolbarSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = (value: string) => {
    setLocalQuery(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setLocalQuery('');
    onSearchChange('');
  };

  return (
    <div className='relative flex-1 max-w-xs'>
      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
      <Input
        type='text'
        placeholder={placeholder}
        value={localQuery}
        onChange={e => handleSearch(e.target.value)}
        className='pl-9 pr-8 h-9'
      />
      {localQuery && (
        <Button
          size='sm'
          variant='ghost'
          className='absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0'
          onClick={clearSearch}
        >
          <X className='h-3 w-3' />
        </Button>
      )}
    </div>
  );
}
