#include <Arduino.h>
#include <EEPROM.h>
#include "external-config.h"
#include "storage-layout.h"

namespace ExternalConfig {
static byte read(byte offset) { return EEPROM.read(Storage::EXTERNAL_FOOTS + offset); }
static byte length(byte no, byte field) {
    byte offset = 1 + no * 6;
    return field == 0 ? read(offset + 4) >> 4 : field == 1 ? read(offset + 4) & 15 : read(offset + 5) & 15;
}
bool valid() {
    if (read(0) != 0xE3) return false;
    unsigned int crc = 0xFFFF;
    for (byte i = 0; i < 75; i++) crc = Storage::crcByte(crc, read(i));
    if (read(75) != (crc >> 8) || read(76) != (crc & 255)) return false;
    byte total = 0;
    for (byte no = 0; no < COUNT; no++) {
        byte offset = 1 + no * 6, type = read(offset) & 7;
        for (byte i = 1; i <= 3; i++) if (read(offset + i) > 127) return false;
        if ((type == 6 || type == 7) && read(offset + 1) > 2) return false;
        if (tapPolicy(no) > 2) return false;
        if (length(no, 0) > 12 || length(no, 1) > 10 || length(no, 2) > 10) return false;
        for (byte field = 0; field < 3; field++) total += length(no, field);
    }
    if (total > 56) return false;
    for (byte i = 0; i < total; i++) if (read(19 + i) < 32 || read(19 + i) > 126) return false;
    return true;
}
ControllerButtonEntity command(byte no) {
    byte offset = 1 + no * 6, packed = read(offset);
    return {byte((packed >> 4) + 1), byte(packed & 7), read(offset + 1), read(offset + 2), read(offset + 3)};
}
byte tapPolicy(byte no) { return read(6 + no * 6) >> 4; }
bool onOff(byte no) { return read(1 + no * 6) & 8; }
void text(byte no, byte field, char *out) {
    byte offset = 19;
    for (byte n = 0; n < no; n++) for (byte f = 0; f < 3; f++) offset += length(n, f);
    for (byte f = 0; f < field; f++) offset += length(no, f);
    byte size = length(no, field);
    for (byte i = 0; i < size; i++) out[i] = read(offset + i);
    out[size] = 0;
}
}
