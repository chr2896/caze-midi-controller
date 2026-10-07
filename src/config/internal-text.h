#ifndef INTERNAL_TEXT_H
#define INTERNAL_TEXT_H
#include <Arduino.h>
namespace InternalText {
const int FORMAT_ADDRESS = 925;
const byte FORMAT = 0xA3;
bool packed();
bool valid();
byte length(byte action, byte field);
byte tapPolicy(byte action);
void text(byte action, byte field, char *out);
}
#endif
