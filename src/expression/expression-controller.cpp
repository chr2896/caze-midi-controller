#include <Arduino.h>
#include <MIDI.h>
#include "expression-controller.h"
#include "consts.h"
#include "midi-instance.h"

ExpressionController::ExpressionController(ExpressionConfig* config) {
    this->config = config;
    this->lastValue = -1;
    this->lastRead = 0;
}

void ExpressionController::init() {
    pinMode(EXPRESSION_PIN, INPUT);
}

void ExpressionController::update() {
    if (!this->config->isEnabled()) {
        return;
    }

    // ~100 Hz maximum update rate.
    unsigned long now = millis();
    if (now - this->lastRead < 10) {
        return;
    }
    this->lastRead = now;

    // Small averaging filter to reduce ADC/pedal jitter.
    long sum = 0;
    for (byte i = 0; i < FILTER_SAMPLES; i++) {
        sum += analogRead(EXPRESSION_PIN);
    }
    int raw = sum / FILTER_SAMPLES;

    // Calibrated physical endpoints; defaults remain 0..1023 until calibrated.
    int value = map(raw, this->config->getHeel(), this->config->getToe(), 0, 127);
    value = constrain(value, 0, 127);

    if (this->config->isReversed()) {
        value = 127 - value;
    }

    int minValue = this->config->getMinValue();
    int maxValue = this->config->getMaxValue();
    value = map(value, 0, 127, minValue, maxValue);
    value = constrain(value, 0, 127);

    // Do not resend the same MIDI value.
    if (value == this->lastValue) {
        return;
    }

    MIDI.sendControlChange(
        this->config->getCC(),
        value,
        this->config->getChannel()
    );

    this->lastValue = value;
}

void ExpressionController::reset() { this->lastValue = -1; }

int ExpressionController::readCalibrationPosition() {
    long sum = 0;
    for (byte i = 0; i < 32; i++) sum += analogRead(EXPRESSION_PIN);
    return sum / 32;
}
