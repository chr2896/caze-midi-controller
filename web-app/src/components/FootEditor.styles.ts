import styled from 'styled-components';
export const FootEditorRoot = styled.aside`
  .foot-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
  }

  & .gestures {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 16px;
    margin-bottom: 22px;
  }
  & .gestures button {
    background: transparent;
    border-color: transparent;
    color: var(--muted);
    flex: 1;
    padding: 9px;
  }
  & .gestures button.selected {
    background: #24343a;
    color: #b4eced;
  }
  & {
    min-width: 0;
    background: #141a1f;
    border-left: 1px solid var(--line);
    padding: 24px;
    height: calc(100dvh - 85px);
    overflow: auto;
    position: sticky;
    top: 0;
  }
  & .inspector-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  & .inspector-top button {
    padding: 3px 10px;
    font-size: 22px;
    background: transparent;
    border-color: transparent;
  }
  & h2 {
    font: 500 28px ${({ theme }) => theme.fonts.heading};
    margin: 12px 0 22px;
    font-variant-caps: small-caps;
  }
  & h2 span {
    display: block;
    font: 12px ${({ theme }) => theme.fonts.body};
    color: var(--muted);
    margin-top: 7px;
  }
  & > label {
    display: block;
    font-size: 14px;
    color: #bcc6cd;
    margin-bottom: 18px;
  }
  & .fields > label {
    display: block;
    font-size: 14px;
    color: #bcc6cd;
    margin-bottom: 18px;
  }
  & input {
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 11px;
    color: #e3ebee;
    background: #0f1418;
    border: 1px solid #354049;
    border-radius: 7px;
    min-width: 0;
    font-variant-caps: normal;
  }
  & select {
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 11px;
    color: #e3ebee;
    background: #0f1418;
    border: 1px solid #354049;
    border-radius: 7px;
    min-width: 0;
    font-variant-caps: normal;
  }
  & label small {
    display: block;
    color: var(--muted);
    font-size: 12px;
    margin-top: 6px;
    line-height: 1.5;
  }
  & input[type='checkbox'] {
    width: auto;
    display: inline-block;
    margin: 0 8px 0 0;
    accent-color: var(--accent);
  }
  & .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 12px;
  }
  & .toggle-preview {
    width: 100%;
    font-size: 11px;
  }
  & .editor-note {
    border-top: 1px solid var(--line);
    padding-top: 18px;
    margin: 22px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--muted);
  }
  & .text-button {
    font-size: inherit;
    border: 0;
    background: none;
    color: var(--accent);
    padding: 0;
    text-decoration: underline;
  }
  @media (min-width: 1400px) {
    & {
      padding: 28px;
    }
  }
  @media (max-width: 760px) {
    & {
      position: relative;
      top: auto;
      height: auto;
      overflow: visible;
      border: 1px solid var(--line);
      border-radius: 14px;
      margin: 0 20px 20px;
    }
    & h2 {
      scroll-margin: 20px;
    }
    &:focus-within {
      scroll-margin: 20px;
    }
    & .gestures button {
      font-size: 13px;
    }
  }
`;
