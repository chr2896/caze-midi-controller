#include <EEPROM.h>
#include "internal-text.h"
#include "storage-layout.h"
namespace InternalText {
bool packed() { return EEPROM.read(FORMAT_ADDRESS) == FORMAT || EEPROM.read(FORMAT_ADDRESS) == 0xA4; }
byte length(byte action, byte field) {
    byte a = EEPROM.read(270 + action * 2), b = EEPROM.read(271 + action * 2);
    return field == 0 ? a >> 4 : field == 1 ? a & 15 : b & 15;
}
byte tapPolicy(byte action) { return EEPROM.read(271 + action * 2) >> 4; }
bool valid() {
    unsigned int size = 0;
    for (byte a = 0; a < (Storage::unified() ? 45 : 54); a++) {
        if (length(a, 0) > 12 || length(a, 1) > 10 || length(a, 2) > 10 || tapPolicy(a) > 2) return false;
        for (byte f = 0; f < 3; f++) size += length(a, f);
    }
    unsigned int start = Storage::unified() ? 360 : 378;
    if (size > 918 - start) return false;
    for (unsigned int i = start; i < start + size; i++) if (EEPROM.read(i) < 32 || EEPROM.read(i) > 126) return false;
    return true;
}
void text(byte action, byte field, char *out) {
    unsigned int address = Storage::unified() ? 360 : 378;
    for (byte a = 0; a < action; a++) for (byte f = 0; f < 3; f++) address += length(a, f);
    for (byte f = 0; f < field; f++) address += length(action, f);
    byte size = length(action, field);
    out[0] = 0;
    if (size > 12 || address + size > 918) return;
    for (byte i = 0; i < size; i++) out[i] = EEPROM.read(address + i);
    out[size] = 0;
}
}
