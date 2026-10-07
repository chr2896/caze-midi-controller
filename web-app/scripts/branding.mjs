import { copyFile, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const icon = await readFile('build/icon.svg');
await sharp(icon).png().toFile('build/icon.png');
await copyFile('build/icon.svg', 'public/caze-icon.svg');
const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(size => sharp(icon).resize(size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((data, i) => {
  const p = 6 + i * 16; header[p] = header[p + 1] = sizes[i] % 256;
  header.writeUInt16LE(1, p + 4); header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(data.length, p + 8); header.writeUInt32LE(offset, p + 12); offset += data.length;
});
await writeFile('build/icon.ico', Buffer.concat([header, ...images]));
const chunks = await Promise.all([[128,'ic07'],[256,'ic08'],[512,'ic09'],[1024,'ic10']].map(async ([size, type]) => {
  const png = await sharp(icon).resize(size).png().toBuffer();
  const h = Buffer.alloc(8); h.write(type); h.writeUInt32BE(png.length + 8, 4); return Buffer.concat([h, png]);
}));
const icns = Buffer.alloc(8); icns.write('icns'); icns.writeUInt32BE(8 + chunks.reduce((n,c) => n+c.length,0),4);
await writeFile('build/icon.icns', Buffer.concat([icns, ...chunks]));
for (const name of ['installer-sidebar', 'installer-header']) {
  const {data,info} = await sharp(`build/${name}.svg`).flatten({background:'#101a20'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const stride = Math.ceil(info.width*3/4)*4;
  const bmp = Buffer.alloc(54+stride*info.height); bmp.write('BM'); bmp.writeUInt32LE(bmp.length,2); bmp.writeUInt32LE(54,10); bmp.writeUInt32LE(40,14); bmp.writeInt32LE(info.width,18); bmp.writeInt32LE(info.height,22); bmp.writeUInt16LE(1,26); bmp.writeUInt16LE(24,28);
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) { const s=(y*info.width+x)*3,d=54+(info.height-y-1)*stride+x*3; bmp[d]=data[s+2]; bmp[d+1]=data[s+1]; bmp[d+2]=data[s]; }
  await writeFile(`build/${name}.bmp`,bmp);
  await sharp(`build/${name}.svg`).resize(info.width*3,info.height*3).png().toFile(`build/${name}-preview.png`);
}
console.log('Brand assets generated: PNG, ICO, ICNS and 24-bit installer BMPs.');
