#include <Arduino.h>
#include <EEPROM.h>
#include "storage-layout.h"
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
  if (Storage::pending()) return;
  
  int index = this->buttonAddress(no, click);
  

  EEPROM.write(index, button.channel);
  EEPROM.write(index + 1, button.type);
  EEPROM.write(index + 2, button.value1);
  EEPROM.write(index + 3, button.value2);
  EEPROM.write(index + 4, button.value3);
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
  return this->page * (Storage::modern() ? 30 : PAGE_SIZE) + no * BUTTON_SIZE + gesture * 90;
}

void MidiControllerConfig::getLabel(int no, FootswitchState click, char *label) {
  label[0] = 0;
  if (!Storage::ready()) return;
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
  int action = this->buttonAddress(no, click) / BUTTON_SIZE;
  return EEPROM.read(Storage::FLAGS + action / 8) & (1 << (action % 8));
}
