# Gravação no Nano — mapa v3

Veja o [guia de atualização e funções](../docs/GLOBAL-GESTURES-EXP.md) para migrar os presets, configurar os gestos e usar EXP1/EXP2.

## Fluxo

Ative USB MODE com FS4 + FS6, saia dos menus físicos e conecte pelo editor atualizado. Leia, baixe o backup e carregue a leitura antes de editar. Salvar envia as 36 ações internas e 9 externas. O editor guarda e baixa um JSON com o preset e os 1024 bytes anteriores antes de BEGIN. Se a persistência local falhar, a gravação não começa.

A EEPROM não comporta duas cópias. BEGIN marca a gravação incompleta antes de modificar o preset. Uma interrupção força USB recovery, sem executar comandos ou expressão de dados parciais. **Recuperar gravação** reenvia o preset do backup; não usa edições posteriores. O arquivo pode ser importado em outro navegador. Após COMMIT, o app relê e compara todos os bytes enviados e o marcador de versão antes de confirmar sucesso.

## Layout

| Endereços | Conteúdo |
|---|---|
| 0–179 | 36 ações internas × 5 bytes |
| 180–224 | 9 ações externas × 5 bytes |
| 225–314 | 45 registros de comprimentos/política de tap × 2 bytes |
| 315–917 | Pool de textos compartilhado: 603 caracteres ASCII |
| 918–923 | 45 flags ON/OFF legadas; bits restantes zero |
| 924 | Reservado, zero |
| 925 | Marcador de textos `A4` |
| 926–927 | Reservado |
| 928–934 | Expressão: marcador, habilitado, canal, CC legado, mínimo, máximo, inversão |
| 935 | USB ativo |
| 936–942 | Calibração física, nunca escrita por esse fluxo |
| 943–1019 | Antiga extensão externa, preservada e inativa em v3 |
| 1020–1023 | `43 5A 03`, estado `51` incompleto ou `A5` válido |

Índice interno: `gesto*12 + página*6 + foot`; externo: `36 + footExterno*3 + gesto`. Gestos: clique 0, longo 1, duplo 2. Os cinco bytes são canal, tipo, valor1, valor2 e valor3. Tipos 0–7 preservam seus significados; 8 alterna o roteamento EXP; 9 envia CC64=0/127 e alterna a página local, usando a página atual como referência.

Cada registro de texto contém: primeiro byte = comprimento do nome nos bits 7–4 e estado1 nos bits 3–0; segundo byte = comprimento de estado2 nos bits 3–0 e política de tap nos bits 4–5. Políticas: 0 legado (CC42 interno), 1 habilitado, 2 desabilitado. Bits 6–7 zero. Textos concatenados por ação na ordem nome/estado1/estado2, com limites 12/10/10. Campos vazios mantêm a apresentação padrão.

## Protocolo

O frame SysEx v1 de [USB-READ.md](USB-READ.md) permanece. INFO anuncia `[2,6,3,stride,60,5,31]`; stride é 48 enquanto a EEPROM for pré-v2 e 30 em v2/v3. Capacidade 16 identifica o novo layout e os gestos externos (31 = todas as capacidades anteriores + 16).

- BEGIN (CMD3): cinco bytes `[crcHi,crcLo,3,168,4]`, CRC16 CCITT-FALSE da imagem de **936 bytes**, versão negociada 4. Outros tamanhos/versões são recusados antes de alterar EEPROM. Menus físicos ativos retornam status 2.
- BLOCK (CMD4): offset alto/baixo e 1–16 bytes; somente próximo offset esperado, dentro da imagem.
- COMMIT (CMD5): exige imagem completa, CRC, comandos válidos, destinos 0/1, textos e expressão válidos. Só então marca `A5`; reinicia estados de execução e volta à página 1/EXP1 quando o roteamento duplo estiver configurado.
- Respostas: comando | 0x40; status 0 sucesso, 1 inválido, 2 menu ativo.
- O editor exige v3 também na releitura; ACK isolado não confirma gravação.

Firmware novo ainda **lê** EEPROM legada e v2 (labels fixos ou compactos A3, externos globais simples). Só escreve v3. Firmware anterior pode ser lido pelo app, mas a gravação fica desabilitada. JSON v1 é migrado para v2 do preset; o envelope de recuperação continua versão 2. Não faça downgrade após gravar v3.

A calibração mantém seus endereços e checksum. A expressão usa o CC legado até existir uma ação EXP1/EXP2; nesse caso CC1/CC2 são selecionados em RAM, sem gravar EEPROM a cada pisada.
