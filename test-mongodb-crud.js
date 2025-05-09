/**
 * MongoDB CRUD Operations Test Script
 * Tests Create, Read, Update, and Delete operations
 */

const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017/calculator';
const API_BASE_URL = 'http://localhost:3002';

// Setup Mongoose Schema
const calculationSchema = new mongoose.Schema({
  operation: String,
  parameters: Object,
  result: Number,
  timestamp: { type: Date, default: Date.now }
});

const Calculation = mongoose.model('Calculation', calculationSchema, 'calculations');

/**
 * Test CREATE operation via API
 */
async function testCreate() {
  console.log('\n=== Testing CREATE operation ===');
  
  try {
    // Create a new calculation via API
    const response = await axios.get(`${API_BASE_URL}/add?num1=35&num2=15`);
    console.log('API Response:', response.data);
    
    // Verify in database
    await mongoose.connect(MONGODB_URI);
    
    // Find the calculation we just created (should be the most recent one)
    const record = await Calculation.findOne({ 
      operation: 'add', 
      'parameters.num1': 35, 
      'parameters.num2': 15 
    }).sort({ timestamp: -1 });
    
    if (record) {
      console.log('✅ CREATE Test Passed! Record found in database:', record);
      return record; // Return for use in other tests
    } else {
      console.error('❌ CREATE Test Failed! Record not found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ CREATE Test Error:', error.message);
    return null;
  }
}

/**
 * Test READ operation
 */
async function testRead(recordId) {
  console.log('\n=== Testing READ operation ===');
  
  try {
    // Read from database by ID
    const record = await Calculation.findById(recordId);
    
    if (record) {
      console.log('✅ READ Test Passed! Successfully retrieved record:', record);
      return true;
    } else {
      console.error('❌ READ Test Failed! Could not retrieve record');
      return false;
    }
  } catch (error) {
    console.error('❌ READ Test Error:', error.message);
    return false;
  }
}

/**
 * Test READ via API
 */
async function testReadAPI() {
  console.log('\n=== Testing READ via API ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/history`);
    
    if (response.data && response.data.history && Array.isArray(response.data.history)) {
      console.log(`✅ READ API Test Passed! Retrieved ${response.data.history.length} records`);
      console.log('Sample record:', response.data.history[0]);
      return true;
    } else {
      console.error('❌ READ API Test Failed! Invalid response format');
      return false;
    }
  } catch (error) {
    console.error('❌ READ API Test Error:', error.message);
    return false;
  }
}

/**
 * Test UPDATE operation
 */
async function testUpdate(recordId) {
  console.log('\n=== Testing UPDATE operation ===');
  
  try {
    // Find the record
    const record = await Calculation.findById(recordId);
    
    if (!record) {
      console.error('❌ UPDATE Test Failed! Record not found');
      return false;
    }
    
    // Save original values for comparison
    const originalResult = record.result;
    
    // Update the record
    record.result = 999; // Deliberately change to an obvious value
    await record.save();
    
    // Verify the update worked
    const updatedRecord = await Calculation.findById(recordId);
    
    if (updatedRecord && updatedRecord.result === 999) {
      console.log('✅ UPDATE Test Passed!');
      console.log('Original result:', originalResult);
      console.log('Updated result:', updatedRecord.result);
      
      // Restore original value
      updatedRecord.result = originalResult;
      await updatedRecord.save();
      console.log('Restored original value for other tests');
      
      return true;
    } else {
      console.error('❌ UPDATE Test Failed! Update not applied correctly');
      return false;
    }
  } catch (error) {
    console.error('❌ UPDATE Test Error:', error.message);
    return false;
  }
}

/**
 * Test DELETE operation
 */
async function testDelete() {
  console.log('\n=== Testing DELETE operation ===');
  
  try {
    // Create a temporary record to delete
    const tempRecord = new Calculation({
      operation: 'test-delete',
      parameters: { test: true },
      result: 12345
    });
    
    await tempRecord.save();
    console.log('Created temporary record for deletion:', tempRecord);
    
    // Delete the record
    const deleteResult = await Calculation.deleteOne({ _id: tempRecord._id });
    
    // Verify deletion
    const checkRecord = await Calculation.findById(tempRecord._id);
    
    if (deleteResult.deletedCount === 1 && !checkRecord) {
      console.log('✅ DELETE Test Passed! Record successfully deleted');
      return true;
    } else {
      console.error('❌ DELETE Test Failed! Record not deleted');
      return false;
    }
  } catch (error) {
    console.error('❌ DELETE Test Error:', error.message);
    return false;
  }
}

/**
 * Test API DELETE operation (clearing history)
 */
async function testDeleteAPI() {
  console.log('\n=== Testing DELETE via API (clear history) ===');
  
  try {
    // First check if we have records
    const countBefore = await Calculation.countDocuments();
    
    if (countBefore === 0) {
      // Create a few records first
      await axios.get(`${API_BASE_URL}/add?num1=1&num2=2`);
      await axios.get(`${API_BASE_URL}/add?num1=3&num2=4`);
      console.log('Created temporary records for deletion test');
    }
    
    // Send DELETE request to clear history
    const response = await axios.delete(`${API_BASE_URL}/history`);
    
    // Verify records were deleted
    const countAfter = await Calculation.countDocuments();
    
    if (response.data.message === 'History cleared successfully' && countAfter === 0) {
      console.log('✅ DELETE API Test Passed! All records cleared');
      return true;
    } else {
      console.error('❌ DELETE API Test Failed!');
      console.log('Response:', response.data);
      console.log('Records remaining:', countAfter);
      return false;
    }
  } catch (error) {
    console.error('❌ DELETE API Test Error:', error.message);
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
  try {
    console.log('Starting MongoDB CRUD Tests...');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB at:', MONGODB_URI);
    
    // CREATE test
    const createdRecord = await testCreate();
    
    if (createdRecord) {
      // Run other tests only if CREATE passed
      await testRead(createdRecord._id);
      await testReadAPI();
      await testUpdate(createdRecord._id);
      await testDelete();
      await testDeleteAPI();
    }
    
    console.log('\n=== CRUD Testing Complete ===');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Cleanup: Close MongoDB connection
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run all tests
runAllTests(); 