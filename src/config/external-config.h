#ifndef EXTERNAL_CONFIG_H
#define EXTERNAL_CONFIG_H
#include "controller-button-entity.h"

namespace ExternalConfig {
const byte COUNT = 3;
// Packed records followed by a shared ASCII text pool. Never allocate a RAM copy.
bool valid();
ControllerButtonEntity command(byte no);
byte tapPolicy(byte no);
bool onOff(byte no);
void text(byte no, byte field, char *out); // 0: label (12), 1/2: states (10).
}
#endif
