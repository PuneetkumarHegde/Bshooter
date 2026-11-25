/** useSettingsStore.js — Audio + accessibility prefs that drive the audio engine. */
import { create } from 'zustand';
import audio from '../services/audioEngine.js';

function load() {
  try {
    const raw = localStorage.getItem('bshooter.settings');
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { sound: true, music: true, reducedMotion: false };
}

function persist(s) {
  try {
    localStorage.setItem('bshooter.settings', JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const initial = load();
audio.setSoundEnabled(initial.sound);
audio.setMusicEnabled(initial.music);

export const useSettingsStore = create((set, get) => ({
  sound: initial.sound,
  music: initial.music,
  reducedMotion: initial.reducedMotion,

  toggleSound() {
    const sound = !get().sound;
    audio.setSoundEnabled(sound);
    set({ sound });
    persist({ ...get(), sound });
  },

  toggleMusic() {
    const music = !get().music;
    audio.setMusicEnabled(music); // actually starts/stops the loop
    set({ music });
    persist({ ...get(), music });
  },

  toggleReducedMotion() {
    const reducedMotion = !get().reducedMotion;
    set({ reducedMotion });
    persist({ ...get(), reducedMotion });
  },
}));

export default useSettingsStore;
