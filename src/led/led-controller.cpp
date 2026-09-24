#include <Arduino.h>
#include "led-controller.h"
#include "consts.h"

static const byte LED_PINS[NUMBER_OF_FOOTSWITCHES] = {
    LED_1_PIN, LED_2_PIN, LED_3_PIN,
    LED_4_PIN, LED_5_PIN, LED_6_PIN
};

LedController::LedController()
    : ledState(0), persistentMask(0), flashMask(0), flashUntil(0) {}

void LedController::init() {
    for (byte i = 0; i < NUMBER_OF_FOOTSWITCHES; i++) {
        pinMode(LED_PINS[i], OUTPUT);
        digitalWrite(LED_PINS[i], LOW);
    }
    allOff();
}

void LedController::writeRegister() {
    // Kept as a separate method so the rest of the firmware does not
    // care whether LEDs are driven directly or by an expander.
    for (byte i = 0; i < NUMBER_OF_FOOTSWITCHES; i++) {
        digitalWrite(LED_PINS[i], (ledState & (1 << i)) ? HIGH : LOW);
    }
}

void LedController::allOff() {
    ledState = 0;
    persistentMask = 0;
    flashMask = 0;
    flashUntil = 0;
    writeRegister();
}

void LedController::set(int no, bool on) {
    if (no < 0 || no >= NUMBER_OF_FOOTSWITCHES) return;
    byte mask = (1 << no);
    if (on) persistentMask |= mask;
    else persistentMask &= ~mask;
    ledState = persistentMask | flashMask;
    writeRegister();
}

void LedController::flash(int no, unsigned long duration) {
    if (no < 0 || no >= NUMBER_OF_FOOTSWITCHES) return;
    byte mask = (1 << no);
    flashMask |= mask;
    flashUntil = millis() + duration;
    ledState = persistentMask | flashMask;
    writeRegister();
}

void LedController::update() {
    if (flashMask != 0 && (long)(millis() - flashUntil) >= 0) {
        flashMask = 0;
        ledState = persistentMask;
        writeRegister();
    }
}
