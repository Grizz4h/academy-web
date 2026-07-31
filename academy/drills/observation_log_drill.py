import streamlit as st


def _normalize_missions(config, max_logs):
    missions = config.get("missions") or []
    normalized = []

    for index in range(max_logs):
        mission = missions[index] if index < len(missions) else {}
        if isinstance(mission, str):
            normalized.append({"title": f"Mission {index + 1}", "prompt": mission})
        else:
            normalized.append({
                "title": mission.get("title", f"Mission {index + 1}"),
                "prompt": mission.get("prompt", ""),
            })

    return normalized


def render(drill, context):
    st.subheader(drill["title"])

    config = drill.get("config", {})
    max_logs = config.get("log_count", 3)
    logs_key = config.get("logs_key", "logs")
    decision = config.get("decision", {})
    reflection = config.get("reflection", {})

    decision_key = decision.get("key", "decision")
    decision_label = decision.get("label", "Wer setzt den ersten defensiven Impuls?")
    decision_options = decision.get("options", [])

    reflection_key = reflection.get("key", "reflection")
    reflection_label = reflection.get(
        "label",
        "Woran hast du erkannt, dass genau hier die Defensivaktion beginnt?",
    )
    reflection_placeholder = reflection.get("placeholder", "Optional: kurze Reflexion")
    reflection_max_chars = reflection.get("max_chars", 500)
    reflection_optional = reflection.get("optional", True)

    missions = _normalize_missions(config, max_logs)

    response_key = f"{context['session_id']}_{drill.get('id', 'observation_log_drill')}_{logs_key}"
    if response_key not in st.session_state:
        st.session_state[response_key] = []

    logs = st.session_state[response_key]
    current_index = len(logs)

    if current_index < max_logs:
        mission = missions[current_index]
        st.markdown(f"### {mission['title']}")
        if mission.get("prompt"):
            st.write(mission["prompt"])

        with st.form(key=f"{response_key}_mission_{current_index}", clear_on_submit=True):
            decision_value = st.radio(
                decision_label,
                options=decision_options,
                key=f"{response_key}_decision_{current_index}",
            ) if decision_options else None

            reflection_value = st.text_area(
                reflection_label,
                placeholder=reflection_placeholder,
                max_chars=reflection_max_chars,
                key=f"{response_key}_reflection_{current_index}",
            )

            submitted = st.form_submit_button(config.get("submit_label", "+ Log speichern"))

            if submitted and decision_value:
                logs.append({
                    "mission_index": current_index + 1,
                    "mission_title": mission.get("title"),
                    "mission_prompt": mission.get("prompt"),
                    decision_key: decision_value,
                    reflection_key: reflection_value.strip() if reflection_optional else reflection_value,
                })
                st.session_state[response_key] = logs
                st.rerun()

    if logs:
        st.caption(f"{len(logs)}/{max_logs} Logs erfasst")
        for log in logs:
            mission_label = log.get("mission_title", f"Mission {log.get('mission_index', '?')}")
            decision_value = log.get(decision_key, "")
            reflection_value = log.get(reflection_key, "")
            st.write(f"{mission_label}: {decision_value}")
            if reflection_value:
                st.write(reflection_value)

    return {
        logs_key: logs,
        "completed": len(logs) >= max_logs,
    }