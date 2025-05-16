import { useLocalStorage } from '@/hooks/use-local-storage';
import { type Theme } from '@/types/theme';

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');

  return [theme, setTheme];
}