
'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder to avoid flash/hydration mismatch
    return <Button variant="ghost" size="icon" disabled className="h-12 w-12 rounded-md"><Sun className="h-6 w-6" /></Button>;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-12 w-12 rounded-md text-foreground/70 hover:text-foreground"
      aria-label={theme === 'light' ? t('theme_toggle_switchToDark') : t('theme_toggle_switchToLight')}
    >
      {theme === 'light' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
    </Button>
  );
}
