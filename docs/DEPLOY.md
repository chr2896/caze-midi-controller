# Publicar o editor no Netlify

O app React/Vite é estático: não precisa de backend, banco de dados nem servidor local depois da publicação. A USB continua ligada ao computador de quem abriu o site, não ao servidor do Netlify.

## Pelo GitHub

1. Entre na sua conta Netlify e importe o repositório `caze-midi-controller` do GitHub.
2. Escolha a branch `main`. O `netlify.toml` na raiz define base `web-app`, comando `npm run build`, saída `dist` e Node 22.
3. Confira o plano gratuito e publique. O Netlify fornecerá uma URL HTTPS; configure um nome disponível no painel.
4. Abra a URL diretamente no Chrome/Edge desktop. Conecte o Nano, ative USB MODE e conceda ao site acesso à porta quando clicar em Conectar controlador.

O site deve estar em HTTPS e não dentro de um iframe com a permissão serial bloqueada. O projeto configura `Permissions-Policy: serial=(self)`. Web Serial não é Web MIDI: o CH340 continua sendo uma porta serial. Outros programas que usam essa porta precisam estar fechados.

## Sem vincular o GitHub

Execute `npm ci` e `npm run build` dentro de `web-app`. Publique somente o conteúdo de `web-app/dist` pelo fluxo de deploy manual do Netlify. O `netlify.toml` é destinado ao build pelo Git; o app usa só a rota raiz e não depende de rewrites para esse deploy manual.

## Presets e permissões

O navegador trata localhost e o novo domínio como origens diferentes. **Exporte seus presets e o arquivo de recuperação antes de mudar de endereço**, depois importe no site publicado. As permissões USB também deverão ser concedidas para o novo endereço. Nenhum preset é sincronizado automaticamente entre navegadores ou computadores.

O app não tem endpoint que envie os presets ao servidor; os dados do controlador passam pela Web Serial local. O site baixa os assets e fontes, e o provedor de hospedagem pode registrar acessos normais ao site.

## Plano gratuito

Consulta em 23/09/2026: o Netlify oferece plano Free com limites/créditos de uso. Não é hospedagem ilimitada; confirme preços e regras no painel antes de publicar. Para este editor estático de uso pessoal, é uma opção viável dentro dos limites. Alternativas com hospedagem estática HTTPS também podem servir o `dist`, desde que não bloqueiem Web Serial.

Referências: [planos Netlify](https://www.netlify.com/pricing/), [configuração por arquivo](https://docs.netlify.com/build/configure-builds/file-based-configuration/), [Web Serial](https://developer.chrome.com/docs/capabilities/serial).
