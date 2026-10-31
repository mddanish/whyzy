"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/app/ui";
import { checkOnDevice, installOnDevice, SPEECH_LANG } from "@/lib/voice/speech";

const MESSAGES: Record<string, string> = {
  available: "Ready. Speech is recognised on this device; the voice never leaves it.",
  downloadable: "The speech model needs a one-time download.",
  downloading: "Downloading the speech model…",
  unavailable: "On-device speech for this language is not available on this device. Your child can type instead.",
  // Checking also saves the result on this device, so child mode knows talking works here.
  unsupported: "This browser cannot recognise speech on the device. Use Chrome 139 or newer on a desktop. Your child can type instead.",
};

// Parent setup (FR-21): check and install the on-device model for the
// profile's input language, on the device the child will use.
export function VoiceCheck({ language }: { language: "en" | "hi" }) {
  const lang = SPEECH_LANG[language];
  const [status, setStatus] = useState<string | null>(null);
  const check = async () => setStatus(await checkOnDevice(lang));
  const install = async () => {
    setStatus("downloading");
    setStatus((await installOnDevice(lang)) ? "available" : await checkOnDevice(lang));
  };
  return (
    <div className="mt-6 rounded-lg border border-black/10 p-3 text-sm dark:border-white/15">
      <p className="mb-2 font-medium">Voice on this device ({language === "hi" ? "Hindi" : "English"})</p>
      {status && <p className="mb-2" role="status">{MESSAGES[status] ?? status}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={check} className={secondaryButtonClass}>Check</button>
        {status === "downloadable" && (
          <button type="button" onClick={install} className={secondaryButtonClass}>Download speech model</button>
        )}
      </div>
    </div>
  );
}
