import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { AppRoot } from './components/App.styles';
import { AppHeader } from './components/AppHeader';
import { ControllerPreview } from './components/ControllerPreview';
import { FootEditor } from './components/FootEditor';
import { Modal } from './components/Modal';
import { PresetFiles } from './components/PresetFiles';
import { UsbPanel } from './components/UsbPanel';
import { displayPreview } from './domain/display-preview';
import { internalTextUsage } from './domain/internal-text';
import type { ActiveSlot } from './domain/types';
import { usePreset } from './hooks/usePreset';

export default function App() {
  const [page, setPage] = useState(0);
  const [foot, setFoot] = useState(0);
  const [gesture, setGesture] = useState(0);
  const [midi, setMidi] = useState(64);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(2);
  const [editorOpen, setEditorOpen] = useState(false);
  const usbDialog = useRef<HTMLDialogElement>(null);
  const fileDialog = useRef<HTMLDialogElement>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const selectedButton = useRef<HTMLButtonElement>(null);
  const { preset, externals, action, notice, update, importFile, exportFile, applyUsbPreset } =
    usePreset(page, foot, gesture);
  const { line1, line2 } = displayPreview(action, foot, page, gesture, midi, activeSlot);
  const openUsb = () => usbDialog.current?.showModal();
  function selectFoot(index: number, event: MouseEvent<HTMLButtonElement>) {
    selectedButton.current = event.currentTarget;
    setFoot(index);
    setActiveSlot(2);
    setEditorOpen(true);
  }
  function closeEditor() {
    setEditorOpen(false);
    selectedButton.current?.focus();
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: Refocus the inspector when the selected foot changes while it remains open.
  useEffect(() => {
    if (editorOpen) editorHeading.current?.focus();
  }, [editorOpen, foot]);
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
        setEditorOpen(false);
        selectedButton.current?.focus();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);
  return (
    <AppRoot>
      <AppHeader onOpenFiles={() => fileDialog.current?.showModal()} onOpenUsb={openUsb} />
      <Modal
        dialogRef={fileDialog}
        id="files-title"
        title="Seus presets"
        closeLabel="Fechar arquivos"
      >
        <PresetFiles onImport={importFile} onExport={exportFile} notice={notice} />
      </Modal>
      <Modal
        dialogRef={usbDialog}
        id="usb-title"
        title="Sincronizar controlador"
        closeLabel="Fechar conexão USB"
      >
        {/* Keep mounted when the dialog closes: the serial connection must survive. */}
        <UsbPanel preset={preset} onLoad={applyUsbPreset} />
      </Modal>
      <div className={`workspace ${editorOpen ? 'editing' : ''}`}>
        <ControllerPreview
          preset={preset}
          externals={externals}
          page={page}
          foot={foot}
          gesture={gesture}
          midi={midi}
          editorOpen={editorOpen}
          line1={line1}
          line2={line2}
          setPage={setPage}
          setMidi={setMidi}
          selectFoot={selectFoot}
        />
        {editorOpen && (
          <FootEditor
            textUsage={internalTextUsage(preset)}
            action={action}
            externals={externals}
            foot={foot}
            page={page}
            gesture={gesture}
            activeSlot={activeSlot}
            setActiveSlot={setActiveSlot}
            setGesture={setGesture}
            update={update}
            closeEditor={closeEditor}
            onOpenUsb={openUsb}
            editorHeading={editorHeading}
          />
        )}
      </div>
      <p className="notice" role="status">
        {notice}
      </p>
    </AppRoot>
  );
}
