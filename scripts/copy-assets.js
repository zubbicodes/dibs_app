const fs = require('fs');
const path = require('path');

const srcModel = path.join(__dirname, '..', 'assets', 'models', 'mobilefacenet.tflite');
const destDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'models');
const destModel = path.join(destDir, 'mobilefacenet.tflite');

if (!fs.existsSync(srcModel)) {
  console.log('Model not found at', srcModel, '- skipping copy');
  process.exit(0);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(srcModel, destModel);
console.log('Copied model to android assets');
