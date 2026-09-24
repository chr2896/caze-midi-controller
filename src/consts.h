#define NUMBER_OF_FOOTSWITCHES 6
#define NUMBER_OF_PAGES 3
#define MIDI_MAX_VALUE 128

#define FS_1_PIN 2 
#define FS_2_PIN 3
#define FS_3_PIN 4
#define FS_4_PIN 5
#define FS_5_PIN 6
#define FS_6_PIN 7

#define FS_CONFIG_1 1
#define FS_CONFIG_2 3

#define FS_CONFIG_NEXT 3
#define FS_CONFIG_INCREMENT 1
#define FS_CONFIG_DECREMENT 0

#define FS_INFO_1 0
#define FS_INFO_2 2

#define FS_USB_MIDI_1 3
#define FS_USB_MIDI_2 5

// Hardware additions
#define EXPRESSION_PIN A0

// Six switch LEDs — direct Arduino Nano GPIOs.
// D8-D10 and A1-A3 are unused by the original controller.
#define LED_1_PIN 8
#define LED_2_PIN 9
#define LED_3_PIN 10
#define LED_4_PIN A1
#define LED_5_PIN A2
#define LED_6_PIN A3

// Reserved switch combination to enter expression configuration.
// FS5 + FS6 are otherwise normal switches.
#define EXP_CONFIG_1 4
#define EXP_CONFIG_2 5

// EEPROM area reserved for expression configuration.
// Existing button data uses 0..719 and USB mode uses address 800.
#define EXP_EEPROM_ADDR 720
