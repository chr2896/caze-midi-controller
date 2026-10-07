#include <Arduino.h>
#include <MIDI.h>
#include "executor/command-executor.h"
#include "config/command-type.h"
#include "consts.h"
#include "midi-instance.h"

CommandExecutor::CommandExecutor(MidiControllerConfig* config, Printer *printer) {
    this->config = config;
    this->printer = printer;
    this->toggleIterator = 0;
    this->prevPage = -1;
}

void CommandExecutor::init() {
    MIDI.begin();
}

void CommandExecutor::resetAfterConfiguration() {
    for (byte i = 0; i < 9; i++) this->externalValues[i] = -1;
    this->tapTempo.reset();
    this->lastWasTap = false;
    for (byte i = 0; i < TOGGLE_HISTORY_SIZE; i++) this->toggleKeys[i] = "";
    this->toggleIterator = 0;
    this->prevPage = -1;
    this->lastValue = 0;
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
    byte gestureIndex = (click & FootswitchState::LONG_CLICK) ? 1 : (click & FootswitchState::DOUBLE_CLICK) ? 2 : 0;
    byte externalIndex = (no - NUMBER_OF_FOOTSWITCHES) * 3 + gestureIndex;

    this->lastWasTap = this->config->isTapTempo(no, click);
    if (this->lastWasTap) {
        byte gesture = (click & FootswitchState::LONG_CLICK) ? 1 : (click & FootswitchState::DOUBLE_CLICK) ? 2 : 0;
        uint16_t source = ((no < NUMBER_OF_FOOTSWITCHES ? page * NUMBER_OF_FOOTSWITCHES + no : 18 + no - NUMBER_OF_FOOTSWITCHES) * 3 + gesture) * 16 + entity.channel;
        this->tapTempo.tap(millis(), source);
    }

    switch (entity.type) {
        case byte(CommandType::EXP_TOGGLE): {
            this->lastValue = this->config->toggleExpression();
            break;
        }
        case byte(CommandType::QUAD_PAGE): {
            this->prevPage = -1;
            this->config->setPage(page ^ 1);
            this->lastValue = this->config->getPage() ? 127 : 0;
            MIDI.sendControlChange(64, this->lastValue, entity.channel);
            break;
        }
        case byte(CommandType::NOTE): {
            MIDI.sendProgramChange(entity.value1, entity.channel); // after
            this->lastValue = 127;
            break;
        }

        case byte(CommandType::CC): {
            MIDI.sendControlChange(entity.value1, entity.value2, entity.channel);
            this->lastValue = entity.value2;
            break;
        }

        case byte(CommandType::TOGGLE_CC): {
            int lastValue = no >= NUMBER_OF_FOOTSWITCHES ? this->externalValues[externalIndex] : this->getLastValue(no, page);

            byte valueToSend = entity.value2 != lastValue
                ? entity.value2
                : entity.value3;

            MIDI.sendControlChange(entity.value1, valueToSend, entity.channel);
            if (no >= NUMBER_OF_FOOTSWITCHES) this->externalValues[externalIndex] = valueToSend;
            else this->saveToggleHistory(no, page, valueToSend);
            this->lastValue = valueToSend;
            break;
        }

        case byte(CommandType::NEXT_PAGE): {
            this->config->setPage(page + 1);
            break;
        }

        case byte(CommandType::PREV_PAGE): {
            this->config->setPage(page - 1);
            break;
        }

        case byte(CommandType::PAGE): {
            this->config->setPage(entity.value1);
            break;
        }

        case byte(CommandType::TEMP_PAGE): {
            this->prevPage = this->config->getPage();
            this->config->setPage(entity.value1);
            break;
        }
    }
}

byte CommandExecutor::getExecutedValue() {
    return this->lastValue;
}

void CommandExecutor::sendExternal(byte index, FootswitchState click) {
    if (index >= 3) return;
    byte no = NUMBER_OF_FOOTSWITCHES + index;
    if (this->config->getButtonData(no, click).type == CommandType::UNSET) return;
    int goBackToPage = this->getPrevPage();
    int sourcePage = this->config->getPage();
    bool syncPage = this->config->getButtonData(no, click).type == CommandType::QUAD_PAGE;
    this->executeCommand(no, click);
    if (this->lastWasTap) this->printer->tapInfo(no, click, this->tapTempo.bpm());
    else this->printer->commandInfo(no, click, this->lastValue, syncPage ? sourcePage : -1);
    if (goBackToPage >= 0 && !syncPage) { this->config->setPage(goBackToPage); }
}

void CommandExecutor::sendCommands(Footswitch* footswitches[]) {
    for (int i = 0; i < NUMBER_OF_FOOTSWITCHES; i++) {
        FootswitchState state = footswitches[i]->checkClicked();

        if (state & FootswitchState::ANY_CLICK) {
            int no = footswitches[i]->getNumber();

            int goBackToPage = this->getPrevPage();
            int sourcePage = this->config->getPage();
            bool syncPage = this->config->getButtonData(no, state).type == CommandType::QUAD_PAGE;
            this->executeCommand(no, state);
            if (this->lastWasTap) this->printer->tapInfo(no, state, this->tapTempo.bpm());
            else this->printer->commandInfo(no, state, this->getExecutedValue(), syncPage ? sourcePage : -1);

            if (goBackToPage >= 0 && !syncPage) {
                this->config->setPage(goBackToPage);
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
