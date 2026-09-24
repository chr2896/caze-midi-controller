#ifndef COMMAND_EXECUTOR_H
#define COMMAND_EXECUTOR_H

#include <Arduino.h>
#include <MIDI.h>
#include "config/controller-button-entity.h"
#include "config/midi-controller-config.h"
#include "footswitch/footswitch.h"
#include "footswitch/footswitch-state.h"
#include "printer/printer.h"
#include "led/led-controller.h"

#define TOGGLE_HISTORY_SIZE 20

class CommandExecutor {
    private:
        MidiControllerConfig *config;
        Printer *printer;
        LedController *ledController;

        int toggleIterator;
        String toggleKeys[TOGGLE_HISTORY_SIZE];
        byte toggleValues[TOGGLE_HISTORY_SIZE];

        int getLastValue(int no, int page);
        String composeKey(int no, int page);
        void saveToggleHistory(int no, int page, byte value);
        byte lastValue;
        int prevPage;

    public:
        CommandExecutor(MidiControllerConfig* config, Printer *printer, LedController *ledController);
        void init();
        void executeCommand(int no, FootswitchState click);
        void sendCommands(Footswitch* footswitches[]);
        byte getExecutedValue();
        int getPrevPage();
        void syncPageLeds();
};

#endif