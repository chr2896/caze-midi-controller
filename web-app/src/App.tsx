import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { AppRoot } from './components/App.styles';
import { AppHeader } from './components/AppHeader';
import { ControllerPreview } from './components/ControllerPreview';
import { FootEditor } from './components/FootEditor';
import { Modal } from './components/Modal';
import { PresetFiles } from './components/PresetFiles';
import { UsbPanel } from './components/UsbPanel';
import { Welcome } from './components/Welcome';
import { displayPreview } from './domain/display-preview';
import { internalTextUsage } from './domain/internal-text';
import type { ActiveSlot } from './domain/types';
import { usePreset } from './hooks/usePreset';
import { useUsbController } from './hooks/useUsbController';
import { t, useLanguage } from './i18n';

export default function App() {
  useLanguage();
  const [entered, setEntered] = useState(false);
  const [page, setPage] = useState(0);
  const [foot, setFoot] = useState(0);
  const [gesture, setGesture] = useState(0);
  const [midi, setMidi] = useState(64);
  const [expressionMode, setExpressionMode] = useState(1);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(2);
  const [editorOpen, setEditorOpen] = useState(false);
  const usbDialog = useRef<HTMLDialogElement>(null);
  const fileDialog = useRef<HTMLDialogElement>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const selectedButton = useRef<HTMLButtonElement>(null);
  const {
    preset,
    pendingChanges,
    compareReading,
    synced,
    externals,
    action,
    notice,
    update,
    resetFoot,
    importFile,
    exportFile,
    exportPrevious,
    applyUsbPreset,
  } = usePreset(page, foot, gesture);
  const usb = useUsbController(preset, applyUsbPreset, compareReading);
  async function startConnected() {
    if (await usb.connect()) {
      setEntered(true);
      usbDialog.current?.showModal();
    }
  }
  const dualExpression = [...preset.pages.flat(2), ...externals].some((a) => a.type === 8);
  const { line1, line2 } = displayPreview(
    action,
    foot,
    page,
    gesture,
    midi,
    activeSlot,
    dualExpression ? expressionMode : 0,
  );
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
      {entered ? (
        <AppHeader onOpenFiles={() => fileDialog.current?.showModal()} onOpenUsb={openUsb} />
      ) : (
        <Welcome
          busy={usb.busy}
          message={usb.message}
          onConnect={startConnected}
          onDemo={() => setEntered(true)}
        />
      )}
      {entered && (
        <div className="sync-status" role="status">
          <span>
            {usb.connected ? t('Controlador conectado') : t('Modo demo · Sem conexão USB')}
          </span>
          <span className={pendingChanges ? 'pending' : ''}>
            {pendingChanges
              ? t('● Alterações não enviadas ao controlador')
              : synced
                ? t('✓ Configuração conferida no controlador')
                : t('Rascunho local · Não conferido no controlador')}
          </span>
        </div>
      )}
      <Modal
        dialogRef={fileDialog}
        id="files-title"
        title={t('Seus presets')}
        closeLabel={t('Fechar arquivos')}
      >
        <PresetFiles
          onImport={importFile}
          onExport={exportFile}
          onExportPrevious={exportPrevious}
          notice={t(notice)}
        />
      </Modal>
      <Modal
        dialogRef={usbDialog}
        id="usb-title"
        title={t('Sincronizar controlador')}
        closeLabel={t('Fechar conexão USB')}
      >
        {/* Keep mounted when the dialog closes: the serial connection must survive. */}
        <UsbPanel controller={usb} />
      </Modal>
      {entered && (
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
            expressionMode={dualExpression ? expressionMode : 0}
            setExpressionMode={setExpressionMode}
            setMidi={setMidi}
            selectFoot={selectFoot}
          />
          {editorOpen && (
            <FootEditor
              textUsage={internalTextUsage(preset)}
              action={action}
              foot={foot}
              page={page}
              gesture={gesture}
              activeSlot={activeSlot}
              setActiveSlot={setActiveSlot}
              onToggleExpressionPreview={() => setExpressionMode((mode) => (mode === 1 ? 2 : 1))}
              setGesture={setGesture}
              update={update}
              onResetFoot={() => {
                resetFoot();
                setActiveSlot(2);
              }}
              closeEditor={closeEditor}
              onOpenUsb={openUsb}
              editorHeading={editorHeading}
            />
          )}
        </div>
      )}
      <p className="notice" role="status">
        {t(notice)}
      </p>
    </AppRoot>
  );
}
