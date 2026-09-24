# Calibração do pedal de expressão

O mapeamento anterior pressupunha que A0 percorresse de 0 a 1023. Se o pedal percorre apenas parte dessa faixa, o MIDI também fica limitado (por exemplo, 19–117). A calibração mede dois extremos reais e os converte em 0–127 antes de aplicar REVERSE e o intervalo MIDI MIN/MAX.

1. Entre no menu de expressão com FS5 + FS6.
2. Avance com FS4 pelas opções existentes. Para usar a faixa MIDI completa, mantenha MIN=0 e MAX=127.
3. Após EXP REVERSE aparece EXP CALIBRATE. O padrão NO preserva a calibração anterior; FS4 salva e sai. Escolha YES com FS1/FS2 e confirme com FS4.
4. Em HEEL DOWN, abaixe completamente o calcanhar, mantenha parado e pressione FS4.
5. Em TOE DOWN, abaixe completamente a ponta, mantenha parado e pressione FS4. A confirmação EXPRESSION / SAVED conclui o processo.

Durante as capturas, FS1 volta à escolha sem substituir a calibração anterior. Se aparecer CAL TOO SHORT, repita usando os dois extremos; o intervalo mínimo aceito é de 32 unidades ADC. A captura usa a média de 32 leituras. Entrada crescente ou decrescente é aceita; o calcanhar corresponde ao início do intervalo e REVERSE continua disponível para inverter o sentido. O envio de expressão fica suspenso durante as capturas e retorna após sair.

Os extremos são salvos nos bytes 936–939, com CRC16 em 940–941 e marcador em 942. Os presets do web app escrevem somente 0–935, portanto preservam a calibração. Sem registro válido, o firmware usa 0 e 1023, como antes. Uma interrupção durante a gravação desses sete bytes invalida a calibração, exigindo nova captura; não afeta os comandos e labels.

Após atualizar o firmware, calibre, teste todo o curso e reinicie o controlador para verificar a persistência. O indicador EXP mostra o percentual do valor MIDI final, não da leitura ADC.
