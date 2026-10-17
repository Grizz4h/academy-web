/**
 * Vendored/adapted from Board Studio playerPrimitives.ts — see ../SOURCE.md.
 */

/**
 * Compound hockey-player marker primitives (S082 / S083).
 * Shared by Preview (`PlayerView`) and Export (`renderPlayerPrimitivesMarkup`).
 *
 * Anchor: Scene Position = body / jersey center = rotation pivot.
 * Body geometry is authored in local space; one SVG transform applies
 * evaluated rotation. Labels / halo / hit stay world-upright at the anchor.
 */

import type { Point } from "./localCore.ts";
import {
  DEFAULT_PLAYER_ROTATION_DEGREES,
  SKATER_MARKER_VISUAL_SCALE,
} from "./localCore.ts";
import {
  derivePlayerMarkerPaints,
  type PlayerMarkerPaints,
} from "./playerMarkerPaints.ts";
import type { PlayerRenderAppearance } from "./playerRenderAppearance.ts";
import {
  resolvePlayerVisualGeometry,
  type PlayerVisualGeometry,
} from "./playerVisualGeometry.ts";
import { stickSwingTransformAttribute } from "./stickSwingLocal.ts";
import {
  SKATE_STRIDE_GEOMETRY,
  createNeutralSkateStridePose,
  skateTransformAttribute,
  type SkateStridePose,
} from "./skateStrideLocal.ts";

export type PlayerBodyPrimitiveRole =
  | "left-skate"
  | "right-skate"
  | "stick-shaft"
  | "stick-blade"
  | "left-pad"
  | "right-pad"
  | "blocker"
  | "torso"
  | "torso-trim"
  | "left-glove"
  | "right-glove"
  | "helmet"
  | "helmet-visor"
  | "helmet-highlight";

export type PlayerOverlayPrimitiveRole =
  | "selection-halo"
  | "hit-area"
  | "label";

export type PlayerPrimitiveRole =
  | PlayerBodyPrimitiveRole
  | PlayerOverlayPrimitiveRole;

export type PlayerPrimitive =
  | {
      role: "selection-halo";
      cx: number;
      cy: number;
      r: number;
      stroke: string;
      strokeWidth: number;
    }
  | {
      role: "hit-area";
      cx: number;
      cy: number;
      r: number;
    }
  | {
      role: "stick-shaft" | "stick-blade";
      points: string;
      stroke: string;
      strokeWidth: number;
      outline: string;
      /** Optional local rotate about shaft grip (possession flick). */
      transform?: string;
    }
  | {
      /** S289 — tiny hip/rear skate oval (under torso). */
      role: "left-skate" | "right-skate";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill: string;
      stroke: string;
      strokeWidth: number;
      transform?: string;
    }
  | {
      role: "torso";
      d: string;
      fill: string;
      stroke: string;
      strokeWidth: number;
    }
  | {
      role: "torso-trim";
      d: string;
      stroke: string;
      strokeWidth: number;
    }
  | {
      role: "left-pad" | "right-pad" | "blocker";
      x: number;
      y: number;
      width: number;
      height: number;
      rx: number;
      /** Local clockwise degrees about pad center; 0 / omitted = axis-aligned. */
      rotationDegrees?: number;
      fill: string;
      stroke: string;
      strokeWidth: number;
    }
  | {
      role: "left-glove" | "right-glove" | "helmet" | "helmet-highlight";
      cx: number;
      cy: number;
      r: number;
      fill: string;
      stroke: string;
      strokeWidth: number;
      /** Optional local SVG transform (S150 head yaw on helmet parts). */
      transform?: string;
    }
  | {
      role: "helmet-visor";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill: string;
      transform?: string;
    }
  | {
      role: "label";
      x: number;
      y: number;
      dy: number;
      text: string;
      fill: string;
      fontSize: number;
      fontWeight: number;
      fontFamily: string;
      dominantBaseline: "central";
      textAnchor: "middle";
    };

