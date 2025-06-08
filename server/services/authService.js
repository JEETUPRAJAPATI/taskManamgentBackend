import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage } from '../mongodb-storage.js';

export class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_EXPIRES_IN = '7d';
    this.VERIFICATION_TOKEN_EXPIRES = 24 * 60 * 60 * 1000; // 24 hours
    this.RESET_TOKEN_EXPIRES = 30 * 60 * 1000; // 30 minutes
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        organizationId: user.organization || user.organizationId 
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Individual user registration
  async registerIndividual(userData) {
    const { email, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + this.VERIFICATION_TOKEN_EXPIRES);

    // Create pending user
    const pendingUser = await storage.createPendingUser({
      email,
      firstName,
      lastName,
      type: 'individual',
      verificationCode,
      verificationExpires,
      isVerified: false
    });

    // Send verification email
    await this.sendVerificationEmail(email, verificationCode, firstName);

    return { message: 'Verification email sent successfully' };
  }

  // Organization registration
  async registerOrganization(userData) {
    const { organizationName, email, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if organization name/slug already exists
    const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existingOrg = await storage.getOrganizationBySlug(orgSlug);
    if (existingOrg) {
      throw new Error('Organization name already exists');
    }

    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + this.VERIFICATION_TOKEN_EXPIRES);

    // Create pending user with organization data
    const pendingUser = await storage.createPendingUser({
      email,
      firstName,
      lastName,
      type: 'organization',
      organizationName,
      organizationSlug: orgSlug,
      verificationCode,
      verificationExpires,
      isVerified: false
    });

    // Send verification email
    await this.sendVerificationEmail(email, verificationCode, firstName, organizationName);

    return { message: 'Verification email sent successfully' };
  }

  // Verify email
  async verifyEmail(email, verificationCode) {
    const pendingUser = await storage.getPendingUserByEmail(email);
    
    if (!pendingUser) {
      throw new Error('Verification request not found');
    }

    if (pendingUser.verificationExpires < new Date()) {
      throw new Error('Verification code has expired');
    }

    if (pendingUser.verificationCode !== verificationCode) {
      throw new Error('Invalid verification code');
    }

    // Mark as verified
    await storage.updatePendingUser(pendingUser._id, { 
      isVerified: true,
      verificationCode: null,
      verificationExpires: null 
    });

    return { message: 'Email verified successfully' };
  }

  // Complete individual registration
  async completeIndividualRegistration(email, password) {
    const pendingUser = await storage.getPendingUserByEmail(email);
    
    if (!pendingUser || !pendingUser.isVerified) {
      throw new Error('Email not verified');
    }

    if (pendingUser.type !== 'individual') {
      throw new Error('Invalid registration type');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create actual user
    const user = await storage.createUser({
      email: pendingUser.email,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      passwordHash,
      role: 'member',
      isActive: true,
      emailVerified: true
    });

    // Remove pending user
    await storage.deletePendingUser(pendingUser._id);

    // Generate token
    const token = this.generateToken(user);

    return {
      message: 'Registration completed successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }

  // Complete organization registration
  async completeOrganizationRegistration(email, password) {
    const pendingUser = await storage.getPendingUserByEmail(email);
    
    if (!pendingUser || !pendingUser.isVerified) {
      throw new Error('Email not verified');
    }

    if (pendingUser.type !== 'organization') {
      throw new Error('Invalid registration type');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create organization first
    const organization = await storage.createOrganization({
      name: pendingUser.organizationName,
      slug: pendingUser.organizationSlug,
      description: `${pendingUser.organizationName} workspace`,
      isActive: true
    });

    // Create admin user
    const user = await storage.createUser({
      email: pendingUser.email,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      passwordHash,
      role: 'admin',
      organizationId: organization._id,
      isActive: true,
      emailVerified: true
    });

    // Update organization with creator
    await storage.updateOrganization(organization._id, { createdBy: user._id });

    // Create default task statuses for the organization
    const defaultStatuses = [
      { name: "To Do", color: "#6B7280", order: 0, isDefault: true, organizationId: organization._id },
      { name: "In Progress", color: "#3B82F6", order: 1, organizationId: organization._id },
      { name: "Review", color: "#F59E0B", order: 2, organizationId: organization._id },
      { name: "Done", color: "#10B981", order: 3, isCompleted: true, organizationId: organization._id },
    ];

    for (const status of defaultStatuses) {
      await storage.createTaskStatus(status);
    }

    // Remove pending user
    await storage.deletePendingUser(pendingUser._id);

    // Generate token
    const token = this.generateToken(user);

    return {
      message: 'Organization created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId
      }
    };
  }

  // Login
  async login(email, password) {
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    if (!user.emailVerified) {
      throw new Error('Email not verified');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await storage.updateUser(user._id, { lastLoginAt: new Date() });

    // Generate token
    const token = this.generateToken(user);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId
      }
    };
  }

  // Forgot password
  async forgotPassword(email) {
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + this.RESET_TOKEN_EXPIRES);

    // Store reset token
    await storage.updateUser(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    // Send reset email
    await this.sendPasswordResetEmail(email, resetToken, user.firstName);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  // Validate reset token
  async validateResetToken(token) {
    const user = await storage.getUserByResetToken(token);
    
    if (!user || user.resetPasswordExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    return { message: 'Reset token is valid' };
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const user = await storage.getUserByResetToken(token);
    
    if (!user || user.resetPasswordExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user password and clear reset token
    await storage.updateUser(user._id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return { message: 'Password reset successfully' };
  }

  // Resend verification code
  async resendVerificationCode(email) {
    const pendingUser = await storage.getPendingUserByEmail(email);
    
    if (!pendingUser) {
      throw new Error('Verification request not found');
    }

    if (pendingUser.isVerified) {
      throw new Error('Email already verified');
    }

    // Generate new verification code
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + this.VERIFICATION_TOKEN_EXPIRES);

    // Update pending user
    await storage.updatePendingUser(pendingUser._id, {
      verificationCode,
      verificationExpires
    });

    // Send new verification email
    await this.sendVerificationEmail(
      email, 
      verificationCode, 
      pendingUser.firstName, 
      pendingUser.organizationName
    );

    return { message: 'Verification code resent successfully' };
  }

  // Send verification email
  async sendVerificationEmail(email, code, firstName, organizationName = null) {
    const subject = organizationName 
      ? `Verify your ${organizationName} admin account - TaskSetu`
      : 'Verify your TaskSetu account';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to TaskSetu${organizationName ? ` - ${organizationName}` : ''}!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for ${organizationName ? 'creating your organization on' : 'joining'} TaskSetu. To complete your registration, please verify your email address.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Your verification code is:</p>
          <h1 style="margin: 10px 0; font-size: 32px; color: #1e40af; letter-spacing: 4px;">${code}</h1>
        </div>
        <p>This code will expire in 24 hours for security reasons.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          TaskSetu - Professional Task Management<br>
          This is an automated email, please do not reply.
        </p>
      </div>
    `;

    // In a real implementation, integrate with email service (SendGrid, etc.)
    console.log(`Verification email sent to ${email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification Code: ${code}`);
    
    // For development, you might want to log this or use a service like Mailtrap
    return true;
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    const subject = 'Reset your TaskSetu password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your TaskSetu password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${resetUrl}</p>
        <p>This link will expire in 30 minutes for security reasons.</p>
        <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          TaskSetu - Professional Task Management<br>
          This is an automated email, please do not reply.
        </p>
      </div>
    `;

    console.log(`Password reset email sent to ${email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    
    return true;
  }
}

export const authService = new AuthService();