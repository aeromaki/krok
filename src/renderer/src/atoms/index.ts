import { atom, createStore } from "jotai";

export const authAtom = atom<string | null>(null);
export const userAtom = atom<{ userName: string, email: string }>({ userName: '', email: '' });
export const audioInputDeviceAtom = atom<MediaDeviceInfo | null>(null);

export const obsAtom = atom<{ address: string, password: string, sceneName: string }>({ address: '127.0.0.1:4455', password: '', sceneName: '' });

export const store = createStore();