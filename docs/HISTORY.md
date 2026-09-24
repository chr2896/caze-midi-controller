# Historico reconstruido dos backups

Os commits foram criados agora a partir dos arquivos disponiveis, sem alterar datas ou atribuir autoria original a terceiros. Nao sao o historico Git de galczo5. O primeiro ZIP ja inclui a correcao do LCD; nao ha snapshot separado anterior a ela.

| Checkpoint | Commit | Conteudo do ZIP |
|---|---|---|
| `firmware-funcional-antes-exp-percent-20260923-091333.zip` | `ab769ab` | Firmware; sem web app |
| `firmware-funcional-antes-usb-leitura-20260923-094253.zip` | `19adb8a` | Firmware; sem web app |
| `versao-funcional-antes-gravacao-20260923-100726.zip` | `8f53c33` | Firmware e web app |
| `firmware-funcional-antes-calibracao-20260923-110846.zip` | `adcbd5b` | Firmware; sem web app |
| `firmware-antes-tap-tempo-20260923-193832.zip` | `c1abf82` | Firmware; sem web app |
| Codigo atual: tap tempo e editor consolidado | `38b7507` | Diretorio de trabalho atual |

## Limites

Pastas ausentes de um ZIP foram mantidas no ultimo estado conhecido. Em especial, o editor dos checkpoints de gravacao e calibracao ainda e o snapshot anterior de leitura; o editor completo chega no commit do estado atual. Nao foi inventado um snapshot web intermediario. A documentacao atual e a configuracao de publicacao entram em um commit posterior.

Os ZIPs brutos ficam locais e sao ignorados pelo Git. Dependencias instaladas, builds, arquivos de ambiente e configuracoes locais do VS Code foram excluidos. Os commits de firmware antigo sao historicos: nao instale um deles sobre EEPROM v2 sem restauracao adequada.

## SHA-256 dos arquivos de origem

- `firmware-funcional-antes-exp-percent-20260923-091333.zip`: `215f97fe0b5fb2bba13f7c76e5c505d9642bdebf1529fc804726dfa9dfd90de4`
- `firmware-funcional-antes-usb-leitura-20260923-094253.zip`: `6edc6caa41553be603c56035c085817a77f4308b5e32ad5e0af9e57618eb7534`
- `versao-funcional-antes-gravacao-20260923-100726.zip`: `5bee735e6e6fc5325b3303f2aa45c2096cc56e981006ab6db94c91ccce9ae6f7`
- `firmware-funcional-antes-calibracao-20260923-110846.zip`: `1c6c2eab13b280db476162054217800a6199f04886aeaf1f6a2f9af77aee2426`
- `firmware-antes-tap-tempo-20260923-193832.zip`: `1d34883a4fcae3652db674796640ae213aaf86bfd639a53d148066a6f07d2714`
