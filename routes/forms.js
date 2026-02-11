const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Form, Board } = require('../models');

// @route   GET api/forms
router.get('/', auth, async (req, res) => {
  try {
    const forms = await Form.findAll({ include: [{ model: Board, attributes: ['name'] }] });
    res.json(forms);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/forms
router.post('/', auth, async (req, res) => {
  try {
    const form = await Form.create(req.body);
    res.json(form);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
