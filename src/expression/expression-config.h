#ifndef EXPRESSION_CONFIG_H
#define EXPRESSION_CONFIG_H

#include <Arduino.h>
#include "consts.h"

class ExpressionConfig {
private:
    bool enabled;
    byte channel;
    byte cc;
    byte minValue;
    byte maxValue;
    bool reversed;

public:
    ExpressionConfig();

    bool isEnabled();
    byte getChannel();
    byte getCC();
    byte getMinValue();
    byte getMaxValue();
    bool isReversed();

    void setEnabled(bool value);
    void setChannel(byte value);
    void setCC(byte value);
    void setMinValue(byte value);
    void setMaxValue(byte value);
    void setReversed(bool value);

    void load();
    void save();
};

#endif