/** Label typography — shared Preview / Export. */
export const PLAYER_LABEL_FONT_SIZE = 10.5;
/** @deprecated Labels sit on the jersey — gap unused. */
export const PLAYER_LABEL_GAP = 0;
export const PLAYER_LABEL_DOMINANT_BASELINE = "central" as const;
export const PLAYER_LABEL_DY = -0.55;
export const PLAYER_LABEL_FONT_FAMILY =
  "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
export const PLAYER_LABEL_FONT_WEIGHT = 700;

export const SELECTION_HALO_STROKE_WIDTH = 3.5;
/** @deprecated Prefer PLAYER_VISUAL_GEOMETRY.selectionHaloRadius */
export const SELECTION_HALO_OFFSET = 9;
/** Outer outline width for major body shapes (skater baseline). */
export const PLAYER_STROKE_WIDTH = 1.7;

function stickPolylineLocal(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  return `${x1},${y1} ${x2},${y2}`;
}

/** SVG transform rotating a rect about its center (local body space). */
export function padRectTransformAttribute(
  x: number,
  y: number,
  width: number,
  height: number,
  rotationDegrees: number | undefined,
): string | undefined {
  if (
    rotationDegrees === undefined ||
    !Number.isFinite(rotationDegrees) ||
    Math.abs(rotationDegrees) < 1e-9
  ) {
    return undefined;
  }
  const cx = x + width / 2;
  const cy = y + height / 2;
  return `rotate(${rotationDegrees} ${cx} ${cy})`;
}

/**
 * SVG transform for the body group: pivot = Scene Position.
 * `rotate` is clockwise degrees (SVG), matching domain convention.
 * Optional uniform `scale` enlarges skaters without changing goalie geometry.
 */
export function playerBodyTransformAttribute(
  position: Point,
  rotationDegrees: number = DEFAULT_PLAYER_ROTATION_DEGREES,
  scale: number = 1,
): string {
  const degrees = Number.isFinite(rotationDegrees)
    ? rotationDegrees
    : DEFAULT_PLAYER_ROTATION_DEGREES;
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const scalePart =
    Math.abs(safeScale - 1) > 1e-9 ? ` scale(${safeScale})` : "";
  return `translate(${position.x} ${position.y}) rotate(${degrees})${scalePart}`;
}

export interface BuildPlayerPrimitivesOptions {
  appearance: PlayerRenderAppearance;
  position: Point;
  /** Evaluated rotation degrees (domain). Default 0. */
  rotationDegrees?: number;
  /** Head yaw offset relative to body (S150). Default 0. */
  headYawOffsetDegrees?: number;
  /**
   * Derived possession stick flick (local SVG degrees about shaft grip).
   * Render-only — omit / 0 = rest pose.
   */
  stickSwingDegrees?: number;
  /**
   * S289 — derived skating stride (local hip/rear). Omit = neutral rest.
   * Goalies / stationary resolve to neutral inside the pose helper.
   */
  skateStride?: SkateStridePose | null;
  selected?: boolean;
  /** Include invisible hit circle (Preview only). */
  includeHitArea?: boolean;
  paints?: PlayerMarkerPaints;
}

export interface BuiltPlayerVisual {
  position: Point;
  rotationDegrees: number;
  headYawOffsetDegrees: number;
  stickSwingDegrees: number;
  skateStrideActive: boolean;
  bodyTransform: string;
  /** Local-space body parts (under bodyTransform). */
  body: PlayerPrimitive[];
  /** World-space overlays: halo, upright label, hit area. */
  overlays: PlayerPrimitive[];
}

/**
 * Build body (local) + overlays (world) for one Player.
 */
