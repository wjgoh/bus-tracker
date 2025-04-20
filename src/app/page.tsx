import MapWrapper from "@/components/MapWrapper";
import { BusTrackerSidebar } from "@/components/SidebarContent/SidebarContent";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <>
      <BusTrackerSidebar />
      <SidebarInset>
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
          <div className="w-full max-w-5xl flex flex-col items-start gap-4">
            <div className="relative w-full h-[50vh] md:h-[600px]">
              <MapWrapper />
            </div>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
