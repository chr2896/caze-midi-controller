#include <Arduino.h>
#include <LiquidCrystal_I2C.h>

#include "configuration/configuration-state.h"
#include "config/command-type.h"
#include "footswitch/footswitch-state.h"
#include "printer.h"

#define MESSAGE_TIMEOUT 1500

Printer::Printer(MidiControllerConfig *config) : lcd(0x27, 20, 4) {
    this->config = config;
}

void Printer::init() {
  lcd.init();
  lcd.backlight();
}

void Printer::welcome(String revision) {
    this->lcd.setCursor(0, 0);
    this->lcd.print("MIDI CONTROLLER");
    this->lcd.setCursor(0, 1);
    this->lcd.print("REV. " + revision);
    delay(MESSAGE_TIMEOUT);
    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("PRESS ANY");
    this->lcd.setCursor(0, 1);
    this->lcd.print("FOOTSWITCH");
}

void Printer::enterConfiguration() {
    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("MIDI CONTROLLER");
    this->lcd.setCursor(0, 1);
    this->lcd.print("CONFIGURATION");
    delay(MESSAGE_TIMEOUT);
    this->lcd.clear();

    this->selectFootswitchPrompt();
}

void Printer::leaveConfiguration() {
    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("MIDI CONTROLLER");
    this->lcd.setCursor(0, 1);
    this->lcd.print("SAVED");
    delay(MESSAGE_TIMEOUT);
    this->lcd.clear();
}

void Printer::selectFootswitchPrompt() {
    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("SELECT");
    this->lcd.setCursor(0, 1);
    this->lcd.print("FOOTSWITCH");
}

void Printer::configurationPrompt(ConfigurationState state, byte value, CommandType commandType) {
    String line1;
    String line2;

    if (state == ConfigurationState::SELECT_CHANNEL) {
        line1 = "MIDI CHANNEL";
        line2 = String(value);
    } else if (state == ConfigurationState::SELECT_TYPE) {
        line1 = "COMMAND TYPE";
        line2 = this->valueToCommandTypeLabel(value);
    } else if (state == ConfigurationState::SELECT_VALUE1) {

        int offset = 0;

        if (commandType == CommandType::CC || commandType == CommandType::TOGGLE_CC) {
            line1 = "CC";
        } else if (commandType == CommandType::NOTE) {
            line1 = "PG";
        } else if (commandType == CommandType::PAGE || commandType == CommandType::TEMP_PAGE) {
            line1 = "PAGE";
            offset = 1;
        } else {
            line1 = "VALUE";
        }

        line2 = String(value + offset);
    } else if (state == ConfigurationState::SELECT_VALUE2) {
        line1 = "VALUE";
        line2 = String(value);
    } else if (state == ConfigurationState::SELECT_VALUE3) {
        line1 = "TOGGLE VALUE";
        line2 = String(value);
    } else {
        line1 = "ERROR - UNKNOWN";
        line2 = "STATE: " + String(state);
    }

    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print(line1);
    this->lcd.setCursor(0, 1);
    this->lcd.print(line2);
}

String Printer::valueToCommandTypeLabel(byte value) {
    switch (value) {
        case CommandType::UNSET:
            return "EMPTY";
        case CommandType::NOTE:
            return "PG";
        case CommandType::CC:
            return "CC";
        case CommandType::TOGGLE_CC:
            return "TOGGLE CC";
        case CommandType::NEXT_PAGE:
            return "NEXT PAGE";
        case CommandType::PREV_PAGE:
            return "PREV PAGE";
        case CommandType::PAGE:
            return "GO TO PAGE";
        case CommandType::TEMP_PAGE:
            return "TEMP PAGE";
        
        default:
            return "ERROR: UNKNOWN";
    }
}

String footswitchStateToTwoLetters(FootswitchState click) {
    if (click & FootswitchState::CLICK) {
        return "";
    }

    if (click & FootswitchState::LONG_CLICK) {
        return "LONG ";
    }

    if (click & FootswitchState::DOUBLE_CLICK) {
        return "DOUBLE ";
    }

    return "";
}

