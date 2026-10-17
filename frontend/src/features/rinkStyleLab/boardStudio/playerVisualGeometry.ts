/**
 * Vendored from rInQ Board Studio (see ../SOURCE.md).
 * Canonical Player marker design-space (S082 / S085).
 * Local origin = body / jersey center.
 * SVG Y grows downward — helmet sits at negative offsetY.
 */

/** Hit radius in SVG design units (Board Studio PLAYER_RADIUS). */
export const PLAYER_RADIUS = 17.5;

export interface PlayerCircleGeom {
  offsetX: number;
  offsetY: number;
  radius: number;
}

export interface PlayerPadGeom {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  /**
   * Optional local rotation (SVG degrees, clockwise) about the pad center.
   * Goalie pads use opposite signs to open a crouch / butterfly V toward the helmet.
   */
  rotationDegrees?: number;
}

export interface PlayerStickGeom {
  /** Shaft start/end in local coords. */
  shaft: { x1: number; y1: number; x2: number; y2: number };
  /** Blade tip relative to shaft end (polyline end). */
  blade: { x: number; y: number };
}

/**
 * Tunable hockey-marker dimensions (skater local design space).
 * Drawn with `SKATER_MARKER_VISUAL_SCALE` (~1.08) so skaters read larger
 * without exceeding goalie bulk. Keep hit radius aligned with PLAYER_RADIUS.
 */
export const PLAYER_VISUAL_GEOMETRY = {
  /** Logical interaction footprint (unchanged Scene clamp semantics). */
  hitRadius: PLAYER_RADIUS,
  /**
   * Selection halo radius around the body center — covers helmet + stick tip
   * without hugging the old circle alone.
   */
  selectionHaloRadius: 24,
  helmet: {
    offsetX: 0,
    offsetY: -10.25,
    radius: 5.9,
  } satisfies PlayerCircleGeom,
  /** Small darker visor band under the helmet shell. */
  helmetVisor: {
    offsetX: 0,
    offsetY: -8.35,
    radiusX: 4.4,
    radiusY: 2.15,
  },
  /**
   * Compact jersey / torso — dominant label surface.
   * Path is in local coords (body center origin).
   */
  torsoPathLocal:
    "M -11.5 -4.75 C -11.5 -7.4 -7.2 -8.6 0 -8.6 C 7.2 -8.6 11.5 -7.4 11.5 -4.75 L 7.6 9.4 Q 0 12.1 -7.6 9.4 Z",
  leftGlove: {
    offsetX: -12.1,
    offsetY: 1.6,
    radius: 3.35,
  } satisfies PlayerCircleGeom,
  rightGlove: {
    offsetX: 12.1,
    offsetY: 1.6,
    radius: 3.35,
  } satisfies PlayerCircleGeom,
  /** Goalie-only pad cues — null for skaters. */
  leftPad: null as PlayerPadGeom | null,
  rightPad: null as PlayerPadGeom | null,
  /** Goalie-only blocker (boxy hand) — null for skaters. */
  blocker: null as PlayerPadGeom | null,
  /**
   * Canonical stick side is right. Left-handed players mirror via
   * `resolvePlayerVisualGeometry(marker, "left")`.
   */
  stick: {
    shaft: { x1: 13.2, y1: 2.2, x2: 23.8, y2: -5.0 },
    // Blade heel ~105° (opened from ~90° L) — more natural stick lie.
    blade: { x: 21.8, y: -10.9 },
  } satisfies PlayerStickGeom,
  /** Blade stroke width scale vs shaft (skater ~1.15). */
  stickBladeStrokeScale: 1.15,
  /** Label sits on jersey center with slight optical nudge. */
  label: {
    offsetX: 0,
    offsetY: 1.35,
  },
  outlineWidth: 1.7,
  stickStrokeWidth: 2.35,
  trimStrokeWidth: 1.05,
  helmetHighlight: {
    offsetX: -1.6,
    offsetY: -11.6,
    radius: 1.55,
  } satisfies PlayerCircleGeom,
} as const;

/**
 * Goalie variant — same rInQ Player language, crouch / bent-over top-down read.
 *
 * From above, a crouched goalie shows a large back/torso (like skaters) with
 * pads peeking past the torso toward the helmet side (−Y) and to the sides —
 * not a short stack of equipment covering itself.
 *
 * Paint order: pads + catcher under torso; blocker beside; helmet on top.
 * Hit radius unchanged.
 */
