# After Project Photocopy

**Digital file receiving system for photocopy and print shops.**

Customers scan a QR code, upload their files, add a note, and receive a request code. The shop side manages incoming requests, downloads files, updates print status, and displays the upload QR.

## Core flow

Customer → Scan QR → Upload → Send → Request code → Operator receives → Print → Complete

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Important architecture note

The current browser data layer uses IndexedDB plus BroadcastChannel. This is reliable for a same-device browser demo, but **it is not a cross-device production backend**. For a real shop deployment, connect `src/lib/db.ts` to a shared API/database so a customer's phone and the operator computer share the same request data and uploaded files.

## Project identity

After Project Photocopy is intentionally positioned as a lightweight digital file receiving workflow for print/copy shops—not a full marketplace.
