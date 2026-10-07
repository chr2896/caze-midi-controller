#pragma once
#include <cstdint>
#include <string>
#include <vector>
#include <deque>
#include <algorithm>
using byte = uint8_t;
using boolean = bool;
using std::min;
#define F(x) x
#define HIGH 1
#define LOW 0
#define INPUT_PULLUP 2
#define OUTPUT 1
#define A0 14
#define A1 15
#define A2 16
#define A3 17
#define A6 20
struct String {
    std::string value;
    String() = default;
    String(const char* s) : value(s) {}
    String(std::string s) : value(s) {}
    String(int n) : value(std::to_string(n)) {}
    String(char c) : value(1, c) {}
    friend String operator+(const String& a, const String& b) { return a.value + b.value; }
    friend bool operator==(const String& a, const String& b) { return a.value == b.value; }
};
inline uint32_t testMillis = 0;
inline unsigned long millis() { return testMillis; }
inline void delay(int) {}
inline void pinMode(int, int) {}
inline void digitalWrite(int, int) {}
inline int digitalRead(int) { return HIGH; }
struct HardwareSerial {
    std::deque<byte> input;
    std::vector<byte> output;
    int available() { return int(input.size()); }
    byte read() { byte b = input.front(); input.pop_front(); return b; }
    void write(byte b) { output.push_back(b); }
};
inline HardwareSerial Serial;
