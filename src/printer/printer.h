#ifndef PRINTER_H
#define PRINTER_H

#include <Arduino.h>
#include <LiquidCrystal_I2C.h>
#include "configuration/configuration-state.h"
#include "config/controller-button-entity.h"
#include "config/midi-controller-config.h"
#include "config/command-type.h"

class Printer {
    private:
        String valueToCommandTypeLabel(byte value);
        LiquidCrystal_I2C lcd;
        MidiControllerConfig *config;
        int displayedExpression = -3;
        void clearDisplay();
        void toggleValue(byte value, byte activeValue, bool customOnOff = false, byte offValue = 0);

    public:
        Printer(MidiControllerConfig *config);
        void init();
        void welcome(String revision);
        void enterConfiguration();
        void leaveConfiguration();
        void selectFootswitchPrompt();
        void configurationPrompt(ConfigurationState state, byte value, CommandType commandType);
        void commandInfo(int footswitchNo, FootswitchState click, byte lastValue);
        void printConfigPage(MidiControllerConfig *config);
        void changeModeMessage(boolean inConfigurationMode);
        void usbMode(boolean enabled);
        void debug(String txt);
        void clickType(FootswitchState click);
        void expressionPrompt(int state, byte value);
        void expressionSaved();
        void expressionStatus(bool enabled, int midiValue);
        void editorRecovery();
};

#endif
