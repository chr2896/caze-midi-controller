# Testes do firmware no computador

Os testes usam o código real de configuração, executor, protocolo USB, LCD e debounce. Os stubs substituem Arduino, EEPROM, MIDI e LCD; não verificam a eletrônica nem o tempo real do AVR. O fixture é produzido pelo serializador do web app, para detectar divergências entre JavaScript e C++.

Execute da raiz, com Node.js e compilador C++17. Exemplo GCC/Clang:

```sh
mkdir -p .pio/host-tests
web-app/node_modules/.bin/tsx tests/firmware/fixture.mjs .pio/host-tests/unified-fixture.bin
g++ -std=c++17 -Itests/firmware/stubs -Isrc tests/firmware/external-tests.cpp src/config/internal-text.cpp src/config/external-config.cpp src/config/midi-controller-config.cpp src/executor/command-executor.cpp src/editor/editor-reader.cpp src/printer/printer.cpp src/expression/expression-config.cpp src/expression/expression-controller.cpp src/footswitch/footswith.cpp -o .pio/host-tests/external-tests
.pio/host-tests/external-tests .pio/host-tests/unified-fixture.bin tests/firmware/fixtures/legacy-fixed.bin tests/firmware/fixtures/legacy-packed.bin
```

No Windows, em um Developer Command Prompt do Visual Studio, substitua a compilação por:

```bat
cl /nologo /EHsc /std:c++17 /Itests\firmware\stubs /Isrc tests\firmware\external-tests.cpp src\config\internal-text.cpp src\config\external-config.cpp src\config\midi-controller-config.cpp src\executor\command-executor.cpp src\editor\editor-reader.cpp src\printer\printer.cpp src\expression\expression-config.cpp src\expression\expression-controller.cpp src\footswitch\footswith.cpp /Fo.pio\host-tests\ /Fe.pio\host-tests\external-tests.exe
.pio\host-tests\external-tests.exe .pio\host-tests\unified-fixture.bin tests\firmware\fixtures\legacy-fixed.bin tests\firmware\fixtures\legacy-packed.bin
```

Compile também o firmware para o alvo real com `pio run -e nanoatmega328` e execute `npm test` e `npm run build` em `web-app`.

No PowerShell, gere os fixtures com `& web-app/node_modules/.bin/tsx.cmd tests/firmware/fixture.mjs .pio/host-tests/unified-fixture.bin`. O fixture gerado e os dois fixtures legados versionados verificam compatibilidade entre o formato fixo anterior e os novos textos compactos, incluindo calibração, labels, tap e recuperação de metadados inválidos.
