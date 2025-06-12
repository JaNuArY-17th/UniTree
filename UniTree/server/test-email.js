// Simple test script to verify email functionality
require('dotenv').config();

const emailService = require('./src/utils/emailService');

async function testEmail() {
  try {
    console.log('Testing email service...');
    
    // Generate test code
    const testCode = emailService.generateVerificationCode();
    console.log('Generated verification code:', testCode);
    
    // Try to send verification email (will use ethereal in development)
    const result = await emailService.sendVerificationEmail(
      'longnhgch230179@fpt.edu.vn',
      testCode,
      'Nguyễn Hoàng Long'
    );
    
    console.log('Email sent successfully:', result);
    
    // Try to send welcome email
    const welcomeResult = await emailService.sendWelcomeEmail(
      'longnhgch230179@fpt.edu.vn',
      'Nguyễn Hoàng Long',
      'Nhl'
    );
    
    console.log('Welcome email sent successfully:', welcomeResult);
    
  } catch (error) {
    console.error('Email test failed:', error);
  }
}

// Run test
testEmail(); 