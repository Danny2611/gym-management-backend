import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import Member from '../models/Member';
import dotenv from 'dotenv';
import Role from '../models/Role';
dotenv.config();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await Member.findOne({ email: profile.emails?.[0].value });
        const defaultRole = await Role.findOne({ name: 'Member' });
        if (!defaultRole) {
            throw new Error('Không tìm thấy vai trò mặc định');
          }
          
        if (!user) {
            user = await Member.create({
                name: profile.displayName,
                email: profile.emails?.[0].value,
                password: 'google-auth', // Đặt giá trị tạm thời
                role: defaultRole._id,
                isVerified: true,
                status: 'active',
            });
        }

        done(null, user);
    } catch (error) {
        console.error("Google Login Error:", error);
        done(error, false);
    }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '',
    profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await Member.findOne({ email: profile.emails?.[0].value });
        const defaultRole = await Role.findOne({ name: 'Member' });
        if (!defaultRole) {
            throw new Error('Không tìm thấy vai trò mặc định');
          }
        if (!user) {
            user = await Member.create({
                name: profile.displayName,
                email: profile.emails?.[0].value,
                password: 'facebook-auth', // Đặt giá trị tạm thời
                role: defaultRole._id,
                isVerified: true,
                status: 'active',
            });
        }

        done(null, user);
    } catch (error) {
        console.error("Facebook Login Error:", error);
        done(error, false);
    }
}));

// Serialize & Deserialize User
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Member.findById(id);
        done(null, user);
    } catch (error) {
        done(error, false);
    }
});

export default passport;
