# Manual CAZE MIDI CTRL

## Footswitches

São duas páginas e seis footswitches por página. Cada um tem ações de clique simples, longo e duplo. No menu de comandos, PG significa Program Change (o enum histórico no código se chama NOTE).

| Combinação | Função |
|---|---|
| FS2 + FS4 | Entrar/sair da configuração dos footswitches |
| FS1 + FS3 | Mostrar configuração |
| FS4 + FS6 | Alternar USB/MIDI e reiniciar |
| FS5 + FS6 | Menu de expressão |

Nos menus, FS1 diminui, FS2 aumenta e FS4 avança/confirma. No menu de expressão, a calibração aparece depois de REVERSE. Consulte o [guia de calibração](EXPRESSION-CALIBRATION.md).

## LCD

Além dos seis internos, há três [foots externos globais](docs/EXTERNAL-FOOTSWITCHES.md): FS7/FS8 para o dual e FS9 para o toe switch. São configurados pelo web app e têm somente clique simples, independente da página. Começam desativados (EMPTY). O Toggle externo mantém seu estado entre páginas e envia Valor 1 no primeiro clique após ligar ou salvar.

A primeira linha mostra o label de até 12 caracteres, ou a identificação FS/página quando não há label. EXP usa as três últimas colunas; o percentual ocupa até quatro caracteres na segunda linha. Expressão desativada aparece como OFF.

CC Toggle mostra os dois valores e coloca parênteses no ativo. 0/127 aparecem como OFF/ON. A opção do editor aplica OFF ao menor valor e ON ao maior para outros pares, sem mudar os números MIDI enviados. Valores iguais mantêm a apresentação original.

Nos externos, o Toggle mostra somente o estado ativo entre parênteses. Seus dois textos são personalizáveis, até 10 caracteres cada. Nomes e estados das 45 ações compartilham 603 caracteres. EXP1/EXP2 e o percentual aparecem à direita quando a troca de expressão está configurada.

Os LEDs de footswitch foram removidos do firmware. O estado enviado continua indicado pelo LCD; a alternância dos valores MIDI permanece igual.

CC42 nos presets Nano Cortex, ou CC44 aplicado pela biblioteca Quad Cortex mini, exibe o [tap tempo](TAP-TEMPO.md) calculado localmente. A primeira pisada mostra -- BPM e as seguintes usam a média dos últimos quatro intervalos. Uma pausa maior que três segundos reinicia a sequência no próximo tap.

## Editor e persistência

[Guia de leitura/gravação](web-app/USB-WRITE.md). As edições no editor são rascunhos até Salvar preset no controlador. A gravação inclui as 45 ações, nomes e textos personalizados dos estados. Os ajustes atuais da expressão são preservados; sua calibração fica numa região independente.

Se o envio for interrompido, use Recuperar gravação. Guarde o JSON de backup baixado antes do envio. Não volte ao firmware legado após migrar sem um procedimento de restauração da EEPROM.

Veja também o [manual herdado](docs/MANUAL-inherited.md), mantido para referência histórica, que pode divergir desta adaptação.

## Duas páginas, gestos globais e EXP1/EXP2

A versão atual usa duas páginas internas e nove ações externas globais. O comando **EXP1 / EXP2** alterna CC1/CC2 do pedal local e o cabeçalho do LCD; **CC64 + PÁGINA** troca I/II na Quad e 1/2 no controlador. [Guia de configuração e migração](docs/GLOBAL-GESTURES-EXP.md).
