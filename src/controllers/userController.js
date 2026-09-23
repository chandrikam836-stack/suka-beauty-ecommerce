const bcrypt = require("bcryptjs");
const { User, Address } = require("../models");

// ---- PROFILE ----
exports.getProfile = async (req, res) => {
  const { id, name, email, phone, role } = req.user;
  res.json({ id, name, email, phone, role });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = req.user;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    res.json({ message: "Profile updated", user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

// ---- ADDRESSES ----
exports.listAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({ where: { userId: req.user.id }, order: [["isDefault", "DESC"]] });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
};

exports.createAddress = async (req, res, next) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (data.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }
    const address = await Address.create(data);
    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!address) return res.status(404).json({ message: "Address not found" });

    if (req.body.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }
    await address.update(req.body);
    res.json(address);
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!address) return res.status(404).json({ message: "Address not found" });
    await address.destroy();
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
};
