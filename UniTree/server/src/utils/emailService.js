const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Configure email transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production configuration (use your email service)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } else {
        // Development configuration (use ethereal for testing)
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass'
          }
        });
      }

      // Verify transporter configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
        } else {
          logger.info('Email transporter is ready to send emails');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  // Generate 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send password reset email
  async sendPasswordResetEmail(email, verificationCode, fullName) {
    try {
      const mailOptions = {
        from: `"UniTree" <${process.env.EMAIL_USER || 'noreply@unitree.app'}>`,
        to: email,
        subject: 'UniTree - Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #50AF27; margin: 0;">UniTree</h1>
              <p style="color: #666; margin: 5px 0;">Password Reset Request</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${fullName || 'User'}!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                We received a request to reset your UniTree account password. If you didn't make this request, you can safely ignore this email.
              </p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                To reset your password, please enter the following verification code:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #FFA79D; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                  ${verificationCode}
                </div>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">
                This code will expire in 10 minutes for security reasons.
              </p>
            </div>
            
            <div style="background: #fff3f3; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #FFA79D;">
              <h3 style="color: #d63384; margin-bottom: 15px;">🔒 Security Tips</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Never share your verification code with anyone</li>
                <li>UniTree staff will never ask for your password</li>
                <li>Always verify the sender's email address</li>
                <li>If you didn't request this, secure your account immediately</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you didn't request this password reset, please ignore this email or contact support.
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                © 2024 UniTree - Growing a Greener Future
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`, result);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send verification email
  async sendVerificationEmail(email, verificationCode, fullName) {
    try {
      const mailOptions = {
        from: `"UniTree" <${process.env.EMAIL_USER || 'noreply@unitree.app'}>`,
        to: email,
        subject: 'UniTree - Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #50AF27; margin: 0;">UniTree</h1>
              <p style="color: #666; margin: 5px 0;">Join the Green Revolution</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${fullName || 'Student'}!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Welcome to UniTree! We're excited to have you join our community of environmentally conscious students.
              </p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                To complete your registration, please enter the following verification code in the app:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #50AF27; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                  ${verificationCode}
                </div>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">
                This code will expire in 10 minutes for security reasons.
              </p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #50AF27; margin-bottom: 15px;">🌱 What's Next?</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Connect to your university WiFi to earn points</li>
                <li>Plant and grow virtual trees</li>
                <li>Contribute to real environmental projects</li>
                <li>Compete with classmates in eco-challenges</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you didn't request this verification code, please ignore this email.
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                © 2024 UniTree - Growing a Greener Future
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`, result);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send welcome email after successful registration
  async sendWelcomeEmail(email, fullName, nickname) {
    try {
      const mailOptions = {
        from: `"UniTree" <${process.env.EMAIL_USER || 'noreply@unitree.app'}>`,
        to: email,
        subject: 'Welcome to UniTree! 🌱',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #50AF27; margin: 0;">Welcome to UniTree, ${nickname}!</h1>
              <p style="color: #666; margin: 5px 0;">Your journey to a greener future starts now</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #98D56D, #50AF27); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
              <h2 style="margin: 0 0 15px 0;">🎉 Registration Complete!</h2>
              <p style="margin: 0; font-size: 16px;">You're now part of the UniTree community</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-bottom: 15px;">Getting Started</h3>
              <ol style="color: #666; line-height: 1.6;">
                <li><strong>Connect to University WiFi</strong> - Start earning points immediately</li>
                <li><strong>Plant Your First Tree</strong> - Use your points to grow virtual trees</li>
                <li><strong>Watch It Grow</strong> - The more you connect, the healthier your trees become</li>
                <li><strong>Make an Impact</strong> - Your virtual trees contribute to real environmental projects</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <p style="color: #666; font-size: 16px;">Ready to make a difference? Open the UniTree app and start your eco-journey!</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Need help? Contact us at support@unitree.app
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                © 2024 UniTree - Growing a Greener Future
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}`, result);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email as it's not critical
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService(); 