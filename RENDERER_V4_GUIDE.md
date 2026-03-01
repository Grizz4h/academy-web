# Renderer V4: Meta-Scan Implementation

## Overview

Renderer V4 is designed for **Meta-Scan modules** that analyze entire games across three periods. Unlike V1-V3 which focus on shift-by-shift or scene-by-scene analysis, V4 provides a holistic view of game patterns, root causes, and systemic issues.

## Activation

V4 automatically activates for modules where:
- `module_id` starts with `M` (e.g., `M1`, `M2`)
- `module_id` contains `META` (e.g., `E_META`, `META_SCAN`)

See: `frontend/src/components/DrillRendererRouter.tsx`

## Data Structure

V4 stores all data in `answers.meta` with the following structure:

```typescript
{
  meta: {
    // Meta-Scan Axes (1-5 scale per dimension, per period)
    axes: {
      structure: number | null,      // Formation stability
      compactness: number | null,    // Spacing, layers, closing speed
      decision_time: number | null,  // With/without puck - fast or hesitant
      chance_quality: number | null, // For/against - slot vs perimeter
      turnover_pressure: number | null // How often game tips due to turnovers
    },
    
    // Timeline Markers (event log per period)
    timeline: [
      {
        timestamp: string,    // e.g., "5:23" or "Shift #2"
        category: string,     // Turnover, Entry, Exit, Chance, Goal, Penalty, Momentum
        team: string,         // "for" or "against"
        note: string          // Optional description
      }
    ],
    
    // Causal Chains (cause-effect patterns per period)
    chains: [
      {
        cause: string,        // Gap, Bad Exit, Lost F2, Late Backcheck, Bad Change, Other
        trigger: string,      // Turnover, Chip, Stretch Pass, Wall Battle Lost, etc.
        consequence: string   // Rush, Zone Time, Slot Chance, Goal Against, Momentum Shift
      }
    ],
    
    // POST Phase Summary (entire game synthesis)
    postSummary: {
      summary: string,       // 3-sentence game overview
      rootCause: string,     // Top 1 problem identified
      fix: string,           // Top 1 adjustment recommended
      confidence: number     // 1-5 scale: analysis confidence
    }
  }
}
```

## Phase Flow

### PRE Phase
- Introduction to Meta-Scan approach
- Explanation of axes, timeline, and causal chains

### P1, P2, P3 (Period Analysis)
Each period includes:
1. **Meta-Scan Axes** - 5 dimensions rated 1-5 (or null for "unsure")
2. **Timeline Markers** - Event log with timestamps and categories
3. **Causal Chain Builder** - Cause → Trigger → Consequence patterns

### POST Phase
- 3-sentence game summary
- Root cause identification
- Top adjustment recommendation
- Confidence rating (1-5)

## Export Integration

V4 data is automatically included in session exports:

```bash
GET /api/sessions/{session_id}/download?phase=P1
```

Export includes:
- Session metadata (module_id, user, goal, etc.)
- `raw_answers` field containing complete `meta` structure
- All timeline markers and causal chains for the period
- Microfeedback if present

## Compatibility

✅ **Does NOT break existing renderers**
- V1 (A1 modules) - unchanged
- V2 (default/A2+ modules) - unchanged  
- V3 (E-Track modules) - unchanged

✅ **Uses existing session infrastructure**
- Same phase engine (PRE → P1 → P2 → P3 → POST)
- Same checkin/draft storage
- Same export endpoints

✅ **Minimal invasiveness**
- Only 3 new files added
- Router logic extended with one condition
- Export enhanced to include raw_answers fallback

## Testing

To test V4:

1. Navigate to Curriculum and find **M1 – Meta-Scan Novice**
2. Start a session
3. Complete P1 with:
   - Rate all 5 axes
   - Add 1-2 timeline markers
   - Create 1 causal chain
4. Download phase export: `GET /sessions/{id}/download?phase=P1`
5. Verify `raw_answers.meta` contains axes, timeline, and chains

## Future Extensions

Potential V4 enhancements:
- Visual timeline representation
- Axis comparison across periods (P1 vs P2 vs P3)
- Pattern detection (automated chain suggestions)
- Export to CSV for quantitative analysis
- Coach notes integration

## Files Modified/Created

**Created:**
- `frontend/src/renderers/v4/DrillRenderer.tsx`
- `frontend/src/renderers/v4/DrillRenderer.module.css`
- `RENDERER_V4_GUIDE.md`

**Modified:**
- `frontend/src/components/DrillRendererRouter.tsx` - Added V4 routing
- `backend/main.py` - Enhanced export with raw_answers fallback
- `data/academy/curriculum.json` - Added M-Track with M1 module

**Branch:** `RendererV4`
