import streamlit as st
from ..curriculum import get_tracks
from ..renderers import render_header, render_card

def render():
    render_header("Curriculum", "Wähle ein Modul zum Starten einer Session")

    tracks = get_tracks()

    for track in tracks:
        st.header(f"{track['id']} - {track['title']}")
        if track.get('goal'):
            st.markdown(f"*{track['goal']}*")

        for module in track['modules']:
            with st.container(border=True):
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.subheader(module['title'])
                    if module.get('summary'):
                        st.write(module['summary'])
                    drill_count = len(module.get('drills', []))
                    st.write(f"Drills verfügbar: {drill_count}")
                with col2:
                    if st.button("Starten", key=f"start_{module['id']}"):
                        st.session_state.selected_module = module['id']
                        st.rerun()