void Printer::commandInfo(int footswitchNo, FootswitchState click, byte lastValue) {

    ControllerButtonEntity btn = this->config->getButtonData(footswitchNo, click);
    int page = this->config->getPage();

    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print(footswitchStateToTwoLetters(click) + "FS " + String(footswitchNo + 1));
    this->lcd.setCursor(14, 0);
    this->lcd.print("P" + String(page + 1));
    this->lcd.setCursor(0, 1);

    if (btn.type == CommandType::CC) {
        this->lcd.print(F("CC "));
        this->lcd.print(btn.value1);
        this->lcd.print(' ');
        this->lcd.print(btn.value2);
    } else if (btn.type == CommandType::TOGGLE_CC) {
        this->lcd.print(F("CC "));
        this->lcd.print(btn.value1);
        this->lcd.print(' ');
        if (btn.value2 == lastValue) this->lcd.print('(');
        this->lcd.print(btn.value2);
        if (btn.value2 == lastValue) this->lcd.print(')');
        this->lcd.print(' ');
        if (btn.value3 == lastValue) this->lcd.print('(');
        this->lcd.print(btn.value3);
        if (btn.value3 == lastValue) this->lcd.print(')');
    } else if (
        btn.type == CommandType::PAGE || 
        btn.type == CommandType::NEXT_PAGE || 
        btn.type == CommandType::PREV_PAGE || 
        btn.type == CommandType::TEMP_PAGE) {

        this->lcd.print(F("GO TO PAGE "));
        this->lcd.print(page + 1);

    } else if (btn.type == CommandType::UNSET) {
        this->lcd.print(this->valueToCommandTypeLabel(CommandType::UNSET));
    } else if (btn.type == CommandType::NOTE) {
        this->lcd.print(F("PG "));
        this->lcd.print(btn.value1);
        this->lcd.print(' ');
        this->lcd.print(btn.value2);
    } else {
        this->lcd.print("EMPTY");
    }
    
}

void Printer::printConfigPage(MidiControllerConfig *config) {
    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("CURRENT");
    this->lcd.setCursor(0, 1);
    this->lcd.print("CONFIGURATION");
    delay(MESSAGE_TIMEOUT);

    for (int i = 0; i < BUTTON_NO; i++) {
        this->lcd.clear();
        this->commandInfo(i, FootswitchState::CLICK, 0);
        delay(MESSAGE_TIMEOUT);
    }

    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("LONG CLICK");
    this->lcd.setCursor(0, 1);
    this->lcd.print("CONFIGURATION");
    delay(MESSAGE_TIMEOUT);

    for (int i = 0; i < BUTTON_NO; i++) {
        this->lcd.clear();
        this->commandInfo(i, FootswitchState::LONG_CLICK, 0);
        delay(MESSAGE_TIMEOUT);
    }

    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("DOUBLE CLICK");
    this->lcd.setCursor(0, 1);
    this->lcd.print("CONFIGURATION");
    delay(MESSAGE_TIMEOUT);

    for (int i = 0; i < BUTTON_NO; i++) {
        this->lcd.clear();
        this->commandInfo(i, FootswitchState::DOUBLE_CLICK, 0);
        delay(MESSAGE_TIMEOUT);
    }

    this->lcd.clear();
}

void Printer::changeModeMessage(boolean inConfigurationMode) {
    if (inConfigurationMode) {
      this->enterConfiguration();
    } else {
      this->leaveConfiguration();
    }  
}

void Printer::usbMode(boolean enabled) {
    if (enabled) {
        this->lcd.clear();
        this->lcd.setCursor(0, 0);
        this->lcd.print("USB MODE");
        this->lcd.setCursor(0, 1);
        this->lcd.print("ENABLED");
    } else {
        this->lcd.clear();
        this->lcd.setCursor(0, 0);
        this->lcd.print("MIDI MODE");
        this->lcd.setCursor(0, 1);
        this->lcd.print("ENABLED");
    }

    delay(MESSAGE_TIMEOUT);
    this->lcd.clear();
}

void Printer::debug(String txt) {
    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print(txt);
    delay(500);
    this->lcd.clear();
}

void Printer::clickType(FootswitchState click) {
    this->lcd.clear();
    this->lcd.setCursor(0, 0);

    if (click & FootswitchState::CLICK) {
        this->lcd.print("CLICK");
    }

    if (click & FootswitchState::LONG_CLICK) {
        this->lcd.print("LONG CLICK");
    }

    if (click & FootswitchState::DOUBLE_CLICK) {
        this->lcd.print("DOUBLE CLICK");
    }

    delay(MESSAGE_TIMEOUT);
    this->lcd.clear();
    
}

void Printer::expressionPrompt(int state, byte value) {
    const char* labels[] = {
        "EXP ENABLE",
        "EXP CHANNEL",
        "EXP CC",
        "EXP MIN",
        "EXP MAX",
        "EXP REVERSE"
    };

    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print(labels[state]);

    this->lcd.setCursor(0, 1);
    if (state == 0 || state == 5) {
        this->lcd.print(value ? "ON" : "OFF");
    } else {
        this->lcd.print(String(value));
    }

    this->lcd.setCursor(0, 3);
    this->lcd.print("FS1-/FS2+ FS4=NEXT");
}

void Printer::expressionSaved() {
    this->lcd.clear();
    this->lcd.setCursor(0, 0);
    this->lcd.print("EXPRESSION");
    this->lcd.setCursor(0, 1);
    this->lcd.print("SAVED");
    delay(MESSAGE_TIMEOUT);
    this->lcd.clear();
}
