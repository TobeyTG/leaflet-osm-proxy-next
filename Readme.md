# Leaflet OSM Proxy Next

**A GDPR-compliant, filesystem-caching OpenStreetMap proxy for Next.js App Router.**

## Why use this?

Using standard OpenStreetMap (OSM) tile servers (`tile.openstreetmap.org`) in your application exposes your users' IP addresses to third-party servers immediately upon loading the map. Under GDPR (DSGVO), this usually requires a **Cookie Banner** or a "Click-to-Load" consent overlay.

**This package solves that problem:**

1.  **Proxy:** It routes all tile requests through _your_ Next.js server.
2.  **Privacy:** OSM only sees your server's IP, not your users'. No consent banner needed!
3.  **Cache:** It saves tiles to your local disk. Subsequent requests are instant and don't hit OSM servers (respecting their usage policy).

---

## Installation

```bash
# Using npm
npm install leaflet-osm-proxy-next
```

1. Create the API Route (Server-Side)
   Create a dynamic route handler in your Next.js App Router to handle the proxying.

   **File:** app/api/tiles/[z]/[x]/[y]/route.ts

```typescript
import { createTileProxyHandler } from "leaflet-osm-proxy-next";
export const GET = createTileProxyHandler({
  userAgent: "LeafletOSMProxy/1.0", // Customize your User-Agent
  cacheFolder: "tile-cache",        // Folder to store cached tiles
});
```

2. Configure the Map (Client-Side)
   Point your Leaflet TileLayer to your new API route instead of the official OSM server.

   **File**: components/Map.tsx

```typescript
"use client";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MyMap() {
  return (
    <MapContainer center={[52.52, 13.4]} zoom={13} scrollWheelZoom={false}>
      <TileLayer url="/api/tiles/{z}/{x}/{y}" />
    </MapContainer>
  );
}
```

3. Update .gitignore Since this package saves images to your disk, you should ignore the cache folder so you don't commit thousands of PNG files to Git.

   **File:** .gitignore

```
# ... other ignores
tile-cache/
```

## ⚠️ Deployment Notice

This package relies on the Local Filesystem (fs) to cache images.

✅ Works perfectly on:

- VPS / Virtual Machines (DigitalOcean, Hetzner, EC2)

- Docker Containers (Coolify, Railway with Volumes, Portainer)

- Self-Hosted Next.js

❌ Does NOT work well on:

- Serverless Environments (Vercel, Netlify, AWS Lambda)

## 📝 License

[MIT License](LICENSE.md)

Made by [TobeyTG](https://tobeytg.de/) ✌️
