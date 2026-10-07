#pragma once
#include <Arduino.h>
class LiquidCrystal_I2C {
    int x = 0, y = 0;
public:
    inline static std::string rows[2] = {std::string(16, ' '), std::string(16, ' ')};
    LiquidCrystal_I2C(int, int, int) {}
    void init() {}
    void backlight() {}
    void clear() { rows[0] = rows[1] = std::string(16, ' '); x = y = 0; }
    void setCursor(int column, int row) { x = column; y = row; }
    void print(const char* s) { while (*s) print(*s++); }
    void print(const String& s) { print(s.value.c_str()); }
    void print(char c) { if (x < 16 && y < 2) rows[y][x] = c; x++; }
    void print(int n) { print(std::to_string(n).c_str()); }
    void print(unsigned int n) { print(std::to_string(n).c_str()); }
};
