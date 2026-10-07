# Hardware da versão CAZE

Esta versão não usa LEDs de footswitch nem 74HC595. O LCD é **16×2 I²C**, endereço configurado `0x27`.

| Função | Pino |
|---|---|
| FS1 / FS2 / FS3 / FS4 / FS5 / FS6 | D2 / D3 / D4 / D5 / D6 / D7 |
| Pinos livres (antigos LEDs) | D11 / D12 / A1 / A2 / A3 |
| Expressão | A0 |
| Dual externo superior / inferior | D8 / D9 |
| Toe switch externo | D10, com INPUT_PULLUP |
| LCD SDA / SCL | A4 / A5 |
| MIDI serial TX | D1/TX, através do circuito MIDI adequado |

Os seis footswitches internos e os três externos usam `INPUT_PULLUP`: contatos momentâneos normalmente abertos entre a entrada e GND, sem resistor externo. O dual usa D8/D9 e o toe switch usa D10. Veja a identificação dos contatos no [guia dos foots externos](docs/EXTERNAL-FOOTSWITCHES.md). A entrada de expressão continua em A0.

Disposição física:

```text
FS1   FS3   FS5
FS2   FS4   FS6
```

A leitura de expressão espera um pedal passivo como divisor de tensão: ponta para A0, anel para 5 V e manga para GND, **somente se essa pinagem corresponder ao pedal utilizado**. Confira os contatos reais do jack; modelos podem ter terminais comutados e convenções diferentes. Conecte/desconecte o TRS com o controlador desligado, conforme o procedimento adotado nesta montagem.

Este documento descreve a pinagem do firmware, não um esquema elétrico revisado de alimentação ou da saída DIN. Para a base original, veja [projeto de galczo5](https://github.com/galczo5/open-midi-controller) e o [documento herdado](docs/BUILD-inherited.md). Trechos antigos sobre 74HC595 ou LCD de quatro linhas não descrevem o firmware atual.
