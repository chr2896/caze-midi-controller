#include <Arduino.h>
#include <EEPROM.h>
#include "expression-config.h"
#include "config/storage-layout.h"

#define EXP_MAGIC 0xA5

ExpressionConfig::ExpressionConfig() {
    this->enabled = false;
    this->channel = 1;
    this->cc = 11;
    this->minValue = 0;
    this->maxValue = 127;
    this->reversed = false;
    this->load();
}

void ExpressionConfig::load() {
    this->loadCalibration();
    if (Storage::pending()) { this->enabled = false; return; }
    if (EEPROM.read(Storage::expressionAddress()) != EXP_MAGIC) {
        // First boot after installing the modified firmware.
        // Keep expression disabled until the user enables/configures it.
        this->enabled = false;
        this->channel = 1;
        this->cc = 11;
        this->minValue = 0;
        this->maxValue = 127;
        this->reversed = false;
        this->save();
        return;
    }

    this->enabled = EEPROM.read(Storage::expressionAddress() + 1);
    this->channel = EEPROM.read(Storage::expressionAddress() + 2);
    this->cc = EEPROM.read(Storage::expressionAddress() + 3);
    this->minValue = EEPROM.read(Storage::expressionAddress() + 4);
    this->maxValue = EEPROM.read(Storage::expressionAddress() + 5);
    this->reversed = EEPROM.read(Storage::expressionAddress() + 6);
}

void ExpressionConfig::loadCalibration() {
    heel = 0;
    toe = 1023;
    const int base = Storage::CALIBRATION;
    if (EEPROM.read(base + 6) != 0xC7) return;
    uint16_t crc = 0xFFFF;
    for (byte i = 0; i < 4; i++) crc = Storage::crcByte(crc, EEPROM.read(base + i));
    if (EEPROM.read(base + 4) != (crc & 255) || EEPROM.read(base + 5) != (crc >> 8)) return;
    int storedHeel = EEPROM.read(base) | (EEPROM.read(base + 1) << 8);
    int storedToe = EEPROM.read(base + 2) | (EEPROM.read(base + 3) << 8);
    if (storedHeel < 0 || storedHeel > 1023 || storedToe < 0 || storedToe > 1023 || abs(storedToe - storedHeel) < 32) return;
    heel = storedHeel;
    toe = storedToe;
}

bool ExpressionConfig::calibrate(int heelValue, int toeValue) {
    if (Storage::pending() || heelValue < 0 || heelValue > 1023 || toeValue < 0 || toeValue > 1023 || abs(toeValue - heelValue) < 32) return false;
    byte values[4] = {byte(heelValue), byte(heelValue >> 8), byte(toeValue), byte(toeValue >> 8)};
    const int base = Storage::CALIBRATION;
    EEPROM.update(base + 6, 0); // Invalidate until all endpoints and CRC are written.
    uint16_t crc = 0xFFFF;
    for (byte i = 0; i < 4; i++) {
        EEPROM.update(base + i, values[i]);
        crc = Storage::crcByte(crc, values[i]);
    }
    EEPROM.update(base + 4, crc & 255);
    EEPROM.update(base + 5, crc >> 8);
    EEPROM.update(base + 6, 0xC7);
    heel = heelValue;
    toe = toeValue;
    return true;
}

void ExpressionConfig::save() {
    if (Storage::pending()) return;
    EEPROM.update(Storage::expressionAddress(), EXP_MAGIC);
    EEPROM.update(Storage::expressionAddress() + 1, this->enabled ? 1 : 0);
    EEPROM.update(Storage::expressionAddress() + 2, this->channel);
    EEPROM.update(Storage::expressionAddress() + 3, this->cc);
    EEPROM.update(Storage::expressionAddress() + 4, this->minValue);
    EEPROM.update(Storage::expressionAddress() + 5, this->maxValue);
    EEPROM.update(Storage::expressionAddress() + 6, this->reversed ? 1 : 0);
}

bool ExpressionConfig::isEnabled() { return this->enabled; }
byte ExpressionConfig::getChannel() { return this->channel; }
byte ExpressionConfig::getCC() { return this->cc; }
byte ExpressionConfig::getMinValue() { return this->minValue; }
byte ExpressionConfig::getMaxValue() { return this->maxValue; }
bool ExpressionConfig::isReversed() { return this->reversed; }

void ExpressionConfig::setEnabled(bool value) { this->enabled = value; }
void ExpressionConfig::setChannel(byte value) { this->channel = constrain(value, 1, 16); }
void ExpressionConfig::setCC(byte value) { this->cc = constrain(value, 0, 127); }
void ExpressionConfig::setMinValue(byte value) { this->minValue = constrain(value, 0, 127); }
void ExpressionConfig::setMaxValue(byte value) { this->maxValue = constrain(value, 0, 127); }
void ExpressionConfig::setReversed(bool value) { this->reversed = value; }
