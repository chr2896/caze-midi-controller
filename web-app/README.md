# MIDI Studio

Editor local em React + JavaScript. Execute `npm install` e `npm run dev` nesta pasta. `npm run build` gera a versão de produção.

Configura três páginas, seis footswitches e três gestos por switch. Rascunhos ficam no localStorage e podem ser exportados/importados como JSON validado. Labels de até 12 caracteres ASCII aparecem na prévia da primeira linha; o comando permanece na segunda e EXP à direita. A expressão e o Toggle da prévia são simulações.

O editor agora identifica o Nano e lê sua EEPROM por Web Serial, com o firmware atualizado e USB MODE ativo. A leitura só substitui os comandos do rascunho quando solicitada; labels e ON/OFF locais são preservados. É possível baixar o backup bruto da EEPROM. Veja [USB-READ.md](USB-READ.md) para instruções e limitações do mapa de memória legado.

Ainda não há gravação no Nano nem armazenamento de labels no firmware. A prévia de expressão e os botões do editor não enviam comandos MIDI.
