/** Browser-side calls to the log API. */

export async function removeLogEntryRequest(id: number): Promise<void> {
  const response = await fetch(`/api/log/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Couldn't remove that entry. Try again.");
}
