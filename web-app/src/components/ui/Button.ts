import styled, { css } from 'styled-components';

const buttonStyles = css`
  font: inherit;
  font-variant-caps: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.035em;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #1b2228;
  color: #dce4e9;
  border-radius: 8px;
  padding: 10px 14px;
  transition:
    background 0.15s,
    border-color 0.15s;
  &:hover {
    background: #28343d;
    border-color: #536773;
  }
  &:focus-visible,
  &:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const Button = styled.button.attrs({ type: 'button' })`
  ${buttonStyles}
`;
export const FileButton = styled.label`
  ${buttonStyles}
  position: relative;
  overflow: hidden;
  display: inline-block;
  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    cursor: pointer;
  }
`;
