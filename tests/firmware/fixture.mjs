import { writeFileSync } from 'node:fs';
import { createPreset } from '../../web-app/src/domain/preset.ts';
import { buildImage } from '../../web-app/src/domain/storage-layout.ts';
const preset = createPreset();
Object.assign(preset.externals[0], { type: 3, channel: 16, value1: 47, value2: 0, value3: 2, label: 'MODO', state1: 'PRESET', state2: 'STOMP' });
Object.assign(preset.externals[1], { type: 3, value1: 64, label: 'PAGINA QUAD', state1: 'I', state2: 'II' });
Object.assign(preset.externals[2], { type: 3, value1: 35, label: 'WAH', state1: 'OFF', state2: 'ON' });
const before = new Array(1024).fill(255);
before.splice(720, 7, 165, 1, 1, 11, 0, 127, 0);
writeFileSync(process.argv[2], buildImage(preset, before, true));

if (process.argv[3]) {
 Object.assign(preset.pages[0][0][0], {type:3,value1:47,value2:0,value3:2,label:'MODO',state1:'PRESET',state2:'STOMP',tapTempo:false});
 Object.assign(preset.pages[0][1][0], {type:2,value1:42,value2:127,tapTempo:false});
 Object.assign(preset.pages[0][2][0], {type:2,value1:44,value2:127,tapTempo:true});
 Object.assign(preset.pages[2][5][2], {type:3,value1:64,label:'LAST',state1:'I',state2:'II'});
 Object.assign(preset.externals[2], {type:2,value1:44,value2:127,tapTempo:true});
 writeFileSync(process.argv[3], buildImage(preset,before,true));
}
