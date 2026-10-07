# CAZE MIDI CTRL — Web app

Editor em React + TypeScript (modo estrito), com styled-components e Vite. A interface mantém o dark mode, o LCD 16×2 entre duas fileiras de foots e o editor contextual.

## Desenvolvimento

Requer Node.js 22 e npm. O projeto mantém `package-lock.json` como lockfile oficial para instalações reproduzíveis; não é necessário instalar Yarn.

```sh
cd web-app
npm ci
npm run dev -- --port 5174
```

Abra o endereço mostrado pelo Vite. As alterações em componentes e estilos são recarregadas automaticamente. Para editar pelo VS Code, comece pelos arquivos abaixo.

## Onde editar

| Área | Arquivos |
| --- | --- |
| Composição da tela e seleção do foot | `src/App.tsx` |
| Topo e botões principais | `src/components/AppHeader.tsx` e `.styles.ts` |
| Pedal, LCD, páginas e expressão simulada | `src/components/ControllerPreview.tsx` e `.styles.ts` |
| Campos e atalhos de um foot | `src/components/FootEditor.tsx` e `.styles.ts` |
| Janelas e botões reutilizáveis | `src/components/Modal.tsx`, `src/components/ui/` |
| Cores e fontes compartilhadas | `src/styles/theme.ts` |
| Reset e acessibilidade visual | `src/styles/GlobalStyles.styles.ts` |
| Rascunho, importação/exportação e persistência | `src/hooks/usePreset.ts` |
| Conexão, leitura, gravação e recuperação USB | `src/hooks/useUsbController.ts` |
| Transporte Web Serial | `src/services/serial-client.ts` |
| Tipos, validação, LCD, protocolo e EEPROM | `src/domain/` |
| Testes de regressão em TypeScript | `src/tests/` |

Os estilos de cada seção são encapsulados em seu componente styled, com seletores locais no arquivo `.styles.ts`. Botões, importadores de arquivo e textos auxiliares têm componentes compartilhados em `ui/`. `ThemeProvider` fornece cores e tipografia tipadas. O CSS global contém apenas a base da página e regras gerais de acessibilidade.

## Verificações

```sh
npm run lint         # Biome: imports, acessibilidade e regras recomendadas
npm run lint:fix     # Correções seguras do Biome
npm run typecheck    # TypeScript estrito, incluindo testes
npm test            # Testes de protocolo, memória, presets, LCD e recuperação
npm run format      # Formata os arquivos com Prettier
npm run check       # Tipagem + Biome + testes + verificação de formatação
npm run build       # Tipagem + bundle de produção em dist/
npm run preview     # Prévia local do bundle
```

## Compatibilidade e USB

O formato JSON v2 usa duas páginas e nove ações externas; presets JSON v1 são migrados e o rascunho anterior é preservado em uma chave de backup. Presets antigos sem foots externos continuam aceitos. As 36 ações internas, três foots externos, labels, ON/OFF, tap tempo e a calibração existente permanecem compatíveis.

A janela USB mantém seu componente montado ao fechar, preservando a conexão. A gravação conserva o backup anterior, valida o mapa de EEPROM e confere a releitura. Veja [USB-WRITE.md](USB-WRITE.md) e [USB-READ.md](USB-READ.md).

A prévia de expressão e os foots da tela não enviam comandos MIDI. A configuração/calibração física continua no firmware. A migração para TypeScript não exigiu upload; os novos textos internos e a identificação de tap da biblioteca exigem o firmware atualizado.

O `netlify.toml` na raiz continua usando `npm run build` e a pasta `dist`. Web Serial precisa de navegador compatível e contexto seguro (HTTPS ou localhost).

O Biome verifica o código e organiza imports; o Prettier continua responsável pela formatação. O formatter do Biome fica desativado para evitar conflitos entre as ferramentas. Uma exceção local documentada preserva o foco do editor ao trocar de foot.

## Biblioteca Quad Cortex mini e segunda linha

Selecione um foot e clique em **Biblioteca MIDI · Quad Cortex mini**. O modal oferece busca por nome/CC, categorias e os 34 comandos da tabela de entrada (33 CC + Program Change), com base no [manual oficial CorOS 4.1.1](https://neuraldsp.com/manual/quad-cortex-mini). Escolha valores fixos ou dois estados nos comandos compatíveis e aplique ao gesto selecionado. O canal MIDI é mantido; confira se corresponde ao da Quad. CC0, CC32 e PC continuam sendo mensagens separadas.

Nos foots 1–6, assim como nos externos, TOGGLE CC oferece **Texto do valor 1/2**. São até 10 caracteres ASCII por estado; exemplo `(PRESET)` / `(STOMP)`. O checkbox ON/OFF foi substituído por esses campos. O contador informa o limite compartilhado de 603 caracteres para as 45 ações (internas e externas, todos os gestos). Campos vazios preservam a apresentação anterior.

A biblioteca diferencia CC42 da mini (foot D da página II) do antigo tap da Nano Cortex e configura CC44 com cálculo local de BPM. O looper envia 127 em cada pisada nos comandos de acionamento. Isso não adiciona sincronização de estado ou leitura de BPM da Quad. A prévia é local; para uso físico, faça upload do novo firmware e depois salve pelo painel USB.

## Gestos globais, EXP1/EXP2 e páginas sincronizadas

Os foots externos oferecem Clique, Longo e Duplo numa única configuração global. A lista de tipos inclui **EXP1 / EXP2** e **CC64 + PÁGINA**; CC Toggle 64 também oferece um checkbox de sincronização. Veja o [guia completo](../docs/GLOBAL-GESTURES-EXP.md), incluindo a migração da antiga página 3, timings dos gestos e a configuração dos blocos na Quad.
