const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

/**
 * FRAContract - Forest Rights Atlas Smart Contract
 * Handles document verification, land rights recording, and audit trails
 */
class FRAContract extends Contract {

  /**
   * Initialize the smart contract
   * @param {Context} ctx - Transaction context
   */
  async InitLedger(ctx) {
    console.log('🚀 Initializing Forest Rights Atlas Smart Contract');
    
    // Store contract metadata
    const contractInfo = {
      name: 'Forest Rights Atlas Contract',
      version: '1.0.0',
      description: 'Smart contract for forest land rights verification and audit',
      initialized: new Date().toISOString(),
      totalVerifications: 0,
      totalClaims: 0
    };
    
    await ctx.stub.putState('CONTRACT_INFO', Buffer.from(JSON.stringify(contractInfo)));
    
    return JSON.stringify(contractInfo);
  }

  /**
   * Get contract information
   * @param {Context} ctx - Transaction context
   * @returns {string} Contract information
   */
  async GetContractInfo(ctx) {
    const contractInfoBytes = await ctx.stub.getState('CONTRACT_INFO');
    
    if (!contractInfoBytes || contractInfoBytes.length === 0) {
      const defaultInfo = {
        name: 'Forest Rights Atlas Contract',
        version: '1.0.0',
        status: 'active',
        initialized: new Date().toISOString()
      };
      return JSON.stringify(defaultInfo);
    }
    
    return contractInfoBytes.toString();
  }

  /**
   * Record document verification on blockchain
   * @param {Context} ctx - Transaction context
   * @param {string} requestId - Unique request identifier
   * @param {string} documentHash - SHA256 hash of document
   * @param {string} metadataHash - SHA256 hash of metadata
   * @param {string} combinedHash - Combined hash
   * @param {string} userId - User who submitted document
   * @param {string} timestamp - ISO timestamp
   * @param {string} fileInfo - JSON string of file information
   * @param {string} metadata - JSON string of extracted metadata
   * @returns {string} Verification record
   */
  async RecordVerification(ctx, requestId, documentHash, metadataHash, combinedHash, userId, timestamp, fileInfo, metadata) {
    console.log(`📝 Recording verification: ${requestId}`);
    
    // Validate inputs
    if (!requestId || !documentHash || !userId || !timestamp) {
      throw new Error('Missing required parameters: requestId, documentHash, userId, timestamp');
    }

    // Check if verification already exists
    const existingVerification = await ctx.stub.getState(`VERIFICATION_${requestId}`);
    if (existingVerification && existingVerification.length > 0) {
      throw new Error(`Verification already exists for request: ${requestId}`);
    }

    // Get transaction ID and timestamp
    const txId = ctx.stub.getTxID();
    const txTimestamp = ctx.stub.getTxTimestamp();

    // Create verification record
    const verification = {
      requestId,
      documentHash,
      metadataHash: metadataHash || '',
      combinedHash: combinedHash || documentHash,
      userId,
      submissionTimestamp: timestamp,
      blockchainTimestamp: new Date(txTimestamp.seconds.low * 1000).toISOString(),
      transactionId: txId,
      fileInfo: this.parseJSONSafely(fileInfo),
      metadata: this.parseJSONSafely(metadata),
      status: 'VERIFIED',
      immutable: true,
      auditTrail: this.createAuditEntry('DOCUMENT_VERIFIED', `Document verified for user ${userId}`, txTimestamp)
    };

    // Store verification record
    await ctx.stub.putState(`VERIFICATION_${requestId}`, Buffer.from(JSON.stringify(verification)));
    
    // Create index for user verifications
    await this.createUserIndex(ctx, userId, requestId);
    
    // Update contract statistics
    await this.updateContractStats(ctx, 'totalVerifications');

    // Emit event
    ctx.stub.setEvent('DocumentVerified', Buffer.from(JSON.stringify({
      requestId,
      userId,
      documentHash,
      transactionId: txId,
      timestamp: verification.blockchainTimestamp
    })));

    console.log(`✅ Verification recorded successfully: ${requestId}`);
    return JSON.stringify(verification);
  }

