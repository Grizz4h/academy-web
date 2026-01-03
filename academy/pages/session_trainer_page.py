import streamlit as st
from datetime import datetime
from ..curriculum import get_module
from ..sessions import create_session, add_checkin, complete_session, load_session
from ..drill_engine import render_drill
from ..renderers import render_header, render_card

def render():
    if 'current_session' not in st.session_state:
        render_session_setup()
    else:
        render_session_workflow()

def render_session_setup():
    render_header("Session Trainer", "Starte eine neue Lernsession")

    with st.form("session_setup"):
        date = st.date_input("Datum", value=datetime.today())
        league = st.text_input("Liga", value="DEL")
        team_home = st.text_input("Team Home")
        team_away = st.text_input("Team Away")

        module_id = st.session_state.get('selected_module')
        if module_id:
            module = get_module(module_id[0], module_id)  # Assuming track_id is first char
            st.write(f"Modul: {module['title'] if module else 'Unbekannt'}")

        goal = st.text_area("Ziel", height=100)
        confidence = st.slider("Confidence (1-5)", 1, 5, 3)

        if st.form_submit_button("Session starten"):
            game_info = {
                'date': date.isoformat(),
                'league': league,
                'team_home': team_home,
                'team_away': team_away
            }
            user = st.session_state.get('user', 'martin')  # Default user
            session = create_session(user, module_id, goal, confidence, game_info)
            st.session_state.current_session = session['id']
            st.rerun()

def render_session_workflow():
    session_id = st.session_state.current_session
    session = load_session(session_id)

    if not session:
        st.error("Session nicht gefunden")
        return

    render_header("Session Trainer", f"Modul: {session['module_id']}")

    # Phase selector
    phases = ["PRE", "P1", "P2", "P3", "POST"]
    current_phase = st.radio("Phase", phases, horizontal=True)

    if current_phase == "PRE":
        render_pre_phase(session)
    elif current_phase in ["P1", "P2", "P3"]:
        render_checkin_phase(session, current_phase)
    elif current_phase == "POST":
        render_post_phase(session)

def render_pre_phase(session):
    st.subheader("Pre-Session Setup")
    st.metric("Ziel", session['goal'])
    st.metric("Confidence", session['confidence'])

def render_checkin_phase(session, phase):
    st.subheader(f"Check-in {phase}")

    # Find drill for this module
    module = get_module(session['module_id'][0], session['module_id'])
    if module and module['drills']:
        drill = module['drills'][0]  # For now, take first drill
        context = {
            'user': session['user'],
            'game_info': session['game_info'],
            'session_id': session['id'],
            'phase': phase
        }
        responses = render_drill(drill, context)

        if responses and st.button("Speichern"):
            # Simple coaching rules
            feedback = "Gut gemacht!"
            next_task = "Nächste Phase vorbereiten"
            add_checkin(session['id'], phase, responses, feedback, next_task)
            st.success("Check-in gespeichert!")

def render_post_phase(session):
    st.subheader("Post-Session")

    with st.form("post_form"):
        summary = st.text_area("Zusammenfassung")
        unclear = st.text_area("Unklarheiten")
        next_module = st.text_input("Nächstes Modul")
        helpfulness = st.slider("Nützlichkeit (1-5)", 1, 5, 3)

        if st.form_submit_button("Session abschließen"):
            complete_session(session['id'], summary, unclear, next_module, helpfulness)
            del st.session_state.current_session
            st.success("Session abgeschlossen!")
            st.rerun()