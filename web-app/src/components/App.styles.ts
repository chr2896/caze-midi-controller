import styled from 'styled-components';
export const AppRoot = styled.main`
  & {
    max-width: 1600px;
    margin: auto;
  }
  & .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    max-width: 980px;
    margin: auto;
    align-items: start;
  }
  & .workspace.editing {
    max-width: none;
    grid-template-columns: minmax(0, 1fr) 360px;
  }
  & .notice {
    font-size: 11px;
    color: var(--accent);
    text-align: center;
    padding: 0 24px;
    min-height: 16px;
  }
  @media (max-width: 1100px) {
    & .workspace.editing {
      grid-template-columns: minmax(0, 1fr) 330px;
    }
  }
  @media (max-width: 760px) {
    & .workspace.editing {
      grid-template-columns: 1fr;
    }
  }
`;
