from .drills import period_checkin, micro_quiz

DRILL_REGISTRY = {
    "period_checkin": period_checkin.render,
    "micro_quiz": micro_quiz.render
}

def render_drill(drill, context):
    drill_type = drill.get('drill_type')
    if drill_type in DRILL_REGISTRY:
        return DRILL_REGISTRY[drill_type](drill, context)
    else:
        st.error(f"Unknown drill type: {drill_type}")
        return None