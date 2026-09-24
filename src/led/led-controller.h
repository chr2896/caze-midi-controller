#ifndef LED_CONTROLLER_H
#define LED_CONTROLLER_H
#include <Arduino.h>
class LedController {
private:
    byte ledState;
    byte persistentMask;
    byte flashMask;
    unsigned long flashUntil;
    void writeRegister();
public:
    LedController();
    void init();
    void allOff();
    void set(int no, bool on);
    void flash(int no, unsigned long duration = 120);
    void update();
};
#endif
