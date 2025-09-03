# scripts/make_questions.py
# Generates data/quizzes/quizzes.json with 14 chapters and 4 sections each.
import json, os, math, random
random.seed(42)

def predict_questions(n=30):
    qs=[]
    for i in range(n):
        # simple but varied patterns: increments, loops, refs, strings, arrays
        t = i % 5
        if t == 0:
            q = "int a={0}; cout<<a++<<\" \"<<++a;".format(2+i%7)
            ans1 = str(2+i%7)
            ans2 = str(2+i%7 + 2)
            exp = "Post‑increment prints the original value, then pre‑increment increases before printing."
            qs.append({"type":"predict","question":"Predict the output:\n\n" + q, "answer": f"{ans1} {ans2}", "explanation": exp})
        elif t == 1:
            n1 = 3 + (i%5)
            q = f"int s=0; for(int i=1;i<={n1};++i) s+=i; cout<<s;"
            exp = "Sum of first n natural numbers n(n+1)/2."
            qs.append({"type":"predict","question":"Predict the output:\n\n" + q, "answer": str(n1*(n1+1)//2), "explanation": exp})
        elif t == 2:
            q = "string s=\"OOP\"; s+=to_string(1+2); cout<<s.size();"
            qs.append({"type":"predict","question":"Predict the output:\n\n" + q, "answer":"4", "explanation":"\"OOP\" has 3 chars; appending \"3\" yields 4."})
        elif t == 3:
            q = "int a=5,b=2; cout<<(a/b)<<\" \"<<(double)a/b;"
            qs.append({"type":"predict","question":"Predict the output:\n\n" + q, "answer":"2 2.5", "explanation":"Integer division truncates; casting yields floating division."})
        else:
            q = "int a[]={1,2,3}; int *p=a+1; cout<<*p<<\" \"<<*(p+1);"
            qs.append({"type":"predict","question":"Predict the output:\n\n" + q, "answer":"2 3", "explanation":"Pointer arithmetic moves by element size."})
    return qs

def descriptive_questions(n=30):
    base = [
        ("Encapsulation", "Hiding internal state behind a public interface; explain using a BankAccount class."),
        ("Abstraction", "Modeling only essential features; how it reduces coupling."),
        ("Inheritance", "Reusing behavior; when to prefer composition instead."),
        ("Polymorphism", "Runtime dispatch via virtual functions vs templates (compile‑time)."),
        ("RAII", "Why destructors are key on exceptions; unique_ptr vs shared_ptr.")
    ]
    qs=[]
    for i in range(n):
        topic = base[i % len(base)]
        qs.append({
            "type":"descriptive",
            "question":f"Explain {topic[0]}. {topic[1]}",
            "answer":f"{topic[0]} definition with a short example.",
            "explanation":"2–3 line conceptual clarification with example (see notes)."
        })
    return qs

def coding_questions(n=15):
    tasks = [
        ("Point distance", "Class Point(x,y) with method double dist(const Point&) const;"),
        ("Stack", "Implement a simple Stack<T> with push/pop/top using std::vector."),
        ("Shape area", "Abstract base Shape with virtual area(); derive Circle/Rectangle."),
        ("BigInt add", "Add two big integers given as strings."),
        ("File stats", "Read a file and print line/word/char counts.")
    ]
    qs=[]
    for i in range(n):
        t = tasks[i % len(tasks)]
        qs.append({
            "type":"code",
            "question":t[1],
            "answer":"Reference solution acceptable.",
            "explanation":"Design classes cleanly, handle edge cases; see revise notes for examples."
        })
    return qs

def make_chapter(idx):
    return {
        "id": f"ch{idx}",
        "title": f"Chapter {idx}",
        "sections": {
            "Mastery": [
                {"type":"mcq","question":"Which principle minimizes coupling?","choices":["Encapsulation","Inheritance","Overloading","Casting"],"answer":"Encapsulation","explanation":"Encapsulation exposes a minimal interface and hides details."},
                {"type":"mcq","question":"Which keyword enables runtime polymorphism?","choices":["template","virtual","static","constexpr"],"answer":"virtual","explanation":"Virtual functions let derived overrides dispatch at runtime."}
            ],
            "Review": [
                {"type":"short","question":"One line: difference between class and struct in C++?","answer":"Only default access (class: private, struct: public).","explanation":"Semantics are the same; only default visibility differs."}
            ],
            "Cumulative": predict_questions(30),
            "Exercises": coding_questions(15) + descriptive_questions(30)
        }
    }

def main():
    os.makedirs("data/quizzes", exist_ok=True)
    data = {"chapters": [make_chapter(i) for i in range(1, 14+1)]}
    with open("data/quizzes/quizzes.json","w",encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Wrote data/quizzes/quizzes.json")

if __name__ == "__main__":
    main()
