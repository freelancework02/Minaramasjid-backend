const db = require("../config/db");

// Get all questions (excluding deleted)
exports.getAllNewQuestions = (req, res) => {
  const sql = `
    SELECT id, image, slug, questionEnglish, answerEnglish, questionUrdu, answerUrdu,
           writer, date, tags, language, topic, translator,
           createdOn, isPublished, modifiedOn, isDeleted
    FROM New_Question_Table
    WHERE isDeleted = 0
    ORDER BY createdOn DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching new questions:', err);
      return res.status(500).send('Error fetching new questions');
    }
    res.json(results);
  });
};

// Get a single question by ID
exports.getNewQuestionById = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send('Question ID is required.');

  const sql = `
    SELECT id, image, slug, questionEnglish, answerEnglish, questionUrdu, answerUrdu,
           writer, date, tags, language, topic, translator,
           createdOn, isPublished, modifiedOn, isDeleted
    FROM New_Question_Table
    WHERE id = ? AND isDeleted = 0
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching new question:', err);
      return res.status(500).send('Error fetching new question');
    }
    if (results.length === 0) return res.status(404).send('Question not found.');
    res.json(results[0]);
  });
};

// Get question image
exports.getNewQuestionImage = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send('Question ID is required.');

  const sql = `SELECT image FROM New_Question_Table WHERE id = ? AND isDeleted = 0`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching image:', err);
      return res.status(500).send('Error fetching image');
    }
    if (results.length > 0 && results[0].image) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(results[0].image);
    } else {
      res.status(404).send('Image not found.');
    }
  });
};

// Create a new question
exports.createNewQuestion = (req, res) => {
  const {
    slug,
    questionEnglish,
    answerEnglish,
    questionUrdu,
    answerUrdu,
    writer,
    date,
    tags = null,
    language,
    topic,
    translator = null
  } = req.body;

  const imageBuffer = req.file ? req.file.buffer : null;

  if (!slug || !writer || !date || !language || !topic || !imageBuffer) {
    return res.status(400).send('Required fields (except question/answer, tags, translator) are missing.');
  }

  if (isNaN(Date.parse(date))) {
    return res.status(400).send('Invalid date format.');
  }

  const createdOn = new Date();
  const modifiedOn = new Date();
  const isPublished = 0;
  const isDeleted = 0;

  const sql = `
    INSERT INTO New_Question_Table
    (image, slug, questionEnglish, answerEnglish, questionUrdu, answerUrdu,
     writer, date, tags, language, topic, translator,
     createdOn, isPublished, modifiedOn, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    imageBuffer,
    slug,
    questionEnglish,
    answerEnglish,
    questionUrdu,
    answerUrdu,
    writer,
    date,
    tags,
    language,
    topic,
    translator,
    createdOn,
    isPublished,
    modifiedOn,
    isDeleted
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error creating new question:', err);
      return res.status(500).send('Error creating new question');
    }
    res.status(201).json({ message: 'Question created successfully!', id: result.insertId });
  });
};

// Update a question
exports.updateNewQuestion = (req, res) => {
  const { id } = req.params;
  const {
    questionEnglish,
    answerEnglish,
    questionUrdu,
    answerUrdu,
  } = req.body;

  const imageBuffer = req.file ? req.file.buffer : null;
  const modifiedOn = new Date();

  if (!id) return res.status(400).send("ID is required");

  // Generate slug if question fields are updated
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u0600-\u06FF]+/g, "") // remove Urdu
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  // Fetch the existing question to compare
  const fetchSql = "SELECT questionEnglish, questionUrdu FROM New_Question_Table WHERE id = ? AND isDeleted = 0";
  db.query(fetchSql, [id], (fetchErr, rows) => {
    if (fetchErr || rows.length === 0) {
      console.error("Error fetching question:", fetchErr);
      return res.status(500).send("Error fetching existing question");
    }

    const existing = rows[0];
    const englishChanged = questionEnglish && questionEnglish !== existing.questionEnglish;
    const urduChanged = questionUrdu && questionUrdu !== existing.questionUrdu;

    let slug = null;
    if (englishChanged && urduChanged) {
      slug = generateSlug(questionEnglish);
    } else if (englishChanged) {
      slug = generateSlug(questionEnglish);
    } else if (urduChanged) {
      slug = generateSlug(questionUrdu);
    }

    // Construct SQL dynamically
    let sql = `UPDATE New_Question_Table SET `;
    const fields = [];
    const params = [];

    if (imageBuffer) {
      fields.push("image = ?");
      params.push(imageBuffer);
    }

    if (questionEnglish !== undefined) {
      fields.push("questionEnglish = ?");
      params.push(questionEnglish);
    }

    if (answerEnglish !== undefined) {
      fields.push("answerEnglish = ?");
      params.push(answerEnglish);
    }

    if (questionUrdu !== undefined) {
      fields.push("questionUrdu = ?");
      params.push(questionUrdu);
    }

    if (answerUrdu !== undefined) {
      fields.push("answerUrdu = ?");
      params.push(answerUrdu);
    }

    if (slug) {
      fields.push("slug = ?");
      params.push(slug);
    }

    fields.push("modifiedOn = ?");
    params.push(modifiedOn);

    sql += fields.join(", ") + " WHERE id = ? AND isDeleted = 0";
    params.push(id);

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("Error updating new question:", err);
        return res.status(500).send("Error updating question");
      }
      if (result.affectedRows === 0) return res.status(404).send("Question not found");
      res.json({ message: "Question updated successfully!" });
    });
  });
};



// Soft delete
exports.deleteNewQuestion = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send('Question ID is required.');

  const modifiedOn = new Date();

  const sql = `
    UPDATE New_Question_Table
    SET isDeleted = 1, modifiedOn = ?
    WHERE id = ?
  `;

  db.query(sql, [modifiedOn, id], (err, result) => {
    if (err) {
      console.error('Error deleting question:', err);
      return res.status(500).send('Error deleting question');
    }
    if (result.affectedRows === 0) return res.status(404).send('Question not found.');
    res.send('Question deleted (soft delete) successfully!');
  });
};
