#define REVISION "1.1.0"

#include <MIDI.h>

#include "consts.h"
#include "config/midi-controller-config.h"
#include "footswitch/footswitch.h"
#include "config/command-type.h"
#include "controller/controller-state-machine.h"
#include "printer/printer.h"
#include "configuration/configuration-state-machine.h"
#include "executor/command-executor.h"
#include "configuration/configurator.h"
#include "expression/expression-config.h"
#include "expression/expression-controller.h"
#include "expression/expression-configurator.h"
#include "editor/editor-reader.h"
#include "footswitch/external-switch.h"

/**
 * Open Midi Controller
 * Footswitch pin map:
 *  __________________________
 * |                          |
 * | fs1 D2   fs3 D4   fs5 D6 |
 * |                          |
 * |                          |
 * | fs2 D3   fs4 D5   fs6 D7 |
 * |__________________________|
 */

// INIT FOOTSWITCHES
Footswitch fs1(0, FS_1_PIN);
Footswitch fs2(1, FS_2_PIN);
Footswitch fs3(2, FS_3_PIN);
Footswitch fs4(3, FS_4_PIN);
Footswitch fs5(4, FS_5_PIN);
Footswitch fs6(5, FS_6_PIN);

Footswitch* footswitches[6] = { &fs1, &fs2, &fs3, &fs4, &fs5, &fs6 };
ExternalSwitch externalSwitches[3];

MidiControllerConfig config;
ControllerStateMachine controllerStateMachine(ControllerState::SEND_COMMAND);
ConfigurationStateMachine configurationStateMachine;
Printer printer(&config);
ExpressionConfig expressionConfig;
ExpressionController expressionController(&expressionConfig);
CommandExecutor commandExecutor(&config, &printer);
ExpressionConfigurator expressionConfigurator(&expressionConfig, &printer, &expressionController);
Configurator configurator(&config, &configurationStateMachine, &printer);
boolean usbModeButtonsPressed = false;
boolean expressionButtonsPressed = false;
boolean editorUsbMode = false;
boolean editorPendingScreen = false;
void(* resetFunc) (void) = 0;

void setup() {
    pinMode(EXT_UPPER_PIN, INPUT_PULLUP);
    pinMode(EXT_LOWER_PIN, INPUT_PULLUP);
    pinMode(EXT_TOE_PIN, INPUT_PULLUP);
    config.reloadExternal();
    commandExecutor.init();
    expressionController.init();

    printer.init();
    printer.welcome(REVISION);

    boolean usbMode = config.isInUsbMidiMode();
    editorUsbMode = usbMode;
    if (usbMode) {
        Serial.begin(115200);
    }

    printer.usbMode(usbMode);

    for (Footswitch* fs : footswitches) { 
        fs->init(); 
    }
}

