# Socrates: sở hữu AI riêng — kiến trúc và trạng thái 19/10/2026

**Trạng thái chính xác:** Socrates Web/PWA **2.3.0** có mã kết nối AI tạo sinh theo tùy chọn; **chưa có nhà cung cấp/model online hoạt động mặc định**. Việc đẩy mã lên GitHub Pages không triển khai gateway hay cấp GPU/API key. Nếu chưa cấu hình server HTTPS, Socrates vẫn chỉ dùng bộ suy luận cục bộ.

## Hai nguồn GitHub được đối chiếu

| Nguồn | Thực chất | Quyết định |
| --- | --- | --- |
| [ai-for-developers/awesome-ai-coding-tools](https://github.com/ai-for-developers/awesome-ai-coding-tools) | Danh mục AI code editors/agents/testers/SDK; không phải mô hình ngôn ngữ | Dùng lựa chọn công cụ phát triển, **không nhúng cả danh sách vào app** |
| [moeru-ai/airi](https://github.com/moeru-ai/airi) — **MIT** | Nhân vật AI sở hữu cá nhân: hội thoại, Live2D/VRM, voice, avatar, Web/PWA/desktop và kết nối model/game tools | Dùng **thiết kế tham khảo**, giữ giao diện Socrates nhỏ gọn. Không sao chép toàn bộ AIRI hoặc nói đã tích hợp AIRI runtime |
| [moeru-ai/xsai](https://github.com/moeru-ai/xsai) — **MIT** | SDK mô hình nhỏ, tách giao thức OpenAI Responses/Chat Completions/Anthropic | Học cách **tách protocol khỏi provider**, viết adapter độc lập, không chép thư viện hay bắt app tải cả monorepo |

## Kiến trúc đã tạo

```text
User → Socrates character/PWA
        ├─ Local SS9 knowledge, OCR & build constraints, rotation calculator
        └─ [Explicit AI mode + every-message JSON preview + consent]
                      ↓ HTTPS /chat
          Private model gateway (gateway/start.mjs + handler.mjs)
                     [access-token, origin filter, rate limit]
                      ↓
          Provider adapter (gateway/providers.mjs)
             ├─ Gemini API (server secret)
             └─ OpenAI-compatible endpoint
                (self-hosted model/proxy, HTTPS or loopback to gateway)
```

* Web bridge: `web-ai-bridge.js` stores gateway endpoint, temporary access token, and six recent text turns **only in RAM**, disconnect clears all, and in-flight answers become invalid when session is cleared. `index.html` uses a hidden password input panel and per-message `window.confirm` showing the **exact JSON** (without access token). No automatic screenshot, OCR dump, image memory or game files sent.
* Gateway: `gateway/providers.mjs` supports two server-controlled providers with no new npm dependency. `gateway/handler.mjs` sanitizes question, game context, OCR facts and up to six previous turns, while rejecting client-supplied provider URL, keys and arbitrary hidden fields.
* The AI prompt now identifies **Socrates** and its Soul Knight Prequel role. Official patch claims remain scoped and dated; only a model provider can generate free-form answers. Without one, no generative capability.
* The browser is **not** permitted to set the model's direct API key; `SOCRATES_AI_API_KEY` and `GEMINI_API_KEY` must remain environment variables on the server. The browser's temporary `LINH_ACCESS_TOKEN` grants access to *one gateway*, not directly to a model vendor.
* Built-in rule explanations and local numerical calculations stay available, and the online text mode does not claim to interpret images.

## Server configuration (do not paste secrets into chat/GitHub)

1. Deploy the **gateway/** folder as an HTTPS Node 20+ service you control (Render Free, private VPS, homelab with reverse proxy; resource and pricing obligations must be reviewed by owner).
2. Always set `LINH_ACCESS_TOKEN=<long random private value>` and `LINH_ALLOWED_ORIGIN=https://hoaianhdoan0209-hue.github.io` on **server only**.
3. For the existing provider: `SOCRATES_AI_PROVIDER=gemini`, `GEMINI_MODEL=<model you are actually entitled to use>`, `GEMINI_API_KEY=<key from an authorized free-tier project>`. Do not enable billing without explicit owner approval. Check provider policy: free-tier data may be processed under that tier's terms.
4. For an independently operated OpenAI-compatible service: `SOCRATES_AI_PROVIDER=openai-compatible`, `SOCRATES_AI_MODEL=<installed model ID>`, `SOCRATES_AI_BASE_URL=https://your-trusted-model-host/v1/`. Set `SOCRATES_AI_API_KEY` only if that server requires a key. An Ollama instance on the **same machine as the gateway** may use loopback `http://127.0.0.1:11434/v1/`, but a public Render container **cannot see your laptop's localhost**.
5. Open [Socrates Web](https://hoaianhdoan0209-hue.github.io/Linh-Ai/), tap **Kết nối AI riêng**, enter the HTTPS gateway `https://YOUR-GATEWAY/chat` and the gateway access token. Never enter the provider API key. Every text turn requires reviewing the exact outbound JSON before it is sent; choose Cancel to keep local-only answer.
6. To disconnect and clear temporary chat context, type **tắt AI riêng**. **Xóa hội thoại** clears AI history plus local transient build context; it does **not** automatically erase locally saved game notes, as shown in the existing app.

## Security and remaining gaps

- A shared static GitHub Pages site cannot safely hold a secret paid API token or authenticate each stranger by itself. This gateway is for personal use, with a separate access password and basic rate limiting; not production multi-tenant auth.
- No provider/model connected = no external model inference. No image vision through this gateway. Actual avatar animation is still the existing Socrates CSS avatar, **not** AIRI Live2D/VRM.
- Full multimodal image processing requires explicit per-image consent, preview/redaction, a compatible vision model and regression tests on real Soul Knight Prequel screenshots. It must not auto-upload images from the user's device.
- AI responses can hallucinate outdated SS9 mechanics; before recommending a build, reconcile model replies against verified patch source + prerequisite graph and controlled in-game measurements.
- Running a full local model consumes hardware/RAM/power; self-hosting does not imply zero cost, zero latency or owning underlying third-party weights. Choose a model with a license that permits your use.
- CI tests fake upstream calls; they **do not** prove a real model is online, free, trained from scratch, or empirically correct about gameplay.

## Acceptance

- [x] Optional secure server-side model adapter (Gemini and OpenAI-compatible)
- [x] Web chat can opt in and connect with one-session credentials
- [x] Every remote call requires explicit data preview/consent
- [x] Offline local answer remains available and receives no keys
- [x] Test mocks enforce origin/auth, bounded history, no screenshots, provider URL validation
- [ ] Configure owner-controlled HTTPS gateway and lawful model credentials
- [ ] Verify actual 5–10-turn conversations on iPhone/Safari
- [ ] Add consented multimodal screenshot understanding against a labeled game dataset
- [ ] Empirically validate skill/gear reasoning and damage against actual SS9 game logs
- [ ] Optionally port richer AIRI character animation while preserving performance and licensing
