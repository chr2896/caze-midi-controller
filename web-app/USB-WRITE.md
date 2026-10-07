# Gravação no Nano e labels persistentes

## Primeiro teste

1. Faça upload do firmware atualizado para `nanoatmega328`. Somente o upload não migra a EEPROM; o mapa antigo continua sendo reconhecido.
2. Ative USB MODE com FS4 + FS6, saia dos menus e feche outros programas que usam a mesma porta.
3. Conecte no editor, leia e baixe o backup bruto. Clique em **Substituir comandos locais pela leitura** para partir dos comandos atuais. Confira os avisos: dados inválidos do mapa antigo mantêm o rascunho local e não podem ser recuperados automaticamente.
4. Edite os comandos, nomes e textos dos estados. **Salvar preset no controlador** substitui as 54 ações pelo preset exibido. A expressão atual é copiada da leitura imediatamente anterior ao envio; o modo USB permanece ativo.
5. O app guarda no navegador e inicia o download de um JSON com a EEPROM anterior e o preset enviado. Guarde esse arquivo. Se o armazenamento local falhar, a gravação não começa.
6. Aguarde a confirmação pela releitura. Durante a gravação, o LCD mostra `USB CONFIG / USE WEB APP`. Ao concluir, teste os footswitches e os labels; desligue e ligue para confirmar persistência. O percentual EXP permanece à direita.

Labels ASCII de até 12 caracteres substituem o título da primeira linha; sem label, permanece FS e página. Em TOGGLE CC, os dois estados aceitam textos ASCII de até 10 caracteres. Com texto personalizado, o LCD mostra apenas o estado ativo entre parênteses, mantendo EXP à direita. Sem textos, a apresentação anterior é preservada. O antigo checkbox ON/OFF foi removido; sua flag continua aceita para preservar presets existentes. Os textos não modificam valores MIDI.

## Recuperação

A EEPROM não comporta duas cópias completas. A gravação não é atomicamente reversível: antes do primeiro bloco, ela é marcada como incompleta. Se a USB cair ou faltar energia, o firmware não executa ações nem expressão dessa imagem parcial; inicia em USB e aguarda **Recuperar gravação**. Essa operação repete o preset guardado antes do envio, não o rascunho editado depois. Se trocar de navegador ou perder o armazenamento local, use **Importar recuperação** com o JSON baixado. A recuperação também é verificada por releitura.

Não faça downgrade para o firmware antigo após migrar: ele não reconhece o novo mapa e pode interpretar labels como configurações de expressão/USB. O ZIP anterior guarda o código, não a EEPROM do seu Nano. O JSON de backup contém os bytes anteriores; restauração bruta do mapa antigo não é oferecida por este editor.

## Mapa v2

| Endereços | Conteúdo |
|---|---|
| 0–269 | 54 comandos × 5 bytes |
| 270–917 | Labels fixos legados ou metadados + textos compactos (ver abaixo) |
| 918–924 | 54 bits ON/OFF |
| 925 | `A3` para textos compactos; zero para labels fixos |
| 926–927 | Reservado |
| 928–934 | Expressão: marcador, habilitado, canal, CC, mínimo, máximo, reverse |
| 935 | Modo USB |
| 936–942 | Calibração física de expressão (independente da gravação do app) |
| 943–1019 | Três foots externos globais, textos compactos e CRC16 |
| 1020–1023 | `43 5A 02`, estado `51` incompleto ou `A5` válido |

Índice de ação: `gesto*18 + página*6 + footswitch`, todos base zero. Comando no índice × 5. O firmware lê os comandos direto da EEPROM, sem o antigo buffer de 270 bytes. Sem marcador v2, o endereço legado `page*48 + foot*5 + gesture*90` permanece reconhecido; suas sobreposições não podem ser desfeitas automaticamente. A primeira gravação distribui o preset revisado no mapa novo.

## Protocolo

Mantém o frame v1 em [USB-READ.md](USB-READ.md). Identificação anuncia capacidade 15 (leitura + gravação + externos + textos compactos/tap explícito) e stride 30 quando o mapa é v2. O editor atualizado também aceita capacidade 1 para leitura e 3/7 para gravação de imagens sem os novos textos/metadados. Editores antigos que exigem capacidade 3 precisam ser atualizados.

