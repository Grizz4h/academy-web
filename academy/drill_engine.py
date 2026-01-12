from .drills import period_checkin, shift_tracker, triangle_spotting, role_identification

DRILL_REGISTRY = {
    "period_checkin": period_checkin.render,
    "shift_tracker": shift_tracker.render,
    "triangle_spotting": triangle_spotting.render,
    "role_identification": role_identification.render
}

def render_drill(drill, context):
    drill_type = drill.get('drill_type')
    if drill_type in DRILL_REGISTRY:
        return DRILL_REGISTRY[drill_type](drill, context)
    else:
        st.error(f"Unknown drill type: {drill_type}")
        return None