const { Qrinfo, User, Order, Settings } = require('../models/jankaritagModels');
const crypto = require('crypto');

// ── Dashboard Stats ────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [totalTags, totalUsers, totalOrders, totalPaidOrders] = await Promise.all([
      Qrinfo.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' })
    ]);

    const revenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalTags,
        totalUsers,
        totalOrders,
        totalPaidOrders,
        revenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Bulk Creation with specific category ───────────────
exports.bulkCreateTag = async (req, res) => {
  try {
    const { email, customId, category, ...fields } = req.body;

    if (!email || !customId) {
      return res.status(400).json({ success: false, message: "Email and Tag ID are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in JankariTag." });
    }

    const existing = await Qrinfo.findOne({ customId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Tag ID already exists." });
    }

    const newTag = new Qrinfo({
      customId,
      category: category || "PERSONAL_ITEM",
      customerEmail: email.trim().toLowerCase(),
      createdBy: user._id,
      ...fields
    });

    await newTag.save();
    res.json({ success: true, data: newTag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Auto-Generate Retail QRs (Passcode Method) ──────────
exports.generateUnassigned = async (req, res) => {
  try {
    const { count, category } = req.body;
    const num = parseInt(count) || 10;
    const cat = category || "PERSONAL_ITEM";

    const createdTags = [];
    for (let i = 0; i < num; i++) {
      let customId;
      let exists = true;
      while (exists) {
        customId = "JTNH-" + crypto.randomBytes(3).toString("hex").toUpperCase();
        exists = await Qrinfo.findOne({ customId });
      }

      const passcode = crypto.randomBytes(3).toString("hex").toUpperCase();
      
      const tag = new Qrinfo({
        customId,
        passcode,
        category: cat,
        name: "Unregistered Tag",
        location: "Unknown",
      });

      await tag.save();
      createdTags.push({ srNo: i + 1, customId, passcode });
    }

    res.json({
      success: true,
      message: `Generated ${num} tags.`,
      data: createdTags
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Manual Assignment ───────────────────────────────────
exports.assignEmail = async (req, res) => {
  try {
    const { customId, customerEmail } = req.body;
    
    if (!customId || !customerEmail) {
      return res.status(400).json({ success: false, message: "ID and Email required." });
    }

    const tag = await Qrinfo.findOne({ customId });
    if (!tag) return res.status(404).json({ success: false, message: "Tag not found." });

    if (tag.customerEmail) {
      return res.status(400).json({ success: false, message: "Tag already assigned." });
    }

    tag.customerEmail = customerEmail.trim().toLowerCase();
    await tag.save();

    res.json({ success: true, message: "Assigned successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── User Directory ──────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Genesis Logs (Recent Tags) ──────────────────────────
exports.getRecentTags = async (req, res) => {
  try {
    const tags = await Qrinfo.find({}).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
