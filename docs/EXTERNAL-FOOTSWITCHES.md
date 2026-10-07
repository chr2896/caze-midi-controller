# Três footswitches externos globais

FS7 (dual superior), FS8 (dual inferior) e FS9 (toe switch do Ampero II Press) têm três ações configuráveis cada (clique, longo e duplo), válida em todas as páginas do controlador. Os seis foots internos mantêm as 36 ações e os menus existentes. Os externos são configurados pelo web app, não pelo menu físico.

Cada externo aceita EMPTY, PG, CC, CC Toggle e os comandos de página do controlador. Um contato momentâneo normalmente aberto passa por debounce de 25 ms. Sem gestos extras, o clique permanece imediato; com longo/duplo configurados, os gestos são exclusivos. Veja os tempos e a migração no [guia atualizado](GLOBAL-GESTURES-EXP.md). Acionamentos detectados nos menus ou durante recuperação são descartados. Ao ligar com o contato fechado, é preciso soltar antes da primeira pisada válida.

## Ligações

Monte e conecte os cabos com o controlador desligado. Use contatos secos, sem alimentação externa nessas entradas. Os externos não têm LEDs adicionais nesta implementação.

### Dual DIY: jack TRS

| Contato do jack | Nano | Switch esperado |
|---|---|---|
| Tip / ponta | D8 | Superior / FS7 |
| Ring / anel | D9 | Inferior / FS8 |
| Sleeve / manga | GND | Comum |

Cada botão deve fechar o seu sinal contra o comum somente enquanto pressionado. D8/D9 usam `INPUT_PULLUP`. Confira a montagem do dual com o multímetro; se a ordem física estiver invertida, troque os fios tip/ring ou configure os comandos nos foots correspondentes. O cabo precisa ser TRS; um TS aterra o anel.

### Ampero II Press: saída FOOTSWITCH separada

O [manual da Hotone](https://res.hotoneaudio.com/prod/support/Ampero%20II%C2%A0Press_Manual_EN_V02_231115.1700036824878.pdf) identifica saídas EXP e FOOTSWITCH separadas, sendo FOOTSWITCH momentânea com conector TRS. O switch exige um segundo cabo. O manual admite TS dependendo do equipamento, mas não fornece um esquema detalhado dos contatos do switch.

Antes de soldar o jack receptor, meça a saída FOOTSWITCH com o multímetro e o pedal desconectado dos equipamentos: identifique o par que fica aberto em repouso e fecha ao pressionar o toe switch. Ligue esse par à entrada D10 e ao GND. Não deduza os terminais comutados do jack pela posição física. Se não houver esse comportamento, a ligação precisa ser revista para os contatos reais.

```text
D10 -------- contato do toe switch -------- GND
             (fecha ao pressionar)
```

D10 usa `INPUT_PULLUP`, assim como D8/D9. Não é necessário resistor externo nem ligação a 5V. A entrada A6 deixou de ser usada pelo toe switch.

A saída EXP pode continuar ligada à Quad mini ou à entrada de expressão do controlador. Esta etapa **não implementa MIDI IN nem o retorno do percentual da Quad**; o indicador EXP atual continua representando o pedal conectado ao controlador. D0/RX não foi alterado.

## Configuração no web app

Selecione FS7, FS8 ou FS9 na área de foots externos. Configure o canal, o comando e seus valores. Essas ações são globais e não mudam ao trocar a página do controlador. Use EMPTY para desabilitar uma entrada.

Cada gesto aceita nome de até 12 caracteres e, em CC Toggle, dois textos opcionais de até 10 caracteres. Os nomes e estados dos três externos compartilham **603 caracteres ASCII** com os nomes/estados das ações internas, sem acentos; o editor mostra o contador e impede exceder esse limite.

O LCD mostra o label na primeira linha e somente o estado ativo, entre parênteses, na segunda. Assim `(PRESET)` e `(STOMP)` cabem sem ocupar o percentual EXP. Um estado sem texto personalizado usa o valor/ON/OFF existente. Os textos não alteram os números MIDI. Se os dois valores MIDI forem iguais, o primeiro texto é usado.

O primeiro clique envia Valor 1, o seguinte envia Valor 2. A alternância é independente para cada externo e continua ao trocar páginas. Reiniciar o controlador ou salvar uma configuração reinicia a alternância no Valor 1. O estado exibido representa o último comando enviado, sem sincronização com alterações feitas diretamente na pedaleira.

As edições são rascunhos até salvar no controlador pelo painel USB. Faça upload do firmware correspondente à pinagem D8/D9/D10 antes de usar essa ligação.

### Exemplos Quad Cortex mini

| Uso | Comando | Valor 1 / texto | Valor 2 / texto |
|---|---|---|---|
| Superior: modos padrão | CC Toggle 47 | 0 / PRESET | 2 / STOMP |
| Inferior: páginas da Quad | CC Toggle 64 | 0 / I | 127 / II |
| Toe switch | Configurável | Conforme função desejada | Conforme função desejada |

Os comandos na biblioteca MIDI do editor preenchem somente o foot selecionado e preservam o canal. Confira os modos configurados na Quad. CC64 troca as páginas I/II da Quad; NEXT/PREV/GO TO PAGE trocam as páginas do controlador. [Referência MIDI da Neural DSP](https://neuraldsp.com/manual/quad-cortex-mini).

Um CC enviado pelo toe switch só acionará o wah se a Quad estiver configurada para essa função; não há mapeamento automático de wah. CC42 nos externos é um CC comum, sem o cálculo especial de BPM dos seis foots internos. Na Quad mini o tap tempo usa CC44; a biblioteca configura o cálculo local de BPM para CC44 em qualquer foot. Presets anteriores mantêm CC42 como tap nos foots internos.

## Memória e validação

O mapa v3 armazena as nove ações externas em 180–224 e usa metadados/textos compartilhados com os internos. O mapa dos seis foots foi reorganizado; expressão e calibração permanecem nos endereços anteriores. A antiga extensão 943–1019 é preservada, mas não é usada em v3. Veja o [layout atual](../web-app/USB-WRITE.md).

O protocolo anuncia capacidade 31 e exige o novo formato de 936 bytes. Os mapas antigos continuam disponíveis para leitura. A gravação termina antes dos sete bytes físicos da calibração. O marcador de recuperação continua compartilhado: envio interrompido bloqueia comandos até a recuperação. O app bloqueia envio de externos a firmware antigo. JSON antigo sem `externals` mantém os externos já salvos no Nano quando usado diretamente pelo gravador.

Ao importar JSON antigo pela interface, os externos do rascunho atual são mantidos. Leia e carregue o Nano antes de importar se quiser partir da configuração física atual.

Validação automatizada: ida/volta de todos os campos, limite de textos, CRC, recuperação, preservação da calibração, alternância global e LCD. Testes C++ compilam o código real de configuração, executor, impressora e protocolo com EEPROM/MIDI/LCD simulados. A validação elétrica e das pisadas depende do Nano e dos pedais físicos.
