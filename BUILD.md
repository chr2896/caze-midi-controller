# Hardware da versão CAZE

Esta versão usa LEDs ligados diretamente ao Nano; não usa 74HC595. O LCD é **16×2 I²C**, endereço configurado `0x27`.

| Função | Pino |
|---|---|
| FS1 / FS2 / FS3 / FS4 / FS5 / FS6 | D2 / D3 / D4 / D5 / D6 / D7 |
| LED FS1 / FS2 / FS3 | D8 / D9 / D10 |
| LED FS4 / FS5 / FS6 | A1 / A2 / A3 |
| Expressão | A0 |
| LCD SDA / SCL | A4 / A5 |
| MIDI serial TX | D1/TX, através do circuito MIDI adequado |

Os footswitches usam INPUT_PULLUP: contatos entre a entrada e GND. LEDs precisam de resistor em série dimensionado para o LED e a corrente permitida pelo Nano; o firmware usa HIGH/LOW, não controle PWM de brilho.

Disposição física:

```text
FS1   FS3   FS5
FS2   FS4   FS6
```

A leitura de expressão espera um pedal passivo como divisor de tensão: ponta para A0, anel para 5 V e manga para GND, **somente se essa pinagem corresponder ao pedal utilizado**. Confira os contatos reais do jack; modelos podem ter terminais comutados e convenções diferentes. Conecte/desconecte o TRS com o controlador desligado, conforme o procedimento adotado nesta montagem.

Este documento descreve a pinagem do firmware, não um esquema elétrico revisado de alimentação ou da saída DIN. Para a base original, veja [projeto de galczo5](https://github.com/galczo5/open-midi-controller) e o [documento herdado](docs/BUILD-inherited.md). Trechos antigos sobre 74HC595 ou LCD de quatro linhas não descrevem o firmware atual.
