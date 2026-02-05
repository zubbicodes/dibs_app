# DIBS -- Digital Image Biometric Systems (MVP)

## Overview

DIBS is a biometric-based secure media protection application designed
to prevent unauthorized viewing, misuse, manipulation, deepfake
generation, blackmail, or sharing of sensitive images and videos.

Core principle:

**Media is only visible after successful facial biometric verification
with liveness detection.**

The first release targets **Android (Google Play MVP)**.

------------------------------------------------------------------------

## MVP Goals

-   Validate biometric media locking
-   Prevent unauthorized access and sharing
-   Enable traceability and accountability
-   Deliver a Play Store-ready secure MVP

------------------------------------------------------------------------

## Key Features (Phase One)

### 1. User Authentication & Identity

-   Secure registration and login
-   Firebase Authentication backend
-   Biometric enrollment (Face ID)
-   Identity binding: content linked to verified user

### 2. Biometric Media Access Control (Core)

-   Face recognition + liveness detection
-   Media visible only after verification
-   Content locked to authorized user + device

### 3. Secure Image & Video Viewer

-   In-app protected viewing only
-   No downloads, exports, or sharing
-   Screenshot + screen recording prevention

### 4. Controlled Content Distribution

-   Media delivered only from authorized sources
-   Recipient biometric-bound protection enforced

### 5. User Traceability & Audit Logs

Audit trail captures: - User identity - Access timestamps -
Device/session reference - Verified vs Blocked attempts

### 6. Partial Offline Functionality

-   Limited offline access for previously verified content
-   Re-verification required after defined conditions
-   Secure cloud sync once online

### 7. Compliance-Ready Architecture

-   GDPR-conscious setup
-   Secure encrypted storage practices
-   Foundation ready for future regulatory extensions

------------------------------------------------------------------------

## System Architecture (MVP)

-   Android App (Jetpack Compose UI)
-   Firebase Authentication
-   Firestore Database (users, mediaVault, accessLogs)
-   Firebase Storage (encrypted media files)
-   Optional Cloud Functions for enforcement logic

------------------------------------------------------------------------

## Firestore Database Structure

### users/{userId}

``` json
{
  "fullName": "",
  "email": "",
  "faceEnrollmentStatus": true,
  "deviceId": "",
  "createdAt": "timestamp"
}
```

### mediaVault/{mediaId}

``` json
{
  "assignedToUserId": "",
  "type": "image|video",
  "fileUrl": "",
  "encrypted": true,
  "locked": true,
  "createdAt": "timestamp"
}
```

### accessLogs/{logId}

``` json
{
  "userId": "",
  "mediaId": "",
  "eventType": "VERIFIED|BLOCKED",
  "deviceId": "",
  "timestamp": "timestamp"
}
```

------------------------------------------------------------------------

## Delivery Timeline (6--8 Weeks)

  Week   Phase
  ------ -------------------------------------
  1--2   Setup + Auth + Enrollment
  3--4   Core Media Lock + Viewer
  5--6   Logs + Offline Mode
  7--8   Compliance + Testing + Play Release

------------------------------------------------------------------------

## Final MVP Deliverables

-   Android App (Play Store Ready)
-   Biometric + Liveness Protected Viewer
-   Secure Media Vault
-   Audit Logging System
-   Partial Offline Support
-   GDPR-Ready Foundation
-   Full Documentation + Handover

------------------------------------------------------------------------

## Future Enhancements (Post-MVP)

-   Multi-user secure sharing
-   Admin portal for content assignment
-   Evidence-grade forensic watermarking
-   AI deepfake detection
-   iOS release

------------------------------------------------------------------------

## License

Private MVP build for client delivery.
