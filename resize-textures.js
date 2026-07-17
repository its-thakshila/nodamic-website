import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dir = './src/assets/HeroScene';
const files = ['dark_rock_diff_2k.jpg', 'dark_rock_arm_2k.jpg', 'dark_rock_nor_gl_2k.png'];

async function run() {
  for (const file of files) {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) {
      console.log(`File not found: ${p}`);
      continue;
    }
    
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const newName = basename.replace('_2k', '_1k') + (ext === '.png' ? '.jpg' : ext); // convert normal map to jpg for extra savings
    const outPath = path.join(dir, newName);
    
    console.log(`Resizing ${file} to 1k...`);
    
    let pipeline = sharp(p).resize({ width: 1024 });
    if (ext === '.png') {
        // Convert to high quality JPG to massively reduce file size of the 25MB normal map
        pipeline = pipeline.jpeg({ quality: 90 });
    }
    
    await pipeline.toFile(outPath);
    console.log(`Done: ${newName}`);
  }
}
run().catch(console.error);
