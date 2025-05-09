/**
 * Calculator API and History Testing Script
 */

const axios = require('axios');

// Base URL for the calculator service
const BASE_URL = process.env.API_URL || 'http://localhost:30036';

const MONGODB_URI = 'mongodb://localhost:27017/calculator';

// Test cases for calculator operations
const testCases = [
  { operation: 'add', params: { num1: 5, num2: 3 }, expectedResult: 8 },
  { operation: 'subtract', params: { num1: 10, num2: 4 }, expectedResult: 6 },
  { operation: 'multiply', params: { num1: 7, num2: 6 }, expectedResult: 42 },
  { operation: 'divide', params: { num1: 20, num2: 5 }, expectedResult: 4 },
  { operation: 'power', params: { num1: 2, num2: 3 }, expectedResult: 8 },
  { operation: 'sqrt', params: { num1: 25 }, expectedResult: 5 },
  { operation: 'mod', params: { num1: 17, num2: 5 }, expectedResult: 2 }
];

// Function to run a test case
async function runTest(test) {
  const { operation, params, expectedResult } = test;
  const url = `${BASE_URL}/${operation}?` + 
    Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  
  try {
    console.log(`Testing ${operation} operation: ${url}`);
    const response = await axios.get(url);
    
    if (response.data.result === expectedResult) {
      console.log(`✅ ${operation} test passed! Result: ${response.data.result}`);
      return true;
    } else {
      console.error(`❌ ${operation} test failed! Expected: ${expectedResult}, Got: ${response.data.result}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${operation} test error:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Function to test history API
async function testHistory() {
  try {
    console.log('\nTesting history retrieval...');
    const response = await axios.get(`${BASE_URL}/history`);
    
    if (response.data && response.data.history && Array.isArray(response.data.history)) {
      console.log(`✅ History retrieval test passed! Found ${response.data.history.length} records.`);
      console.log('First few records:', response.data.history.slice(0, 3));
      return true;
    } else {
      console.error('❌ History retrieval test failed! Invalid response format:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ History test error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Function to clear history
async function clearHistory() {
  try {
    console.log('\nClearing history...');
    const response = await axios.delete(`${BASE_URL}/history`);
    
    if (response.data && response.data.message === 'History cleared successfully') {
      console.log('✅ History cleared successfully!');
      return true;
    } else {
      console.error('❌ History clear test failed! Invalid response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ History clear error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting calculator API tests...\n');
  
  // First clear history to start fresh
  await clearHistory();
  
  // Run all calculation tests
  let passedTests = 0;
  for (const test of testCases) {
    if (await runTest(test)) {
      passedTests++;
    }
  }
  
  // Test history after calculations
  const historyTestPassed = await testHistory();
  if (historyTestPassed) passedTests++;
  
  // Summary
  console.log(`\nTest Summary: ${passedTests} out of ${testCases.length + 1} tests passed.`);
  
  if (passedTests === testCases.length + 1) {
    console.log('🎉 All tests passed! The calculator service is working correctly with MongoDB integration.');
  } else {
    console.log('⚠️ Some tests failed. Please check the logs above for details.');
  }
}

// Start the tests
runAllTests().catch(error => {
  console.error('Test execution error:', error);
}); 