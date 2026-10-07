#ifndef EXTERNAL_SWITCH_H
#define EXTERNAL_SWITCH_H
#include <stdint.h>
#include "footswitch-state.h"
// Single press remains immediate when no extra gesture is configured.
// With gestures, single waits for release/double window; long never repeats.
class ExternalSwitch {
    bool raw = true, stable = true, blocked = true;
    bool pending = false, consumed = true, second = false;
    uint32_t changed = 0, downAt = 0, releasedAt = 0;
public:
    FootswitchState update(bool pressed, uint32_t now, bool enabled = true, uint8_t gestures = 0) {
        if (!enabled) { blocked = true; pending = false; consumed = true; second = false; }
        if (pressed != raw) { raw = pressed; changed = now; }
        if (uint32_t(now - changed) >= 25 && raw != stable) {
            stable = raw;
            if (!stable && blocked && enabled) { blocked = false; return FootswitchState::NONE; }
            if (!blocked && enabled) {
                if (stable) {
                    second = pending && uint32_t(now - releasedAt) <= 250;
                    pending = false; downAt = now; consumed = false;
                    if (!gestures) { consumed = true; return FootswitchState::CLICK; }
                } else if (!consumed) {
                    consumed = true;
                    if (second) { second = false; return FootswitchState::DOUBLE_CLICK; }
                    if (gestures & 2) { pending = true; releasedAt = now; }
                    else return FootswitchState::CLICK;
                }
            }
        }
        if (enabled && !raw && !stable) blocked = false;
        if (!enabled || blocked) return FootswitchState::NONE;
        if (stable && !consumed && (gestures & 1) && uint32_t(now - downAt) >= 1000) {
            consumed = true; pending = false; second = false; return FootswitchState::LONG_CLICK;
        }
        if (pending && !stable && uint32_t(now - releasedAt) > 250) {
            pending = false; return FootswitchState::CLICK;
        }
        return FootswitchState::NONE;
    }
};
#endif
