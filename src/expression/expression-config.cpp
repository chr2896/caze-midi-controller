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
