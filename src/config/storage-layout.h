#ifndef STORAGE_LAYOUT_H
#define STORAGE_LAYOUT_H
#include <Arduino.h>
#include <EEPROM.h>

namespace Storage {
const int LABELS = 270;
const int FLAGS = 918;
const int EXPRESSION = 928;
const int USB = 935;
const int IMAGE_SIZE = 936;
const int CALIBRATION = 936; // Separate from web preset writes (0..935).
const int MARKER = 1020;
const byte PENDING = 0x51;
const byte VALID = 0xA5;
inline bool modern() {
    return EEPROM.read(MARKER) == 0x43 && EEPROM.read(MARKER + 1) == 0x5A && EEPROM.read(MARKER + 2) == 2;
}
inline bool ready() { return modern() && EEPROM.read(MARKER + 3) == VALID; }
inline bool pending() { return modern() && !ready(); }
inline int expressionAddress() { return modern() ? EXPRESSION : 720; }
inline int usbAddress() { return modern() ? USB : 800; }
inline uint16_t crcByte(uint16_t crc, byte value) {
    crc ^= (unsigned int)value << 8;
    for (byte bit = 0; bit < 8; bit++) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    return crc;
}
}
#endif