export function buildPlayerVisual(
  options: BuildPlayerPrimitivesOptions,
): BuiltPlayerVisual {
  const {
    appearance,
    position: anchor,
    selected = false,
    includeHitArea = false,
  } = options;
  const rotationDegrees =
    options.rotationDegrees !== undefined &&
    Number.isFinite(options.rotationDegrees)
      ? options.rotationDegrees
      : DEFAULT_PLAYER_ROTATION_DEGREES;
  const headYawOffsetDegrees =
    options.headYawOffsetDegrees !== undefined &&
    Number.isFinite(options.headYawOffsetDegrees)
      ? options.headYawOffsetDegrees
      : DEFAULT_PLAYER_ROTATION_DEGREES;
  const headLocalTransform =
    Math.abs(headYawOffsetDegrees) > 1e-9
      ? `rotate(${headYawOffsetDegrees})`
      : undefined;
  const stickSwingDegrees =
    options.stickSwingDegrees !== undefined &&
    Number.isFinite(options.stickSwingDegrees)
      ? options.stickSwingDegrees
      : 0;
  const skateStride = options.skateStride ?? createNeutralSkateStridePose();
  const paints = options.paints ?? derivePlayerMarkerPaints(appearance);
  const geom: PlayerVisualGeometry = resolvePlayerVisualGeometry(
    appearance.visual.marker,
    appearance.visual.handedness,
  );
  const isGoalie = appearance.visual.marker === "goalie";
  const bodyScale = isGoalie ? 1 : SKATER_MARKER_VISUAL_SCALE;
  const body: PlayerPrimitive[] = [];
  const overlays: PlayerPrimitive[] = [];

  if (selected) {
    overlays.push({
      role: "selection-halo",
      cx: anchor.x,
      cy: anchor.y,
      r: geom.selectionHaloRadius * bodyScale,
      stroke: paints.selectionHalo,
      strokeWidth: SELECTION_HALO_STROKE_WIDTH,
    });
  }

  const shaft = geom.stick.shaft;
  const stickTransform = stickSwingTransformAttribute(
    shaft.x1,
    shaft.y1,
    stickSwingDegrees,
  );

  body.push({
    role: "stick-shaft",
    points: stickPolylineLocal(shaft.x1, shaft.y1, shaft.x2, shaft.y2),
    stroke: paints.stick,
    strokeWidth: geom.stickStrokeWidth,
    outline: paints.stickOutline,
    ...(stickTransform ? { transform: stickTransform } : {}),
  });
  body.push({
    role: "stick-blade",
    points: stickPolylineLocal(
      shaft.x2,
      shaft.y2,
      geom.stick.blade.x,
      geom.stick.blade.y,
    ),
    stroke: paints.stick,
    strokeWidth: geom.stickStrokeWidth * geom.stickBladeStrokeScale,
    outline: paints.stickOutline,
    ...(stickTransform ? { transform: stickTransform } : {}),
  });

  for (const side of ["left-pad", "right-pad"] as const) {
    const pad = side === "left-pad" ? geom.leftPad : geom.rightPad;
    if (pad) {
      body.push({
        role: side,
        x: pad.x,
        y: pad.y,
        width: pad.width,
        height: pad.height,
        rx: pad.rx,
        rotationDegrees: pad.rotationDegrees,
        fill: paints.padFill,
        stroke: paints.outline,
        strokeWidth: geom.outlineWidth * 0.95,
      });
    }
  }

  // Goalie catcher under the torso so the body reads over the glove (top-down).
  const isGoalieEquipment = geom.blocker != null;
  if (isGoalieEquipment && geom.leftGlove.radius > 0) {
    body.push({
      role: "left-glove",
      cx: geom.leftGlove.offsetX,
      cy: geom.leftGlove.offsetY,
      r: geom.leftGlove.radius,
      fill: paints.jerseyDark,
      stroke: paints.outline,
      strokeWidth: geom.outlineWidth * 0.9,
    });
  }

  // S289 — skates under the torso so they peek from the hip/rear edge (+Y).
  if (!isGoalie) {
    const g = SKATE_STRIDE_GEOMETRY;
    for (const side of ["left-skate", "right-skate"] as const) {
      const pose = side === "left-skate" ? skateStride.left : skateStride.right;
      const transform = skateTransformAttribute(
        pose.x,
        pose.y,
        pose.rotationDegrees,
      );
      body.push({
        role: side,
        cx: pose.x,
        cy: pose.y,
        rx: g.width,
        ry: g.length,
        fill: paints.stick,
        stroke: paints.outline,
        strokeWidth: geom.outlineWidth * 0.75,
        ...(transform ? { transform } : {}),
      });
    }
  }

  body.push({
    role: "torso",
    d: geom.torsoPathLocal,
    fill: paints.jersey,
    stroke: paints.outline,
    strokeWidth: geom.outlineWidth,
  });
  body.push({
    role: "torso-trim",
    d: geom.torsoPathLocal,
    stroke: paints.trim,
    strokeWidth: geom.trimStrokeWidth,
  });

  if (!isGoalieEquipment) {
    for (const side of ["left-glove", "right-glove"] as const) {
      const glove = side === "left-glove" ? geom.leftGlove : geom.rightGlove;
      if (glove.radius <= 0) {
        continue;
      }
      body.push({
        role: side,
        cx: glove.offsetX,
        cy: glove.offsetY,
        r: glove.radius,
        fill: paints.jerseyDark,
        stroke: paints.outline,
        strokeWidth: geom.outlineWidth * 0.9,
      });
    }
  } else if (geom.blocker) {
    body.push({
      role: "blocker",
      x: geom.blocker.x,
      y: geom.blocker.y,
      width: geom.blocker.width,
      height: geom.blocker.height,
      rx: geom.blocker.rx,
      fill: paints.blockerFill,
      stroke: paints.outline,
      strokeWidth: geom.outlineWidth * 0.9,
    });
  }

  body.push({
    role: "helmet",
    cx: geom.helmet.offsetX,
    cy: geom.helmet.offsetY,
    r: geom.helmet.radius,
    fill: paints.helmet,
    stroke: paints.outline,
    strokeWidth: geom.outlineWidth,
    ...(headLocalTransform ? { transform: headLocalTransform } : {}),
  });
  body.push({
    role: "helmet-visor",
    cx: geom.helmetVisor.offsetX,
    cy: geom.helmetVisor.offsetY,
    rx: geom.helmetVisor.radiusX,
    ry: geom.helmetVisor.radiusY,
    fill: paints.helmetVisor,
    ...(headLocalTransform ? { transform: headLocalTransform } : {}),
  });
  body.push({
    role: "helmet-highlight",
    cx: geom.helmetHighlight.offsetX,
    cy: geom.helmetHighlight.offsetY,
    r: geom.helmetHighlight.radius,
    fill: paints.helmetHighlight,
    stroke: "none",
    strokeWidth: 0,
    ...(headLocalTransform ? { transform: headLocalTransform } : {}),
  });

  // Upright editor label at body center (does not rotate with the marker).
  // Empty labels (typical default goalies) are omitted — silhouette is enough.
  if (appearance.label.length > 0) {
    overlays.push({
      role: "label",
      x: anchor.x,
      y: anchor.y,
      dy: PLAYER_LABEL_DY,
      text: appearance.label,
      fill: paints.labelFill,
      fontSize: PLAYER_LABEL_FONT_SIZE * (isGoalie ? 1 : bodyScale),
      fontWeight: PLAYER_LABEL_FONT_WEIGHT,
      fontFamily: PLAYER_LABEL_FONT_FAMILY,
      dominantBaseline: PLAYER_LABEL_DOMINANT_BASELINE,
      textAnchor: "middle",
    });
  }

  if (includeHitArea) {
    overlays.push({
      role: "hit-area",
      cx: anchor.x,
      cy: anchor.y,
      r: geom.hitRadius,
    });
  }

  return {
    position: anchor,
    rotationDegrees,
    headYawOffsetDegrees,
    stickSwingDegrees,
    skateStrideActive: skateStride.active,
    bodyTransform: playerBodyTransformAttribute(
      anchor,
      rotationDegrees,
      bodyScale,
    ),
    body,
    overlays,
  };
}

