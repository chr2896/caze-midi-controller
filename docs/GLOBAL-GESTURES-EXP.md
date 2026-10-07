# Duas páginas, gestos externos e modos de expressão

## Atualização e migração

1. Exporte seu preset e baixe a EEPROM antes de gravar. O backup do código anterior está em `before-global-gestures-exp-modes.zip`.
2. Faça upload com PlatformIO, ambiente **nanoatmega328**. O upload sozinho não converte a EEPROM: o firmware ainda lê o mapa anterior, usando suas páginas 1/2 e o clique simples dos externos.
3. Abra o editor atualizado, ative USB MODE (FS4 + FS6), leia o controlador e carregue a leitura. Revise os avisos de migração.
4. Salve o preset pelo editor. Essa gravação instala o mapa novo, com 36 ações internas e 9 externas. A expressão e sua calibração são preservadas.
5. Teste as pisadas e reinicie para conferir a persistência.

Presets JSON v1 com três páginas são importados para v2 com duas páginas. As páginas 1/2 mantêm comandos, gestos, nomes e estados; a página 3 não é executada no novo formato. Destinos explícitos da página 3 são ajustados para página 2. Os três comandos externos anteriores viram o gesto Clique, e os demais gestos começam vazios.

O rascunho antigo do navegador é guardado em uma chave separada e pode ser baixado em **Importar / Exportar → Baixar preset anterior de 3 páginas**. Arquivos importados continuam disponíveis no arquivo original. Antes de escrever na EEPROM, o painel USB guarda e baixa um backup com todos os bytes anteriores, inclusive a antiga página 3. Não faça downgrade do firmware depois de gravar o novo mapa.

## Foots externos globais

| Foot | Entrada | Gestos configuráveis |
|---|---|---|
| FS7 — dual superior | D8 | Clique, Longo, Duplo |
| FS8 — dual inferior | D9 | Clique, Longo, Duplo |
| FS9 — toe switch | D10 | Clique, Longo, Duplo |

Todos usam INPUT_PULLUP e contato momentâneo para GND, sem resistor externo. As nove ações são globais: trocar páginas internas não muda sua configuração nem mistura a alternância dos diferentes gestos. As configurações permanecem ao desligar; estados de alternância em execução reiniciam.

- Debounce: 25 ms.
- Sem longo/duplo configurados: clique imediato ao pressionar após debounce, como antes.
- Com gestos extras: clique simples após soltar; se houver duplo, aguarda 250 ms após a soltura para não enviar o simples junto.
- Longo: um evento ao completar 1 s pressionado; não repete e não envia simples ao soltar.
- Duplo: duas pisadas com até 250 ms entre a primeira soltura e a segunda pressão estabilizadas; dispara ao soltar a segunda.
- Pisadas nos menus/recuperação são descartadas. Contato fechado ao ligar precisa ser solto antes de funcionar.

## EXP1 / EXP2

Escolha **EXP1 / EXP2** na lista de tipos de comando de qualquer foot/gesto. Se esse comando existir na configuração salva, o controlador inicia em EXP1; cada acionamento alterna globalmente EXP1 (CC1) e EXP2 (CC2).

Isso roteia o **pedal de expressão conectado ao controlador em A0**. Ambos usam o canal, limites, inversão e calibração do menu de expressão. Ao trocar, a posição atual é enviada imediatamente no novo CC, mesmo sem movimentar o pedal. O modo anterior mantém o último valor enviado. Sem nenhuma ação EXP1/EXP2 configurada, continua valendo o CC ajustado no menu de expressão.

O canto direito do LCD mostra `EXP1` ou `EXP2` na primeira linha e o percentual do modo ativo na segunda. O espaço de 12 caracteres dos labels permanece disponível. Os dois modos não são exibidos simultaneamente. Reiniciar ou salvar configuração volta a EXP1.

Na Quad, associe EXP1 ao volume e EXP2 ao parâmetro do wah ou whammy. Trocar o CC não aciona automaticamente o bypass do bloco: configure esse comportamento na pedaleira ou atribua outro gesto ao comando correspondente. Esta função não acrescenta MIDI IN nem controla o pedal ligado diretamente à Quad.

## CC64 + página do controlador

Escolha **TOGGLE CC**, configure o número **64** e marque **Sincronizar páginas do controlador e da Quad Cortex**. A biblioteca da Quad mini também oferece essa opção no comando de páginas.

O comando usa a página local como referência: estando em P1, envia CC64=127 e muda para P2/II; estando em P2, envia CC64=0 e muda para P1/I. O canal MIDI é configurável. Qualquer outro foot com essa função acompanha o mesmo estado global; não depende de um histórico Toggle separado. A troca prevalece sobre um retorno pendente de página temporária.

Nomes e textos I/II podem ser personalizados. Sem texto de estado, o LCD mostra `PAGE I / P1` ou `PAGE II / P2`. Um CC Toggle 64 sem a opção continua controlando somente a Quad. As trocas locais normais continuam locais. Como não há retorno MIDI de estado, uma troca feita diretamente na Quad não atualiza o controlador; a próxima pisada sincronizada envia um destino explícito e alinha os dois.

## Memória e validação

Os nomes (até 12 caracteres) e estados (até 10 por campo) das **45 ações** compartilham **603 caracteres ASCII**. O editor mostra o contador e impede exceder o limite. O mapa deixa 943–1019 preservado, mas sem uso ativo no formato novo.

A suíte verifica leitura de fixtures antigos, migração e negociação de formato, recuperação, limites de texto, gestos exclusivos, alternância independente, páginas sincronizadas, roteamento EXP com ADC simulado e LCD 16×2. A validação física das entradas e da Quad ainda deve ser feita no board.
