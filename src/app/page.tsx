import MapWrapper from "@/components/MapWrapper";
import TrackButton from "@/components/TrackButton";

export default function Home() {
  return (
    <div>
      <main className="flex min-h-screen flex-col items-center p-12 md:p-24 gap-12">
        {/* Container for Title, Button, and Map */}
        {/* Changed items-center to items-start here */}
        <div className="w-full max-w-5xl flex flex-col items-start gap-4">
          <h1 className="text-4xl font-bold">Bus Tracker</h1> {/* Title */}
          <TrackButton /> {/* Button directly below title */}
          <div className="relative w-full h-[50vh] md:h-[600px] mt-4">
            {" "}
            {/* Adjusted height and margin */}
            <MapWrapper />
          </div>
        </div>

        {/* Container for Deploy/Docs Links */}
      </main>
    </div>
  );
}
