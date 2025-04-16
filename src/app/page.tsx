import MapWrapper from "@/components/MapWrapper";
import TrackButton from "@/components/TrackButton";
import GtfsUpdateButton from "@/components/GtfsUpdateButton";

export default function Home() {
  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          <h1 className="text-2xl font-bold">Bus Tracker</h1>
        </div>

        <div className="w-full max-w-5xl flex flex-col items-start gap-4">
          <TrackButton /> {/* Button directly below title */}
          <div className="relative w-full h-[50vh] md:h-[600px] mt-4">
            {" "}
            {/* Adjusted height and margin */}
            <MapWrapper />
          </div>
          <div className="w-full flex flex-col gap-4 mt-4">
            <GtfsUpdateButton />
          </div>
        </div>
      </main>
    </div>
  );
}
