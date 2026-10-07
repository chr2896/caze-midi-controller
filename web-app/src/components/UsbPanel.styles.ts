import styled from 'styled-components';
export const UsbPanelRoot = styled.section`
  & .usb-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 20px 0;
  }
  & .section-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  & .section-title h2 {
    font-size: 14px;
    margin: 0;
  }
  & .section-title > span {
    font-size: 9px;
    color: var(--accent);
  }
  & details {
    font-size: 12px;
    margin: 20px 0;
  }
  & .usb-actions .save-controller:not(:disabled) {
    background: #355f64;
    color: #cff5f5;
  }
  & .usb-result {
    border-top: 1px solid var(--line);
    padding-top: 15px;
  }
  & .recovery {
    border-top: 1px solid var(--line);
    padding-top: 15px;
  }
`;
