/**
 * MongoDB Connection and CRUD Operations Test Script
 */

const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:password123@localhost:27017/calculator?authSource=admin';

console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    performCRUDOperations();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define a schema for testing
const TestSchema = new mongoose.Schema({
  name: String,
  value: Number,
  createdAt: { type: Date, default: Date.now }
});

// Create a model from the schema
const TestModel = mongoose.model('Test', TestSchema);

// Perform CRUD operations
async function performCRUDOperations() {
  try {
    // CREATE - Insert a new document
    console.log('\n--- CREATE Operation ---');
    const newItem = new TestModel({
      name: 'Test Item',
      value: Math.floor(Math.random() * 100)
    });
    
    const savedItem = await newItem.save();
    console.log('Created item:', savedItem);

    // READ - Retrieve the document
    console.log('\n--- READ Operation ---');
    const foundItem = await TestModel.findById(savedItem._id);
    console.log('Retrieved item:', foundItem);

    // UPDATE - Modify the document
    console.log('\n--- UPDATE Operation ---');
    foundItem.name = 'Updated Test Item';
    const updatedItem = await foundItem.save();
    console.log('Updated item:', updatedItem);

    // READ AGAIN - Verify the update
    console.log('\n--- READ AGAIN Operation ---');
    const verifyItem = await TestModel.findById(savedItem._id);
    console.log('Verified updated item:', verifyItem);

    // DELETE - Remove the document
    console.log('\n--- DELETE Operation ---');
    const deleteResult = await TestModel.deleteOne({ _id: savedItem._id });
    console.log('Delete result:', deleteResult);

    // VERIFY DELETE - Ensure the document is gone
    console.log('\n--- VERIFY DELETE Operation ---');
    const shouldBeNull = await TestModel.findById(savedItem._id);
    console.log('Item after deletion (should be null):', shouldBeNull);

    console.log('\nAll CRUD operations completed successfully!');
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during CRUD operations:', error);
    process.exit(1);
  }
} 