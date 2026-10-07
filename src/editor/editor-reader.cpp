#include <Arduino.h>
#include <EEPROM.h>
#include "editor-reader.h"
#include "config/midi-controller-config.h"
#include "config/storage-layout.h"
#include "config/external-config.h"
#include "config/internal-text.h"

namespace {
byte request[43]; // Header + 18 decoded payload bytes encoded as nibbles + checksum.
byte count = 0;
bool receiving = false;
unsigned long lastByte = 0;
byte checksum;
bool writing = false;

bool saved = false;
bool writesAllowed = false;
unsigned int nextAddress = 0;
unsigned int expectedCrc = 0;
unsigned int imageSize = Storage::IMAGE_SIZE;

void beginResponse(byte command, byte sequence) {
    Serial.write(0xF0);
    Serial.write(0x7D); // Non-commercial SysEx identifier.
    Serial.write(0x43);
    Serial.write(0x5A);
    Serial.write(1);
    Serial.write(command);
    Serial.write(sequence);
    checksum = (command + sequence) & 0x7F;
}

void sendByte(byte value) {
    Serial.write(value >> 4);
    Serial.write(value & 0x0F);
    checksum = (checksum + value) & 0x7F;
}

bool validImage() {
    unsigned int crc = 0xFFFF;
    for (unsigned int address = 0; address < imageSize; address++) crc = Storage::crcByte(crc, EEPROM.read(Storage::imageAddress(address)));
    if (crc != expectedCrc) return false;

    for (int address = 0; address < 225; address += 5) {
        byte channel = EEPROM.read(address), type = EEPROM.read(address + 1);
        if (channel < 1 || channel > 16 || type > 9) return false;
        for (byte i = 2; i < 5; i++) if (EEPROM.read(address + i) > 127) return false;
        if ((type == 6 || type == 7) && EEPROM.read(address + 2) > 1) return false;
    }
    if (EEPROM.read(925) != 0xA4 || !InternalText::valid()) return false;
    if (EEPROM.read(923) & 0xE0 || EEPROM.read(924)) return false;
    return !(EEPROM.read(924) & 0xC0) && EEPROM.read(928) == 0xA5 &&
        EEPROM.read(929) <= 1 && EEPROM.read(930) >= 1 && EEPROM.read(930) <= 16 &&
        EEPROM.read(931) <= 127 && EEPROM.read(932) <= 127 && EEPROM.read(933) <= 127 &&
        EEPROM.read(934) <= 1 && EEPROM.read(935) == 1;
}

void respond() {
    if (count < 7 || (count - 7) % 2 || request[0] != 0x7D || request[1] != 0x43 ||
        request[2] != 0x5A || request[3] != 1 || request[5] == 0) return;
    byte payloadSize = (count - 7) / 2;
    byte sum = (request[4] + request[5]) & 0x7F;
    // Decode in place, retaining the command and sequence in bytes 4 and 5.
    byte suppliedChecksum = request[count - 1];
    for (byte i = 0; i < payloadSize; i++) {
        byte high = request[6 + i * 2], low = request[7 + i * 2];
        if (high > 15 || low > 15) return;
        request[6 + i] = (high << 4) | low;
        sum = (sum + request[6 + i]) & 0x7F;
    }
    if (sum != suppliedChecksum) return;

    if (request[4] == 1 && payloadSize == 0) {
        beginResponse(0x41, request[5]);
        sendByte(PAGE_NO);
        sendByte(BUTTON_NO);
        sendByte(ACTIONS_NO);
        sendByte(Storage::modern() ? 30 : PAGE_SIZE);
        sendByte(LONG_CLICK_BUFFER_START);
        sendByte(BUTTON_SIZE);
        sendByte(31); // Read, write, external switches, packed texts/tap policy.
    } else if (request[4] == 2 && payloadSize == 0) {
        beginResponse(0x42, request[5]);
        // Stream directly to UART: no 1 KB copy in the Nano's limited RAM.
        // One uninterrupted response prevents MIDI bytes splitting the snapshot.
        for (unsigned int address = 0; address < EEPROM.length(); address++) {
            sendByte(EEPROM.read(address));
        }
    } else if (request[4] == 3 && (payloadSize == 2 || payloadSize == 4 || payloadSize == 5)) {
        unsigned int requestedSize = payloadSize == 2 ? Storage::IMAGE_SIZE : ((unsigned int)request[8] << 8) | request[9];
        if (payloadSize != 5 || request[10] != 4 || requestedSize != Storage::IMAGE_SIZE) {
            beginResponse(0x43, request[5]); sendByte(1);
            Serial.write(checksum); Serial.write(0xF7);
            return;
        }
        if (!writesAllowed) {
            beginResponse(0x43, request[5]); sendByte(2);
            Serial.write(checksum); Serial.write(0xF7);
            return;
        }
        expectedCrc = ((unsigned int)request[6] << 8) | request[7];
        imageSize = requestedSize;
        // Mark incomplete before touching configuration bytes. Reboot forces USB recovery.
        EEPROM.update(Storage::MARKER + 3, Storage::PENDING);
        EEPROM.update(Storage::MARKER, 0x43);
        EEPROM.update(Storage::MARKER + 1, 0x5A);
        EEPROM.update(Storage::MARKER + 2, 3);
        nextAddress = 0;
        writing = true;
        beginResponse(0x43, request[5]); sendByte(0);
    } else if (request[4] == 4 && payloadSize >= 3) {
        unsigned int address = ((unsigned int)request[6] << 8) | request[7];
        byte length = payloadSize - 2;
        byte status = 1;
        if (writing && address == nextAddress && address + length <= imageSize) {
            for (byte i = 0; i < length; i++) EEPROM.update(Storage::imageAddress(address + i), request[8 + i]);
            nextAddress += length;
            status = 0;
        }
        beginResponse(0x44, request[5]); sendByte(status);
    } else if (request[4] == 5 && payloadSize == 0) {
        byte status = 1;
        if (writing && nextAddress == imageSize && validImage()) {
            EEPROM.update(Storage::MARKER + 3, Storage::VALID);
            writing = false;
            saved = true;
            status = 0;
        }
        beginResponse(0x45, request[5]); sendByte(status);
    } else return;
    Serial.write(checksum);
    Serial.write(0xF7);
}

}

bool editorStoragePending() { return Storage::pending(); }
bool editorTakeSaved() { bool result = saved; saved = false; return result; }

void updateEditorReader(bool allowWrites) {
    writesAllowed = allowWrites;
    if (receiving && millis() - lastByte > 250) receiving = false;
    // Bound receive work so unrelated traffic cannot starve footswitch scanning.
    for (byte consumed = 0; consumed < 16 && Serial.available(); consumed++) {
        byte value = Serial.read();
        if (value >= 0xF8) continue; // MIDI realtime can appear between bytes.
        lastByte = millis();
        if (value == 0xF0) { receiving = true; count = 0; }
        else if (value == 0xF7) {
            if (receiving) respond();
            receiving = false;
        } else if (receiving) {
            if (value >= 0x80 || count >= sizeof(request)) receiving = false;
            else request[count++] = value;
        }
    }
}
