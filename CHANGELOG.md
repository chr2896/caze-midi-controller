# Evolução CAZE MIDI CTRL

As etapas abaixo descrevem o trabalho desta adaptação. Os commits foram reconstruídos a partir de backups; ver [histórico e limites](docs/HISTORY.md). O changelog herdado está [arquivado](docs/CHANGELOG-inherited.md).

1. **Base funcional e LCD:** firmware fornecido com LEDs diretos e expressão; impressão dos campos da segunda linha sem concatenações temporárias de String e ajuste para nanoatmega328.
2. **EXP no LCD:** 16×2, percentual do MIDI final à direita, atualização sem limpar a tela a cada amostra, Toggle compacto OFF/ON.
3. **Editor React/JavaScript:** três páginas, 54 ações, labels, prévia, presets JSON, armazenamento local e ON/OFF opcional para valores personalizados.
4. **USB leitura:** identificação, Web Serial, snapshot de EEPROM e carregamento validado no editor.
5. **Gravação e labels persistentes:** novo mapa EEPROM, migração explícita, blocos ordenados, CRC16, releitura, backup e recuperação. Remoção do buffer RAM que não abrangia todos os endereços legados.
6. **Calibração de expressão:** captura HEEL/TOE, rejeição de curso pequeno, CRC e persistência independente do preset web.
7. **Tap tempo:** cálculo para CC42, média de quatro intervalos, timeout, label personalizado e EXP preservado.
8. **Publicação:** documentação consolidada, créditos, commits reconstruídos e configuração Netlify.
