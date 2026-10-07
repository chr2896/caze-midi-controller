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
#include "expression/expression-controller.h"

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
    if (!extended) { payload.push_back(byte(image.size() >> 8)); payload.push_back(byte(image.size())); }
    payload.push_back(4);
    assert(request(3, payload) == std::vector<byte>{0});
}
void blocks(const std::vector<byte>& image) {
    for (size_t offset = 0; offset < image.size(); offset += 16) {
        std::vector<byte> payload = {byte(offset >> 8), byte(offset)};
        for (size_t i = offset; i < std::min(offset + 16, image.size()); i++) payload.push_back(image[i]);
        assert(request(4, payload) == std::vector<byte>{0});
    }
}

std::vector<byte> readImage(const char* path) {
    std::ifstream file(path,std::ios::binary); assert(file.good());
    return std::vector<byte>((std::istreambuf_iterator<char>(file)),{});
}
void installLegacy(const std::vector<byte>& image) {
    EEPROM.bytes.fill(255);
    for (size_t i=0;i<image.size();i++) EEPROM.update(Storage::imageAddress(i),image[i]);
    EEPROM.update(1020,67);EEPROM.update(1021,90);EEPROM.update(1022,2);EEPROM.update(1023,165);
}
void gestureChecks() {
    ExternalSwitch sw;
    assert(!sw.update(true,0,true,3)); assert(!sw.update(true,5000,true,3)); // Held at boot.
    assert(!sw.update(false,5010,true,3));assert(!sw.update(false,5035,true,3));
    assert(!sw.update(true,5100,true,3));assert(!sw.update(true,5125,true,3));
    assert(!sw.update(false,5200,true,3));assert(!sw.update(false,5225,true,3));
    assert(!sw.update(false,5475,true,3)); assert(sw.update(false,5476,true,3)==FootswitchState::CLICK);
    assert(!sw.update(false,6000,true,3));
    // Double sends only DOUBLE, then no delayed single.
    sw.update(true,6100,true,3);sw.update(true,6125,true,3);sw.update(false,6200,true,3);sw.update(false,6225,true,3);
    sw.update(true,6300,true,3);sw.update(true,6325,true,3);sw.update(false,6380,true,3);
    assert(sw.update(false,6405,true,3)==FootswitchState::DOUBLE_CLICK);assert(!sw.update(false,7000,true,3));
    // Long fires at 1 s, no repeat and no single on release.
    sw.update(true,7100,true,3);sw.update(true,7125,true,3);assert(!sw.update(true,8124,true,3));
    assert(sw.update(true,8125,true,3)==FootswitchState::LONG_CLICK);assert(!sw.update(true,12000,true,3));
    sw.update(false,12010,true,3);assert(!sw.update(false,12035,true,3));assert(!sw.update(false,13000,true,3));
    // Menu cancels pending single and held presses must be released.
    sw.update(true,14000,true,3);sw.update(true,14025,true,3);sw.update(false,14100,true,3);sw.update(false,14125,true,3);
    assert(!sw.update(false,14200,false,3));assert(!sw.update(false,15000,true,3));
    sw.update(true,16000,false,3);sw.update(true,16025,false,3);assert(!sw.update(true,18000,true,3));
    sw.update(false,18010,true,3);assert(!sw.update(false,18035,true,3));
    // Without extra actions a single is immediate after debounce, including rollover.
    ExternalSwitch immediate;immediate.update(false,0);immediate.update(false,25);
    immediate.update(true,0xFFFFFFF0u);assert(immediate.update(true,9)==FootswitchState::CLICK);assert(!immediate.update(true,500));
}
int main(int argc,char** argv) {
    assert(argc==4);auto image=readImage(argv[1]);assert(image.size()==936 && image[925]==0xA4);
    MidiControllerConfig config; Printer printer(&config);CommandExecutor executor(&config,&printer);
    for(int fixture=2;fixture<=3;fixture++) {
        installLegacy(readImage(argv[fixture]));config.reloadExternal();config.setPage(0);
        assert(config.getButtonData(6,FootswitchState::CLICK).value1==47);
        assert(config.getButtonData(6,FootswitchState::LONG_CLICK).type==0);
        assert(config.externalGestures(6)==0);
        char label[13];config.getLabel(6,FootswitchState::CLICK,label);assert(std::string(label)=="MODO");
        if(fixture==3){config.getLabel(0,FootswitchState::CLICK,label);assert(std::string(label)=="MODO");}
    }
    for(int i=936;i<943;i++)EEPROM.update(i,byte(i));
    auto untouched=EEPROM.bytes;
    assert(request(1)==std::vector<byte>({2,6,3,30,60,5,31}));
    assert(request(3,{0,0})==std::vector<byte>{1}); assert(EEPROM.bytes==untouched);
    assert(request(3,{0,0,3,168,4},false)==std::vector<byte>{2}); assert(EEPROM.bytes==untouched);
    beginWrite(image); assert(Storage::pending());assert(request(5)==std::vector<byte>{1});
    assert(request(4,{0,16,0})==std::vector<byte>{1});
    blocks(image);assert(request(5)==std::vector<byte>{0});assert(Storage::unified()&&Storage::ready());
    assert(editorTakeSaved()&&!editorTakeSaved());
    for(int i=936;i<1020;i++)assert(EEPROM.read(i)==untouched[i]);
    config.reloadExternal();config.setPage(0);executor.resetAfterConfiguration();assert(config.getExpressionMode()==1);
    executor.sendExternal(0);assert(MIDI.messages.back().command==47 && MIDI.messages.back().value==0 && MIDI.messages.back().channel==16);
    printer.expressionStatus(true,127,1);assert(LiquidCrystal_I2C::rows[0]=="MODO         EXP");assert(LiquidCrystal_I2C::rows[1]=="(PRESET)    100%");
    executor.sendExternal(0,FootswitchState::LONG_CLICK);assert(MIDI.messages.back().value==20);assert(LiquidCrystal_I2C::rows[1].substr(0,7)=="(CLEAN)");
    config.setPage(1);executor.sendExternal(0);assert(MIDI.messages.back().value==2); // Global across pages.
    executor.sendExternal(0,FootswitchState::LONG_CLICK);assert(MIDI.messages.back().value==100); // Independent per gesture.
    executor.sendExternal(0,FootswitchState::DOUBLE_CLICK);assert(MIDI.messages.back().program && MIDI.messages.back().command==6);
    assert(config.externalGestures(6)==3);
    config.setPage(0);executor.sendExternal(1);assert(config.getPage()==1 && MIDI.messages.back().command==64 && MIDI.messages.back().value==127);
    assert(LiquidCrystal_I2C::rows[1].substr(0,12)=="PAGE II / P2");
    executor.sendExternal(1);assert(config.getPage()==0 && MIDI.messages.back().value==0);
    config.setPage(1);executor.sendExternal(1);assert(config.getPage()==0 && MIDI.messages.back().value==0); // Tracks local page changes.
    executor.executeCommand(1,FootswitchState::CLICK);assert(config.getPage()==1); // Temporary page.
    executor.sendExternal(1);assert(config.getPage()==0); // Sync overrides pending temporary return.
    executor.executeCommand(0,FootswitchState::CLICK);assert(config.getPage()==1);
    printer.commandInfo(0,FootswitchState::CLICK,127,0);assert(LiquidCrystal_I2C::rows[0].substr(0,9)=="PAGE SYNC");assert(LiquidCrystal_I2C::rows[1].substr(0,12)=="PAGE II / P2");
    testMillis=1000;executor.sendExternal(1,FootswitchState::LONG_CLICK);testMillis=1500;executor.sendExternal(1,FootswitchState::LONG_CLICK);assert(LiquidCrystal_I2C::rows[1].substr(0,7)=="120 BPM");
    executor.sendExternal(1,FootswitchState::DOUBLE_CLICK);assert(LiquidCrystal_I2C::rows[1].substr(0,9)=="CC 42 127");
    // EXP toggles only routing; the physical calibrated position is immediately sent on the new CC.
    for(int i=936;i<943;i++)EEPROM.update(i,255); // No calibration: full 0..1023 ADC range.
    ExpressionConfig expConfig;ExpressionController expression(&expConfig);analogValue=0;testMillis=2000;
    expression.setMode(config.getExpressionMode());expression.update();assert(MIDI.messages.back().command==1 && MIDI.messages.back().value==0 && MIDI.messages.back().channel==4);
    analogValue=1023;testMillis=2010;expression.update();assert(MIDI.messages.back().value==127);
    auto sent=MIDI.messages.size();executor.sendExternal(2);assert(config.getExpressionMode()==2 && MIDI.messages.size()==sent);
    expression.setMode(config.getExpressionMode());expression.update();assert(MIDI.messages.back().command==2 && MIDI.messages.back().value==127);
    printer.expressionStatus(true,127,2);assert(LiquidCrystal_I2C::rows[0].substr(12)=="EXP2");assert(LiquidCrystal_I2C::rows[1].substr(12)=="100%");
    executor.sendExternal(2);expression.setMode(config.getExpressionMode());expression.update();assert(MIDI.messages.back().command==1);
    config.reloadExternal();assert(config.getExpressionMode()==1);config.setPage(2);assert(config.getPage()==0);config.setPage(-1);assert(config.getPage()==1);
    for(auto fault:std::vector<std::pair<int,byte>>{{225,255},{226,48},{315,255},{1,10},{925,0xA3}}) {
        auto bad=image;bad[fault.first]=fault.second;beginWrite(bad);blocks(bad);assert(request(5)==std::vector<byte>{1});
        sent=MIDI.messages.size();executor.sendExternal(0);assert(MIDI.messages.size()==sent);
    }
    beginWrite(image);blocks(image);assert(request(5)==std::vector<byte>{0});
    gestureChecks();
    std::cout<<"Firmware checks passed: legacy reads, negotiated migration, recovery, global gestures, MIDI toggles, synced pages, EXP routing, LCD and debounce.\n";
}
