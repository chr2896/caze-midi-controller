#ifndef EXTERNAL_SWITCH_H
#define EXTERNAL_SWITCH_H
#include <stdint.h>

// One event per debounced press, with no long/double/repeat gestures.
// Booting with a held switch requires a release before it can send anything.
class ExternalSwitch {
    bool raw = true, stable = true;
    bool blocked = true;
    uint32_t changed = 0;
public:
    bool update(bool pressed, uint32_t now, bool enabled = true) {
        if (!enabled) blocked = true;
        if (pressed != raw) { raw = pressed; changed = now; }
        if (uint32_t(now - changed) < 25) return false;
        if (raw != stable) {
            stable = raw;
            if (stable && !blocked && enabled) return true;
        }
        if (enabled && !raw && !stable) blocked = false;
        return false;
    }
};
#endif