export const GOALIE_VISUAL_GEOMETRY = {
  ...PLAYER_VISUAL_GEOMETRY,
  selectionHaloRadius: 33,
  /**
   * Tall, wide torso (crouch from above ≈ looking at the back).
   * Comparable height to skater torso, ~120% width.
   */
  torsoPathLocal:
    "M -14.2 -5.2 C -14.2 -8.0 -8.6 -9.4 0 -9.4 C 8.6 -9.4 14.2 -8.0 14.2 -5.2 L 11.2 10.6 Q 0 13.6 -11.2 10.6 Z",
  /**
   * Catcher under the left torso edge — body paints over the inner overlap.
   */
  leftGlove: {
    offsetX: -14.4,
    offsetY: 1.2,
    radius: 5.9,
  } satisfies PlayerCircleGeom,
  rightGlove: {
    offsetX: 0,
    offsetY: 0,
    radius: 0,
  } satisfies PlayerCircleGeom,
  /**
   * Pads toward helmet (−Y), splayed outward (butterfly / crouch V).
   * Opposite rotations open a visible gap the helmet does not fully cover.
   */
  leftPad: {
    x: -19.6,
    y: -14.8,
    width: 14.0,
    height: 13.4,
    rx: 3.5,
    rotationDegrees: -25,
  } satisfies PlayerPadGeom,
  rightPad: {
    x: 5.6,
    y: -14.8,
    width: 14.0,
    height: 13.4,
    rx: 3.5,
    rotationDegrees: 25,
  } satisfies PlayerPadGeom,
  /** Blocker beside the torso (visible, not under the jersey). */
  blocker: {
    x: 13.0,
    y: -1.2,
    width: 7.8,
    height: 10.4,
    rx: 1.55,
  } satisfies PlayerPadGeom,
  stick: {
    shaft: { x1: 16.0, y1: 4.0, x2: 30.0, y2: -6.2 },
    // Match skater heel opening (~105°).
    blade: { x: 26.4, y: -15.5 },
  } satisfies PlayerStickGeom,
  stickBladeStrokeScale: 1.55,
  stickStrokeWidth: 3.15,
  helmet: {
    offsetX: 0,
    offsetY: -11.0,
    radius: 6.25,
  } satisfies PlayerCircleGeom,
  helmetVisor: {
    offsetX: 0,
    offsetY: -9.0,
    radiusX: 4.8,
    radiusY: 2.25,
  },
  helmetHighlight: {
    offsetX: -1.7,
    offsetY: -12.35,
    radius: 1.6,
  } satisfies PlayerCircleGeom,
  label: {
    offsetX: 0,
    offsetY: 2.0,
  },
} as const;

export type PlayerVisualGeometry =
  | typeof PLAYER_VISUAL_GEOMETRY
  | typeof GOALIE_VISUAL_GEOMETRY;

function mirrorPad(pad: PlayerPadGeom | null): PlayerPadGeom | null {
  if (!pad) {
    return null;
  }
  return {
    ...pad,
    x: -(pad.x + pad.width),
    rotationDegrees:
      pad.rotationDegrees !== undefined ? -pad.rotationDegrees : undefined,
  };
}

/**
 * Resolve skater vs goalie marker geometry from authored visual.marker.
 * Left handedness mirrors stick / gloves / pads / blocker across body center.
 */
export function resolvePlayerVisualGeometry(
  marker: string | undefined,
  handedness: "left" | "right" | null | undefined = "right",
): PlayerVisualGeometry {
  const base: PlayerVisualGeometry =
    marker === "goalie" ? GOALIE_VISUAL_GEOMETRY : PLAYER_VISUAL_GEOMETRY;
  if (handedness !== "left") {
    return base;
  }

  return {
    ...base,
    leftGlove: {
      ...base.rightGlove,
      offsetX: -base.rightGlove.offsetX,
    },
    rightGlove: {
      ...base.leftGlove,
      offsetX: -base.leftGlove.offsetX,
    },
    leftPad: mirrorPad(base.rightPad),
    rightPad: mirrorPad(base.leftPad),
    blocker: base.blocker
      ? {
          ...base.blocker,
          x: -(base.blocker.x + base.blocker.width),
        }
      : null,
    stick: {
      shaft: {
        x1: -base.stick.shaft.x1,
        y1: base.stick.shaft.y1,
        x2: -base.stick.shaft.x2,
        y2: base.stick.shaft.y2,
      },
      blade: {
        x: -base.stick.blade.x,
        y: base.stick.blade.y,
      },
    },
    helmetHighlight: {
      ...base.helmetHighlight,
      offsetX: -base.helmetHighlight.offsetX,
    },
  } as PlayerVisualGeometry;
}