  /**
   * Record land claim on blockchain
   * @param {Context} ctx - Transaction context
   * @param {string} claimId - Unique claim identifier
   * @param {string} beneficiaryName - Name of beneficiary
   * @param {string} landArea - Land area in acres/hectares
   * @param {string} coordinates - JSON string of coordinates
   * @param {string} villageCode - Village identification code
   * @param {string} userId - Submitting user ID
   * @param {string} verificationRequestId - Associated verification request
   * @returns {string} Claim record
   */
  async RecordClaim(ctx, claimId, beneficiaryName, landArea, coordinates, villageCode, userId, verificationRequestId) {
    console.log(`🏞️ Recording land claim: ${claimId}`);
    
    // Validate inputs
    if (!claimId || !beneficiaryName || !landArea || !userId) {
      throw new Error('Missing required parameters for land claim');
    }

    // Check if claim already exists
    const existingClaim = await ctx.stub.getState(`CLAIM_${claimId}`);
    if (existingClaim && existingClaim.length > 0) {
      throw new Error(`Claim already exists: ${claimId}`);
    }

    // Verify associated verification if provided
    if (verificationRequestId) {
      const verification = await ctx.stub.getState(`VERIFICATION_${verificationRequestId}`);
      if (!verification || verification.length === 0) {
        throw new Error(`Associated verification not found: ${verificationRequestId}`);
      }
    }

    // Get transaction details
    const txId = ctx.stub.getTxID();
    const txTimestamp = ctx.stub.getTxTimestamp();

    // Create claim record
    const claim = {
      claimId,
      beneficiaryName,
      landArea: parseFloat(landArea),
      coordinates: this.parseJSONSafely(coordinates),
      villageCode,
      userId,
      verificationRequestId: verificationRequestId || '',
      submissionTimestamp: new Date(txTimestamp.seconds.low * 1000).toISOString(),
      transactionId: txId,
      status: 'SUBMITTED',
      approvalStatus: 'PENDING',
      immutable: true,
      auditTrail: this.createAuditEntry('CLAIM_SUBMITTED', `Land claim submitted by ${userId} for ${beneficiaryName}`, txTimestamp)
    };

    // Store claim record
    await ctx.stub.putState(`CLAIM_${claimId}`, Buffer.from(JSON.stringify(claim)));
    
    // Create indices
    await this.createUserIndex(ctx, userId, claimId, 'CLAIM');
    await this.createVillageIndex(ctx, villageCode, claimId);
    
    // Update statistics
    await this.updateContractStats(ctx, 'totalClaims');

    // Emit event
    ctx.stub.setEvent('ClaimSubmitted', Buffer.from(JSON.stringify({
      claimId,
      beneficiaryName,
      userId,
      transactionId: txId,
      timestamp: claim.submissionTimestamp
    })));

    return JSON.stringify(claim);
  }

  /**
   * Get verification record
   * @param {Context} ctx - Transaction context
   * @param {string} requestId - Request identifier
   * @returns {string} Verification record
   */
  async GetVerification(ctx, requestId) {
    if (!requestId) {
      throw new Error('Request ID is required');
    }

    const verificationBytes = await ctx.stub.getState(`VERIFICATION_${requestId}`);
    
    if (!verificationBytes || verificationBytes.length === 0) {
      throw new Error(`Verification not found: ${requestId}`);
    }

    return verificationBytes.toString();
  }

  /**
   * Get claim record
   * @param {Context} ctx - Transaction context
   * @param {string} claimId - Claim identifier
   * @returns {string} Claim record
   */
  async GetClaim(ctx, claimId) {
    if (!claimId) {
      throw new Error('Claim ID is required');
    }

    const claimBytes = await ctx.stub.getState(`CLAIM_${claimId}`);
    
    if (!claimBytes || claimBytes.length === 0) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    return claimBytes.toString();
  }

  /**
   * Update claim status (for authorized users only)
   * @param {Context} ctx - Transaction context
   * @param {string} claimId - Claim identifier
   * @param {string} newStatus - New status
   * @param {string} approvalStatus - Approval status
   * @param {string} userId - User updating the claim
   * @param {string} remarks - Optional remarks
   * @returns {string} Updated claim record
   */
  async UpdateClaimStatus(ctx, claimId, newStatus, approvalStatus, userId, remarks = '') {
    if (!claimId || !newStatus || !userId) {
      throw new Error('Missing required parameters for status update');
    }

    const claimBytes = await ctx.stub.getState(`CLAIM_${claimId}`);
    if (!claimBytes || claimBytes.length === 0) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const claim = JSON.parse(claimBytes.toString());
    const txId = ctx.stub.getTxID();
    const txTimestamp = ctx.stub.getTxTimestamp();

    // Update claim
    claim.status = newStatus;
    claim.approvalStatus = approvalStatus || claim.approvalStatus;
    claim.lastUpdated = new Date(txTimestamp.seconds.low * 1000).toISOString();
    claim.updatedBy = userId;
    claim.remarks = remarks;

    // Add audit trail entry
    const auditEntry = this.createAuditEntry(
      'STATUS_UPDATED',
      `Status updated to ${newStatus} by ${userId}${remarks ? ': ' + remarks : ''}`,
      txTimestamp
    );

    if (claim.auditTrail) {
      claim.auditTrail.push(auditEntry);
    } else {
      claim.auditTrail = [auditEntry];
    }

    // Store updated claim
    await ctx.stub.putState(`CLAIM_${claimId}`, Buffer.from(JSON.stringify(claim)));

    // Emit event
    ctx.stub.setEvent('ClaimStatusUpdated', Buffer.from(JSON.stringify({
      claimId,
      status: newStatus,
      approvalStatus,
      updatedBy: userId,
      transactionId: txId,
      timestamp: claim.lastUpdated
    })));

    return JSON.stringify(claim);
  }

