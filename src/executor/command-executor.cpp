#include <Arduino.h>
#include <MIDI.h>
#include "executor/command-executor.h"
#include "config/command-type.h"
#include "consts.h"
#include "midi-instance.h"

CommandExecutor::CommandExecutor(MidiControllerConfig* config, Printer *printer, LedController *ledController) {
    this->config = config;
    this->printer = printer;
    this->ledController = ledController;
    this->toggleIterator = 0;
    this->prevPage = -1;
}

void CommandExecutor::init() {
    MIDI.begin();
}

void CommandExecutor::resetAfterConfiguration() {
    for (byte i = 0; i < TOGGLE_HISTORY_SIZE; i++) this->toggleKeys[i] = "";
    this->toggleIterator = 0;
    this->prevPage = -1;
    this->lastValue = 0;
    this->ledController->allOff();
}

int CommandExecutor::getLastValue(int no, int page) {
    String key = this->composeKey(no, page);
    int keyIndex = -1;

    for (int i = 0; i < TOGGLE_HISTORY_SIZE; i++) {
        if (this->toggleKeys[i] == key) {
            keyIndex = i;
        }
    }

    if (keyIndex >= 0) {
        return this->toggleValues[keyIndex];
    } else {
        return -1;
    }
}

String CommandExecutor::composeKey(int no, int page) {
    return String(page) + 'x' + String(no);
}

void CommandExecutor::saveToggleHistory(int no, int page, byte value) {
    String key = this->composeKey(no, page);
    for (int i = 0; i < TOGGLE_HISTORY_SIZE; i++) {
        if (this->toggleKeys[i] == key) {
            this->toggleValues[i] = value;
            return;        
        }
    }

    this->toggleKeys[this->toggleIterator] = key;
    this->toggleValues[this->toggleIterator] = value;
    this->toggleIterator = (this->toggleIterator + 1) % TOGGLE_HISTORY_SIZE;
}

void CommandExecutor::executeCommand(int no, FootswitchState click) {
    ControllerButtonEntity entity = this->config->getButtonData(no, click);
    int page = this->config->getPage();

    switch (entity.type) {
        case byte(CommandType::NOTE): {
            MIDI.sendProgramChange(entity.value1, entity.channel); // after
            this->lastValue = 127;
            this->ledController->set(no, true);
            break;
        }

        case byte(CommandType::CC): {
            MIDI.sendControlChange(entity.value1, entity.value2, entity.channel);
            this->lastValue = entity.value2;
            // A normal CC remains lit after its most recent activation.
            this->ledController->set(no, true);
            break;
        }

        case byte(CommandType::TOGGLE_CC): {
            int lastValue = this->getLastValue(no, page);

            byte valueToSend = entity.value2 != lastValue 
                ? entity.value2 
                : entity.value3;

            MIDI.sendControlChange(entity.value1, valueToSend, entity.channel);
            this->saveToggleHistory(no, page, valueToSend);
            this->lastValue = valueToSend;
            // For TOGGLE CC, value2 is treated as the ON value and value3 as OFF.
            this->ledController->set(no, valueToSend == entity.value2);
            break;
        }

        case byte(CommandType::NEXT_PAGE): {
            this->config->setPage(page + 1);
            this->syncPageLeds();
            break;
        }

        case byte(CommandType::PREV_PAGE): {
            this->config->setPage(page - 1);
            this->syncPageLeds();
            break;
        }

        case byte(CommandType::PAGE): {
            this->config->setPage(entity.value1);
            this->syncPageLeds();
            break;
        }

        case byte(CommandType::TEMP_PAGE): {
            this->prevPage = this->config->getPage();
            this->config->setPage(entity.value1);
            this->syncPageLeds();
            break;
        }
    }
}

byte CommandExecutor::getExecutedValue() {
    return this->lastValue;
}

void CommandExecutor::sendCommands(Footswitch* footswitches[]) {
    for (int i = 0; i < NUMBER_OF_FOOTSWITCHES; i++) {
        FootswitchState state = footswitches[i]->checkClicked();

        if (state & FootswitchState::ANY_CLICK) {
            int no = footswitches[i]->getNumber();

            int goBackToPage = this->getPrevPage();
            
            this->executeCommand(no, state);
            this->printer->commandInfo(no, state, this->getExecutedValue());

            if (goBackToPage >= 0) {
                this->config->setPage(goBackToPage);
                this->syncPageLeds();
            }

            return;
        }
    }
}

int CommandExecutor::getPrevPage() {
    int result = this->prevPage;
    this->prevPage = -1;
    return result;
}

void CommandExecutor::syncPageLeds() {
    this->ledController->allOff();

    int page = this->config->getPage();
    for (int no = 0; no < NUMBER_OF_FOOTSWITCHES; no++) {
        ControllerButtonEntity entity = this->config->getButtonData(no, FootswitchState::CLICK);
        if (entity.type == CommandType::TOGGLE_CC) {
            int lastValue = this->getLastValue(no, page);
            if (lastValue == entity.value2) {
                this->ledController->set(no, true);
            }
        }
    }
}
