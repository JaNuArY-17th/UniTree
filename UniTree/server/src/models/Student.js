const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: [true, 'Please provide a student ID'],
    unique: true
  },
  full_name: {
    type: String,
    required: [true, 'Please provide a full name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema, 'students');

module.exports = Student; 