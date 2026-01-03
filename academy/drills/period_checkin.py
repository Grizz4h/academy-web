import streamlit as st

def render(drill, context):
    st.subheader(drill['title'])

    responses = {}

    for question in drill['config']['questions']:
        q_key = question['key']
        q_type = question['type']
        q_label = question['label']

        if q_type == 'radio':
            responses[q_key] = st.radio(q_label, question['options'], key=f"{context['session_id']}_{q_key}")
        elif q_type == 'slider':
            responses[q_key] = st.slider(q_label, question['min'], question['max'], key=f"{context['session_id']}_{q_key}")
        elif q_type == 'text':
            responses[q_key] = st.text_area(q_label, max_chars=question.get('max_chars', 200), key=f"{context['session_id']}_{q_key}")

    # Simple coaching feedback
    if responses:
        feedback = ""
        next_task = ""
        for rule in drill['config'].get('coaching_rules', []):
            condition = rule['condition']
            if eval_condition(condition, responses):
                feedback = rule['feedback']
                next_task = rule['next_task']
                break

        if feedback:
            st.success(f"Feedback: {feedback}")
        if next_task:
            st.info(f"Next Task: {next_task}")

    return responses

def eval_condition(condition, responses):
    # Simple condition evaluator
    if '==' in condition:
        key, value = condition.split('==')
        key = key.strip()
        value = value.strip().strip("'\"")
        return responses.get(key) == value
    elif '<=' in condition:
        key, value = condition.split('<=')
        key = key.strip()
        value = int(value.strip())
        return responses.get(key, 0) <= value
    return False