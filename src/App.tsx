import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="storyverse-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  )
}