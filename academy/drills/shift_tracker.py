import streamlit as st

def render(drill, context):
    st.subheader(drill['title'])

    shift_count = drill['config'].get('shift_count', 10)
    responses = {}

    st.write(f"Beobachte {shift_count} Shifts:")

    for i in range(1, shift_count + 1):
        st.subheader(f"Shift {i}")
        shift_responses = {}

        for question in drill['config']['questions']:
            q_key = question['key']
            q_type = question['type']
            q_label = question['label']

            unique_key = f"{context['session_id']}_{q_key}_{i}"

            if q_type == 'checkbox':
                shift_responses[q_key] = st.checkbox(q_label, key=unique_key)
            elif q_type == 'radio':
                shift_responses[q_key] = st.radio(q_label, question['options'], key=unique_key)
            elif q_type == 'text':
                shift_responses[q_key] = st.text_area(q_label, max_chars=question.get('max_chars', 200), key=unique_key)

        responses[f"shift_{i}"] = shift_responses

    return responses