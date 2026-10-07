import styled from 'styled-components';
export const ModalRoot = styled.dialog`
  & .dialog-heading button {
    padding: 3px 10px;
    font-size: 22px;
    background: transparent;
    border-color: transparent;
  }
  & {
    width: min(620px, calc(100% - 32px));
    max-height: 85dvh;
    overflow: auto;
    background: #161d23;
    color: #dce5eb;
    border: 1px solid #3c4e59;
    border-radius: 16px;
    padding: 26px;
    box-shadow: 0 35px 100px #0008;
  }
  &::backdrop {
    background: #05090dba;
    backdrop-filter: blur(5px);
  }
  & .dialog-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 14px;
  }
  & .dialog-heading h2 {
    font: 500 20px ${({ theme }) => theme.fonts.heading};
    margin: 0;
    font-variant-caps: small-caps;
  }
  & p {
    font-size: 13px;
    line-height: 1.7;
    color: #a8b6c0;
  }
  & li {
    font-size: 13px;
    line-height: 1.7;
    color: #a8b6c0;
  }
  & .files {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
`;
