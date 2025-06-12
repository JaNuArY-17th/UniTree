// Quick email test script
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('🧪 Testing email configuration...\n');
  
  // Check environment variables
  console.log('📋 Configuration:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️  EMAIL_USER or EMAIL_PASSWORD not set. Using ethereal for testing...');
  }
  
  try {
    // Create transporter with same logic as emailService
    let transporter;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    }
    
    console.log('🔗 Testing connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email transporter connection successful!\n');
    
    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = process.env.EMAIL_USER || 'test@example.com';
    
    const result = await transporter.sendMail({
      from: `"UniTree Test" <${process.env.EMAIL_USER || 'test@ethereal.email'}>`,
      to: testEmail,
      subject: '🧪 UniTree Email Test',
      html: `
        <h2>🎉 Email Configuration Test Successful!</h2>
        <p>Your UniTree server can now send emails properly.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Configuration:</strong> ${process.env.EMAIL_SERVICE || 'ethereal'}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📫 Message ID: ${result.messageId}`);
    
    if (result.preview) {
      console.log(`🔗 Preview URL: ${result.preview}`);
    }
    
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log(`Error: ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.log('🚨 Authentication Error Detected!');
      console.log('This usually means:');
      console.log('1. Wrong email/password combination');
      console.log('2. Gmail requires App Password (not regular password)');
      console.log('3. 2-Factor Authentication not enabled\n');
      console.log('💡 Solution:');
      console.log('- Enable 2FA on your Gmail account');
      console.log('- Generate an App Password');
      console.log('- Use the App Password in EMAIL_PASSWORD');
      console.log('- See EMAIL_SETUP_GUIDE.md for detailed instructions');
    }
  }
}

// Run the test
testEmailConfig().then(() => {
  console.log('\n🏁 Email test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
}); 