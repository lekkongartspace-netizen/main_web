const GITHUB_API = "https://api.github.com";

interface PinEntry {
  name: string;
  pin: string;
  role: "admin" | "user";
}

function decodeBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString("utf-8");
  }
  return new TextDecoder().decode(
    Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
  );
}

function encodeBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return btoa(
    Array.from(new TextEncoder().encode(str))
      .map((b) => String.fromCharCode(b))
      .join("")
  );
}

async function getFileFromGitHub(): Promise<{ content: PinEntry[]; sha: string }> {
  const res = await fetch(
    GITHUB_API + "/repos/" + process.env.GITHUB_OWNER + "/" + process.env.GITHUB_REPO + "/contents/" + process.env.GITHUB_PINS_PATH,
    {
      headers: {
        Authorization: "Bearer " + process.env.GITHUB_TOKEN,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    if (res.status === 404) {
      return { content: [], sha: "" };
    }
    throw new Error("GitHub API error: " + res.status);
  }

  const data = await res.json();
  const decoded = decodeBase64(data.content);
  return { content: JSON.parse(decoded), sha: data.sha };
}

async function saveFileToGitHub(content: PinEntry[], sha: string): Promise<void> {
  const encoded = encodeBase64(JSON.stringify(content, null, 2));

  const body: Record<string, string> = {
    message: "Update pins.json",
    content: encoded,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    GITHUB_API + "/repos/" + process.env.GITHUB_OWNER + "/" + process.env.GITHUB_REPO + "/contents/" + process.env.GITHUB_PINS_PATH,
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + process.env.GITHUB_TOKEN,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error("GitHub save error: " + res.status + " " + err);
  }
}

export async function getPins(): Promise<PinEntry[]> {
  const { content } = await getFileFromGitHub();
  return content;
}

export async function verifyPin(pin: string): Promise<PinEntry | null> {
  const pins = await getPins();
  return pins.find((p) => p.pin === pin) || null;
}

export async function savePins(pins: PinEntry[]): Promise<void> {
  const { sha } = await getFileFromGitHub();
  await saveFileToGitHub(pins, sha);
}
