import { Label, LabelsResponse, getLabels } from "forta-agent";
import { SCAMMER_BOT_ID } from "./constants";

export async function isScammer(address: string): Promise<boolean> {
    try {
        const results: LabelsResponse = await getLabels({
            entities: [address],
            sourceIds: [SCAMMER_BOT_ID],
            labels: ["scammer"]
        });

        if (results.labels && results.labels.length > 0) {
            console.log('Label found for address:', address);
            return true; // Return true indicating successful label fetching
        } else {
            console.log(results)
            console.log('no label found for:', address)
            return false; // Return false if the label is not present or null
        }
    } catch (error) {
        console.error('An error occurred during label fetching:', error);
        return false; // Return false indicating failed label fetching
    }
}