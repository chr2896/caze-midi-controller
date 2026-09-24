# Créditos e origem

## Projeto original

CAZE MIDI CTRL deriva do [Open Midi Controller, de galczo5](https://github.com/galczo5/open-midi-controller). O reconhecimento pelo projeto original inclui a arquitetura do controlador de seis footswitches, os gestos de clique/longo/duplo, configuração por páginas e menu físico, base MIDI, LCD e documentação de montagem original.

Este projeto é uma adaptação independente. Não é uma publicação oficial nem implica endosso de galczo5 ou da Neural DSP. Nano Cortex é a pedaleira usada nos testes do autor desta adaptação, não a autora deste firmware.

## Adaptação CAZE MIDI CTRL

Direção do projeto e testes no hardware: Carlos Henrique (CAZE). Desenvolvimento incremental do firmware e do editor React com assistência do Codex. A base funcional fornecida para esta evolução já continha LEDs diretos e entrada de expressão; essas funções não são apresentadas como criações novas dos checkpoints reconstruídos.

As alterações desta evolução incluem impressão do LCD com menor uso de Strings temporárias, indicador EXP, editor web, comunicação Web Serial, leitura e gravação verificada de presets, novo mapa EEPROM, labels persistentes, opção ON/OFF para valores personalizados, calibração física da expressão e cálculo local de tap tempo.

## Licença e dependências

O arquivo [LICENSE.txt](../LICENSE.txt) recebido com a base foi preservado integralmente, incluindo `Copyright (c) 2016 Francois Best`. Esse aviso não foi substituído pelo nome da adaptação e não deve ser confundido com a atribuição do projeto Open Midi Controller a galczo5.

Dependências: Arduino AVR Core, MIDI Library (FortySevenEffects), LiquidCrystal_I2C, React e Vite. Elas conservam suas próprias licenças e autorias. Fotos em `photos/` e os manuais históricos foram herdados da base; não são apresentados como fotos do board CAZE.

## Histórico reconstruído

Os commits iniciais deste repositório são reconstruções dos ZIPs locais. Não reproduzem o histórico Git original nem atribuem retroativamente autoria ou datas a terceiros. Os nomes e hashes dos ZIPs, limites dos snapshots e correspondência dos commits estão em [HISTORY.md](HISTORY.md).
