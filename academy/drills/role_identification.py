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
        elif q_type == 'text':
            responses[q_key] = st.text_input(q_label, max_chars=question.get('max_chars', 200), key=f"{context['session_id']}_{q_key}")

    return responses