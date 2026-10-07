import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type Voice = {
  id: string;
  name: string;
  language: string;
  quality: number;
};
export type Capabilities = {
  voices: Voice[];
  sceneAnalysis: string;
  thermalState: string;
  memoryHeadroomBytes: number;
  freeBytes: number;
  totalBytes: number;
  lowPowerMode: boolean;
  charging: boolean;
  batteryLevel: number;
  audioBytes: number;
};
export type SpeechFile = { path: string; bytes: number; duration: number };

export interface Spec extends TurboModule {
  getCapabilities(language: string): Promise<Capabilities>;
  synthesize(text: string, voiceID: string): Promise<SpeechFile>;
  cancel(): Promise<boolean>;
  clearAudio(): Promise<boolean>;
  sceneCue(text: string, language: string): Promise<string>;
  // Hands remaining prepare-for-later segments ([{id, text, voiceID}] JSON)
  // to the OS background worker.
  schedulePreparation(
    itemsJSON: string,
    requiresCharging: boolean,
  ): Promise<boolean>;
  // Stops background work; resolves [{id, path, bytes, duration}] JSON.
  collectPreparation(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('NativeInkNestNarration');
