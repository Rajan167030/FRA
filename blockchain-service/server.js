const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Simple in-memory blockchain
class SimpleBlockchain {
  constructor() {
    this.blocks = [];
    this.pendingTransactions = [];
    this.createGenesisBlock();
  }

  createGenesisBlock() {
    const genesisBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      transactions: [],
      previousHash: '0',
      hash: this.calculateHash(0, new Date().toISOString(), [], '0')
    };
    this.blocks.push(genesisBlock);
  }

  calculateHash(index, timestamp, transactions, previousHash) {
    const data = index + timestamp + JSON.stringify(transactions) + previousHash;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  getLatestBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  minePendingTransactions() {
    const block = {
      index: this.blocks.length,
      timestamp: new Date().toISOString(),
      transactions: this.pendingTransactions,
      previousHash: this.getLatestBlock().hash
    };
    
    block.hash = this.calculateHash(block.index, block.timestamp, block.transactions, block.previousHash);
    this.blocks.push(block);
    this.pendingTransactions = [];
    return block;
  }

  getTransaction(transactionId) {
    for (let block of this.blocks) {
      for (let transaction of block.transactions) {
        if (transaction.id === transactionId) {
          return { transaction, block };
        }
      }
    }
    return null;
  }
}

// Initialize blockchain
const blockchain = new SimpleBlockchain();

// Initialize Express app
const app = express();
const PORT = 8001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper functions
function generateDocumentHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateMetadataHash(metadata) {
  return crypto.createHash('sha256').update(JSON.stringify(metadata || {})).digest('hex');
}

function generateTransactionId() {
  return crypto.randomBytes(16).toString('hex');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'blockchain-verification',
    version: '1.0.0',
    blocks: blockchain.blocks.length,
    pendingTransactions: blockchain.pendingTransactions.length
  });
});

// Submit document verification to blockchain
app.post('/api/submit-verification', async (req, res) => {
  try {
    const { documentHash, metadata, ocrText, coordinates } = req.body;
    
    if (!documentHash) {
      return res.status(400).json({
        success: false,
        error: 'Document hash is required'
      });
    }

    // Generate transaction
    const transactionId = generateTransactionId();
    const metadataHash = generateMetadataHash(metadata);
    const combinedHash = crypto.createHash('sha256')
      .update(documentHash + metadataHash)
      .digest('hex');

    const transaction = {
      id: transactionId,
      type: 'DOCUMENT_VERIFICATION',
      documentHash,
      metadataHash,
      combinedHash,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      ocrText: ocrText || '',
      coordinates: coordinates || {},
      status: 'VERIFIED'
    };

    // Add to blockchain
    blockchain.addTransaction(transaction);
    const block = blockchain.minePendingTransactions();

    console.log(`New verification transaction: ${transactionId}`);
    console.log(`Added to block: ${block.index}`);

    res.json({
      success: true,
      transactionId,
      blockNumber: block.index,
      documentHash,
      metadataHash,
      combinedHash,
      timestamp: transaction.timestamp,
      blockHash: block.hash
    });

  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Blockchain verification failed'
    });
  }
});

// Get verification status
app.get('/api/verification/:transactionId', (req, res) => {
  try {
    const { transactionId } = req.params;
    const result = blockchain.getTransaction(transactionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction: result.transaction,
      block: {
        index: result.block.index,
        hash: result.block.hash,
        timestamp: result.block.timestamp
      }
    });

  } catch (error) {
    console.error('Verification lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup verification'
    });
  }
});

// Get blockchain status
app.get('/api/blockchain/status', (req, res) => {
  res.json({
    success: true,
    blockchain: {
      totalBlocks: blockchain.blocks.length,
      pendingTransactions: blockchain.pendingTransactions.length,
      latestBlock: blockchain.getLatestBlock(),
      genesisBlock: blockchain.blocks[0]
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔗 Blockchain Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Blockchain status: http://localhost:${PORT}/api/blockchain/status`);
});