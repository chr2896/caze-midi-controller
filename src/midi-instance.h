#ifndef MIDI_INSTANCE_H
#define MIDI_INSTANCE_H
#include <MIDI.h>
extern midi::MidiInterface<midi::SerialMIDI<HardwareSerial> > MIDI;
#endif
