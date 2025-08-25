#ifndef QUESTION_H
#define QUESTION_H

#include <string>
#include <vector>

enum class QuestionType
{
  MCQ,
  TEXT
};

class Question
{
protected:
  std::string text;
  QuestionType type;

public:
  bool isGenerated; // flag to indicate if this question was AI-generated
  Question(const std::string &qText, QuestionType qType)
      : text(qText), type(qType), isGenerated(false) {}
  virtual ~Question() = default;
  QuestionType getType() const { return type; }
  const std::string &getText() const { return text; }
  // Abstract method to check if an answer is correct
  virtual bool checkAnswer(const std::string &answer) const = 0;
};

// Multiple-choice question
class MCQQuestion : public Question
{
private:
  std::vector<std::string> options;
  char correctOption;

public:
  MCQQuestion(const std::string &qText, const std::vector<std::string> &opts, char correct)
      : Question(qText, QuestionType::MCQ), options(opts), correctOption(correct) {}
  const std::vector<std::string> &getOptions() const { return options; }
  bool checkAnswer(const std::string &answer) const override;
};

// Text (fill-in or free-response) question
class TextQuestion : public Question
{
private:
  std::string answer;

public:
  TextQuestion(const std::string &qText, const std::string &ans)
      : Question(qText, QuestionType::TEXT), answer(ans) {}
  bool checkAnswer(const std::string &ans) const override;
  const std::string &getAnswer() const { return answer; }
};

#endif
