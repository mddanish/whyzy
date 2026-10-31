# Free OpenRouter models (test phase only)

Checked 2026-10-31 with `npm run models:free`. Made-up prompt only. Free models may keep prompts for training: never use them with real children's data.

| Model | Works | Valid JSON | ms | Note |
|---|---|---|---|---|
| `cohere/north-mini-code:free` | yes | yes | 985 |  |
| `dots-studio/dots-3-note-preview:free` | yes | yes | 8642 |  |
| `google/gemma-4-26b-a4b-it:free` (blocked: Gemini/Google terms) | no | - | 180 | 429 Provider returned error |
| `google/gemma-4-31b-it:free` (blocked: Gemini/Google terms) | no | - | 205 | 429 Provider returned error |
| `google/lyria-3-clip-preview` (blocked: Gemini/Google terms) | no | - | 31 | 402 Insufficient credits. This account never purchased credits. Make sure your key is on the correct account or org, and if  |
| `google/lyria-3-pro-preview` (blocked: Gemini/Google terms) | no | - | 42 | 402 Insufficient credits. This account never purchased credits. Make sure your key is on the correct account or org, and if  |
| `liquid/lfm-2.5-2.6b:free` | no | - | 72 | 429 Provider returned error |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | yes | yes | 1496 |  |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | yes | yes | 6600 |  |
| `nvidia/nemotron-3.5-content-safety:free` | no | - | 72 | 404 Provider returned error |
| `nvidia/nemotron-3.5-lightning:free` | yes | yes | 5018 |  |
| `nvidia/nemotron-3.5-super-vl:free` | yes | yes | 2057 |  |
| `openrouter/free` | yes | yes | 10143 |  |
| `recursive/flint-v1.0:free` | no | - | 205 | 503 Provider returned error |
| `thinkingmachines/inkling-small:free` | no | - | 66 | 403 thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or produ |
| `thinkingmachines/inkling:free` | no | - | 38 | 403 thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivit |
| `xingchen-agi/xing4.0-29b-a4b:free` | no | - | 2425 | 429 Provider returned error |
