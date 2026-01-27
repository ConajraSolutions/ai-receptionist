import Vapi from "https://esm.sh/@vapi-ai/web";

const apiKey = window.__VAPI_PUBLIC_KEY__;
const assistantId = window.__VAPI_ASSISTANT_ID__;

const vapi = new Vapi(apiKey);

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

function log(line) {
  logEl.textContent += line + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

startBtn.onclick = async () => {
  statusEl.textContent = "starting...";
  startBtn.disabled = true;
  stopBtn.disabled = false;

  vapi.start(assistantId);
};

stopBtn.onclick = () => {
  vapi.stop();
};

vapi.on("call-start", () => {
  statusEl.textContent = "in call";
  log("[call-start]");
});

vapi.on("call-end", () => {
  statusEl.textContent = "idle";
  startBtn.disabled = false;
  stopBtn.disabled = true;
  log("[call-end]");
});

vapi.on("message", (m) => {
  if (m.type === "transcript") {
    log(`${m.role}: ${m.transcript}`);
  } else if (m.type) {
    // useful for debugging
    // log(`[message:${m.type}] ${JSON.stringify(m)}`);
  }
});
