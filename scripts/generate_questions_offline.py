
"""
Offline generator to bulk-create practice questions (no AI needed).
It creates additional 'predict the output', descriptive, and code tasks.
Run:
  python scripts/generate_questions_offline.py
"""
import json, random
from pathlib import Path

root = Path(__file__).resolve().parents[1]
outdir = root/"data/quizzes"

def predict_output_variants(base_id, n=40):
    qs=[]
    for i in range(n):
        a = random.randint(2,7)
        b = random.randint(2,7)
        code = f"""```cpp
#include <iostream>
int f(int x){ return x*{a}+{b}; }
int main(){ std::cout << f({i}); }
```"""
        ans = str(a*i+b)
        qs.append({
            "id": f"{base_id}_po_{i}",
            "type":"output",
            "category":"exercise",
            "prompt":"Predict the output:\n"+code,
            "options":[],
            "answer": ans,
            "explanation": f"f(x) = {a}*x+{b}; for x={i}, result={ans}."
        })
    return qs

def descriptive_variants(base_id, n=20):
    bank = [
        ("Explain RAII in C++ and why it prevents resource leaks.", 
         "RAII binds resource lifetime to object lifetime; resources are released in destructors."),
        ("Compare deep copy vs shallow copy with an example.", 
         "Deep copy duplicates owned resources; shallow copy only copies pointers/handles."),
        ("What is virtual inheritance and when do we need it?", 
         "Virtual base classes avoid multiple copies of a base in diamond inheritance.")
    ]
    qs=[]
    for i in range(n):
        q, exp = random.choice(bank)
        qs.append({
            "id": f"{base_id}_desc_{i}",
            "type":"descriptive",
            "category":"mastery",
            "prompt": q,
            "options":[],
            "answer":"(manual check)",
            "explanation": exp
        })
    return qs

def code_tasks(base_id, n=15):
    qs=[]
    for i in range(n):
        qs.append({
            "id": f"{base_id}_code_{i}",
            "type":"code",
            "category":"cumulative",
            "prompt":"Implement a small class `Vec2` supporting + and output via `operator<<`.",
            "options":[],
            "answer":"(manual check)",
            "explanation":"Define x,y; overload operator+ and friend ostream& operator<<."
        })
    return qs

def main():
    for ch in range(1,15):
        p = outdir/f"chapter{ch}.json"
        data = json.loads(p.read_text())
        base_id = f"c{ch}"
        data["questions"].extend(predict_output_variants(base_id, 40))
        data["questions"].extend(descriptive_variants(base_id, 20))
        data["questions"].extend(code_tasks(base_id, 15))
        p.write_text(json.dumps(data, indent=2))
    print("Generated additional questions for chapters 1–14.")

if __name__ == "__main__":
    main()
