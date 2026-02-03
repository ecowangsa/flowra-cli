const fs = require('fs');
const path = require('path');

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function ensureParent(filePath) {
  ensureDir(path.dirname(filePath));
}

function writeFile(filePath, contents) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, contents, 'utf8');
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  ensureDir,
  ensureParent,
  writeFile,
  fileExists,
  readFile,
  removeFile,
};
