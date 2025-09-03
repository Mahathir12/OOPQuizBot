Importer skeleton (offline):
- Put your questions in import_questions_template.csv (add as many rows as you want).
- Columns:
  chapter, section (review|mastery|exercises|cumulative|predict|descriptive|code),
  type (mcq|predict|descriptive), title/prompt, code, options (JSON array), answer (index), expectedOutput, explanation, sampleAnswer.
- Convert per chapter into data/quizzes/chapterN.json with structure:
  { ""title"": ""..."", ""sections"": [ ... questions ... ] }

Why this exists: we can't legally copy a book into the model, but you can load your own materials locally and keep them private.