/**
 * Flat primitive list (body then overlays) for tests that only need roles.
 * Body coordinates are local; overlays are world.
 */
export function buildPlayerPrimitives(
  options: BuildPlayerPrimitivesOptions,
): PlayerPrimitive[] {
  const visual = buildPlayerVisual(options);
  return [...visual.body, ...visual.overlays];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderPrimitiveMarkup(
  p: PlayerPrimitive,
  objectId: string,
): string | null {
  switch (p.role) {
    case "selection-halo":
    case "hit-area":
      return null;
    case "stick-shaft":
    case "stick-blade": {
      const transformAttr = p.transform ? ` transform="${p.transform}"` : "";
      return [
        `<polyline data-player-part="${p.role}" points="${p.points}" fill="none" stroke="${p.outline}" stroke-width="${p.strokeWidth + 1.2}" stroke-linecap="round" stroke-linejoin="round"${transformAttr} />`,
        `<polyline data-player-part="${p.role}" points="${p.points}" fill="none" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${transformAttr} />`,
      ].join("");
    }
    case "left-skate":
    case "right-skate": {
      const transformAttr = p.transform ? ` transform="${p.transform}"` : "";
      return `<ellipse data-player-part="${p.role}" cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"${transformAttr} />`;
    }
    case "left-pad":
    case "right-pad":
    case "blocker": {
      const transform = padRectTransformAttribute(
        p.x,
        p.y,
        p.width,
        p.height,
        p.rotationDegrees,
      );
      const transformAttr = transform ? ` transform="${transform}"` : "";
      return `<rect data-player-part="${p.role}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="${p.rx}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"${transformAttr} />`;
    }
    case "torso":
      return `<path data-player-part="torso" d="${p.d}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linejoin="round" />`;
    case "torso-trim":
      return `<path data-player-part="torso-trim" d="${p.d}" fill="none" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linejoin="round" opacity="0.85" />`;
    case "left-glove":
    case "right-glove":
    case "helmet": {
      const transformAttr = p.transform ? ` transform="${p.transform}"` : "";
      return `<circle data-player-part="${p.role}" cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"${transformAttr} />`;
    }
    case "helmet-highlight": {
      const transformAttr = p.transform ? ` transform="${p.transform}"` : "";
      return `<circle data-player-part="${p.role}" cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}"${transformAttr} />`;
    }
    case "helmet-visor": {
      const transformAttr = p.transform ? ` transform="${p.transform}"` : "";
      return `<ellipse data-player-part="helmet-visor" cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}" fill="${p.fill}"${transformAttr} />`;
    }    case "label":
      return `<text data-object-label="${escapeXml(objectId)}" data-player-part="label" x="${p.x}" y="${p.y}" dy="${p.dy}" text-anchor="${p.textAnchor}" dominant-baseline="${p.dominantBaseline}" font-size="${p.fontSize}" font-weight="${p.fontWeight}" font-family="${escapeXml(p.fontFamily)}" fill="${p.fill}">${escapeXml(p.text)}</text>`;
    default: {
      const _exhaustive: never = p;
      return _exhaustive;
    }
  }
}

/**
 * Deterministic SVG markup for Export (no selection halo / hit area).
 * Body is under one translate+rotate transform; label stays upright.
 */
export function renderPlayerPrimitivesMarkup(
  visual: BuiltPlayerVisual,
  options: {
    objectId: string;
    fillToken: string;
    /** Authored visual.marker — `"goalie"` when goalie silhouette. */
    marker?: string;
  },
): string {
  const markerAttr =
    options.marker === "goalie" ? "goalie" : "hockey-v1";
  const parts: string[] = [
    `<g data-object-id="${escapeXml(options.objectId)}" data-object-type="player" data-player-fill="${escapeXml(options.fillToken)}" data-player-marker="${markerAttr}" data-player-anchor-x="${visual.position.x}" data-player-anchor-y="${visual.position.y}" data-player-rotation="${visual.rotationDegrees}">`,
    `<g data-player-body="true" transform="${visual.bodyTransform}">`,
  ];

  for (const p of visual.body) {
    const markup = renderPrimitiveMarkup(p, options.objectId);
    if (markup) {
      parts.push(markup);
    }
  }

  parts.push(`</g>`);

  for (const p of visual.overlays) {
    const markup = renderPrimitiveMarkup(p, options.objectId);
    if (markup) {
      parts.push(markup);
    }
  }

  parts.push(`</g>`);
  return parts.join("");
}
