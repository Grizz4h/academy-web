import streamlit as st

def render_header(title, subtitle=None):
    st.title(title)
    if subtitle:
        st.markdown(f"*{subtitle}*")

def render_card(content, border=True):
    if border:
        st.markdown("""
        <div style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin: 10px 0;">
        """, unsafe_allow_html=True)
    content()
    if border:
        st.markdown("</div>", unsafe_allow_html=True)

def render_metric(label, value, delta=None):
    st.metric(label, value, delta)

def render_expander(label, content):
    with st.expander(label):
        content()

def render_columns(*contents, widths=None):
    if widths:
        cols = st.columns(widths)
    else:
        cols = st.columns(len(contents))
    for col, content in zip(cols, contents):
        with col:
            content()