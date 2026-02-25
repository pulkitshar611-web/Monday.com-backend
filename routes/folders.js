const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Folder } = require('../models');

// @route   GET api/folders
// @desc    Get all folders
router.get('/', auth, async (req, res) => {
    try {
        const folders = await Folder.findAll();
        res.json(folders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/folders
// @desc    Create a folder
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ msg: 'Please enter a folder name' });

        const folder = await Folder.create({ name });
        res.json(folder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/folders/:id
// @desc    Update a folder
router.put('/:id', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const folder = await Folder.findByPk(req.params.id);
        if (!folder) return res.status(404).json({ msg: 'Folder not found' });

        const oldName = folder.name;
        folder.name = name;
        await folder.save();

        // Update all boards that were in this folder
        const { Board } = require('../models');
        await Board.update({ folder: name }, { where: { folder: oldName } });

        res.json(folder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/folders/:id
// @desc    Delete a folder
router.delete('/:id', auth, async (req, res) => {
    try {
        const folder = await Folder.findByPk(req.params.id);
        if (!folder) return res.status(404).json({ msg: 'Folder not found' });

        const folderName = folder.name;
        await folder.destroy();

        // Move all boards in this folder to 'General'
        const { Board } = require('../models');
        await Board.update({ folder: 'General' }, { where: { folder: folderName } });

        res.json({ msg: 'Folder removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
