# Aplicativo desktop — 1.2.0-beta.1

O mesmo editor React/TypeScript roda dentro do Electron, sem servidor localhost. Layout, presets, biblioteca MIDI e protocolo USB são compartilhados com a versão web. As fontes estão incluídas para uso offline. Editor e firmware exibem 1.2.0-beta.1. O protocolo USB continua compatível com o firmware v1.1.0; a revisão nova mantém o mesmo formato.

## Windows

O instalador de teste fica em `web-app/release/desktop/CAZE MIDI CTRL Setup 1.2.0-beta.1.exe`. Instala apenas para o usuário atual, sem exigir administrador. Ainda não há assinatura digital de distribuição.

Para gerar novamente, com Node.js 22.12 ou superior e npm, na pasta `web-app`:

```sh
npm ci
npm run desktop:win
```

Para abrir sem instalar: `npm run desktop:start`. Para verificar a inicialização com perfil temporário: `npm run desktop:build` e `npm run desktop:test`.

## macOS

Na máquina Mac, copie o projeto atualizado (sem node_modules, dist, desktop-dist e release) e execute na pasta `web-app`:

```sh
npm ci
npm run desktop:start
npm run desktop:mac
```

O pacote DMG/ZIP é gerado para a arquitetura do Mac utilizado (Apple Silicon ou Intel). Gere em cada arquitetura para validar ambas. Não copie node_modules do Windows. Assinatura Developer ID e notarização para distribuição pública ainda não foram configuradas.

## Configurações e USB

O aplicativo tem armazenamento próprio: exporte seu JSON pelo navegador e importe no desktop, ou leia o preset do Nano. Os rascunhos do navegador não são transferidos automaticamente.

1. Feche a conexão USB no navegador/monitor serial.
2. No aplicativo, abra Ler / Salvar e conecte.
3. Selecione explicitamente a porta do Nano na janela de seleção.
4. Leia e confira o preset antes de salvar.

A seleção de portas funciona sob demanda. Caso conecte o cabo depois de abrir a seleção, cancele e tente novamente para atualizar a lista. Nenhuma porta é selecionada automaticamente.

## Validação e limites desta beta

Build React e TypeScript desktop; teste de inicialização com React renderizado a partir de arquivo local, Web Serial disponível e Node isolado do renderer; captura da janela conferida. Instalador Windows gerado. Testes físicos de leitura/gravação USB e validação em macOS ainda pendentes. A beta não instala firmware automaticamente e não possui atualizador automático.

## Estrutura

- `desktop/main.ts`: janela, seleção da porta serial, permissões e links externos.
- `desktop/smoke.ts`: teste com perfil temporário separado dos presets reais.
- `desktop-dist`: resultado da compilação TypeScript (ignorado no Git).
- `release`: pacotes gerados (ignorados no Git).

Referências: [Electron Web Serial](https://www.electronjs.org/docs/latest/tutorial/devices#web-serial-api) e [electron-builder](https://www.electron.build/).

## Tela inicial e sincronização

Conectar controlador abre a seleção USB e, após identificação, o painel de leitura/gravação. Modo demo abre o editor sem conectar hardware. As edições continuam salvas localmente. O aviso de alterações não enviadas só é limpo ao carregar uma leitura completa e válida ou após gravação conferida no Nano. Exportar JSON não equivale a salvar no controlador. Ao reabrir, um rascunho existente precisa ser conferido novamente com o dispositivo.

## Identidade visual

Ícone próprio em SVG/PNG/ICO/ICNS e imagens para cabeçalho, boas-vindas e conclusão do instalador NSIS. Fontes vetoriais em `web-app/build`; execute `npm run branding` na pasta web-app para regenerar os formatos. O instalador mantém os controles nativos do Windows; as áreas ilustradas usam a paleta escura/ciano do editor. A tela inicial do aplicativo faz a recepção, sem splash separada nem atraso artificial. Ícone macOS preparado; validação visual no Mac pendente.

## Idioma da interface

O seletor mostra apenas o idioma ativo e abre Português-BR/English ao clicar, com bandeiras em SVG (também funcionam no Windows). Fica no canto inferior direito da tela inicial e no cabeçalho do editor. A escolha é persistida neste dispositivo e funciona offline. Os textos portugueses editados pelo usuário foram preservados como origem das traduções em `src/i18n/en.json`.

Trocar o idioma não modifica nomes personalizados, textos enviados ao LCD, presets, canais ou comandos MIDI. Modais, biblioteca e mensagens USB são traduzidos na apresentação. O idioma do LCD físico permanece independente. Foram validados 43 testes, build e fluxo desktop de troca de idioma durante edição sem alteração do preset.

## Restaurar um foot

Selecionar EMPTY limpa o nome no display do gesto atual. Restaurar foot redefine os três gestos do foot na página atual; para externos, redefine os três gestos globais. Os demais foots/páginas permanecem intactos. É necessário salvar no controlador para aplicar ao hardware.
