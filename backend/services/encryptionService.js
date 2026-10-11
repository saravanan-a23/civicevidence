const crypto = require('crypto');

// Deriving a standard 32-byte Master Key Buffer from the environment variable
const getMasterKey = () => {
  const masterKeyRaw = process.env.MASTER_ENCRYPTION_KEY || 'defaultmasterkeyfordevtestingpurposesonly';
  return crypto.createHash('sha256').update(masterKeyRaw).digest();
};

/**
 * Encrypt a buffer with the master key
 */
const encryptKey = (keyBuffer) => {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', masterKey, iv);
  let encrypted = cipher.update(keyBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    encryptedKeyHex: encrypted.toString('hex'),
    keyIvHex: iv.toString('hex'),
  };
};

/**
 * Decrypt a hex string key with the master key
 */
const decryptKey = (encryptedKeyHex, keyIvHex) => {
  const masterKey = getMasterKey();
  const iv = Buffer.from(keyIvHex, 'hex');
  const encrypted = Buffer.from(encryptedKeyHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', masterKey, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
};

/**
 * Encrypt a file buffer
 * Returns the encrypted buffer, the file-specific key encrypted with the master key, the file-specific IV, and the original SHA-256 hash.
 */
const encryptFile = (fileBuffer) => {
  // 1. Generate unique key and IV for this file
  const fileKey = crypto.randomBytes(32);
  const fileIv = crypto.randomBytes(16);

  // 2. Calculate SHA-256 hash of original file
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // 3. Encrypt file buffer using the file-specific key and IV
  const cipher = crypto.createCipheriv('aes-256-cbc', fileKey, fileIv);
  let encrypted = cipher.update(fileBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // 4. Encrypt the file key with the master key
  const { encryptedKeyHex, keyIvHex } = encryptKey(fileKey);

  // We combine the encrypted file key and its IV into one metadata string: encryptedKeyHex:keyIvHex
  const fileKeyEncrypted = `${encryptedKeyHex}:${keyIvHex}`;

  return {
    encryptedBuffer: encrypted,
    fileKeyEncrypted,
    fileIvHex: fileIv.toString('hex'),
    hash,
  };
};

/**
 * Decrypt an encrypted file buffer
 */
const decryptFile = (encryptedBuffer, fileKeyEncrypted, fileIvHex) => {
  // 1. Parse the encrypted file key and its IV
  const [encryptedKeyHex, keyIvHex] = fileKeyEncrypted.split(':');
  
  // 2. Decrypt the file key using the master key
  const fileKey = decryptKey(encryptedKeyHex, keyIvHex);
  const fileIv = Buffer.from(fileIvHex, 'hex');

  // 3. Decrypt the file buffer
  const decipher = crypto.createDecipheriv('aes-256-cbc', fileKey, fileIv);
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
};

module.exports = {
  encryptFile,
  decryptFile,
  calculateHash: (buffer) => crypto.createHash('sha256').update(buffer).digest('hex'),
};
