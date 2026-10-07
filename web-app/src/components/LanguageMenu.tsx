import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { type Language, setLanguage, t, useLanguage } from '../i18n';

const Menu = styled.details<{ $corner: boolean }>`
  position: ${({ $corner }) => ($corner ? 'fixed' : 'relative')};
  right: ${({ $corner }) => ($corner ? '24px' : 'auto')};
  bottom: ${({ $corner }) => ($corner ? '24px' : 'auto')};
  z-index: 20;
  font-variant-caps: normal;
  font-size: 14px;
  summary,
  button {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 14px;
    color: #e3eef1;
    border: 1px solid #3c555e;
    background: #19272d;
    border-radius: 8px;
    font: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  summary {
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::after {
    content: '⌄';
    margin-left: 6px;
  }
  .language-options {
    position: absolute;
    right: 0;
    ${({ $corner }) => ($corner ? 'bottom: calc(100% + 8px);' : 'top: calc(100% + 8px);')} padding: 6px;
    background: #131f25;
    border: 1px solid #3c555e;
    border-radius: 10px;
    box-shadow: 0 8px 24px #0008;
    min-width: 180px;
  }
  button {
    width: 100%;
    background: transparent;
    border-color: transparent;
  }
  button:hover,
  button[aria-pressed='true'] {
    background: #29454c;
  }
  img {
    width: 24px;
    height: 18px;
    border-radius: 3px;
  }
  @media (max-width: 600px) {
    right: ${({ $corner }) => ($corner ? '12px' : 'auto')};
    bottom: ${({ $corner }) => ($corner ? '12px' : 'auto')};
  }
`;
const options: { code: Language; label: string; flag: string }[] = [
  { code: 'pt-BR', label: 'Português-BR', flag: './flag-br.svg' },
  { code: 'en', label: 'English', flag: './flag-en.svg' },
];
export function LanguageMenu({ corner = false }: { corner?: boolean }) {
  const language = useLanguage();
  const ref = useRef<HTMLDetailsElement>(null);
  const current = options.find((option) => option.code === language) ?? options[0];
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  return (
    <Menu ref={ref} $corner={corner}>
      <summary aria-label={`${t('Idioma')}: ${current.label}`}>
        <img src={current.flag} alt="" />
        {current.label}
      </summary>
      <fieldset className="language-options" aria-label={t('Idioma do aplicativo')}>
        {options.map((option) => (
          <button
            key={option.code}
            type="button"
            aria-pressed={language === option.code}
            onClick={() => {
              setLanguage(option.code);
              if (ref.current) {
                ref.current.open = false;
                ref.current.querySelector('summary')?.focus();
              }
            }}
          >
            <img src={option.flag} alt="" />
            {option.label}
          </button>
        ))}
      </fieldset>
    </Menu>
  );
}
