#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include "controller-button-entity.h"
#include "footswitch/footswitch-state.h"
#include "command-type.h"

#define BUTTON_NO 6
#define PAGE_NO 2
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
  byte expressionMode = 0;
  int buttonAddress(int no, FootswitchState click);
  bool externalReady = false;

public:
  MidiControllerConfig();

  int getPage();
  byte getExpressionMode() const { return expressionMode; }
  byte toggleExpression() { expressionMode = expressionMode == 2 ? 1 : 2; return expressionMode; }
  byte externalGestures(byte no);
  void setPage(int page);
  
  ControllerButtonEntity getButtonData(int no, FootswitchState click);
  void setButton(int no, ControllerButtonEntity button, FootswitchState click);
  void getLabel(int no, FootswitchState click, char *label);
  bool useOnOff(int no, FootswitchState click);
  void reloadExternal();
  bool isTapTempo(int no, FootswitchState click);
  bool hasStateText(int no, FootswitchState click);
  void getState(int no, FootswitchState click, byte value, char *label);
  void getExternalState(int no, byte value, char *label);
  

  bool isInUsbMidiMode();
  void setUsbMidiMode(boolean enabled);
};

#endif
