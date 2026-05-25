import json
from pathlib import Path

# Path to curriculum.json
CURRICULUM_PATH = Path(__file__).parent.parent / "data" / "academy" / "curriculum.json"

def load_curriculum():
    with open(CURRICULUM_PATH, encoding="utf-8") as f:
        return json.load(f)

def check_mini_feedback_consistency(curriculum):
    def extract_field_options(field):
        options = field.get("options")
        if isinstance(options, list):
            return options

        options_by_value_of = field.get("options_by_value_of")
        if not isinstance(options_by_value_of, dict):
            return None

        flattened = []
        for _, controller_map in options_by_value_of.items():
            if not isinstance(controller_map, dict):
                continue
            for _, values in controller_map.items():
                if isinstance(values, list):
                    flattened.extend(values)
        return flattened or None

    errors = []
    for track in curriculum.get("tracks", []):
        for module in track.get("modules", []):
            for drill in module.get("drills", []):
                drill_id = drill.get("id", "<no id>")
                drill_type = drill.get("drill_type")
                config_questions = {q["key"]: q for q in drill.get("config", {}).get("questions", []) if "key" in q}
                config_fields = {f["key"]: f for f in drill.get("config", {}).get("fields", []) if "key" in f}
                sample_state_key = drill.get("config", {}).get("state_key")
                sample_state_options = drill.get("config", {}).get("state_options", [])
                mini_feedback = drill.get("miniFeedback", {})
                for group in mini_feedback.get("groups", []):
                    when = group.get("when", {})
                    for key, value in when.items():
                        if drill_type == "sample_log" and key == sample_state_key:
                            if sample_state_options and value not in sample_state_options:
                                errors.append(
                                    f"Drill {drill_id}: miniFeedback.when value '{value}' not in sample state options ({sample_state_options})"
                                )
                            continue

                        if key in config_questions:
                            options = config_questions[key].get("options")
                            if options and value not in options:
                                errors.append(f"Drill {drill_id}: miniFeedback.when value '{value}' not in options for key '{key}' ({options})")
                            continue

                        if key in config_fields:
                            options = extract_field_options(config_fields[key])
                            if options and value not in options:
                                errors.append(f"Drill {drill_id}: miniFeedback.when value '{value}' not in options for key '{key}' ({options})")
                            continue

                        errors.append(f"Drill {drill_id}: miniFeedback.when key '{key}' not in config.questions/config.fields")
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
