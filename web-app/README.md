# CAZE MIDI CTRL

Editor local em React + JavaScript. Execute `npm install` e `npm run dev` nesta pasta. `npm run build` gera a versão de produção.

Configura três páginas, seis footswitches e três gestos por switch. Rascunhos ficam no localStorage e podem ser exportados/importados como JSON validado. Labels de até 12 caracteres ASCII aparecem na prévia da primeira linha; o comando permanece na segunda e EXP à direita. A expressão e o Toggle da prévia são simulações.

O editor identifica, lê e grava no Nano por Web Serial, com o firmware atualizado e USB MODE ativo. O botão Salvar envia o preset completo e verifica a releitura. O novo mapa de EEPROM separa comandos, labels, ON/OFF, expressão e modo USB. Leituras do mapa antigo preservam labels locais; leituras v2 carregam os labels salvos no Nano. Veja [USB-WRITE.md](USB-WRITE.md) para instruções, backup e recuperação.

A prévia de expressão e os botões do editor não enviam comandos MIDI. A configuração do pedal permanece no menu físico e é preservada ao salvar pelo app.
