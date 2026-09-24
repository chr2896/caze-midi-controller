> Registro da etapa anterior (firmware somente leitura). Para o firmware atual com gravação e mapa v2, siga [USB-WRITE.md](USB-WRITE.md).

# Conexão USB — somente leitura

1. Compile e faça upload do firmware desta pasta usando `board = nanoatmega328`. O firmware anterior não responde ao editor. Esta tarefa não faz upload automaticamente.
2. Ative o modo USB com FS4 + FS6. Essa combinação já existia: alterna o modo e reinicia o Nano. Confirme `USB MODE / ENABLED` no LCD. A combinação inversa volta ao modo MIDI DIN.
3. Feche o monitor serial e qualquer ponte MIDI que esteja usando a mesma porta.
4. Abra o editor em `http://127.0.0.1:5173` no Chrome/Edge com Web Serial disponível. Clique em **Conectar controlador** e escolha a porta do Nano. A abertura pode reiniciar a placa; aguarde a identificação.
5. Clique em **Ler controlador**. Baixe o backup bruto de EEPROM e, se desejar, carregue os comandos válidos no editor. O carregamento substitui apenas os campos de comandos; preserva labels e toggleOnOff. Dados inválidos mantêm o rascunho e geram avisos. O rascunho anterior fica na chave localStorage `midi-controller-preset-v1-before-usb`.
6. Desconecte no app para liberar a porta antes de um novo upload.

Não há comando de gravação, migração ou reset remoto. A leitura não escreve na EEPROM. O startup original pode inicializar configurações de expressão se o marcador EEPROM estiver ausente; esse comportamento existente não foi modificado. O modo USB existente usa 115200 baud em vez dos 31250 do MIDI DIN; não usar saída DIN como MIDI padrão nesse modo.

## Protocolo v1

115200 baud, 8N1. Frame: `F0 7D 43 5A 01 CMD SEQ [PAYLOAD em nibbles alto/baixo] CHECKSUM F7`.
SEQ: 1–127. CHECKSUM: `(CMD + SEQ + soma dos bytes originais de PAYLOAD) & 127`.
Identificar: CMD=1, sem payload; resposta CMD=0x41, payload `[3,6,3,48,90,5,1]` (páginas, footswitches, gestos, stride de página, stride de gesto, tamanho de ação, capacidade somente leitura).
Snapshot: CMD=2, sem payload; resposta CMD=0x42, payload de 1024 bytes de EEPROM. Bytes >=248 são MIDI realtime e ignorados pelo parser. Frames estranhos, excessivos ou corrompidos são descartados. O firmware aceita apenas pedidos sem payload de comprimento exato; recepção parcial expira em 250 ms.

A resposta é transmitida inteira e diretamente da EEPROM, sem alocar uma cópia em RAM. Há uma pausa de aproximadamente 180 ms no loop durante o snapshot USB; use a leitura durante configuração. O protocolo não encaminha os pedidos ao MIDI e não altera canais, CC, valores, página ativa ou LEDs. A biblioteca MIDI atual tem `UseRunningStatus=false`, portanto o envio direto da resposta não deixa running status em cache.

## Limitação encontrada no mapa original

O firmware usa `page*48 + foot*5 + gesture*90` e buffer RAM de 270 bytes. Há sobreposição entre gestos/páginas (por exemplo, página 3 clique e página 1 longo), e a última ação chega ao endereço 305. Não alteramos esse mapa nesta etapa. A leitura é da EEPROM, inclusive além de 269, sem acessar fora do buffer RAM. Não se deve interpretar essa leitura como garantia do comportamento em execução nas ações afetadas. Antes de implementar gravação e labels persistentes, precisamos corrigir o layout com migração e backup explícitos.

Referência Web Serial: https://developer.chrome.com/docs/capabilities/serial
