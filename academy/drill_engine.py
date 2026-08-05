from .drills import period_checkin, shift_tracker, triangle_spotting, role_identification, sample_log, observation_log_drill

DRILL_REGISTRY = {
    "period_checkin": period_checkin.render,
    "pressure_diagnosis": period_checkin.render,
    "observation_log_drill": observation_log_drill.render,
    "impact_classification_observation": observation_log_drill.render,
    "support_classification_observation": observation_log_drill.render,
    "sequence_classification_observation": observation_log_drill.render,
    "pattern_reflection_observation": observation_log_drill.render,
    "clickable_rink_observation": observation_log_drill.render,
    "draggable_rink_observation": observation_log_drill.render,
    "rink_corridor_observation": observation_log_drill.render,
    "rink_segmented_zone_observation": observation_log_drill.render,
    "paintable_rink_observation": observation_log_drill.render,
    "sample_log": sample_log.render,
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