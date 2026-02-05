# DIBS – Digital Image Biometric Systems
## Design Specification (Android - Light Theme)

### 1. Visual Identity & Theme
- **Style:** Professional, Minimal, Compact, and Security-Focused.
- **Theme:** Light Theme.
- **Color Palette:**
  - Primary: Deep Blue `#0A2E65` (Text, Primary Buttons, Branding)
  - Accent: Teal/Cyan `#00C2D1` (Status indicators, Secondary actions)
  - Background: Pure White `#FFFFFF`
  - Secondary Background: Light Gray `#F8F9FA`
  - Success: Emerald Green `#27AE60`
  - Danger: Soft Red `#EB5757`
- **Typography:**
  - Modern Sans-Serif (e.g., Inter or Roboto).
  - Compact letter spacing.
  - Headings: Bold, Semi-bold for high hierarchy.
  - Body: Medium weight for readability.

### 2. Global UI Components
- **Corners:** 16px to 20px radius for cards and buttons.
- **Shadows:** Very soft, subtle elevation (Low blur, 5-10% opacity).
- **Inputs:** Minimalist with thin 1px borders or light gray background fills.
- **Navigation:** Bottom navigation bar with 4 minimalist line-art icons.

### 3. Screen Specifications

#### 3.1 Splash & Onboarding
- **Splash:** White background, centered Deep Blue logo, small subtitle in compact caps.
- **Onboarding:** 3-step carousel. Thin-line illustrations. Minimal text. Airy white space.

#### 3.2 Authentication
- **Login:** Clean input fields for email/password. Single primary button "Login Securely". Minimalist link for account creation.
- **Face Enrollment:** Circular viewfinder (thin frame). Progress ring during liveness detection. Text-based instructions: "Blink," "Turn Head."

#### 3.3 Dashboard & Media
- **Home:** Header with shield icon ("Protection Active"). Compact cards for Image and Video counts. "Recent Activity" list below.
- **Media Vault:** Grid view. **Critical:** Every thumbnail must have a heavy "frosted glass" blur effect and a center lock icon until verified.
- **Secure Viewer:** Fullscreen image (after unlock). Overlay watermark: "Protected by DIBS". Disable screenshots and sharing.

#### 3.4 Security Flow (Core Feature)
- **Identity Verification Modal:** Triggers on vault item tap. White card popup. Face scan animation. 
- **States:** 
  - *Success:* Green checkmark + "Access Granted".
  - *Failure:* Red icon + "Access Denied - Unauthorized User".

#### 3.5 Logs & Settings
- **Audit Logs:** Tabular list. Green/Red status icons. Modern, tight typography for timestamps and device IDs.
- **Settings:** Grouped sections (Account, Security, Privacy). Clean toggles. Red outline button for Logout.

### 4. Technical Rules for Developer
- **Security:** Implement `FLAG_SECURE` on the Media Viewer screen to prevent system-level screenshots.
- **Biometrics:** Logic should require "Liveness Detection" (e.g., blink or head movement) during enrollment and verification.
- **Vault:** No media should be cached or previewed in an unencrypted/unblurred state.
You can copy this into a file named design.md in your project root, and then tell your IDE: "Read design.md and help me implement the Home Dashboard and Media Vault components using these styles."

design : https://stitch.withgoogle.com/projects/13923926541348017262

