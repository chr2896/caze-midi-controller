#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include "controller-button-entity.h"
#include "footswitch/footswitch-state.h"
#include "command-type.h"

#define BUTTON_NO 6
#define PAGE_NO 3
#define PAGE_SIZE 48
#define BUTTON_SIZE 5
#define LONG_CLICK_BUFFER_START BUTTON_NO * PAGE_NO * BUTTON_SIZE
#define ACTIONS_NO 3
#define BUFFER_SIZE BUTTON_NO * BUTTON_SIZE * ACTIONS_NO * PAGE_NO

#define USB_MODE_EEPROM_ADDR 800

class MidiControllerConfig {

private:
  const int MAX_PAGES = PAGE_NO;

  int page;
  int buttonAddress(int no, FootswitchState click);

public:
  MidiControllerConfig();

  int getPage();
  void setPage(int page);
  
  ControllerButtonEntity getButtonData(int no, FootswitchState click);
  void setButton(int no, ControllerButtonEntity button, FootswitchState click);
  void getLabel(int no, FootswitchState click, char *label);
  bool useOnOff(int no, FootswitchState click);
  

  bool isInUsbMidiMode();
  void setUsbMidiMode(boolean enabled);
};

#endif
