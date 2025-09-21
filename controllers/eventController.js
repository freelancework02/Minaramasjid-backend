const pool = require("../config/db");

// Helper: remove HTML tags
const removeHtml = (str) => str.replace(/<[^>]*>/g, "");

// Create Event (with image upload)
exports.createEvent = (req, res) => {
  const {
    title, content, topic, language,
    writers, translator, tags, eventDate
  } = req.body;

  const slug = title?.trim();
  const imageBuffer = req.file ? req.file.buffer : null;

  if (!slug || !title || !content || !topic || !language || !writers || !eventDate || !imageBuffer) {
    return res.status(400).json({ error: "All required fields including image must be provided." });
  }

  const createdOn = new Date();
  const modifiedOn = createdOn;
  const finalTranslator = translator || null;
  const finalTags = tags || null;
  const views = 0;
  const isDeleted = 0;

  const sql = `
    INSERT INTO events (
      image, slug, title, content, topic, language,
      writers, translator, tags, eventDate,
      views, createdOn, modifiedOn, isDeleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    imageBuffer, slug, title, content, topic, language,
    writers, finalTranslator, finalTags, eventDate,
    views, createdOn, modifiedOn, isDeleted
  ];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting event:", err);
      return res.status(500).json({ error: "Error saving event." });
    }
    res.status(201).json({ message: "Event saved successfully!", eventId: result.insertId });
  });
};

// Get All Events (excluding image)
exports.getAllEvents = (req, res) => {
  const sql = `
    SELECT id, slug, title, 
           REGEXP_REPLACE(content, '<[^>]*>', '') AS content, 
           topic, language, writers,
           translator, tags, eventDate, views, createdOn, modifiedOn
    FROM events 
    WHERE isDeleted = 0
    ORDER BY createdOn DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching events:", err);
      return res.status(500).json({ error: "Error fetching events." });
    }
    res.json(results);
  });
};


// Get Event by ID (excluding image)
exports.getEventById = (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "Event ID is required." });

  const sql = `
    SELECT id, slug, title, 
           REGEXP_REPLACE(content, '<[^>]*>', '') AS content, 
           topic, language, writers,
           translator, tags, eventDate, views, createdOn, modifiedOn
    FROM events 
    WHERE id = ? AND isDeleted = 0
  `;

  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching event:", err);
      return res.status(500).json({ error: "Error fetching event." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json(results[0]);
  });
};

// Get Event Image
exports.getEventImage = (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "Event ID is required." });

  const sql = `SELECT image FROM events WHERE id = ? AND isDeleted = 0`;

  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching image:", err);
      return res.status(500).json({ error: "Error fetching image." });
    }

    if (results.length > 0 && results[0].image) {
      res.setHeader("Content-Type", "image/jpeg");
      res.send(results[0].image);
    } else {
      res.status(404).json({ error: "Image not found." });
    }
  });
};

// Update Event (optional title, content, image)
exports.updateEvent = (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;
  const modifiedOn = new Date();

  if (!id) return res.status(400).json({ error: "Event ID is required." });

  const fields = [];
  const values = [];

  if (title !== undefined) {
    fields.push("title = ?");
    values.push(title);
  }

  if (content !== undefined) {
    fields.push("content = ?");
    values.push(content);
  }

  if (imageBuffer !== null) {
    fields.push("image = ?");
    values.push(imageBuffer);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "At least one field must be provided for update." });
  }

  fields.push("modifiedOn = ?");
  values.push(modifiedOn);
  values.push(id);

  const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ? AND isDeleted = 0`;

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating event:", err);
      return res.status(500).json({ error: "Error updating event." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Event not found or already deleted." });
    }

    res.json({ message: "Event updated successfully!" });
  });
};

// Soft Delete Event
exports.deleteEvent = (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "Event ID is required." });

  const modifiedOn = new Date();

  const sql = `
    UPDATE events 
    SET isDeleted = 1, modifiedOn = ? 
    WHERE id = ? AND isDeleted = 0
  `;

  pool.query(sql, [modifiedOn, id], (err, result) => {
    if (err) {
      console.error("Error deleting event:", err);
      return res.status(500).json({ error: "Error deleting event." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Event not found or already deleted." });
    }

    res.json({ message: "Event deleted successfully!" });
  });
};
