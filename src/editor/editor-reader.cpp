#include <Arduino.h>
#include <EEPROM.h>
#include "editor-reader.h"
#include "config/midi-controller-config.h"

namespace {
byte request[7];
byte count = 0;
bool receiving = false;
unsigned long lastByte = 0;
byte checksum;

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

void respond() {
    if (count != sizeof(request) || request[0] != 0x7D || request[1] != 0x43 ||
        request[2] != 0x5A || request[3] != 1 || request[5] == 0 ||
        request[6] != ((request[4] + request[5]) & 0x7F)) return;

    if (request[4] == 1) {
        beginResponse(0x41, request[5]);
        sendByte(PAGE_NO);
        sendByte(BUTTON_NO);
        sendByte(ACTIONS_NO);
        sendByte(PAGE_SIZE);
        sendByte(LONG_CLICK_BUFFER_START);
        sendByte(BUTTON_SIZE);
        sendByte(1); // Capabilities: read only. Legacy EEPROM layout.
    } else if (request[4] == 2) {
        beginResponse(0x42, request[5]);
        // Stream directly to UART: no 1 KB copy in the Nano's limited RAM.
        // One uninterrupted response prevents MIDI bytes splitting the snapshot.
        for (unsigned int address = 0; address < EEPROM.length(); address++) {
            sendByte(EEPROM.read(address));
        }
    } else return;
    Serial.write(checksum);
    Serial.write(0xF7);
}
}

void updateEditorReader() {
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
