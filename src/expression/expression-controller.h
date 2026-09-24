#ifndef EXPRESSION_CONTROLLER_H
#define EXPRESSION_CONTROLLER_H

#include <Arduino.h>
#include <MIDI.h>
#include "expression/expression-config.h"

class ExpressionController {
private:
    ExpressionConfig* config;
    int lastValue;
    unsigned long lastRead;
    static const byte FILTER_SAMPLES = 4;

public:
    ExpressionController(ExpressionConfig* config);
    void init();
    void update();
    void reset();
};

#endif