void loop() {
    // Consume external presses even in menus/recovery: never replay them later.
    FootswitchState externalEvents[3] = {FootswitchState::NONE, FootswitchState::NONE, FootswitchState::NONE};
    bool externalAllowed = !editorStoragePending() && !expressionConfigurator.isActive() && controllerStateMachine.getState() == ControllerState::SEND_COMMAND;
    bool externalStates[] = {digitalRead(EXT_UPPER_PIN) == LOW, digitalRead(EXT_LOWER_PIN) == LOW, digitalRead(EXT_TOE_PIN) == LOW};
    for (byte i = 0; i < 3; i++) externalEvents[i] = externalSwitches[i].update(externalStates[i], millis(), externalAllowed, config.externalGestures(6 + i));

    if (editorUsbMode) updateEditorReader(controllerStateMachine.getState() == ControllerState::SEND_COMMAND && !expressionConfigurator.isActive());
    if (editorStoragePending()) {
        if (!editorPendingScreen) {
            printer.editorRecovery();
            editorPendingScreen = true;
        }
        return;
    }
    editorPendingScreen = false;
    if (editorTakeSaved()) {
        config.reloadExternal();
        for (byte i = 0; i < 3; i++) externalEvents[i] = FootswitchState::NONE;
        expressionConfig.load();
        expressionController.reset();
        commandExecutor.resetAfterConfiguration();
        config.setPage(0);
        configurationStateMachine.reset();
        controllerStateMachine.enterState(ControllerState::SEND_COMMAND);
    }

    for (Footswitch* fs : footswitches) {
        fs->scan();
    }

    expressionController.setMode(config.getExpressionMode());
    if (!expressionConfigurator.isCalibrating()) expressionController.update();

    if (infoSwitchesPressed() || configSwitchesPressed() || usbModeSwitchesPressed() || expressionSwitchesPressed()) {
        return;
    }

    ControllerState controllerState = controllerStateMachine.getState();

    if (controllerStateMachine.checkChanges()) {
        configurationStateMachine.reset();
        printer.changeModeMessage(controllerState == ControllerState::CONFIGURE);    
        return;
    }

    if (expressionConfigurator.isActive()) {
        expressionConfigurator.process(footswitches);
        return;
    }

    switch (controllerState) {
        case ControllerState::CONFIGURE:
            configurator.configure(footswitches);
            break;

        case ControllerState::SEND_COMMAND:
            commandExecutor.sendCommands(footswitches);
            for (byte i = 0; i < 3; i++) if (externalEvents[i] != FootswitchState::NONE) commandExecutor.sendExternal(i, externalEvents[i]);
            expressionController.setMode(config.getExpressionMode());
            expressionController.update();
            printer.expressionStatus(expressionConfig.isEnabled(), expressionController.getLastValue(), config.getExpressionMode());
            break;
    }

}

boolean expressionSwitchesPressed() {
    if (controllerStateMachine.getState() != ControllerState::SEND_COMMAND) {
        return false;
    }

    FootswitchState fs1State = footswitches[EXP_CONFIG_1]->checkClicked();
    FootswitchState fs2State = footswitches[EXP_CONFIG_2]->checkClicked();

    if (fs1State == FootswitchState::PRESSED && fs2State == FootswitchState::PRESSED) {
        expressionButtonsPressed = true;
        return true;
    }

    if (fs1State == FootswitchState::NONE && expressionButtonsPressed) {
        expressionButtonsPressed = false;
        expressionConfigurator.start();
        return true;
    }

    return expressionButtonsPressed;
}


boolean usbModeSwitchesPressed() {
    FootswitchState fs1State = footswitches[FS_USB_MIDI_1]->checkClicked();
    FootswitchState fs2State = footswitches[FS_USB_MIDI_2]->checkClicked();

    if (fs1State == FootswitchState::PRESSED && fs2State == FootswitchState::PRESSED) {
        usbModeButtonsPressed = true;
    }

    if (fs1State == FootswitchState::NONE && usbModeButtonsPressed) {
        config.setUsbMidiMode(!config.isInUsbMidiMode());
        resetFunc();
        return true;
    }

    return false;
}


boolean infoSwitchesPressed() {
    FootswitchState fs1State = footswitches[FS_INFO_1]->checkClicked();
    FootswitchState fs2State = footswitches[FS_INFO_2]->checkClicked();

    if (fs1State == FootswitchState::PRESSED && fs2State == FootswitchState::PRESSED) {
        configurationStateMachine.setShouldPrintInfo(true);
    }

    if (fs1State == FootswitchState::NONE && configurationStateMachine.shouldPrintInfo()) {
        configurationStateMachine.setShouldPrintInfo(false);
        printer.printConfigPage(&config);
        return true;
    }

    return false;
}

boolean configSwitchesPressed() {
    FootswitchState fs1State = footswitches[FS_CONFIG_1]->checkClicked();
    FootswitchState fs2State = footswitches[FS_CONFIG_2]->checkClicked();

    if (fs1State == FootswitchState::PRESSED && fs2State == FootswitchState::PRESSED) {
        configurationStateMachine.setShouldEnterConfiguration(true);
    }
    
    if (fs1State == FootswitchState::NONE && configurationStateMachine.shouldEnterConfiguration()) {
        controllerStateMachine.toggleState();
        configurationStateMachine.setShouldEnterConfiguration(false);
        return true;
    }

    return configurationStateMachine.shouldEnterConfiguration();;
}