- CMD 3 BEGIN: payload CRC16 CCITT-FALSE (alto/baixo). Dois bytes mantêm o formato de 936 bytes, preservando os externos. Para gravar externos, envie mais dois bytes de tamanho (alto/baixo), totalizando 1013 bytes. Marca a imagem incompleta e reinicia o offset em zero. Recusado enquanto um menu físico estiver ativo; tamanhos desconhecidos são recusados antes de alterar a memória.
- CMD 4 BLOCK: offset lógico alto/baixo e 1–16 bytes. Só aceita o próximo offset esperado dentro do tamanho negociado. Offsets 0–935 correspondem à mesma posição física; 936–1012 correspondem a 943–1019, pulando a calibração. Usa `EEPROM.update`.
- CMD 5 COMMIT: sem payload. Exige todos os bytes, CRC16 correto e validação de canal, tipo, valores, labels, flags e expressão. Só então marca válido e recarrega a configuração em execução. Histórico de Toggle é reiniciado após a nova configuração.
- Resposta de gravação: CMD | 0x40, payload `[0]` sucesso, `[1]` dados/ordem inválidos, `[2]` menu ativo.
- O app relê CMD 2 após COMMIT e compara todos os bytes enviados e o marcador, aplicando o mesmo mapeamento de endereços. Não confirma sucesso apenas pelo ACK.

### Extensão de externos

Os 77 bytes físicos em 943–1019 usam: byte 0 `E3`; três registros de 6 bytes em 1–18; pool ASCII compartilhado de 56 caracteres em 19–74; CRC16 CCITT-FALSE dos bytes 0–74 em 75–76 (alto/baixo). Cada registro guarda canal menos 1 nos bits 7–4, ON/OFF no bit 3 e tipo nos bits 2–0; os próximos três bytes são os valores; o quinto byte contém comprimento do label nos bits 7–4 e do primeiro estado nos bits 3–0; o sexto é o comprimento do segundo estado. Os quatro bits baixos do sexto byte guardam esse comprimento; os bits 4–5 guardam a política de tap (0 legado, 1 habilitado, 2 desabilitado); bits 6–7 devem ser zero. Os textos são concatenados por foot, na ordem label/estado1/estado2. Limites: 12/10/10 caracteres por campo e 56 no total. COMMIT estendido exige também o CRC e a validade dessa região.

O backup de recuperação guarda `includeExternals: true` quando usou essa extensão. Backups antigos sem esse campo continuam usando 936 bytes. Presets JSON aceitam a propriedade opcional `externals` (três ações globais); presets antigos sem ela preservam os externos da leitura anterior ao construir a imagem estendida.

Uma leitura completa bloqueia o loop por cerca de 180 ms. Durante a gravação, os comandos físicos ficam suspensos até a confirmação; faça isso durante a configuração do setup.

Validação local cobre round-trip de todas as 54 ações, limites, CRC16 de referência, expressão preservada, recuperação e falhas de transporte. Ainda é necessário testar upload, gravação e reinício no Nano físico.

## Textos internos compactos e política de tap

Quando existem estados internos personalizados ou `tapTempo` explícito, o editor usa o byte 925 = `A3`. Em 270–377 ficam 54 registros de dois bytes: primeiro byte contém comprimento do nome nos bits 7–4 e do estado 1 nos bits 3–0; segundo contém comprimento do estado 2 nos bits 3–0 e política de tap nos bits 4–5 (0 automático legado, 1 habilitado, 2 desabilitado). Os demais bits são zero.

O pool ASCII em 378–917 comporta **540 caracteres compartilhados**, concatenados por índice de ação, na ordem nome/estado1/estado2. Limites por campo: 12/10/10. O editor valida o total antes de aceitar edições/importações ou iniciar uma gravação. Presets sem esses recursos continuam podendo usar os 648 caracteres do formato fixo.

Esse formato exige capacidade `8` além das capacidades existentes. BEGIN recebe cinco bytes: CRC alto/baixo, tamanho alto/baixo e versão de formato `3`. COMMIT exige que o marcador corresponda ao formato negociado e valida comprimentos, caracteres e limite do pool. BEGIN legado com 2 ou 4 bytes continua suportado. A calibração em 936–942 nunca é escrita por esse fluxo.

A política automática mantém CC42 como tap nos foots internos e desativa tap nos externos. A biblioteca marca CC44 como tap e os outros comandos como não-tap, evitando confundir CC42 da Quad mini com o tap da Nano Cortex. JSON v1 aceita `state1`, `state2` e `tapTempo` opcionais em todas as ações. O upload do firmware por si só preserva os mapas anteriores; não use firmware/editor anterior para interpretar uma imagem compacta.
