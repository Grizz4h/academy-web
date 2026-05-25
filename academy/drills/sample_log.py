import streamlit as st


def render(drill, context):
    st.subheader(drill["title"])

    config = drill.get("config", {})
    sample_key = config.get("sample_key", "samples")
    max_samples = config.get("max_samples_per_phase", 3)
    state_key = config.get("state_key", "state")
    state_label = config.get("state_label", "Support")
    factor_key = config.get("factor_key", "factor")
    factor_label = config.get("factor_label", "Hauptfaktor")
    quality_key = config.get("quality_key")
    quality_label = config.get("quality_label", "Qualität")
    quality_options = config.get("quality_options", [])
    note_key = config.get("note_key", "note")
    note_label = config.get("note_label", "Notiz (optional)")
    note_max_chars = config.get("note_max_chars", 120)
    state_options = config.get("state_options", [])
    factors_by_state = config.get("factors_by_state", {})

    response_key = f"{context['session_id']}_{drill.get('id', 'sample_log')}_{sample_key}"
    if response_key not in st.session_state:
        st.session_state[response_key] = []

    samples = st.session_state[response_key]

    with st.form(key=f"{response_key}_form", clear_on_submit=True):
        state = st.radio(state_label, options=state_options, key=f"{response_key}_state") if state_options else ""
        factor_options = factors_by_state.get(state, [])
        factor = st.selectbox(factor_label, options=[""] + factor_options, key=f"{response_key}_factor")
        quality = ""
        if quality_key and isinstance(quality_options, list) and len(quality_options) > 0:
            quality = st.radio(quality_label, options=quality_options, key=f"{response_key}_quality")
        note = st.text_input(note_label, max_chars=note_max_chars, key=f"{response_key}_note")
        submitted = st.form_submit_button("+ Support-Moment")

        quality_ok = (not quality_key) or (quality_key and quality)
        if submitted and len(samples) < max_samples and state and factor and quality_ok:
            sample = {
                state_key: state,
                factor_key: factor,
                note_key: note.strip(),
            }
            if quality_key:
                sample[quality_key] = quality
            samples.append(sample)
            st.session_state[response_key] = samples

    st.caption(f"{len(samples)}/{max_samples} erfasst")
    for idx, sample in enumerate(samples, start=1):
        st.write(f"{idx}. {sample.get(state_key, '')} | {sample.get(factor_key, '')} | {sample.get(note_key, '')}")

    return {
        sample_key: samples,
        "selected_sample_index": max(0, len(samples) - 1) if samples else None,
    }
