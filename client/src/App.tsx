import './App.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router';

import { UPDATES_SUPPORTED } from './bridge/platform';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { TauriAppShell } from './components/window/title-bar';
import { MenuFocusProvider } from './contexts/menu-focus-context';
import { NavInputProvider } from './contexts/nav-input-context';
import { ThemeProvider } from './contexts/theme-context';
import { MenuIndex, MenuLayout } from './pages/menu/menu';
import { SettingsPage } from './pages/menu/settings';
import { Playback } from './pages/playback/playback';
import { useConfig } from './queries/use-config';
import { useUpdate } from './queries/use-update';

const queryClient = new QueryClient();

const UpdateAutoCheck = () => {
  useUpdate();

  return null;
};

const InnerWrapper = () => (
  <>
    <MenuFocusProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuLayout />}>
            <Route index element={<MenuIndex />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/playback" element={<Playback />} />
        </Routes>
      </BrowserRouter>
    </MenuFocusProvider>
    <Toaster />
    {UPDATES_SUPPORTED && <UpdateAutoCheck />}
  </>
);

const ThemeWrapper = () => {
  const { data: config } = useConfig();

  return (
    <ThemeProvider defaultTheme={config?.dark_mode === false ? 'light' : 'dark'}>
      <TooltipProvider>
        <TauriAppShell>
          <InnerWrapper />
        </TauriAppShell>
      </TooltipProvider>
    </ThemeProvider>
  );
};

const App = () => (
  <NavInputProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeWrapper />
    </QueryClientProvider>
  </NavInputProvider>
);

export default App;
