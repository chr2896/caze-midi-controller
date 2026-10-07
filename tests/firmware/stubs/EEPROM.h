#pragma once
#include <Arduino.h>
#include <array>
#include <cassert>
struct FakeEEPROM {
    std::array<byte, 1024> bytes{};
    byte read(int a) { assert(a >= 0 && a < 1024); return bytes[a]; }
    void update(int a, byte v) { assert(a >= 0 && a < 1024); bytes[a] = v; }
    void write(int a, byte v) { update(a, v); }
    int length() { return 1024; }
};
inline FakeEEPROM EEPROM;
