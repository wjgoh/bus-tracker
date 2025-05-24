import MapWrapper from "@/components/map/MapWrapper";
import { BusTrackerSidebar } from "@/components/layout/sidebar/SidebarContent";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* GtfsLoader will trigger data fetch on every page load */}
      <BusTrackerSidebar />
      <SidebarInset className="flex-1 relative">
        <main className="absolute inset-0">
          <MapWrapper />
        </main>
      </SidebarInset>
    </div>
  );
}