  /**
   * Get all verifications for a user
   * @param {Context} ctx - Transaction context
   * @param {string} userId - User identifier
   * @returns {string} Array of verification records
   */
  async GetUserVerifications(ctx, userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const iterator = await ctx.stub.getStateByPartialCompositeKey('USER_VERIFICATION', [userId]);
    const verifications = [];

    try {
      for await (const result of iterator) {
        const verificationId = result.key.split('\u0000')[2]; // Extract verification ID from composite key
        const verification = await this.GetVerification(ctx, verificationId);
        verifications.push(JSON.parse(verification));
      }
    } finally {
      await iterator.close();
    }

    return JSON.stringify(verifications);
  }

  /**
   * Get claims by village
   * @param {Context} ctx - Transaction context
   * @param {string} villageCode - Village code
   * @returns {string} Array of claim records
   */
  async GetClaimsByVillage(ctx, villageCode) {
    if (!villageCode) {
      throw new Error('Village code is required');
    }

    const iterator = await ctx.stub.getStateByPartialCompositeKey('VILLAGE_CLAIM', [villageCode]);
    const claims = [];

    try {
      for await (const result of iterator) {
        const claimId = result.key.split('\u0000')[2];
        const claim = await this.GetClaim(ctx, claimId);
        claims.push(JSON.parse(claim));
      }
    } finally {
      await iterator.close();
    }

    return JSON.stringify(claims);
  }

  /**
   * Get contract statistics
   * @param {Context} ctx - Transaction context
   * @returns {string} Contract statistics
   */
  async GetContractStats(ctx) {
    const contractInfoBytes = await ctx.stub.getState('CONTRACT_INFO');
    
    if (contractInfoBytes && contractInfoBytes.length > 0) {
      return contractInfoBytes.toString();
    }

    // Return default stats if not found
    const defaultStats = {
      totalVerifications: 0,
      totalClaims: 0,
      contractVersion: '1.0.0',
      lastUpdated: new Date().toISOString()
    };

    return JSON.stringify(defaultStats);
  }

  // Helper Methods

  /**
   * Parse JSON string safely
   * @param {string} jsonString - JSON string to parse
   * @returns {object} Parsed object or empty object
   */
  parseJSONSafely(jsonString) {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch (error) {
      console.warn('Failed to parse JSON:', error.message);
      return {};
    }
  }

  /**
   * Create audit trail entry
   * @param {string} action - Action performed
   * @param {string} description - Description of action
   * @param {object} timestamp - Fabric timestamp
   * @returns {object} Audit entry
   */
  createAuditEntry(action, description, timestamp) {
    return {
      action,
      description,
      timestamp: new Date(timestamp.seconds.low * 1000).toISOString(),
      blockNumber: timestamp.seconds.low, // Simplified - in reality would need block info
      immutable: true
    };
  }

  /**
   * Create user index for verifications/claims
   * @param {Context} ctx - Transaction context
   * @param {string} userId - User ID
   * @param {string} recordId - Record ID
   * @param {string} type - Record type ('VERIFICATION' or 'CLAIM')
   */
  async createUserIndex(ctx, userId, recordId, type = 'VERIFICATION') {
    const indexKey = ctx.stub.createCompositeKey(`USER_${type}`, [userId, recordId]);
    await ctx.stub.putState(indexKey, Buffer.from(recordId));
  }

  /**
   * Create village index for claims
   * @param {Context} ctx - Transaction context
   * @param {string} villageCode - Village code
   * @param {string} claimId - Claim ID
   */
  async createVillageIndex(ctx, villageCode, claimId) {
    const indexKey = ctx.stub.createCompositeKey('VILLAGE_CLAIM', [villageCode, claimId]);
    await ctx.stub.putState(indexKey, Buffer.from(claimId));
  }

  /**
   * Update contract statistics
   * @param {Context} ctx - Transaction context
   * @param {string} statName - Statistic name to increment
   */
  async updateContractStats(ctx, statName) {
    try {
      const contractInfoBytes = await ctx.stub.getState('CONTRACT_INFO');
      let contractInfo = {};

      if (contractInfoBytes && contractInfoBytes.length > 0) {
        contractInfo = JSON.parse(contractInfoBytes.toString());
      }

      contractInfo[statName] = (contractInfo[statName] || 0) + 1;
      contractInfo.lastUpdated = new Date().toISOString();

      await ctx.stub.putState('CONTRACT_INFO', Buffer.from(JSON.stringify(contractInfo)));
    } catch (error) {
      console.warn('Failed to update contract stats:', error.message);
    }
  }
}

module.exports = FRAContract;