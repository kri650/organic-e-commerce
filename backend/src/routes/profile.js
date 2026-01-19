const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /profile - Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      addresses: user.addresses,
      avatarUrl: user.avatarUrl,
      profilePreferences: user.profilePreferences,
      phone: user.phone
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /profile - Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatarUrl, profilePreferences, phone } = req.body;

    // Basic validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updateData = { name: name.trim(), phone };
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (profilePreferences !== undefined) updateData.profilePreferences = profilePreferences;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      addresses: updatedUser.addresses,
      avatarUrl: updatedUser.avatarUrl,
      profilePreferences: updatedUser.profilePreferences,
      phone: updatedUser.phone
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /profile/password - Update user password
router.put('/profile/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /addresses - Get user addresses
router.get('/addresses', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /addresses - Add new address
router.post('/addresses', auth, async (req, res) => {
  try {
    const { type, street, city, state, zip, country } = req.body;

    if (!street || !city || !state || !zip || !country) {
      return res.status(400).json({ message: 'Street, city, state, zip, and country are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAddress = { type: type || 'home', street, city, state, zip, country };
    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(newAddress);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /addresses/:id - Update address
router.put('/addresses/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, street, city, state, zip, country } = req.body;

    if (!street || !city || !state || !zip || !country) {
      return res.status(400).json({ message: 'Street, city, state, zip, and country are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === id);
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.addresses[addressIndex] = { ...user.addresses[addressIndex], type: type || user.addresses[addressIndex].type, street, city, state, zip, country };
    await user.save();

    res.json(user.addresses[addressIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /addresses/:id - Delete address
router.delete('/addresses/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === id);
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;