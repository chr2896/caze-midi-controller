#include <cassert>
#include <fstream>
#include <iostream>
#include "config/storage-layout.h"
#include "config/external-config.h"
#include "config/midi-controller-config.h"
#include "executor/command-executor.h"
#include "footswitch/external-switch.h"
#include "editor/editor-reader.h"
#include "midi-instance.h"

midi::MidiInterface<midi::SerialMIDI<HardwareSerial>> MIDI;

std::vector<byte> request(byte command, std::vector<byte> payload = {}, bool allowed = true) {
    Serial.output.clear();
    Serial.input = {0xF0, 0x7D, 0x43, 0x5A, 1, command, 1};
    byte checksum = (command + 1) & 127;
    for (byte v : payload) { Serial.input.push_back(v >> 4); Serial.input.push_back(v & 15); checksum = (checksum + v) & 127; }
    Serial.input.push_back(checksum); Serial.input.push_back(0xF7);
    while (Serial.available()) updateEditorReader(allowed);
    assert(Serial.output.size() >= 9 && Serial.output[5] == (command | 64));
    std::vector<byte> result;
    for (size_t i = 7; i + 2 < Serial.output.size(); i += 2) result.push_back((Serial.output[i] << 4) | Serial.output[i + 1]);
    return result;
}
void beginWrite(const std::vector<byte>& image, bool extended = true) {
    uint16_t crc = 0xFFFF;
    for (byte v : image) crc = Storage::crcByte(crc, v);
    std::vector<byte> payload = {byte(crc >> 8), byte(crc)};
    if (extended) { payload.push_back(byte(image.size() >> 8)); payload.push_back(byte(image.size())); }
    if (image[925] == 0xA3) { if (!extended) { payload.push_back(byte(image.size() >> 8)); payload.push_back(byte(image.size())); } payload.push_back(3); }
    assert(request(3, payload) == std::vector<byte>{0});
}
void blocks(const std::vector<byte>& image) {
    for (size_t offset = 0; offset < image.size(); offset += 16) {
        std::vector<byte> payload = {byte(offset >> 8), byte(offset)};
        for (size_t i = offset; i < std::min(offset + 16, image.size()); i++) payload.push_back(image[i]);
        assert(request(4, payload) == std::vector<byte>{0});
    }
}
int main(int argc, char** argv) {
    assert(argc == 3);
    std::ifstream file(argv[1], std::ios::binary);
    std::vector<byte> image((std::istreambuf_iterator<char>(file)), {});
    assert(image.size() == 1013);
    EEPROM.bytes.fill(255);
    for (int i = 936; i < 943; i++) EEPROM.update(i, byte(i));
    assert(request(1).back() == 15);
    assert(request(3, {0, 0, 0, 10}) == std::vector<byte>{1});
    assert(request(3, {0, 0}, false) == std::vector<byte>{2});
    assert(!Storage::pending());
    beginWrite(image);
    assert(Storage::pending());
    assert(request(4, {0, 16, 0}) == std::vector<byte>{1});
    assert(request(5) == std::vector<byte>{1});
    blocks(image);
    assert(request(5) == std::vector<byte>{0});
    assert(editorTakeSaved() && !editorTakeSaved());
    assert(Storage::ready() && ExternalConfig::valid());
    for (int i = 936; i < 943; i++) assert(EEPROM.read(i) == byte(i));
    for (int i = 0; i < 1013; i++) assert(EEPROM.read(Storage::imageAddress(i)) == image[i]);

    // Exercise real executor/config/printer against the JS-produced fixture.
    MidiControllerConfig config; config.reloadExternal();
    Printer printer(&config);
    CommandExecutor executor(&config, &printer);
    executor.sendExternal(0);
    assert(MIDI.messages.back().command == 47 && MIDI.messages.back().value == 0 && MIDI.messages.back().channel == 16);
    printer.expressionStatus(true, 127);
    assert(LiquidCrystal_I2C::rows[0] == "MODO         EXP");
    assert(LiquidCrystal_I2C::rows[1] == "(PRESET)    100%");
    config.setPage(2); executor.sendExternal(0);
    assert(MIDI.messages.back().value == 2);
    assert(LiquidCrystal_I2C::rows[1].substr(0, 7) == "(STOMP)");
    executor.sendExternal(1); assert(MIDI.messages.back().command == 64 && MIDI.messages.back().value == 0);
    config.setPage(1); executor.sendExternal(1); assert(MIDI.messages.back().value == 127);
    executor.sendExternal(2); assert(MIDI.messages.back().command == 35);
    executor.resetAfterConfiguration(); executor.sendExternal(0); assert(MIDI.messages.back().value == 0);
    config.setPage(0); auto original = config.getButtonData(0, FootswitchState::CLICK);
    config.setButton(6, {1, 1, 50, 0, 0}, FootswitchState::CLICK); // Menu writes must not overlap internal storage.
    assert(config.getButtonData(0, FootswitchState::CLICK).type == original.type);

    auto corrupt = image; corrupt[960] ^= 1;
    beginWrite(corrupt); blocks(corrupt);
    assert(request(5) == std::vector<byte>{1}); // Image CRC passes; extension CRC fails.
    auto sent = MIDI.messages.size(); executor.sendExternal(0); assert(MIDI.messages.size() == sent);
    beginWrite(image); blocks(image); assert(request(5) == std::vector<byte>{0});
    // Legacy writer is still accepted and preserves the extension and calibration.
    auto externalBefore = EEPROM.bytes;
    std::vector<byte> old(image.begin(), image.begin() + 936);
    beginWrite(old, false); blocks(old); assert(request(5) == std::vector<byte>{0});
    for (int i = 936; i < 1020; i++) assert(EEPROM.read(i) == externalBefore[i]);

    std::ifstream packedFile(argv[2], std::ios::binary);
    std::vector<byte> packed((std::istreambuf_iterator<char>(packedFile)), {});
    assert(packed.size() == 1013 && packed[925] == 0xA3);
    beginWrite(packed); blocks(packed); assert(request(5) == std::vector<byte>{0});
    config.reloadExternal(); config.setPage(0); executor.resetAfterConfiguration();
    char label[13]; config.getLabel(0, FootswitchState::CLICK, label); assert(std::string(label) == "MODO");
    executor.executeCommand(0, FootswitchState::CLICK);
    printer.commandInfo(0, FootswitchState::CLICK, executor.getExecutedValue()); printer.expressionStatus(true,127);
    assert(LiquidCrystal_I2C::rows[1] == "(PRESET)    100%");
    executor.executeCommand(0, FootswitchState::CLICK);
    printer.commandInfo(0, FootswitchState::CLICK, executor.getExecutedValue());
    assert(LiquidCrystal_I2C::rows[1].substr(0,7) == "(STOMP)");
    assert(!config.isTapTempo(1, FootswitchState::CLICK));
    assert(config.isTapTempo(2, FootswitchState::CLICK));
    assert(config.isTapTempo(8, FootswitchState::CLICK));
    testMillis = 1000; executor.sendExternal(2); testMillis = 1500; executor.sendExternal(2);
    assert(LiquidCrystal_I2C::rows[1].substr(0,7) == "120 BPM");
    config.setPage(2); config.getState(5, FootswitchState::DOUBLE_CLICK, 127, label); assert(std::string(label) == "II");
    for (int i = 936; i < 943; i++) assert(EEPROM.read(i) == byte(i));
    for (auto fault : std::vector<std::pair<int,byte>>{{270,255},{271,48},{378,255}}) {
        auto bad = packed; bad[fault.first] = fault.second;
        beginWrite(bad); blocks(bad); assert(request(5) == std::vector<byte>{1});
    }
    beginWrite(image); blocks(image); assert(request(5) == std::vector<byte>{0}); // Legacy image still works after packed recovery.
    config.setPage(0); config.setButton(0,{1,2,42,127,0},FootswitchState::CLICK);
    assert(config.isTapTempo(0, FootswitchState::CLICK));

    ExternalSwitch sw;
    assert(!sw.update(true, 0) && !sw.update(true, 100)); // Held at boot.
    assert(!sw.update(false, 101) && !sw.update(false, 126));
    assert(!sw.update(true, 130) && !sw.update(false, 135) && !sw.update(true, 140));
    assert(!sw.update(true, 164) && sw.update(true, 165));
    assert(!sw.update(true, 5000)); // No repeat or long event.
    assert(!sw.update(false, 5010) && !sw.update(false, 5035));
    assert(!sw.update(true, 0xFFFFFFF0u) && sw.update(true, 9)); // Rollover.
    ExternalSwitch inMenu;
    assert(!inMenu.update(false, 0) && !inMenu.update(false, 25));
    assert(!inMenu.update(true, 40, false));
    assert(!inMenu.update(true, 65, true)); // No delayed press on leaving a menu.
    assert(!inMenu.update(false, 70) && !inMenu.update(false, 95));
    assert(!inMenu.update(true, 100) && inMenu.update(true, 125));
    std::cout << "Firmware checks passed: protocol, recovery, calibration, global toggles, LCD, debounce.\n";
}

