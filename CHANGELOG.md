# Evolução CAZE MIDI CTRL

## v1.2.0-beta.1 — 2026-10-07

- Aplicativo Windows validado pelo usuário; pacote macOS preparado, ainda pendente de validação no Mac.
- Tela inicial com conexão USB/modo demo e indicador comparado à configuração lida do controlador.
- Português-BR/English com escolha persistente, ícone próprio e instalador personalizado.
- EMPTY limpa o nome do gesto; Restaurar foot redefine os três gestos sem afetar outros foots/páginas.
- Aplicativo Electron com layout React existente e fontes locais para uso offline.
- Seleção explícita da porta USB; renderer isolado de Node e navegação restrita.
- Instalador Windows e comandos para gerar DMG/ZIP no Mac.
- Guia: [aplicativo desktop](docs/DESKTOP.md). Editor e firmware identificados como 1.2.0-beta.1.


## v1.1.0 — 2026-10-07

Versão para Quad Cortex mini, com editor React/TypeScript e styled-components. Requer atualização conjunta do firmware e editor; exporte o preset antes de migrar de três para duas páginas.

### Duas páginas, gestos externos e modos EXP

- FS7–FS9: clique, longo e duplo globais, com estados Toggle independentes por gesto e bloqueio em menus/recuperação.
- Comando EXP/EXP2: roteamento global CC1/CC2, envio da posição atual ao trocar e percentual do modo ativo no LCD.
- CC64 + PÁGINA: sincroniza I/II da Quad com 1/2 do controlador; opção disponível no CC Toggle 64 e na biblioteca.
- Migração de JSON v1/EEPROM antiga, backup da terceira página e layout v3 com 603 caracteres compartilhados; calibração preservada.

## Foots externos em entradas digitais

- FS7/FS8/FS9 passam a D8/D9/D10 com INPUT_PULLUP e contato para GND.
- Removida a leitura analógica do toe switch e a necessidade do resistor externo de A6; expressão em A0 preservada.

## Remoção dos LEDs de footswitch

- Removidos driver, estado em RAM, atualização no loop e sincronização de LEDs ao trocar páginas.
- Liberados D8, D9, D10, A1, A2 e A3; mapa dos foots externos D11/D12/A6 preservado.
- LCD, labels, histórico de CC Toggle, MIDI, expressão e EEPROM mantidos.
- PlatformIO `nanoatmega328`: Flash 22.474 → 21.892 bytes; RAM estática 1.540 → 1.523 bytes. Testes C++ de protocolo, recuperação, calibração, Toggle, LCD e debounce passaram.

## Textos dos estados e biblioteca Quad Cortex mini

- Segunda linha personalizável para TOGGLE CC nos foots 1–6, em todos os gestos/páginas; checkbox ON/OFF substituído por dois campos de texto.
- Biblioteca MIDI em modal com busca, categorias e os 34 comandos CC/PC da tabela oficial da mini (CorOS 4.1.1).
- Armazenamento compacto compatível com presets anteriores, negociação USB e validação de limites antes da gravação; calibração preservada.
- Tap explícito para CC44 da Quad mini, sem interpretar seu CC42 como tap; presets Nano Cortex anteriores preservados.
- Validação: 36 testes do editor, testes C++ com EEPROM/LCD simulados, build Vite e PlatformIO nanoatmega328.

As etapas abaixo descrevem o trabalho desta adaptação. Os commits foram reconstruídos a partir de backups; ver [histórico e limites](docs/HISTORY.md). O changelog herdado está [arquivado](docs/CHANGELOG-inherited.md).

1. **Base funcional e LCD:** firmware fornecido com LEDs diretos e expressão; impressão dos campos da segunda linha sem concatenações temporárias de String e ajuste para nanoatmega328.
2. **EXP no LCD:** 16×2, percentual do MIDI final à direita, atualização sem limpar a tela a cada amostra, Toggle compacto OFF/ON.
3. **Editor React/JavaScript:** três páginas, 54 ações, labels, prévia, presets JSON, armazenamento local e ON/OFF opcional para valores personalizados.
4. **USB leitura:** identificação, Web Serial, snapshot de EEPROM e carregamento validado no editor.
5. **Gravação e labels persistentes:** novo mapa EEPROM, migração explícita, blocos ordenados, CRC16, releitura, backup e recuperação. Remoção do buffer RAM que não abrangia todos os endereços legados.
6. **Calibração de expressão:** captura HEEL/TOE, rejeição de curso pequeno, CRC e persistência independente do preset web.
7. **Tap tempo:** cálculo para CC42, média de quatro intervalos, timeout, label personalizado e EXP preservado.
8. **Publicação:** documentação consolidada, créditos, commits reconstruídos e configuração Netlify.
9. **Externos globais (2026-10-05):** três entradas de clique simples (D11, D12 e A6 com resistor externo), configuração pelo web app, Toggle independente das páginas e labels de estados. Extensão EEPROM de 77 bytes com CRC, gravação verificada que preserva a calibração e testes C++/JavaScript. Atalhos opcionais CC47/CC64 para Quad Cortex mini; sem MIDI IN nesta etapa.

10. **Web app TypeScript (2026-10-06):** migração para TypeScript estrito e styled-components; componentes de interface, hooks de rascunho/USB, domínio e transporte separados. Tema tipado, controles compartilhados e Prettier. Layout 2.0, presets JSON e protocolo do Nano preservados. Verificação de tipos incluindo testes, 29 testes de regressão e build de produção validados; sem alteração de firmware nesta etapa.

## v1.0.0 — base publicada em 2026-09-23

Tag atribuída ao commit `9b5fe3c`: base Nano Cortex com editor React, leitura/gravação USB, labels, calibração, tap tempo CC42, documentação e créditos originais.
