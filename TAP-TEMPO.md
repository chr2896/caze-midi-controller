# Tap tempo no LCD

Configure um footswitch para CC42, mantendo canal e valor que já funcionam na sua pedaleira. Recomenda-se usar o gesto de clique simples para tap. O firmware mantém o envio MIDI e o comportamento dos LEDs; calcula o BPM no acionamento do comando, sem receber o tempo da pedaleira.

- Primeiro tap: `-- BPM`.
- A partir do segundo: BPM arredondado, pela média dos últimos quatro intervalos (até cinco taps).
- Intervalos menores que 100 ms são ignorados somente pelo cálculo; o MIDI continua sendo enviado.
- Pausa maior que 3 segundos ou mudança de footswitch, gesto, página ou canal na sequência de taps inicia nova contagem.
- O último BPM fica visível até outro comando/tela. Após a pausa, o próximo tap volta a `-- BPM`.
- CC comum e CC Toggle com número 42 ativam essa apresentação. Programa 42 e os demais comandos permanecem inalterados.
- Labels personalizados são respeitados; sem label, o título é `TAP TEMPO`. EXP continua nas últimas colunas e o percentual na segunda linha.

O estado do tap existe apenas na RAM, sem mudanças na EEPROM ou nos presets. O web app mostra `-- BPM` como prévia estática; não recebe telemetria do controlador. O resultado é uma estimativa local e pode diferir do algoritmo da pedaleira.

Teste no Nano após upload: taps a cada 500 ms devem indicar aproximadamente 120 BPM; a cada 1000 ms, 60 BPM. Depois de quatro intervalos num novo ritmo, a média usa somente esse ritmo. Verifique também pausa maior que 3 segundos, um comando diferente e expressão simultânea.
