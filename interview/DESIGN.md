# AI Essentials — Liquid Glass Design System (Dark)

The visual language for the AI interview page and the Interview Hub. Dark-first, built from layered translucent "liquid glass" surfaces that float over a slowly drifting aurora.

---

## 1. Principles

1. **Depth over decoration.** Every surface sits on a z-layer: void → aurora → glass → content → light. Nothing is flat.
2. **Light is a material.** Glass shows refraction (blur + saturation), a bright top edge (specular), a soft rim, and a light that follows the cursor.
3. **Calm motion.** Springy for touch feedback, slow and ambient for the background. No motion when the user has asked for less.
4. **Two voices of type.** A clean grotesk for UI and a serif italic for the emotional accent words (*Janani*, *you*, *Hub*).
5. **Bilingual by default.** Tamil script renders in Noto Sans Tamil next to the Latin text.

---

## 2. Color tokens

| Token | Value | Use |
|---|---|---|
| `--void` | `#04050a` | Page base |
| `--ink` | `#f5f6fb` | Primary text |
| `--ink-2` | `rgba(245,246,251,.72)` | Body text |
| `--ink-3` | `rgba(245,246,251,.48)` | Secondary / meta |
| `--ink-4` | `rgba(245,246,251,.28)` | Placeholder / fine print |
| `--violet` | `#8b7bff` | Brand accent, focus ring |
| `--iris` | `#5b8cff` | "Recommended" |
| `--aqua` | `#4fe3c1` | Success, live, "Strongly Recommended", user voice |
| `--amber` | `#ffb86b` | "Needs Another Round", score band |
| `--rose` | `#ff6b8b` | Recording dot, End call |
| WhatsApp | `#25d366` | WhatsApp actions only |

**Aurora blobs** (screen-blended, `blur(90px)`): violet `#5a3dff`, cyan `#0fb5ff`, coral `#ff7a59`, magenta `#ff4fd8`, each 18–55% opacity, drifting 22–34 s.

**Accent gradient** (headlines and score ring): `#c9c1ff → #8fd8ff → #ffd3a1 → #ff9fb6`.

---

## 3. The liquid glass primitive

```css
.glass{
  background: linear-gradient(145deg, rgba(255,255,255,.115), rgba(255,255,255,.045) 42%, rgba(255,255,255,.025));
  backdrop-filter: blur(34px) saturate(190%) brightness(1.06);
  border-radius: 32px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.34),   /* specular top edge */
    inset 0 -1px 0 rgba(255,255,255,.06),  /* bottom bounce light */
    0 12px 30px -8px rgba(0,0,0,.55),      /* contact shadow */
    0 40px 90px -20px rgba(0,0,0,.65);     /* ambient lift */
}
```

The other layers:
- **Rim** (`::before`): a 1px gradient border, made with a mask, that is bright at the top-left and bottom-right and fades out in between, like light catching a glass edge.
- **Cursor light** (`::after`): a 420px radial glow that follows the pointer (`--mx`, `--my`) and fades in on hover.
- **Sheen** (`.sheen`): a soft curved highlight across the top third.
- **Grain**: animated fractal noise at 6–7% opacity over everything, so gradients never band.

**Wells** (inputs and tracks) are the inverse of glass: a dark recessed fill (`rgba(0,0,0,.32→.18)`) with an inner shadow and a 1px hairline. When focused they get a violet ring plus a glow.

---

## 4. Typography

| Role | Font | Size / weight | Tracking |
|---|---|---|---|
| Display | Geist | 40–76px / 500 | −0.045em |
| Accent word | Instrument Serif *Italic* | inherits | −0.02em, gradient fill |
| Heading | Geist | 17–34px / 500 | −0.02 to −0.04em |
| Body | Geist | 15–17px / 300–400 | −0.005em |
| Label / meta | Geist | 11–12.5px / 500 | +0.08em, uppercase for eyebrows |
| Tamil | Noto Sans Tamil | matches the Latin size | — |

Numbers use `font-variant-numeric: tabular-nums`.

---

## 5. Radius, spacing, elevation

- Radius: `32` cards · `22` tiles · `16` wells · `14` rows · `999` pills and buttons.
- Spacing scale: 6 · 8 · 10 · 14 · 18 · 22 · 26 · 30 · 48.
- Elevation: glass cards carry both the contact and ambient shadow. Inline chips use the inner hairline only.

---

## 6. Components

**Buttons**
- **Primary** (`.cta` / `.btn.light`): a white-to-lavender pill with a white top highlight, a faint violet inner glow and a violet drop glow. It plays a slow light sweep every 3.6 s.
- **Ghost**: a glass pill with a hairline border.
- **WhatsApp**: a green gel pill (`#5cf08f → #22c35e`) with dark green text. The soft variant is a green-tinted glass pill.
- **End call**: a rose gel pill. The first tap arms it, the second tap ends the call.

**Segmented control:** a recessed track with a sliding glass "thumb" that moves on a spring (`cubic-bezier(.34,1.56,.64,1)`).

**Status pills:** a tinted fill plus a glowing 6px dot in the same color.

**Voice orb (live screen):**
1. A spinning conic core (violet → cyan → aqua → amber → rose), `blur(22px)`, one turn every 7 s.
2. A counter-rotating overlay of light and shadow.
3. A glass lens highlight, top-left.
4. A rim glow.
5. An aura and two ripple rings behind the orb.

The orb scales by up to 22% with voice volume, and the aura by up to 45%. When the agent is listening, the core shifts to aqua/blue and slows to 12 s per turn.

**Captions:** the agent's lines appear as glass bubbles, the candidate's as aqua-tinted glass. New bubbles pop in on a spring. The list fades out at the top.

**Score ring:** a 12px stroke on a `rgba(255,255,255,.08)` track, with a violet → cyan → aqua gradient and a drop glow.

---

## 7. Motion

| Token | Curve | Use |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | Screen transitions, fades |
| `--spring` | `cubic-bezier(.34,1.56,.64,1)` | Taps, thumbs, bubbles, toasts |

- Screen enter: 0.7 s rise of 14px, scale from .985, blur from 6px to 0.
- Ambient: aurora drift 22–34 s, grain 1.2 s in steps, live dot ping 2 s.
- `prefers-reduced-motion`: all animation and transitions are switched off.

---

## 8. Accessibility

- Body text contrast is at least 4.5:1 on the darkest glass. Secondary text is never used for actions.
- Focus is always visible (violet ring plus glow).
- The language control uses `role="radiogroup"` and `aria-checked`, and captions are an `aria-live` region.
- Tap targets are at least 44px. Safe-area insets are respected on iOS.

---

## 9. Files

- `interview/index.html`: the candidate interview page (welcome → live → done).
- `interview/elevenlabs-client.js`: a bundled copy of the voice SDK (no CDN dependency).
- The Interview Hub is a Claude artifact built with the same tokens.
