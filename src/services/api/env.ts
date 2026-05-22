export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
};

if (!env.apiUrl) {
  console.warn("NEXT_PUBLIC_API_URL não foi definida.");
}
