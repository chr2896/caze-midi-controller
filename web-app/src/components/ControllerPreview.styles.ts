import styled from 'styled-components';
export const ControllerPreviewRoot = styled.div`
  & {
    min-width: 0;
    padding: 38px 44px 20px;
  }
  & .canvas-heading {
    display: flex;
    align-items: center;
    justify-content: right;
    gap: 15px;
    margin-bottom: 28px;
    margin-right: 10px;
  }
  & .canvas-heading h2 {
    font: 400 24px ${({ theme }) => theme.fonts.heading};
    letter-spacing: -0.6px;
    margin: 8px 0 0;
    font-variant-caps: small-caps;
  }
  & .draft-tag {
    white-space: nowrap;
    color: #a6b0b7;
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 6px 10px;
    font-size: 11px;
  }
  & .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  & .toolbar .hint {
    margin: 0;
  }
  & .tabs {
    display: flex;
    gap: 4px;
  }
  & .tabs button {
    background: transparent;
    border-color: transparent;
    color: var(--muted);
  }
  & .tabs button.selected {
    background: #24343a;
    color: #b4eced;
  }
  & .device {
    position: relative;
    border: 1px solid #465057;
    border-radius: 18px;
    padding: 28px 32px 22px;
    background: linear-gradient(135deg, #2b3237, #1b2227);
    box-shadow:
      0 18px 40px #0004,
      inset 0 1px #ffffff17,
      0 4px 0 #080b0d;
  }
  & .lcd {
    width: min(100%, 420px);
    margin: 18px auto 22px;
    background: #101f22;
    border: 8px solid #0d1417;
    border-radius: 6px;
    box-shadow:
      0 0 0 1px #485357,
      inset 0 0 25px #24545c40;
    font-variant-caps: normal;
    letter-spacing: normal;
  }
  & .lcd pre {
    font: clamp(18px, 4.4cqw, 34px)/1.55 monospace;
    letter-spacing: 0;
    margin: 10px 12px;
    text-align: center;
    color: #a9dedc;
    white-space: pre;
    text-shadow: 0 0 8px #81d6d122;
  }
  & .foots {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 20px;
  }
  & .foot {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 14px 8px;
    background: transparent;
    border: 1px solid transparent;
    position: relative;
  }
  & .foot:hover {
    background: #ffffff05;
    border-color: #586971;
  }
  & .foot.chosen {
    background: #75d6dc0a;
    border-color: #5a959a;
  }
  & .foot strong {
    font-size: 10px;
    letter-spacing: 1.5px;
    font-weight: 500;
    color: #bdc8cc;
  }
  & .foot small {
    font-size: 12px;
    color: #bac5cb;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  & .led {
    display: none;
  }
  & .switch {
    display: block;
    width: 44px;
    height: 44px;
    border: 5px solid #465158;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 25%, #dee2e4, #98a3a9 55%, #55616a);
    box-shadow:
      0 4px 0 #0c1114,
      0 7px 9px #0007,
      inset 0 1px 2px #fff9;
    outline: 1px solid #10191e;
  }
  & .chosen .switch {
    border-color: #81cfd2;
    box-shadow:
      0 0 0 3px #263b40,
      0 4px 0 #0c1114,
      0 0 18px #68d5d32b;
  }
  & .external-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 26px 0 12px;
  }
  & .external-heading h3 {
    font-size: 12px;
    font-weight: 500;
    margin: 0;
  }
  & .external-heading span {
    font-size: 11px;
    color: var(--muted);
  }
  & .external-foots {
    gap: 10px;
  }
  & .external-foots .foot {
    display: grid;
    grid-template-columns: 30px 1fr;
    text-align: left;
    gap: 5px 10px;
    background: #141a1f;
    border-color: #2d373e;
    padding: 13px;
  }
  & .external-foots .foot.chosen {
    border-color: #5a959a;
    background: #1b2b30;
  }
  & .external-foots .switch {
    grid-column: 1;
    grid-row: 1/4;
    width: 25px;
    height: 25px;
    border-width: 3px;
  }
  & .external-foots strong {
    grid-column: 2;
    font-size: 9px;
  }
  & .external-foots small {
    grid-column: 2;
    font-size: 9px;
  }
  & .external-foots small:last-child {
    color: #82b8be;
  }
  & .expression-tools {
    margin-top: 23px;
    font-size: 11px;
    color: var(--muted);
  }
  & .simulation {
    display: block;
    margin-top: 15px;
    font-size: 12px;
  }
  & .simulation strong {
    float: right;
    font-weight: 400;
    color: var(--accent);
  }
  & .canvas-tip {
    text-align: center;
    color: #93a0a9;
    font-size: 12px;
    margin: 30px 0 0;
  }
  @media (min-width: 1400px) {
    .editing & {
      max-width: 1040px;
      width: 100%;
      justify-self: center;
    }
  }
  @media (max-width: 1100px) {
    & {
      padding: 30px 26px 20px;
    }
    .editing & .device {
      padding: 22px 15px;
    }
    .editing & .external-foots .foot {
      display: flex;
      text-align: center;
      padding: 10px 4px;
    }
    .editing & .external-foots .switch {
      display: none;
    }
    & .draft-tag {
      display: none;
    }
  }
  @media (max-width: 760px) {
    & {
      padding: 28px 20px 22px;
    }
    & .canvas-heading h2 {
      font-size: 22px;
    }
    & .device {
      padding: 24px 18px;
    }
    & .external-foots .foot {
      padding: 12px 7px;
      gap: 5px;
    }
    & .foots {
      gap: 10px;
    }
    & .canvas-tip {
      margin-top: 22px;
    }
    & .tabs button {
      font-size: 13px;
    }
    & .external-foots small {
      font-size: 10px;
    }
  }
  @media (max-width: 380px) {
    & .external-foots .foot {
      display: flex;
      text-align: center;
    }
    & .external-foots .switch {
      display: none;
    }
    & .canvas-heading h2 {
      font-size: 20px;
    }
    & .simulation strong {
      float: none;
      display: block;
      margin-top: 5px;
    }
  }
`;
