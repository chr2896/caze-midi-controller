# CAZE MIDI CTRL

Controlador MIDI para **Arduino Nano ATmega328P**, com seis footswitches, LCD 16×2, pedal de expressão e editor web em React + TypeScript e styled-components.

> Adaptação independente do [Open Midi Controller, de galczo5](https://github.com/galczo5/open-midi-controller). A autoria original e a licença recebida foram preservadas. Veja [créditos](docs/CREDITS.md).

## O que ele faz

- **45 ações:** 36 nos seis footswitches internos (duas páginas × três gestos) e nove nos três externos globais.
- **Três externos globais:** dual momentâneo e toe switch, com clique simples, comandos configuráveis e textos por estado do Toggle. Veja [ligações e configuração](docs/EXTERNAL-FOOTSWITCHES.md).
- Program Change, CC, CC Toggle e navegação de páginas.
- Labels ASCII de até 12 caracteres, salvos no Nano.
- Indicador de expressão à direita do LCD, com percentual do MIDI final.
- Calibração de calcanhar/ponta, MIN/MAX, canal, CC e REVERSE.
- Tap tempo local para CC42 (Nano Cortex) e CC44 via biblioteca (Quad mini): média dos últimos quatro intervalos.
- Editor com prévia do LCD, presets JSON, Web Serial, leitura e gravação verificada.
- Backup antes da gravação e recuperação após envio interrompido.

```text
TAP TEMPO    EXP
120 BPM      75%
```

O envio MIDI funciona sem o computador. O editor é usado para configuração; seu controle de expressão é uma simulação, não telemetria do board.

## Começar

### Conheça o editor web

![Editor CAZE MIDI CTRL com três foots externos globais e textos PRESET/STOMP](docs/images/caze-midi-external-foots.png)

*Captura real do editor com exemplos PRESET/STOMP e página I/II nos externos. Nano desconectado; o percentual de expressão mostrado é uma simulação.*

| Área do editor | O que você pode fazer |
|---|---|
| **Controlador USB** | Conectar o Nano por Web Serial, ler a configuração, baixar um backup da EEPROM e gravar o preset completo com conferência por releitura. |
| **Páginas e footswitches** | Selecionar uma das duas páginas e um dos seis footswitches, na mesma disposição física do board. |
| **Clique, Longo e Duplo** | Configurar separadamente os três gestos de cada footswitch, com 36 ações internas e nove externas globais. |
| **Foots externos** | Configurar FS7/FS8/FS9, globais em todas as páginas, com labels e textos como PRESET/STOMP. A biblioteca em modal oferece os 34 comandos CC/PC da tabela da Quad mini. |
| **Prévia do LCD** | Visualizar o label, os valores do comando e o indicador EXP antes de salvar. O slider simula a expressão; não movimenta nem lê o pedal real. |
| **Comandos e labels** | Escolher o tipo de comando, canal, número de CC/programa, valores e um label de até 12 caracteres sem acentos. |
| **Textos do CC Toggle** | Personalizar os dois estados da segunda linha nos foots 1–9, com até 10 caracteres por estado, mantendo os valores MIDI. |
| **Importar / Exportar** | Levar presets JSON entre computadores ou entre localhost e o site publicado. O rascunho também fica salvo neste navegador. |
| **Recuperação** | Repetir uma gravação interrompida usando o preset e o backup guardados antes do envio. |

As alterações só chegam ao Nano ao clicar em **Salvar preset no controlador**. A calibração física da expressão é feita no menu do board; o BPM de CC42 é calculado pelas pisadas no controlador, sem telemetria ao editor.

### Firmware

Instale PlatformIO e abra a raiz deste projeto:

```sh
pio run -e nanoatmega328
pio run -e nanoatmega328 -t upload
```

A placa testada usa **`board = nanoatmega328`**. Desconecte o editor/monitor serial antes do upload. Após migrar os presets para o mapa v3, não instale o firmware antigo diretamente: ele interpreta os endereços de outra forma.

### Editor local

Requer Node.js 22 e npm:

```sh
cd web-app
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite. Para conferir o app:

```sh
npm test
npm run build
```

### Editor online

É possível publicar o app no Netlify, sem depender de localhost. A configuração está em `netlify.toml`; siga [publicação por HTTPS](docs/DEPLOY.md). Ainda será necessário conectar o Nano por USB ao computador e autorizar a porta no navegador.

## Usar com o Nano

1. Instale o firmware atual.
2. Ative **USB MODE com FS4 + FS6** e saia dos menus físicos.
3. No editor, conecte a porta do Nano e clique em **Ler controlador**.
4. Baixe o backup e carregue a leitura antes de editar, se quiser preservar os comandos existentes.
5. Edite o preset e clique em **Salvar preset no controlador**. Isso grava as 36 ações internas e nove externas no firmware atualizado, não apenas o footswitch selecionado.
6. Aguarde a confirmação pela releitura. Os labels funcionam mesmo após desligar o computador.

O modo USB usa serial a 115200 baud; o modo MIDI DIN usa 31250. O Nano com CH340 não se torna um dispositivo USB MIDI nativo. Para usar DIN, volte ao modo MIDI com a combinação existente.

## Guias

| Assunto | Documento |
|---|---|
| Hardware e pinagem atual | [BUILD.md](BUILD.md) |
| Dual foot e toe switch do Ampero II Press | [EXTERNAL-FOOTSWITCHES.md](docs/EXTERNAL-FOOTSWITCHES.md) |
| Menus, footswitches e uso | [MANUAL.md](MANUAL.md) |
| Upload | [UPLOADING.md](UPLOADING.md) |
| Gravação, EEPROM e recuperação | [USB-WRITE.md](web-app/USB-WRITE.md) |
| Calibração da expressão | [EXPRESSION-CALIBRATION.md](EXPRESSION-CALIBRATION.md) |
| Tap tempo | [TAP-TEMPO.md](TAP-TEMPO.md) |
| Hospedagem gratuita/HTTPS | [DEPLOY.md](docs/DEPLOY.md) |
| Evolução por etapa | [CHANGELOG.md](CHANGELOG.md) |
| ZIPs e reconstrução Git | [HISTORY.md](docs/HISTORY.md) |
| Origem e licença | [CREDITS.md](docs/CREDITS.md), [LICENSE.txt](LICENSE.txt) |

## Estado e limites

Firmware e editor foram desenvolvidos e testados incrementalmente no board do projeto. O usuário confirmou o funcionamento da gravação, labels e tap tempo. A compilação não substitui testes na sua montagem; o comportamento elétrico depende do pedal, cabo e jack.

- Não há leitura do BPM interno da pedaleira: o número é calculado pelas pisadas.
- Os rascunhos e recuperação ficam no navegador; exporte-os antes de trocar de domínio/computador.
- A gravação não tem segunda cópia completa na EEPROM. Se interrompida, o Nano aguarda recuperação por USB.
- O mapa legado tinha sobreposições; dados já sobrescritos nele não podem ser reconstruídos automaticamente.
- O projeto não implementa uma entrada MIDI para sincronismo externo.

## Créditos e licença

Projeto original: **[galczo5/open-midi-controller](https://github.com/galczo5/open-midi-controller)**. Adaptação CAZE e testes: **Carlos Henrique (CAZE)**, com assistência de desenvolvimento do Codex. O arquivo MIT [LICENSE.txt](LICENSE.txt), incluindo o aviso de Francois Best presente na base, foi mantido intacto. Bibliotecas mantêm suas próprias licenças.

Os documentos herdados estão em `docs/*-inherited.md`; as fotos da base são do projeto herdado, não desta montagem.

Os textos internos usam um pool de 603 caracteres compartilhado por nomes/estados das 45 ações. Para gravá-los, atualize o firmware do Nano. [Biblioteca MIDI e limites de texto](web-app/README.md#biblioteca-quad-cortex-mini-e-segunda-linha).

### Gestos externos e modos EXP

Agora são **duas páginas internas** e **três gestos globais por foot externo**. Os novos comandos EXP1/EXP2 e CC64 + PÁGINA roteiam a expressão e sincronizam as páginas da Quad mini. [Atualização, migração e uso](docs/GLOBAL-GESTURES-EXP.md).
