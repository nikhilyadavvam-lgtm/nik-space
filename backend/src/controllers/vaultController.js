const Vault = require('../models/Vault');

exports.getVaultEntries = async (req, res) => {
  try {
    const entries = await Vault.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching vault entries' });
  }
};

exports.createVaultEntry = async (req, res) => {
  try {
    const { accountName, password } = req.body;
    
    const entry = new Vault({
      userId: req.userId,
      accountName,
      password,
    });
    
    await entry.save();
    res.status(201).json({ entry });
  } catch (error) {
    res.status(500).json({ error: 'Server error creating vault entry' });
  }
};

exports.updateVaultEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, password } = req.body;
    
    const entry = await Vault.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { accountName, password, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!entry) {
      return res.status(404).json({ error: 'Vault entry not found.' });
    }
    
    res.json({ entry });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating vault entry' });
  }
};

exports.deleteVaultEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Vault.findOneAndDelete({ _id: id, userId: req.userId });
    
    if (!entry) {
      return res.status(404).json({ error: 'Vault entry not found.' });
    }
    
    res.json({ message: 'Vault entry deleted successfully', entryId: id });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting vault entry' });
  }
};
