# Gravação no Nano e labels persistentes

## Primeiro teste

1. Faça upload do firmware atualizado para `nanoatmega328`. Somente o upload não migra a EEPROM; o mapa antigo continua sendo reconhecido.
2. Ative USB MODE com FS4 + FS6, saia dos menus e feche outros programas que usam a mesma porta.
3. Conecte no editor, leia e baixe o backup bruto. Clique em **Substituir comandos locais pela leitura** para partir dos comandos atuais. Confira os avisos: dados inválidos do mapa antigo mantêm o rascunho local e não podem ser recuperados automaticamente.
4. Edite os comandos, labels e ON/OFF. **Salvar preset no controlador** substitui as 54 ações pelo preset exibido. A expressão atual é copiada da leitura imediatamente anterior ao envio; o modo USB permanece ativo.
5. O app guarda no navegador e inicia o download de um JSON com a EEPROM anterior e o preset enviado. Guarde esse arquivo. Se o armazenamento local falhar, a gravação não começa.
6. Aguarde a confirmação pela releitura. Durante a gravação, o LCD mostra `USB CONFIG / USE WEB APP`. Ao concluir, teste os footswitches e os labels; desligue e ligue para confirmar persistência. O percentual EXP permanece à direita.

Labels ASCII de até 12 caracteres substituem o título da primeira linha; sem label, permanece FS e página. A opção ON/OFF muda apenas a apresentação: menor valor vira OFF, maior vira ON; iguais mantêm a apresentação original. Não modifica os valores MIDI nem a lógica dos LEDs.

## Recuperação

A EEPROM não comporta duas cópias completas. A gravação não é atomicamente reversível: antes do primeiro bloco, ela é marcada como incompleta. Se a USB cair ou faltar energia, o firmware não executa ações nem expressão dessa imagem parcial; inicia em USB e aguarda **Recuperar gravação**. Essa operação repete o preset guardado antes do envio, não o rascunho editado depois. Se trocar de navegador ou perder o armazenamento local, use **Importar recuperação** com o JSON baixado. A recuperação também é verificada por releitura.

Não faça downgrade para o firmware antigo após migrar: ele não reconhece o novo mapa e pode interpretar labels como configurações de expressão/USB. O ZIP anterior guarda o código, não a EEPROM do seu Nano. O JSON de backup contém os bytes anteriores; restauração bruta do mapa antigo não é oferecida por este editor.

## Mapa v2

| Endereços | Conteúdo |
|---|---|
| 0–269 | 54 comandos × 5 bytes |
| 270–917 | 54 labels × 12 bytes, preenchimento com zero |
| 918–924 | 54 bits ON/OFF |
| 925–927 | Reservado |
| 928–934 | Expressão: marcador, habilitado, canal, CC, mínimo, máximo, reverse |
| 935 | Modo USB |
| 936–942 | Calibração física de expressão (independente da gravação do app) |
| 943–1019 | Livre |
| 1020–1023 | `43 5A 02`, estado `51` incompleto ou `A5` válido |

Índice de ação: `gesto*18 + página*6 + footswitch`, todos base zero. Comando no índice × 5. O firmware lê os comandos direto da EEPROM, sem o antigo buffer de 270 bytes. Sem marcador v2, o endereço legado `page*48 + foot*5 + gesture*90` permanece reconhecido; suas sobreposições não podem ser desfeitas automaticamente. A primeira gravação distribui o preset revisado no mapa novo.

## Protocolo

Mantém o frame v1 em [USB-READ.md](USB-READ.md). Identificação agora anuncia capacidade 3 (leitura + gravação) e stride 30 quando o mapa é v2. Firmware anterior com capacidade 1 continua aceito para leitura.

- CMD 3 BEGIN: payload CRC16 CCITT-FALSE de 936 bytes (alto/baixo). Marca a imagem incompleta e reinicia o offset em zero. Recusado enquanto um menu físico estiver ativo.
- CMD 4 BLOCK: offset alto/baixo e 1–16 bytes. Só aceita o próximo offset esperado e não ultrapassa 936 bytes. Usa `EEPROM.update`.
- CMD 5 COMMIT: sem payload. Exige todos os bytes, CRC16 correto e validação de canal, tipo, valores, labels, flags e expressão. Só então marca válido e recarrega a configuração em execução. Histórico de Toggle/LED é reiniciado após a nova configuração.
- Resposta de gravação: CMD | 0x40, payload `[0]` sucesso, `[1]` dados/ordem inválidos, `[2]` menu ativo.
- O app relê CMD 2 após COMMIT e compara todos os 936 bytes e o marcador. Não confirma sucesso apenas pelo ACK.

Uma leitura completa bloqueia o loop por cerca de 180 ms. Durante a gravação, os comandos físicos ficam suspensos até a confirmação; faça isso durante a configuração do setup.

Validação local cobre round-trip de todas as 54 ações, limites, CRC16 de referência, expressão preservada, recuperação e falhas de transporte. Ainda é necessário testar upload, gravação e reinício no Nano físico.
