import streamlit as st
from ..sessions import list_sessions
from ..renderers import render_header, render_card

def render():
    render_header("Historie", "Vergangene Sessions")

    users = ["alle", "martin", "christoph"]
    selected_user = st.selectbox("User", users)

    user_filter = None if selected_user == "alle" else selected_user
    sessions = list_sessions(user_filter)

    for session in sessions:
        with st.container(border=True):
            col1, col2 = st.columns([2, 1])
            with col1:
                st.subheader(f"{session['game_info'].get('team_home', 'Home')} vs {session['game_info'].get('team_away', 'Away')}")
                st.write(f"Datum: {session['game_info'].get('date', 'Unbekannt')}")
                st.write(f"Modul: {session['module_id']}")
            with col2:
                st.metric("Confidence", session['confidence'])
                st.metric("Status", session['state'])

            if session['checkins']:
                with st.expander("Check-ins anzeigen"):
                    for checkin in session['checkins']:
                        st.write(f"**{checkin['phase']}** - {checkin['timestamp']}")
                        st.json(checkin['responses'])
                        if checkin.get('feedback'):
                            st.write(f"Feedback: {checkin['feedback']}")
                        if checkin.get('next_task'):
                            st.write(f"Next Task: {checkin['next_task']}")

            if session.get('post'):
                with st.expander("Post-Session"):
                    post = session['post']
                    st.write(f"Zusammenfassung: {post.get('summary', '')}")
                    st.write(f"Unklarheiten: {post.get('unclear', '')}")
                    st.write(f"Nächstes Modul: {post.get('next_module', '')}")
                    st.metric("Nützlichkeit", post.get('helpfulness', 0))