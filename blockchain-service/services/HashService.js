const crypto = require('crypto');
const winston = require('winston');

/**
 * HashService - Handles all cryptographic hashing operations
 * Provides secure hash generation for documents, metadata, and combined data
 */
class HashService {
  constructor() {
    this.algorithm = process.env.HASH_ALGORITHM || 'sha256';
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    
    this.logger.info(`HashService initialized with algorithm: ${this.algorithm}`);
  }

  /**
   * Generate cryptographic hash for document buffer
   * @param {Buffer} documentBuffer - The document file buffer
   * @param {string} salt - Optional salt for additional security
   * @returns {string} Hexadecimal hash string
   */
  generateDocumentHash(documentBuffer, salt = '') {
    try {
      if (!Buffer.isBuffer(documentBuffer)) {
        throw new Error('Document must be a Buffer');
      }

      const hash = crypto.createHash(this.algorithm);
      
      // Add salt if provided
      if (salt) {
        hash.update(salt);
      }
      
      // Hash the document content
      hash.update(documentBuffer);
      
      const documentHash = hash.digest('hex');
      
      this.logger.debug(`Generated document hash: ${documentHash.substring(0, 16)}... (size: ${documentBuffer.length} bytes)`);
      
      return documentHash;
      
    } catch (error) {
      this.logger.error('Failed to generate document hash:', error);
      throw new Error(`Hash generation failed: ${error.message}`);
    }
  }

  /**
   * Generate hash for metadata object
   * @param {object} metadata - The metadata object to hash
   * @returns {string} Hexadecimal hash string
   */
  generateMetadataHash(metadata) {
    try {
      if (!metadata || typeof metadata !== 'object') {
        this.logger.warn('No valid metadata provided, using empty object');
        metadata = {};
      }

      // Create deterministic string representation
      const metadataString = this.createDeterministicString(metadata);
      
      const hash = crypto.createHash(this.algorithm);
      hash.update(metadataString);
      
      const metadataHash = hash.digest('hex');
      
      this.logger.debug(`Generated metadata hash: ${metadataHash.substring(0, 16)}... (data: ${metadataString.length} chars)`);
      
      return metadataHash;
      
    } catch (error) {
      this.logger.error('Failed to generate metadata hash:', error);
      throw new Error(`Metadata hash generation failed: ${error.message}`);
    }
  }

  /**
   * Generate combined hash from document and metadata hashes
   * @param {string} documentHash - The document hash
   * @param {string} metadataHash - The metadata hash
   * @param {string} timestamp - ISO timestamp string
   * @returns {string} Combined hexadecimal hash
   */
  generateCombinedHash(documentHash, metadataHash, timestamp = null) {
    try {
      if (!documentHash || !metadataHash) {
        throw new Error('Both document and metadata hashes are required');
      }

      const hash = crypto.createHash(this.algorithm);
      
      // Combine hashes in deterministic order
      hash.update(documentHash);
      hash.update(metadataHash);
      
      // Add timestamp if provided
      if (timestamp) {
        hash.update(timestamp);
      }
      
      const combinedHash = hash.digest('hex');
      
      this.logger.debug(`Generated combined hash: ${combinedHash.substring(0, 16)}...`);
      
      return combinedHash;
      
    } catch (error) {
      this.logger.error('Failed to generate combined hash:', error);
      throw new Error(`Combined hash generation failed: ${error.message}`);
    }
  }

  /**
   * Generate verification token for blockchain transactions
   * @param {object} transactionData - The transaction data
   * @returns {string} Verification token
   */
  generateVerificationToken(transactionData) {
    try {
      const tokenData = {
        documentHash: transactionData.documentHash,
        timestamp: transactionData.timestamp,
        userId: transactionData.userId,
        requestId: transactionData.requestId
      };

      const tokenString = this.createDeterministicString(tokenData);
      const hash = crypto.createHash(this.algorithm);
      hash.update(tokenString);
      
      const token = hash.digest('hex');
      
      this.logger.debug(`Generated verification token: ${token.substring(0, 16)}...`);
      
      return token;
      
    } catch (error) {
      this.logger.error('Failed to generate verification token:', error);
      throw new Error(`Verification token generation failed: ${error.message}`);
    }
  }

  /**
   * Verify document integrity by comparing hashes
   * @param {Buffer} documentBuffer - The document to verify
   * @param {string} expectedHash - The expected hash value
   * @param {string} salt - Optional salt used in original hash
   * @returns {boolean} True if hashes match
   */
  verifyDocumentIntegrity(documentBuffer, expectedHash, salt = '') {
    try {
      const actualHash = this.generateDocumentHash(documentBuffer, salt);
      const isValid = actualHash === expectedHash;
      
      this.logger.info(`Document integrity verification: ${isValid ? 'VALID' : 'INVALID'}`);
      
      if (!isValid) {
        this.logger.warn(`Hash mismatch - Expected: ${expectedHash.substring(0, 16)}..., Actual: ${actualHash.substring(0, 16)}...`);
      }
      
      return isValid;
      
    } catch (error) {
      this.logger.error('Document integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Create a deterministic string representation of an object
   * Ensures consistent hashing across different environments
   * @param {object} obj - Object to stringify
   * @returns {string} Deterministic string representation
   */
  createDeterministicString(obj) {
    if (obj === null || obj === undefined) {
      return 'null';
    }
    
    if (typeof obj !== 'object') {
      return String(obj);
    }
    
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.createDeterministicString(item)).join(',') + ']';
    }
    
    // Sort keys to ensure deterministic order
    const sortedKeys = Object.keys(obj).sort();
    const keyValuePairs = sortedKeys.map(key => {
      return `"${key}":${this.createDeterministicString(obj[key])}`;
    });
    
    return '{' + keyValuePairs.join(',') + '}';
  }

  /**
   * Generate Merkle tree root hash for batch verification
   * @param {Array<string>} hashes - Array of document hashes
   * @returns {string} Merkle root hash
   */
  generateMerkleRoot(hashes) {
    try {
      if (!Array.isArray(hashes) || hashes.length === 0) {
        throw new Error('Hashes array is required and must not be empty');
      }

      if (hashes.length === 1) {
        return hashes[0];
      }

      let currentLevel = [...hashes];

      while (currentLevel.length > 1) {
        const nextLevel = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
          const left = currentLevel[i];
          const right = currentLevel[i + 1] || left; // Duplicate if odd number

          const hash = crypto.createHash(this.algorithm);
          hash.update(left + right);
          nextLevel.push(hash.digest('hex'));
        }

        currentLevel = nextLevel;
      }

      const merkleRoot = currentLevel[0];
      this.logger.debug(`Generated Merkle root: ${merkleRoot.substring(0, 16)}... from ${hashes.length} hashes`);
      
      return merkleRoot;
      
    } catch (error) {
      this.logger.error('Failed to generate Merkle root:', error);
      throw new Error(`Merkle root generation failed: ${error.message}`);
    }
  }

  /**
   * Get hash algorithm information
   * @returns {object} Algorithm details
   */
  getAlgorithmInfo() {
    return {
      algorithm: this.algorithm,
      digestLength: crypto.createHash(this.algorithm).digest('hex').length,
      available: crypto.getHashes().includes(this.algorithm)
    };
  }
}

module.exports = HashService;