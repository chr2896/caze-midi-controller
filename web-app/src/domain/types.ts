export interface MidiAction {
  type: number;
  channel: number;
  value1: number;
  value2: number;
  value3: number;
  label: string;
  toggleOnOff?: boolean;
  tapTempo?: boolean;
  state1?: string;
  state2?: string;
}
export interface Preset {
  version: 1;
  pages: MidiAction[][][];
  externals?: MidiAction[];
}
export type Bytes = number[] | Uint8Array;
export type Checksum = (bytes: Bytes) => number;
export type ActiveSlot = 2 | 3;
export type NumericActionKey = 'channel' | 'value1' | 'value2' | 'value3';
export interface RecoveryBundle {
  version: 2;
  includeExternals?: boolean;
  created?: string;
  preset: Preset;
  before: number[];
}
