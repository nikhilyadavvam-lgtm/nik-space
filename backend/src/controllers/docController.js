const Doc = require('../models/Doc');

exports.getDocs = async (req, res) => {
  try {
    const docs = await Doc.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ docs });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching documents' });
  }
};

exports.createDoc = async (req, res) => {
  try {
    const { name, imageUrl, category } = req.body;
    const normalizedCategory = ['document', 'personal', 'partner', 'other'].includes(category)
      ? category
      : 'document';

    const doc = new Doc({
      userId: req.userId,
      name,
      imageUrl,
      category: normalizedCategory,
    });
    await doc.save();
    res.status(201).json({ doc });
  } catch (error) {
    res.status(500).json({ error: 'Server error creating document' });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Doc.findOneAndDelete({ _id: id, userId: req.userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully', docId: id });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting document' });
  }
};
