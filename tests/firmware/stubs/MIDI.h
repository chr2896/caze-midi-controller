#pragma once
#include <Arduino.h>
namespace midi {
template<class T> class SerialMIDI {};
struct Message { byte command, value, channel; bool program; };
template<class T> class MidiInterface {
public:
    std::vector<Message> messages;
    void begin() {}
    void sendControlChange(byte c, byte v, byte ch) { messages.push_back({c, v, ch, false}); }
    void sendProgramChange(byte p, byte ch) { messages.push_back({p, 0, ch, true}); }
};
}
