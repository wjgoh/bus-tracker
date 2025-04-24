> crazy this is all ai generated 🗣️

# Bus Tracker Application

A real-time bus tracking application built with Next.js, React, and Leaflet for interactive mapping.

## Features

- Interactive map display using Leaflet
- Real-time bus tracking functionality
- Modern UI built with shadcn/ui components
- Responsive design for all device sizes

## Technologies Used

- Next.js 15
- React 19
- Leaflet for mapping
- shadcn/ui for UI components
- Tailwind CSS for styling

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

The project follows a feature-based directory structure for better maintainability:

### Key Directories:

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - React components organized by feature
  - `src/components/map/` - Map-related components (Map, BusStops, RouteShape)
  - `src/components/layout/` - Layout components including sidebar
  - `src/components/ui/` - Reusable UI components from shadcn/ui
- `src/lib/` - Utilities and services
  - `src/lib/gtfs/` - GTFS data processing utilities
  - `src/lib/api/` - API service functions
- `src/hooks/` - Custom React hooks
- `src/store/` - Zustand state management
- `src/rapid_bus_mrtfeeder/` - GTFS data for MRT feeder buses
- `src/rapid_bus_kl/` - GTFS data for Rapid Bus KL

### Key Files:

- `src/app/page.tsx` - Main application page
- `src/components/map/MapWrapper.tsx` - Map container component
- `src/components/map/Map.tsx` - Interactive map with bus positions
- `src/components/TrackButton.tsx` - Bus tracking controls
- `src/lib/api/gtfsService.ts` - Centralized service for GTFS data handling

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to a GitHub repository
2. Import the repository into Vercel
3. Vercel will automatically detect and configure the Next.js application

For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
