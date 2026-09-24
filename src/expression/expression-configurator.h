#ifndef EXPRESSION_CONFIGURATOR_H
#define EXPRESSION_CONFIGURATOR_H

#include "expression/expression-config.h"
#include "printer/printer.h"
#include "expression/expression-controller.h"
#include "footswitch/footswitch.h"

enum ExpressionConfigState {
    EXP_SELECT_ENABLED = 0,
    EXP_SELECT_CHANNEL = 1,
    EXP_SELECT_CC = 2,
    EXP_SELECT_MIN = 3,
    EXP_SELECT_MAX = 4,
    EXP_SELECT_REVERSE = 5
};

class ExpressionConfigurator {
private:
    ExpressionConfig* config;
    ExpressionController* controller;
    Printer* printer;
    ExpressionConfigState state;
    byte value;
    bool active;

    void show();
    void next();
    void increment();
    void decrement();

public:
    ExpressionConfigurator(ExpressionConfig* config, Printer* printer, ExpressionController* controller);
    void start();
    bool isActive();
    void process(Footswitch* footswitches[]);
};

#endif
