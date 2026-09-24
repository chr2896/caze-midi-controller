#ifndef TAP_TEMPO_H
#define TAP_TEMPO_H
#include <stdint.h>

// Rolling mean of the last four intervals. No MIDI or EEPROM side effects.
class TapTempo {
    uint32_t previous = 0;
    uint16_t intervals[4] = {};
    uint16_t source = 0;
    uint16_t total = 0;
    uint8_t count = 0;
    uint8_t cursor = 0;
    bool started = false;
public:
    void reset() { started = false; count = 0; cursor = 0; total = 0; }
    void tap(uint32_t now, uint16_t tapSource) {
        uint32_t elapsed = now - previous; // Handles millis() rollover.
        if (!started || tapSource != source || elapsed > 3000) {
            reset();
            started = true;
            source = tapSource;
            previous = now;
            return;
        }
        if (elapsed < 100) return; // Ignore accidental duplicates for display only.
        previous = now;
        if (count == 4) total -= intervals[cursor];
        else count++;
        intervals[cursor] = uint16_t(elapsed);
        total += intervals[cursor];
        cursor = (cursor + 1) % 4;
    }
    uint16_t bpm() const { return count ? (60000UL * count + total / 2) / total : 0; }
};
#endif
