import { create } from 'zustand';
import type { User } from '@/types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  currentModule: string | null;
  setCurrentModule: (moduleId: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  currentModule: null,
  setCurrentModule: (moduleId) => set({ currentModule: moduleId }),
}));
