const fs = require('fs');
const buffer = fs.readFileSync('public/models/Node1.glb');
const magic = buffer.readUInt32LE(0);
if (magic !== 0x46546C67) { console.log('Not a GLB'); process.exit(1); }
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonChunkType = buffer.readUInt32LE(16);
if (jsonChunkType !== 0x4E4F534A) { console.log('First chunk not JSON'); process.exit(1); }
const jsonBuffer = buffer.slice(20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonBuffer.toString('utf8'));
const materials = gltf.materials;

console.log('--- MATERIALS ---');
materials.forEach((m, i) => {
  const name = (m.name || '').toLowerCase();
  if (name.includes('acrylic') || name.includes('led')) return;
  console.log(`Material ${i}: ${m.name}`);
  console.log(`  Type: ${m.alphaMode === 'BLEND' ? 'Transparent' : 'Opaque'}`);
  
  if (m.pbrMetallicRoughness) {
    const pbr = m.pbrMetallicRoughness;
    console.log(`  Roughness: ${pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 1}`);
    console.log(`  Metalness: ${pbr.metallicFactor !== undefined ? pbr.metallicFactor : 1}`);
    if (pbr.baseColorTexture) {
       console.log(`  BaseColor Texture: ${pbr.baseColorTexture.index}`);
    }
    if (pbr.metallicRoughnessTexture) {
       console.log(`  MetallicRoughness Texture: ${pbr.metallicRoughnessTexture.index}`);
    }
  }
  if (m.normalTexture) console.log(`  Normal Map: ${m.normalTexture.index}`);
  if (m.occlusionTexture) console.log(`  AO Map: ${m.occlusionTexture.index}`);
  console.log('');
});

console.log('--- EXTENSIONS (Compression) ---');
console.log('Extensions Used:', gltf.extensionsUsed || 'None');
console.log('Extensions Required:', gltf.extensionsRequired || 'None');
