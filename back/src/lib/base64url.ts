const toBinaryString = (bytes: Uint8Array) => {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return binary;
};

export const encodeBase64Url = (bytes: Uint8Array): string => {
	const base64 =
		typeof btoa === "function"
			? btoa(toBinaryString(bytes))
			: // Node.js without a global btoa.
				Buffer.from(bytes).toString("base64");

	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const decodeBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
	const padding = (4 - (base64.length % 4)) % 4;
	const binary =
		typeof atob === "function"
			? atob(base64 + "=".repeat(padding))
			: Buffer.from(base64 + "=".repeat(padding), "base64").toString(
					"binary",
				);

	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
};
