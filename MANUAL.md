# Manual CAZE MIDI CTRL

## Footswitches

São três páginas e seis footswitches por página. Cada um tem ações de clique simples, longo e duplo. No menu de comandos, PG significa Program Change (o enum histórico no código se chama NOTE).

| Combinação | Função |
|---|---|
| FS2 + FS4 | Entrar/sair da configuração dos footswitches |
| FS1 + FS3 | Mostrar configuração |
| FS4 + FS6 | Alternar USB/MIDI e reiniciar |
| FS5 + FS6 | Menu de expressão |

Nos menus, FS1 diminui, FS2 aumenta e FS4 avança/confirma. No menu de expressão, a calibração aparece depois de REVERSE. Consulte o [guia de calibração](EXPRESSION-CALIBRATION.md).

## LCD e LEDs

A primeira linha mostra o label de até 12 caracteres, ou a identificação FS/página quando não há label. EXP usa as três últimas colunas; o percentual ocupa até quatro caracteres na segunda linha. Expressão desativada aparece como OFF.

CC Toggle mostra os dois valores e coloca parênteses no ativo. 0/127 aparecem como OFF/ON. A opção do editor aplica OFF ao menor valor e ON ao maior para outros pares, sem mudar os números MIDI enviados. Valores iguais mantêm a apresentação original.

No comportamento atual dos LEDs, CC comum fica aceso depois de acionado; Toggle usa o primeiro valor configurado como estado aceso. A opção visual ON/OFF do LCD não altera essa lógica.

CC42 exibe o [tap tempo](TAP-TEMPO.md) calculado localmente. A primeira pisada mostra -- BPM e as seguintes usam a média dos últimos quatro intervalos. Uma pausa maior que três segundos reinicia a sequência no próximo tap.

## Editor e persistência

[Guia de leitura/gravação](web-app/USB-WRITE.md). As edições no editor são rascunhos até Salvar preset no controlador. A gravação inclui as 54 ações, labels e ON/OFF. Os ajustes atuais da expressão são preservados; sua calibração fica numa região independente.

Se o envio for interrompido, use Recuperar gravação. Guarde o JSON de backup baixado antes do envio. Não volte ao firmware legado após migrar sem um procedimento de restauração da EEPROM.

Veja também o [manual herdado](docs/MANUAL-inherited.md), mantido para referência histórica, que pode divergir desta adaptação.
