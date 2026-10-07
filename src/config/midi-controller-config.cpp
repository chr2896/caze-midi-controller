#include <Arduino.h>
#include <EEPROM.h>
#include "storage-layout.h"
#include "external-config.h"
#include "internal-text.h"
#include "midi-controller-config.h"
#include "footswitch/footswitch-state.h"

MidiControllerConfig::MidiControllerConfig() {
  this->page = 0;
}

int MidiControllerConfig::getPage() {
  return this->page;
}

ControllerButtonEntity MidiControllerConfig::getButtonData(int no, FootswitchState click) {
  if (Storage::pending()) return {1, 0, 0, 0, 0};
  if (no >= BUTTON_NO && !Storage::unified()) return no < BUTTON_NO + 3 && click == FootswitchState::CLICK && externalReady ? ExternalConfig::command(no - BUTTON_NO) : ControllerButtonEntity{1, 0, 0, 0, 0};

  int index = this->buttonAddress(no, click);

  ControllerButtonEntity button = {
    EEPROM.read(index),
    EEPROM.read(index + 1),
    EEPROM.read(index + 2),
    EEPROM.read(index + 3),
    EEPROM.read(index + 4),
  };

  return button;
}

void MidiControllerConfig::setButton(int no, ControllerButtonEntity button, FootswitchState click) {
  if (Storage::pending() || no >= BUTTON_NO) return;
  
  int index = this->buttonAddress(no, click);
  

  EEPROM.write(index, button.channel);
  EEPROM.write(index + 1, button.type);
  EEPROM.write(index + 2, button.value1);
  EEPROM.write(index + 3, button.value2);
  EEPROM.write(index + 4, button.value3);
  reloadExternal();
}

void MidiControllerConfig::setPage(int page) {
  this->page = page % PAGE_NO;

  if (this->page < 0) {
    this->page = PAGE_NO - 1;
  }
}


boolean MidiControllerConfig::isInUsbMidiMode() {
  return Storage::pending() || EEPROM.read(Storage::usbAddress());
}

void MidiControllerConfig::setUsbMidiMode(boolean enabled) {
  EEPROM.update(Storage::usbAddress(), enabled ? 1 : 0);
}

int MidiControllerConfig::buttonAddress(int no, FootswitchState click) {
  int gesture = (click & FootswitchState::LONG_CLICK) ? 1 : (click & FootswitchState::DOUBLE_CLICK) ? 2 : 0;
  if (Storage::unified()) return (no >= BUTTON_NO ? 36 + (no - BUTTON_NO) * 3 + gesture : gesture * 12 + page * 6 + no) * 5;
  return this->page * (Storage::modern() ? 30 : PAGE_SIZE) + no * BUTTON_SIZE + gesture * 90;
}

void MidiControllerConfig::getLabel(int no, FootswitchState click, char *label) {
  label[0] = 0;
  if (!Storage::ready()) return;
  if (no >= BUTTON_NO && !Storage::unified()) {
    if (no < BUTTON_NO + 3 && externalReady) ExternalConfig::text(no - BUTTON_NO, 0, label);
    return;
  }
  if (InternalText::packed()) { InternalText::text(buttonAddress(no, click) / BUTTON_SIZE, 0, label); return; }
  int address = Storage::LABELS + (this->buttonAddress(no, click) / BUTTON_SIZE) * 12;
  for (byte i = 0; i < 12; i++) {
    byte value = EEPROM.read(address + i);
    label[i] = (value >= 32 && value <= 126) ? value : 0;
    if (!label[i]) return;
  }
  label[12] = 0;
}

bool MidiControllerConfig::useOnOff(int no, FootswitchState click) {
  if (!Storage::ready()) return false;
  if (no >= BUTTON_NO && !Storage::unified()) return no < BUTTON_NO + 3 && externalReady && ExternalConfig::onOff(no - BUTTON_NO);
  int action = this->buttonAddress(no, click) / BUTTON_SIZE;
  return EEPROM.read(Storage::FLAGS + action / 8) & (1 << (action % 8));
}

void MidiControllerConfig::reloadExternal() {
  externalReady = Storage::ready() && !Storage::unified() && ExternalConfig::valid();
  expressionMode = 0;
  if (Storage::ready() && Storage::unified()) {
    for (byte i = 0; i < 45; i++) if (EEPROM.read(i * 5 + 1) == CommandType::EXP_TOGGLE) { expressionMode = 1; break; }
  }
}

void MidiControllerConfig::getExternalState(int no, byte value, char *label) {
  label[0] = 0;
  if (!externalReady || no < BUTTON_NO || no >= BUTTON_NO + 3) return;
  ControllerButtonEntity button = ExternalConfig::command(no - BUTTON_NO);
  ExternalConfig::text(no - BUTTON_NO, value == button.value2 ? 1 : 2, label);
}

bool MidiControllerConfig::isTapTempo(int no, FootswitchState click) {
  ControllerButtonEntity btn = getButtonData(no, click);
  if (btn.type != CommandType::CC && btn.type != CommandType::TOGGLE_CC) return false;
  byte policy = 0;
  if (Storage::ready()) {
    if (no >= BUTTON_NO && !Storage::unified() && externalReady) policy = ExternalConfig::tapPolicy(no - BUTTON_NO);
    else if (InternalText::packed()) policy = InternalText::tapPolicy(buttonAddress(no, click) / BUTTON_SIZE);
  }
  return policy ? policy == 1 : no < BUTTON_NO && btn.value1 == 42;
}
bool MidiControllerConfig::hasStateText(int no, FootswitchState click) {
  if (!Storage::ready()) return false;
  if (no >= BUTTON_NO) return true;
  byte action = buttonAddress(no, click) / BUTTON_SIZE;
  return InternalText::packed() && (InternalText::length(action, 1) || InternalText::length(action, 2));
}
void MidiControllerConfig::getState(int no, FootswitchState click, byte value, char *label) {
  label[0] = 0;
  if (no >= BUTTON_NO && !Storage::unified()) { getExternalState(no, value, label); return; }
  if (!Storage::ready() || !InternalText::packed()) return;
  InternalText::text(buttonAddress(no, click) / BUTTON_SIZE, value == getButtonData(no, click).value2 ? 1 : 2, label);
}

byte MidiControllerConfig::externalGestures(byte no) {
  byte mask = 0;
  if (getButtonData(no, FootswitchState::LONG_CLICK).type != CommandType::UNSET) mask |= 1;
  if (getButtonData(no, FootswitchState::DOUBLE_CLICK).type != CommandType::UNSET) mask |= 2;
  return mask;
}
