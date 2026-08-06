# Nodamic | Unthink the Ordinary

Welcome to the **Nodamic** brand website. This repository contains the source code for our immersive, interactive 3D product showcase built to introduce our flagship device: **Node 1**.

Our design philosophy focuses on unthinking the ordinary, combining luxury hardware aesthetics, moody cinematic lighting, and state-of-the-art WebGL engineering to deliver a premium interactive experience directly in the browser.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **3D Engine**: [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- **3D Utilities**: [@react-three/drei](https://github.com/pmndrs/drei)
- **Post-Processing**: [@react-three/postprocessing](https://docs.pmnd.rs/react-three-postprocessing/introduction)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Bundler**: [Vite](https://vitejs.dev/)

## ⚡ Features

- **Interactive 3D Hardware**: Inspect Node 1 in real-time. The product natively reacts to cursor movement via responsive pointer-tracking mathematics.
- **Cinematic Rendering**: Implements high-end photography techniques including physical material roughness overrides, HDR image-based lighting, baked contact shadows, and bespoke Post-Processing pipelines (Bloom, Tone Mapping, SMAA, Film Grain, Vignette).
- **Runtime Performance Engineered**: Optimized `frameloop` rendering, minimal React state churn, rigorous garbage collection, and dynamic Device Pixel Ratio (DPR) scaling guarantees a locked 60 FPS experience across high-end desktops and standard laptops.
- **Strict Asset Synchronization**: Custom loading pipelines ensure the entire scene (GLB geometry, HDR maps, WebFonts) remains hidden until fully buffered, triggering a unified, perfectly timed cinematic entrance.

## 🛠️ Development

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v20+ recommended).

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser to view the application.

### Building for Production

Compile a highly optimized, minified production build:

```bash
npm run build
```

You can preview the built static output using:

```bash
npm run preview
```

## 📜 License

© Nodamic. All rights reserved.
