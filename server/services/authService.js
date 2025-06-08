import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { MongoStorage } from '../mongodb-storage.js';
import { emailService } from './emailService.js';

const storage = new MongoStorage();

export class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_EXPIRES_IN = '7d';
    this.VERIFICATION_TOKEN_EXPIRES = 24 * 60 * 60 * 1000; // 24 hours
    this.RESET_TOKEN_EXPIRES = 30 * 60 * 1000; // 30 minutes
    
    // Testing configuration - disable email verification bypass for production email flow
    this.BYPASS_EMAIL_VERIFICATION = false; // Always require email verification
    this.AUTO_AUTHENTICATE_ON_REGISTER = false; // Always require verification
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        organizationId: user.organization || user.organizationId || null
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

    // Check if pending user exists and remove it to allow re-registration
    const existingPendingUser = await storage.getPendingUserByEmail(email);
    if (existingPendingUser) {
      await storage.deletePendingUser(existingPendingUser._id);
    }

    // Auto-authenticate in development mode
    if (this.AUTO_AUTHENTICATE_ON_REGISTER) {
      // Create user directly without verification
      const hashedPassword = await this.hashPassword('temp123'); // Temporary password
      
      const userData = {
        firstName,
        lastName,
        email,
        username: email.split('@')[0],
        passwordHash: hashedPassword,
        role: 'member',
        isActive: true,
        emailVerified: true
      };

      const user = await storage.createUser(userData);
      const token = this.generateToken(user);
      
      return {
        success: true,
        user,
        token,
        autoAuthenticated: true,
        message: 'Auto-authenticated for testing. Please set a password.'
      };
    }

    // Normal flow with email verification
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
    const { organizationName, organizationSlug, email, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if pending user exists and remove it to allow re-registration
    const existingPendingUser = await storage.getPendingUserByEmail(email);
    if (existingPendingUser) {
      await storage.deletePendingUser(existingPendingUser._id);
    }

    // Use provided slug or generate from name
    const orgSlug = organizationSlug || organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(orgSlug) || orgSlug.length < 3) {
      throw new Error('Organization URL must be at least 3 characters and contain only lowercase letters, numbers, and hyphens');
    }

    // Check if organization slug already exists
    const existingOrg = await storage.getOrganizationBySlug(orgSlug);
    if (existingOrg) {
      throw new Error('Organization URL already exists');
    }

    // Auto-authenticate in development mode
    if (this.AUTO_AUTHENTICATE_ON_REGISTER) {
      // Create organization first
      const organization = await storage.createOrganization({
        name: organizationName,
        slug: orgSlug,
        settings: {
          maxUsers: 10,
          features: ['tasks', 'projects', 'collaboration']
        },
        subscriptionPlan: 'basic',
        isActive: true
      });

      // Create admin user directly
      const hashedPassword = await this.hashPassword('temp123'); // Temporary password
      
      const adminUserData = {
        firstName,
        lastName,
        email,
        username: email.split('@')[0],
        passwordHash: hashedPassword,
        organization: organization._id,
        organizationId: organization._id,
        role: 'admin',
        isActive: true,
        emailVerified: true
      };

      const user = await storage.createUser(adminUserData);
      const token = this.generateToken(user);
      
      return {
        success: true,
        user,
        token,
        organization,
        autoAuthenticated: true,
        message: 'Auto-authenticated for testing. Please set a password.'
      };
    }

    // Normal flow with email verification
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
      organization: organization._id,
      organizationId: organization._id,
      isActive: true,
      emailVerified: true
    });

    // Update organization with creator
    await storage.updateOrganization(organization._id, { createdBy: user._id });

    // Create default task statuses for the organization
    const defaultStatuses = [
      { name: "To Do", color: "#6B7280", order: 0, isDefault: true, organization: organization._id },
      { name: "In Progress", color: "#3B82F6", order: 1, organization: organization._id },
      { name: "Review", color: "#F59E0B", order: 2, organization: organization._id },
      { name: "Done", color: "#10B981", order: 3, isCompleted: true, organization: organization._id },
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
    return await emailService.sendVerificationEmail(email, code, firstName, organizationName);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token, firstName) {
    return await emailService.sendPasswordResetEmail(email, token, firstName);
  }
}

export const authService = new AuthService();