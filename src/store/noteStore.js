import { create } from 'zustand';

/**
 * useNoteStore — manages note CRUD, selection, tags, and AI output cache
 */
const getSavedNotes = () => {
  try {
    const saved = localStorage.getItem('noteai-notes');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const getSavedAICache = () => {
  try {
    const saved = localStorage.getItem('noteai-aicache');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const useNoteStore = create((set, get) => ({
  notes: getSavedNotes(),
  activeNoteId: null,
  loading: false,
  error: null,

  // AI output attached to a note
  noteAICache: getSavedAICache(), // { [noteId]: { summary, quiz, tts } }

  setNotes: (notes) => {
    localStorage.setItem('noteai-notes', JSON.stringify(notes));
    set({ notes });
  },

  addNote: (note) => set((s) => {
    const nextNotes = [note, ...s.notes];
    localStorage.setItem('noteai-notes', JSON.stringify(nextNotes));
    return {
      notes: nextNotes,
      activeNoteId: note.id,
    };
  }),

  updateNote: (id, patch) => set((s) => {
    const nextNotes = s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
    localStorage.setItem('noteai-notes', JSON.stringify(nextNotes));
    return {
      notes: nextNotes,
    };
  }),

  deleteNote: (id) => set((s) => {
    const nextNotes = s.notes.filter((n) => n.id !== id);
    localStorage.setItem('noteai-notes', JSON.stringify(nextNotes));
    return {
      notes: nextNotes,
      activeNoteId: s.activeNoteId === id ? (nextNotes[0]?.id ?? null) : s.activeNoteId,
    };
  }),

  setActiveNote: (id) => set({ activeNoteId: id }),

  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find((n) => n.id === activeNoteId) ?? null;
  },

  setAICache: (noteId, key, value) => set((s) => {
    const nextCache = {
      ...s.noteAICache,
      [noteId]: { ...(s.noteAICache[noteId] ?? {}), [key]: value },
    };
    localStorage.setItem('noteai-aicache', JSON.stringify(nextCache));
    return { noteAICache: nextCache };
  }),

  getAICache: (noteId, key) => {
    const { noteAICache } = get();
    return noteAICache[noteId]?.[key] ?? null;
  },

  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
}));
