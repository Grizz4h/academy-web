import streamlit as st
import time

def render(drill, context):
    st.subheader(drill['title'])

    time_limit = drill['config'].get('time_limit', 60)
    questions = drill['config']['questions']

    if 'quiz_start' not in st.session_state:
        st.session_state.quiz_start = time.time()
        st.session_state.quiz_answers = {}

    elapsed = time.time() - st.session_state.quiz_start
    remaining = max(0, time_limit - elapsed)

    st.progress(min(elapsed / time_limit, 1.0))
    st.write(f"Verbleibende Zeit: {int(remaining)} Sekunden")

    if remaining <= 0:
        st.error("Zeit abgelaufen!")
        return st.session_state.quiz_answers

    responses = {}

    for i, q in enumerate(questions):
        st.write(f"**Frage {i+1}:** {q['question']}")
        answer = st.radio(
            "Antwort",
            q['options'],
            key=f"q_{i}_{context['session_id']}",
            index=None
        )
        responses[f"q{i+1}"] = answer

        if answer == q.get('correct'):
            st.success("Richtig!")
            if q.get('explanation'):
                st.write(f"Erklärung: {q['explanation']}")
        elif answer:
            st.error("Falsch.")

    if st.button("Quiz abschließen"):
        return responses

    return None