import type { ReactNode, RefObject } from 'react';
import { ModalRoot } from './Modal.styles';
import { Button } from './ui/Button';

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  id: string;
  title: string;
  closeLabel: string;
  children: ReactNode;
}
export function Modal({ dialogRef, id, title, closeLabel, children }: Props) {
  return (
    <ModalRoot ref={dialogRef} aria-labelledby={id}>
      <div className="dialog-heading">
        <h2 id={id}>{title}</h2>
        <Button aria-label={closeLabel} onClick={() => dialogRef.current?.close()}>
          ×
        </Button>
      </div>
      {children}
    </ModalRoot>
  );
}
