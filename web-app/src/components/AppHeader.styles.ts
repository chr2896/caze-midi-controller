import styled from 'styled-components';
export const AppHeaderRoot = styled.header`
  & {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 22px 36px;
    border-bottom: 1px solid #242a30;
  }
  & .brand {
    display: flex;
    align-items: center;
    gap: 13px;
  }
  & .logo {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid #426569;
    border-radius: 10px;
    color: var(--accent);
    font: 500 26px ${({ theme }) => theme.fonts.heading};
  }
  & .brand h1 {
    font-size: 14px;
    letter-spacing: 1.5px;
    margin: 0;
    font-variant-caps: small-caps;
  }
  & .brand small {
    display: block;
    font-size: 9px;
    font-weight: 400;
    color: var(--muted);
    letter-spacing: 2px;
    margin-top: 5px;
  }
  & .brand small span {
    color: var(--accent);
  }
  & nav {
    display: flex;
    gap: 10px;
  }
  & button.primary {
    background: #29494e;
    border-color: #3b6870;
    color: #bcf1f4;
  }
  @media (max-width: 760px) {
    & {
      padding: 18px 20px;
      flex-wrap: wrap;
    }
    & nav {
      width: 100%;
      gap: 6px;
    }
    & nav button {
      flex: 1;
      font-size: 12px;
      padding: 9px;
    }
    & .brand h1 {
      font-size: 11px;
      letter-spacing: 0.7px;
    }
    & .logo {
      display: none;
    }
  }
`;
