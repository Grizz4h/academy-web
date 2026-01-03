import streamlit as st
from academy.pages.curriculum_page import render as render_curriculum
from academy.pages.session_trainer_page import render as render_session_trainer
from academy.pages.history_page import render as render_history
from academy.pages.glossary_page import render as render_glossary
from academy.pages.progress_page import render as render_progress

st.set_page_config(page_title="MatchHub + Academy", layout="wide")

# Sidebar Navigation
st.sidebar.title("Navigation")
bereich = st.sidebar.radio("Bereich", ["MATCHHUB", "ACADEMY"])

if bereich == "MATCHHUB":
    st.sidebar.radio("MatchHub", ["Heute", "Pre-Match", "Beobachtung", "Historie"])
    st.title("MatchHub")
    st.write("MatchHub-Features hier implementieren...")

elif bereich == "ACADEMY":
    academy_page = st.sidebar.radio("Academy", ["Curriculum", "Session Trainer", "Glossar", "Fortschritt", "Historie"])

    if academy_page == "Curriculum":
        render_curriculum()
    elif academy_page == "Session Trainer":
        render_session_trainer()
    elif academy_page == "Historie":
        render_history()
    elif academy_page == "Glossar":
        render_glossary()
    elif academy_page == "Fortschritt":
        render_progress()

# User selection (placeholder)
if 'user' not in st.session_state:
    st.session_state.user = st.sidebar.selectbox("User", ["martin", "christoph"])