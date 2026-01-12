import json
from pathlib import Path

# Path to curriculum.json
CURRICULUM_PATH = Path(__file__).parent.parent / "data" / "academy" / "curriculum.json"

def load_curriculum():
    with open(CURRICULUM_PATH, encoding="utf-8") as f:
        return json.load(f)

def check_mini_feedback_consistency(curriculum):
    errors = []
    for track in curriculum.get("tracks", []):
        for module in track.get("modules", []):
            for drill in module.get("drills", []):
                drill_id = drill.get("id", "<no id>")
                config_questions = {q["key"]: q for q in drill.get("config", {}).get("questions", []) if "key" in q}
                mini_feedback = drill.get("miniFeedback", {})
                for group in mini_feedback.get("groups", []):
                    when = group.get("when", {})
                    for key, value in when.items():
                        if key not in config_questions:
                            errors.append(f"Drill {drill_id}: miniFeedback.when key '{key}' not in config.questions")
                        else:
                            options = config_questions[key].get("options")
                            if options and value not in options:
                                errors.append(f"Drill {drill_id}: miniFeedback.when value '{value}' not in options for key '{key}' ({options})")
    return errors

def main():
    curriculum = load_curriculum()
    errors = check_mini_feedback_consistency(curriculum)
    if errors:
        print("Inkonsistenzen gefunden:")
        for err in errors:
            print("-", err)
    else:
        print("Alle miniFeedback-Gruppen sind konsistent mit config.questions.")

if __name__ == "__main__":
    main()
