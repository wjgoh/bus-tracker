import { fetchAndUnzipGtfsData } from "@/utils/fetchGtfsData";

export async function GtfsDataLoader() {
  // This runs on the server for each request
  await fetchAndUnzipGtfsData();

  // This component doesn't render anything
  return null;
}
