const mongoose = require('mongoose');
const { getJankariConnection } = require('../config/db');

const jankariConn = getJankariConnection();

// ── Qrinfo Schema ───────────────────────────────────────
const qrinfoSchema = new mongoose.Schema(
  {
    track: { type: String, enum: ["personal", "institute"], default: "personal" },
    category: {
      type: String,
      enum: [
        "WATER_COOLER", "SCHOOL_ASSET", "LAB_EQUIPMENT", "AIR_CONDITIONER", "BUS",
        "PERSONAL_ITEM", "VEHICLE", "ELECTRONICS", "SUITCASE", "SHOPS", "OTHER"
      ],
      default: "PERSONAL_ITEM",
    },
    phonePrivacyMode: { type: String, enum: ["private", "public"], default: "private" },
    customId: { type: String, unique: true, required: true },
    name: { type: String },
    location: { type: String },
    phone: { type: String },
    emergencyPhone: { type: String },
    info: { type: String },
    emergencyInfo: { type: String },
    cleanerName: { type: String },
    lastCleaningDate: { type: Date },
    nextCleaningDate: { type: Date },
    tds: { type: String },
    lastRoFilterChangeDate: { type: Date },
    nextRoFilterChangeDate: { type: Date },
    cleaningHistory: [{ date: { type: Date }, cleanerName: { type: String }, _id: false }],
    shopTiming: { type: String },
    shopDescription: { type: String },
    imgurl: { type: String, default: "/images/1.jpg" },
    onlyqrimg: { type: String, default: "/images/coverdefault.jpg" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    customerEmail: { type: String, trim: true, lowercase: true },
    passcode: { type: String },
    reminderSent: { type: Boolean, default: false },
    allowedDomain: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

// ── User Schema ─────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6 },
    role: { type: String, enum: ["user", "admin", "shopkeeper", "student", "manager"], default: "user" },
    referralCode: { type: String, unique: true, sparse: true },
    isBulkAccount: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Order Schema ────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    tagId: String,
    name: String,
    phone: String,
    address: String,
    pincode: String,
    amount: Number,
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// ── Settings Schema ─────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  tagPrice: { type: Number, default: 100 },
  stickerPriceText: { type: String, default: "2 stickers at 59 rupees" },
  messagingChannel: { type: String, enum: ["httpsms", "whatsapp"], default: "httpsms" },
});

// Bind models to the JankariTag connection
const Qrinfo = jankariConn.model('qrinfo', qrinfoSchema);
const User = jankariConn.model('user', userSchema);
const Order = jankariConn.model('order', orderSchema);
const Settings = jankariConn.model('settings', settingsSchema);

module.exports = { Qrinfo, User, Order, Settings };
