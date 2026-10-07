import styled from 'styled-components';
import { version } from '../../package.json';
import { t } from '../i18n';
import { LanguageMenu } from './LanguageMenu';
import { Button } from './ui/Button';

const WelcomeRoot = styled.section`
  min-height: 90vh;
  display: grid;
  place-content: center;
  grid-template-columns: minmax(0, 560px);
  padding: 40px 24px 100px;
  .welcome-card {
    width: 100%;
    min-width: 0;
    padding: 48px;
    border: 1px solid #34434a;
    border-radius: 24px;
    background: linear-gradient(145deg, #202a30, #10171b);
    box-shadow: 0 24px 80px #0006;
  }
  .welcome-logo {
    display: inline-grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border: 1px solid #74d9df;
    border-radius: 16px;
    color: #74d9df;
    font-size: 36px;
  }
  h1 {
    font-family: 'Oxanium', sans-serif;
    font-size: clamp(24px, 4vw, 36px);
    margin: 28px 0 8px;
  }
  p {
    color: #a5b6be;
    line-height: 1.6;
  }
  .welcome-actions {
    display: grid;
    gap: 12px;
    margin: 28px 0;
  }
  .welcome-primary {
    background: #28565c;
    border-color: #70cbd3;
  }
  small {
    color: #81959d;
  }
  @media (max-width: 600px) {
    .welcome-card {
      padding: 28px;
    }
  }
`;

export function Welcome({
  busy,
  message,
  onConnect,
  onDemo,
}: {
  busy: boolean;
  message: string;
  onConnect: () => void;
  onDemo: () => void;
}) {
  return (
    <WelcomeRoot aria-label={t('Bem-vindo ao CAZE MIDI CTRL')}>
      <div className="welcome-card">
        <img src="./caze-icon.svg" width="64" height="64" alt="" />
        <h1>CAZE MIDI CTRL</h1>
        <small>EDITOR · {version}</small>
        <p>
          {' '}
          {t(
            'Conecte o pedal para ler e salvar configurações ou explore o editor no modo demo.',
          )}{' '}
        </p>
        <div className="welcome-actions">
          <Button
            className="welcome-primary"
            disabled={busy || !('serial' in navigator)}
            onClick={onConnect}
          >
            {busy ? t('Conectando controlador…') : t('Conectar controlador')}
          </Button>
          <Button disabled={busy} onClick={onDemo}>
            {' '}
            {t('Entrar no modo demo')}{' '}
          </Button>
        </div>
        <p role="status">{t(message)}</p>
        {!('serial' in navigator) && (
          <p>{t('Para conectar via USB, use o aplicativo desktop, Chrome ou Edge.')}</p>
        )}
        <small>
          {t('No modo demo, suas edições ficam neste dispositivo. Nada é enviado ao pedal.')}
        </small>
      </div>
      <LanguageMenu corner />
    </WelcomeRoot>
  );
}
