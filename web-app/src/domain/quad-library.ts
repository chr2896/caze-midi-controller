import type { MidiAction } from './types';
export const QUAD_MANUAL = 'https://neuraldsp.com/manual/quad-cortex-mini';
export interface QuadOption {
  value: number;
  name: string;
  text: string;
}
export interface QuadCommand {
  id: string;
  name: string;
  category: string;
  cc?: number;
  label: string;
  description: string;
  options?: QuadOption[];
  trigger?: boolean;
  tap?: boolean;
  defaultValue?: number;
}
const option = (value: number, name: string, text = name): QuadOption => ({ value, name, text });
const cc = (
  number: number,
  name: string,
  category: string,
  label: string,
  description: string,
  extra: Partial<QuadCommand> = {},
): QuadCommand => ({ id: `cc${number}`, cc: number, name, category, label, description, ...extra });
const binary = [option(0, 'Desligado', 'OFF'), option(127, 'Ligado', 'ON')];
export const quadCommands: QuadCommand[] = [
  {
    id: 'pc',
    name: 'Carregar preset',
    category: 'Presets',
    label: 'PRESET',
    description:
      'PC 0–127 no banco e setlist selecionados. Para outra região, envie CC0 e CC32 separadamente antes do PC. O editor não cria uma sequência de mensagens.',
  },
  cc(
    0,
    'Banco de presets',
    'Presets',
    'BANCO',
    'Seleciona o grupo de 128 presets para o próximo PC.',
    { options: [option(0, 'Primeiro grupo', 'BANCO 1'), option(1, 'Segundo grupo', 'BANCO 2')] },
  ),
  cc(32, 'Setlist', 'Presets', 'SETLIST', 'Seleciona a setlist para a troca de preset.', {
    options: [
      option(0, 'Factory Presets', 'FACTORY'),
      option(1, 'My Presets', 'MY PRESETS'),
      ...Array.from({ length: 11 }, (_, i) => option(i + 2, `User ${i + 1}`, `USER ${i + 1}`)),
    ],
  }),
  ...[1, 2].map((n) =>
    cc(
      n,
      `Expressão ${n}`,
      'Expressão',
      `EXP ${n}`,
      `Envia uma posição fixa: 0 = calcanhar, 127 = ponta.${n === 2 ? ' EXP2 é controlada via MIDI.' : ''} Um foot não gera um movimento contínuo.`,
    ),
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    cc(
      35 + i,
      `Foot ${'ABCD'[i % 4]} · página ${i < 4 ? 'I' : 'II'}`,
      'Footswitches',
      `FOOT ${'ABCD'[i % 4]} ${i < 4 ? 'I' : 'II'}`,
      'Emula uma pisada no foot correspondente. Qualquer valor de 0 a 127 aciona o comando.',
      { trigger: true },
    ),
  ),
  cc(43, 'Selecionar cena', 'Cenas e modos', 'CENA', 'Carrega uma das oito cenas do preset.', {
    options: Array.from({ length: 8 }, (_, i) =>
      option(i, `${'ABCD'[i % 4]} · página ${i < 4 ? 'I' : 'II'}`, `CENA ${i + 1}`),
    ),
  }),
  cc(
    44,
    'Tap tempo',
    'Utilidades',
    'TAP TEMPO',
    'Envia uma pisada de tap e calcula o BPM local no controlador. Não lê o BPM da Quad.',
    { trigger: true, tap: true },
  ),
  cc(45, 'Afinador', 'Utilidades', 'AFINADOR', '0–63 fecha; 64–127 abre.', {
    options: [option(0, 'Fechar', 'OFF'), option(127, 'Abrir', 'ON')],
  }),
  cc(46, 'Gig View', 'Utilidades', 'GIG VIEW', '0–63 fecha; 64–127 abre.', {
    options: [option(0, 'Fechar', 'OFF'), option(127, 'Abrir', 'ON')],
  }),
  cc(
    47,
    'Modo de operação',
    'Cenas e modos',
    'MODO',
    'Slots padrão: 0 Preset, 1 Scene, 2 Stomp. Se você reordenar os modos na Quad, os números continuam selecionando os slots. Slot vazio não tem efeito.',
    {
      options: [
        option(0, 'Preset · slot 1', 'PRESET'),
        option(1, 'Scene · slot 2', 'SCENE'),
        option(2, 'Stomp · slot 3', 'STOMP'),
      ],
    },
  ),
  cc(
    48,
    'Abrir editor Looper X',
    'Looper X',
    'LOOPER',
    '0–63 abre; 64–127 fecha (ordem inversa à do afinador).',
    { options: [option(0, 'Abrir', 'ABERTO'), option(127, 'Fechar', 'FECHADO')] },
  ),
  ...[
    'Duplicate',
    'One Shot',
    'Half Speed',
    'Punch In / Out',
    'Record / Overdub',
    'Play / Stop',
    'Reverse',
    'Undo / Redo',
  ].map((name, i) =>
    cc(
      49 + i,
      name,
      'Looper X',
      [
        'DUPLICATE',
        'ONE SHOT',
        'HALF SPEED',
        'PUNCH',
        'REC/OVERDUB',
        'PLAY/STOP',
        'REVERSE',
        'UNDO/REDO',
      ][i],
      'Cada envio de 64–127 aciona a função. Enviamos 127 em toda pisada; alternar 0/127 perderia um acionamento a cada duas pisadas.',
      { trigger: true },
    ),
  ),
  cc(57, 'Duplicate Mode', 'Looper X', 'DUP MODE', 'Define o modo de duplicação.', {
    options: [option(0, 'Free', 'FREE'), option(1, 'Sync', 'SYNC')],
  }),
  cc(58, 'Quantize', 'Looper X', 'QUANTIZE', 'Seleciona a quantização do looper.', {
    options: [
      option(0, 'Off', 'OFF'),
      ...Array.from({ length: 8 }, (_, i) => option(i + 1, `${i + 1} beats`, `${i + 1} BEATS`)),
      option(9, '16 beats', '16 BEATS'),
    ],
  }),
  cc(
    59,
    'MIDI Clock Start',
    'Looper X',
    'CLOCK START',
    'Comportamento de início do looper em relação ao MIDI Clock.',
    { options: [option(0, 'Free', 'FREE'), option(1, 'Sync', 'SYNC')] },
  ),
  cc(
    60,
    'Perform / Parameters',
    'Looper X',
    'LOOPER VIEW',
    'Seleciona a página do editor do looper.',
    { options: [option(0, 'Perform', 'PERFORM'), option(1, 'Parameters', 'PARAMETERS')] },
  ),
  cc(61, 'Routing', 'Looper X', 'ROUTING', 'Seleciona a origem ou destino do looper.', {
    options: [
      'Grid',
      'Input 1',
      'Input 2',
      'Return 1',
      'Return 2',
      'Inputs 1/2',
      'Returns 1/2',
      'Out 1',
      'Out 2',
      'Out 3',
      'Out 4',
      'Out 1/2',
      'Out 3/4',
      'Multiple Outputs',
    ].map((name, i) =>
      option(
        i,
        name,
        [
          'GRID',
          'INPUT 1',
          'INPUT 2',
          'RETURN 1',
          'RETURN 2',
          'INPUTS 1/2',
          'RET 1/2',
          'OUT 1',
          'OUT 2',
          'OUT 3',
          'OUT 4',
          'OUT 1/2',
          'OUT 3/4',
          'MULTI OUT',
        ][i],
      ),
    ),
  }),
  cc(
    62,
    'Ignorar PC duplicado',
    'Presets',
    'IGNORE PC',
    '0–63 desativa; 64–127 ativa. Quando ativo, ignora PC repetido e os CC0/CC32 associados.',
    { options: binary },
  ),
  cc(
    64,
    'Página dos footswitches',
    'Footswitches',
    'PAGINA QUAD',
    '0–63 seleciona I; 64–127 seleciona II. Troca a página da Quad mini, não a página do controlador.',
    { options: [option(0, 'Página I', 'I'), option(127, 'Página II', 'II')] },
  ),
];
export function quadPatch(
  command: QuadCommand,
  first: number,
  second?: number,
): Partial<MidiAction> {
  const value = command.trigger ? 127 : first;
  const toggle = second !== undefined && Boolean(command.options);
  return {
    type: command.cc === undefined ? 1 : toggle ? 3 : 2,
    value1: command.cc ?? value,
    value2: command.cc === undefined ? 0 : value,
    value3: toggle ? second : 127,
    label: command.label,
    state1: toggle ? (command.options?.find((o) => o.value === value)?.text ?? '') : '',
    state2: toggle ? (command.options?.find((o) => o.value === second)?.text ?? '') : '',
    toggleOnOff: false,
    tapTempo: command.tap === true,
  };
}
