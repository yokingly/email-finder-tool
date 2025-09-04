#!/usr/bin/env node

/**
 * Email Validation Test Script
 * 
 * This script tests the email validation functionality
 * Run this after deploying to Vercel to verify everything works
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://email-finder-tool.vercel.app';
const TEST_EMAILS = [
  'test@gmail.com',
  'john.doe@company.com',
  'invalid@nonexistentdomain12345.com',
  'admin@google.com'
];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    console.log(`✅ Health Check: ${response.status} - ${JSON.stringify(response.data)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.message}`);
    return false;
  }
}

async function testEmailFind() {
  console.log('\n🔍 Testing Email Find...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/email/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: 'gmail.com',
        firstName: 'John',
        lastName: 'Doe'
      })
    });
    
    console.log(`📧 Email Find: ${response.status}`);
    if (response.data) {
      console.log(`   Found ${response.data.patterns?.length || 0} patterns`);
      if (response.data.patterns) {
        response.data.patterns.slice(0, 3).forEach((pattern, i) => {
          console.log(`   ${i + 1}. ${pattern.example} (${pattern.type})`);
        });
      }
    }
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Email Find Failed: ${error.message}`);
    return false;
  }
}

async function testEmailValidate() {
  console.log('\n✅ Testing Email Validation...');
  
  for (const email of TEST_EMAILS) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/email/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      console.log(`📧 ${email}: ${response.status}`);
      if (response.data) {
        const result = response.data;
        console.log(`   Valid: ${result.isValid ? '✅' : '❌'}`);
        console.log(`   Catch-All: ${result.isCatchAll ? '⚠️' : '✅'}`);
        if (result.mxProvider) {
          console.log(`   Provider: ${result.mxProvider}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${email} validation failed: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Email Finder Tool Tests...\n');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Health check failed. Please check your deployment.');
    return;
  }
  
  await testEmailFind();
  await testEmailValidate();
  
  console.log('\n🎉 Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Visit your frontend: https://email-finder-tool.vercel.app');
  console.log('2. Sign up with Clerk authentication');
  console.log('3. Test the email finder interface');
  console.log('4. Check the API endpoints with your API keys');
}

// Run the tests
runTests().catch(console.error);
