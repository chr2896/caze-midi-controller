#include <Arduino.h>
#include "expression-configurator.h"
#include "consts.h"

ExpressionConfigurator::ExpressionConfigurator(ExpressionConfig* config, Printer* printer, ExpressionController* controller) {
    this->config = config;
    this->printer = printer;
    this->controller = controller;
    this->active = false;
    this->state = EXP_SELECT_ENABLED;
    this->value = 0;
}

void ExpressionConfigurator::start() {
    this->active = true;
    this->state = EXP_SELECT_ENABLED;
    this->value = this->config->isEnabled() ? 1 : 0;
    this->show();
}

bool ExpressionConfigurator::isActive() {
    return this->active;
}

void ExpressionConfigurator::show() {
    this->printer->expressionPrompt(this->state, this->value);
}

void ExpressionConfigurator::increment() {
    byte maxValue = 127;
    if (this->state == EXP_SELECT_ENABLED || this->state == EXP_SELECT_REVERSE || this->state == EXP_CALIBRATE) maxValue = 1;
    else if (this->state == EXP_SELECT_CHANNEL) maxValue = 16;

    this->value++;
    if (this->value > maxValue) this->value = 0;
}

void ExpressionConfigurator::decrement() {
    byte maxValue = 127;
    if (this->state == EXP_SELECT_ENABLED || this->state == EXP_SELECT_REVERSE || this->state == EXP_CALIBRATE) maxValue = 1;
    else if (this->state == EXP_SELECT_CHANNEL) maxValue = 16;

    if (this->value == 0) this->value = maxValue;
    else this->value--;
}

void ExpressionConfigurator::next() {
    switch (this->state) {
        case EXP_SELECT_ENABLED: config->setEnabled(this->value); break;
        case EXP_SELECT_CHANNEL: config->setChannel(this->value); break;
        case EXP_SELECT_CC: config->setCC(this->value); break;
        case EXP_SELECT_MIN: config->setMinValue(this->value); break;
        case EXP_SELECT_MAX: config->setMaxValue(this->value); break;
        case EXP_SELECT_REVERSE:
            config->setReversed(this->value);
            break;
        case EXP_CALIBRATE:
            if (!value) { finish(); return; }
            state = EXP_HEEL;
            show();
            return;
        case EXP_HEEL:
        case EXP_TOE:
            return; // Captures are handled by process(), not menu increments.
    }

    state = static_cast<ExpressionConfigState>(state + 1);

    switch (state) {
        case EXP_SELECT_ENABLED: value = config->isEnabled(); break;
        case EXP_SELECT_CHANNEL: value = config->getChannel(); break;
        case EXP_SELECT_CC: value = config->getCC(); break;
        case EXP_SELECT_MIN: value = config->getMinValue(); break;
        case EXP_SELECT_MAX: value = config->getMaxValue(); break;
        case EXP_SELECT_REVERSE: value = config->isReversed(); break;
        case EXP_CALIBRATE: value = 0; break;
        case EXP_HEEL:
        case EXP_TOE:
            break;
    }
    show();
}

void ExpressionConfigurator::finish() {
    config->save();
    controller->reset();
    printer->expressionSaved();
    active = false;
}

void ExpressionConfigurator::process(Footswitch* footswitches[]) {
    if (!active) return;

    FootswitchState inc = footswitches[FS_CONFIG_INCREMENT]->checkClicked();
    FootswitchState dec = footswitches[FS_CONFIG_DECREMENT]->checkClicked();
    FootswitchState nextState = footswitches[FS_CONFIG_NEXT]->checkClicked();

    if (isCalibrating()) {
        if (dec & FootswitchState::ANY_CLICK) {
            state = EXP_CALIBRATE;
            value = 0;
            show();
        } else if (nextState & FootswitchState::ANY_CLICK) {
            int position = controller->readCalibrationPosition();
            if (state == EXP_HEEL) {
                heelPosition = position;
                state = EXP_TOE;
                show();
            } else if (config->calibrate(heelPosition, position)) {
                finish();
            } else {
                printer->debug("CAL TOO SHORT");
                state = EXP_HEEL;
                show();
            }
        }
        return;
    }

    if (inc & FootswitchState::ANY_CLICK) {
        increment();
        show();
    } else if (dec & FootswitchState::ANY_CLICK) {
        decrement();
        show();
    }

    if (nextState & FootswitchState::ANY_CLICK) {
        next();
    }
}
