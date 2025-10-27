const jwt = require('jsonwebtoken');
require('dotenv').config();

// Check if JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not configured in your .env file');
  console.log('Please add JWT_SECRET=your_secret_key to your .env file');
  process.exit(1);
}

/**
 * Generate a JWT token
 * @param {Object} payload - The payload to encode in the token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
function generateJWT(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 * @param {string} token - The token to verify
 * @returns {Object} Decoded payload
 */
function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Decode a JWT token without verification
 * @param {string} token - The token to decode
 * @returns {Object} Decoded payload
 */
function decodeJWT(token) {
  return jwt.decode(token);
}

// Example usage
if (require.main === module) {
  console.log('🔐 JWT Token Generator');
  console.log('========================\n');

  // Example 1: Generate token for a user
  const userPayload = {
    userId: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    role: 'user'
  };
  
  const userToken = generateJWT(userPayload, '7d');
  console.log('👤 User Token (7 days):');
  console.log(userToken);
  console.log('\nPayload:', userPayload);
  console.log('Expires in: 7 days\n');

  // Example 2: Generate admin token
  const adminPayload = {
    userId: '507f1f77bcf86cd799439012',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  };
  
  const adminToken = generateJWT(adminPayload, '24h');
  console.log('👑 Admin Token (24 hours):');
  console.log(adminToken);
  console.log('\nPayload:', adminPayload);
  console.log('Expires in: 24 hours\n');

  // Example 3: Generate custom token
  const customPayload = {
    type: 'api-access',
    clientId: 'mobile-app-123',
    features: ['plant-identification', 'social-feeds']
  };
  
  const customToken = generateJWT(customPayload, '30d');
  console.log('🔧 Custom Token (30 days):');
  console.log(customToken);
  console.log('\nPayload:', customPayload);
  console.log('Expires in: 30 days\n');

  // Example 4: Test token verification
  try {
    const verified = verifyJWT(userToken);
    console.log('✅ Token verification successful:');
    console.log(verified);
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
  }

  console.log('\n📝 Usage Examples:');
  console.log('1. Generate user token: generateJWT({ userId: "123", role: "user" })');
  console.log('2. Generate admin token: generateJWT({ userId: "123", role: "admin" }, "24h")');
  console.log('3. Verify token: verifyJWT("your.jwt.token")');
  console.log('4. Decode token: decodeJWT("your.jwt.token")');
}

module.exports = {
  generateJWT,
  verifyJWT,
  decodeJWT
};

