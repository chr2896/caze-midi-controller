import styled from 'styled-components';
export const QuadLibraryRoot = styled.div`
  display: grid;
  gap: 16px;
  label {
    display: grid;
    gap: 8px;
    font-size: 13px;
  }
  && input,
  && select {
    margin-top: 0;
    width: 100%;
    min-width: 0;
    padding: 10px;
    border: 1px solid #3c4e59;
    border-radius: 8px;
    background: #10171c;
    color: #e5eef3;
    font: inherit;
  }
  && input[type='checkbox'] {
    width: auto;
    justify-self: start;
    accent-color: var(--accent);
  }
  a {
    color: #6ddbcc;
  }
  .library-filters,
  .library-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .library-list {
    margin: 0;
    border: 0;
    padding: 0;
    min-width: 0;
    legend {
      font-size: 12px;
      color: #a8b6c0;
      margin-bottom: 8px;
    }
    display: grid;
    gap: 6px;
    max-height: 220px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .library-list button {
    display: flex;
    justify-content: space-between;
    text-align: left;
    gap: 12px;
  }
  .library-list button[aria-pressed='true'] {
    border-color: #61cebf;
    background: #1e393b;
  }
  small {
    color: #8dc9c3;
  }
  .library-detail {
    display: grid;
    gap: 12px;
    padding-top: 14px;
    border-top: 1px solid #344650;
  }
  h3,
  p {
    margin: 0;
  }
  @media (max-width: 480px) {
    .library-filters,
    .library-values {
      grid-template-columns: 1fr;
    }
  }
`;
