# Open MIDI Controller — LEDs + Expression Pedal

Based on the uploaded `open-midi-controller-program-change` project.

## Added hardware

- 6 switch indicator LEDs
- LED series resistors: 220 ohm supported
- Expression pedal input on A0
- LEDs are driven directly from Arduino Nano GPIOs; no 74HC595 is required.
- Recommended LED brightness is reduced in firmware using PWM where the selected
  Arduino pins support it; non-PWM indicator pins use software timing to maintain
  a consistent perceived brightness.

## Added expression features

- Separate Expression menu, entered with FS5 + FS6 in normal operation
- Enable/disable
- MIDI channel
- MIDI CC number
- MIDI minimum
- MIDI maximum
- Reverse
- Heel calibration
- Toe calibration
- EEPROM storage
- ADC filtering and duplicate-value suppression

The original six-footswitch configuration menu remains unchanged.
