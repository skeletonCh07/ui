'use client';

import { Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/50 bg-gradient-to-r from-background via-background to-primary/5 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <Sparkles className="h-5 w-5 text-primary/40" />
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {action}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-primary" />
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-destructive">
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}
