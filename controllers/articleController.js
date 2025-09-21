const db = require("../config/db");

// Create Article (upload with image)
exports.createArticle = (req, res) => {
  const {
    title,
    englishDescription,
    urduDescription,
    topic,
    writers,
    translator,
    language,
    date,
    tags,
    isPublished,
  } = req.body;

  const imageBuffer = req.file ? req.file.buffer : null;

  // Required field check (translator and tags are now optional)
  if (
    !title ||
    !topic ||
    !writers ||
    !language ||
    !date ||
    isPublished === undefined
  ) {
    return res.status(400).send("Required fields are missing.");
  }

  const createdOn = new Date();
  const modifiedOn = new Date();
  const views = 0;
  const isDeleted = 0;

  const sql = `
    INSERT INTO New_Articles 
    (image, title, englishDescription, urduDescription, topic, writers, translator, language, date, tags, views, createdOn, isPublished, modifiedOn, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    imageBuffer || null,
    title,
    englishDescription?.trim() || null,
    urduDescription?.trim() || null,
    topic,
    writers,
    translator?.trim() || null,
    language,
    date,
    tags?.trim() || null,
    views,
    createdOn,
    isPublished,
    modifiedOn,
    isDeleted,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error inserting article:", err);
      return res.status(500).send("Error saving article");
    }
    res.json({ message: "Article saved successfully!" });
  });
};


// Get all articles (excluding image and deleted)
exports.getAllArticles = (req, res) => {
  const sql = `
    SELECT 
      id,
      title,
      REGEXP_REPLACE(englishDescription, '<[^>]*>', '') AS englishDescription,
      REGEXP_REPLACE(urduDescription, '<[^>]*>', '') AS urduDescription,
      topic,
      writers,
      translator,
      language,
      date,
      tags,
      views,
      createdOn,
      isPublished
    FROM New_Articles
    WHERE isDeleted = 0
    ORDER BY createdOn DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching articles:", err);
      return res.status(500).send("Error fetching articles");
    }
    res.json(results);
  });
};


// Get a single article by ID
exports.getArticleById = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send("Article ID is required.");
  }

  const sql = `
    SELECT 
      id,
      title,
      englishDescription,
      urduDescription,
      topic,
      writers,
      translator,
      language,
      date,
      tags,
      views,
      createdOn,
      isPublished
    FROM New_Articles
    WHERE id = ? AND isDeleted = 0
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching article:", err);
      return res.status(500).send("Error fetching article");
    }

    if (results.length === 0) {
      return res.status(404).send("Article not found.");
    }

    res.json(results[0]);
  });
};

// Get article image by ID
exports.getArticleImage = (req, res) => {
  const id = req.params.id;

  const sql = `SELECT image FROM New_Articles WHERE id = ? AND isDeleted = 0`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching article image:", err);
      return res.status(500).send("Error fetching image");
    }

    if (results.length > 0 && results[0].image) {
      res.setHeader("Content-Type", "image/jpeg");
      res.send(results[0].image);
    } else {
      res.status(404).send("Image not found");
    }
  });
};

// Update Article
// Patch Article - Update only title, englishDescription, urduDescription, and image
exports.updateArticle = (req, res) => {
  const id = req.params.id;
  const {
    title,
    englishDescription,
    urduDescription,
  } = req.body;

  const imageBuffer = req.file ? req.file.buffer : null;

  if (!id) {
    return res.status(400).send("Article ID is required.");
  }

  const modifiedOn = new Date();

  // Build dynamic query based on provided fields
  let fieldsToUpdate = [];
  let params = [];

  if (imageBuffer) {
    fieldsToUpdate.push("image = ?");
    params.push(imageBuffer);
  }
  if (title !== undefined) {
    fieldsToUpdate.push("title = ?");
    params.push(title);
  }
  if (englishDescription !== undefined) {
    fieldsToUpdate.push("englishDescription = ?");
    params.push(englishDescription.trim() || null);
  }
  if (urduDescription !== undefined) {
    fieldsToUpdate.push("urduDescription = ?");
    params.push(urduDescription.trim() || null);
  }

  if (fieldsToUpdate.length === 0) {
    return res.status(400).send("No fields provided for update.");
  }

  // Always update modifiedOn
  fieldsToUpdate.push("modifiedOn = ?");
  params.push(modifiedOn);

  // Finalize query
  const sql = `
    UPDATE New_Articles 
    SET ${fieldsToUpdate.join(", ")} 
    WHERE id = ? AND isDeleted = 0
  `;
  params.push(id);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error patching article:", err);
      return res.status(500).send("Error updating article");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Article not found or already deleted.");
    }

    res.json({ message: "Article updated successfully!" });
  });
};


// Soft delete Article
exports.deleteArticle = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send("Article ID is required.");
  }

  const modifiedOn = new Date();

  const sql = `
    UPDATE New_Articles 
    SET isDeleted = 1, modifiedOn = ?
    WHERE id = ?
  `;

  db.query(sql, [modifiedOn, id], (err, result) => {
    if (err) {
      console.error("Error deleting article:", err);
      return res.status(500).send("Error deleting article");
    }
    res.json({ message: "Article deleted (soft) successfully!" });
  });
};
