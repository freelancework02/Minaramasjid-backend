const db = require("../config/db");

// Create Writer (upload writer with image)
exports.createWriter = (req, res) => {
  const { name, designation, englishDescription, urduDescription } = req.body;
  let { isTeamMember } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;

  if (!name || !designation || !englishDescription || !urduDescription || isTeamMember === undefined || !imageBuffer) {
    return res.status(400).send('All fields including isTeamMember and image are required.');
  }

  // Convert isTeamMember properly
  isTeamMember = isTeamMember === 'true' ? 1 : 0;

  const createdOn = new Date();
  const modifiedOn = new Date();
  const isDeleted = 0;

  const sql = `
    INSERT INTO New_Writer 
    (image, name, designation, englishDescription, urduDescription, isTeamMember, createdOn, modifiedOn, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [imageBuffer, name, designation, englishDescription, urduDescription, isTeamMember, createdOn, modifiedOn, isDeleted], (err, result) => {
    if (err) {
      console.error('Error inserting writer:', err);
      return res.status(500).send('Error saving writer');
    }
    res.send('Writer saved successfully!');
  });
};

// Get all writers (without image, and not deleted)
exports.getAllWriters = (req, res) => {
  const sql = `
    SELECT id, name, designation, englishDescription, urduDescription, isTeamMember, createdOn
    FROM New_Writer
    WHERE isDeleted = 0
    ORDER BY createdOn DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching writers:', err);
      return res.status(500).send('Error fetching writers');
    }
    res.json(results);
  });
};



// Get a single writer by ID (without image, and not deleted)
exports.getWriterById = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send('Writer ID is required.');
  }

  const sql = `
    SELECT id, name, designation, englishDescription, urduDescription, isTeamMember
    FROM New_Writer
    WHERE id = ? AND isDeleted = 0
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching writer:', err);
      return res.status(500).send('Error fetching writer');
    }

    if (results.length === 0) {
      return res.status(404).send('Writer not found.');
    }

    res.json(results[0]); // send the single writer object
  });
};


// Get writer image by ID
exports.getWriterImage = (req, res) => {
  const id = req.params.id;

  const sql = `SELECT image FROM New_Writer WHERE id = ? AND isDeleted = 0`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching image:', err);
      return res.status(500).send('Error fetching image');
    }

    if (results.length > 0 && results[0].image) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(results[0].image);
    } else {
      res.status(404).send('Image not found');
    }
  });
};

exports.updateWriter = (req, res) => {
  const id = req.params.id;
  const { name, designation, englishDescription, urduDescription, isTeamMember } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;

  if (!id) {
    return res.status(400).send('Writer ID is required.');
  }

  const modifiedOn = new Date();

  const sql = `
    UPDATE New_Writer SET
      ${imageBuffer ? "image = ?," : ""}
      name = ?,
      designation = ?,
      englishDescription = ?,
      urduDescription = ?,
      isTeamMember = ?,
      modifiedOn = ?
    WHERE id = ? AND isDeleted = 0
  `;

  const params = [];

  if (imageBuffer) {
    params.push(imageBuffer);
  }
  params.push(name, designation, englishDescription, urduDescription, isTeamMember, modifiedOn, id);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating writer:', err);
      return res.status(500).send('Error updating writer');
    }
    res.json({
      id,
      name,
      designation,
      englishDescription,
      urduDescription,
      isTeamMember,
      modifiedOn,
    });
  });
};

// Soft delete writer
exports.deleteWriter = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send('Writer ID is required.');
  }

  const modifiedOn = new Date();

  const sql = `
    UPDATE New_Writer 
    SET isDeleted = 1, modifiedOn = ?
    WHERE id = ? AND isDeleted = 0
  `;

  db.query(sql, [modifiedOn, id], (err, result) => {
    if (err) {
      console.error('Error soft deleting writer:', err);
      return res.status(500).send('Error deleting writer');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Writer not found or already deleted.');
    }

    res.send('Writer deleted (soft delete) successfully!');
  });
};
