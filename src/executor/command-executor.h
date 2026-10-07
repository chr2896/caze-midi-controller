#ifndef COMMAND_EXECUTOR_H
#define COMMAND_EXECUTOR_H

#include <Arduino.h>
#include <MIDI.h>
#include "config/controller-button-entity.h"
#include "config/midi-controller-config.h"
#include "footswitch/footswitch.h"
#include "footswitch/footswitch-state.h"
#include "printer/printer.h"
#include "tap-tempo.h"

#define TOGGLE_HISTORY_SIZE 20

class CommandExecutor {
    private:
        MidiControllerConfig *config;
        Printer *printer;

        int toggleIterator;
        String toggleKeys[TOGGLE_HISTORY_SIZE];
        byte toggleValues[TOGGLE_HISTORY_SIZE];

        int getLastValue(int no, int page);
        String composeKey(int no, int page);
        void saveToggleHistory(int no, int page, byte value);
        byte lastValue;
        int prevPage;
        TapTempo tapTempo;
        bool lastWasTap = false;
        int8_t externalValues[9] = {-1, -1, -1, -1, -1, -1, -1, -1, -1};

    public:
        CommandExecutor(MidiControllerConfig* config, Printer *printer);
        void init();
        void executeCommand(int no, FootswitchState click);
        void sendCommands(Footswitch* footswitches[]);
        void sendExternal(byte index, FootswitchState click = FootswitchState::CLICK);
        byte getExecutedValue();
        int getPrevPage();
        void resetAfterConfiguration();
};

#endif
