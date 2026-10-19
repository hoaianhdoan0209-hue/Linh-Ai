"""Linh private RTMP proof-of-concept: frame RAM -> on-device? NO, cloud OCR -> short Discord.
Never records streams, screenshots, raw OCR, player usernames or Discord credentials.
Requires: STREAM_KEY, STATUS_TOKEN; optional DISCORD_WEBHOOK_URL (private env only).
"""
from __future__ import annotations

import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
import re
import subprocess
import threading
import time
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen

STREAM_KEY = os.environ.get("STREAM_KEY", "")
STATUS_TOKEN = os.environ.get("STATUS_TOKEN", "")
WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "")
PORT = int(os.environ.get("PORT", "8080"))
COOLDOWN_SECONDS = 90
FRAME_SECONDS = 6
MAX_PNG_BYTES = 3 * 1024 * 1024
MAX_OCR_CHARS = 5000

DISCORD_ALLOWED_HOSTS = {"discord.com", "discordapp.com"}


def check_environment() -> None:
    if not re.fullmatch(r"[A-Za-z0-9_-]{24,90}", STREAM_KEY):
        raise RuntimeError("STREAM_KEY must be a random 24–90 character URL-safe secret")
    if not re.fullmatch(r"[A-Za-z0-9_-]{24,90}", STATUS_TOKEN):
        raise RuntimeError("STATUS_TOKEN must be a DIFFERENT random URL-safe secret")
    if hmac.compare_digest(STREAM_KEY, STATUS_TOKEN):
        raise RuntimeError("STREAM_KEY and STATUS_TOKEN must differ")
    if WEBHOOK_URL:
        u = urlsplit(WEBHOOK_URL)
        if (u.scheme != "https" or u.hostname not in DISCORD_ALLOWED_HOSTS
                or not re.fullmatch(r"/api/webhooks/[0-9]+/[A-Za-z0-9_-]+/?", u.path)
                or u.username or u.password or u.port or u.query or u.fragment):
            raise RuntimeError("DISCORD_WEBHOOK_URL must be an official HTTPS Discord webhook")


def token_matches(given: str, expected: str) -> bool:
    return bool(expected and hmac.compare_digest(given.encode(), expected.encode()))


def normalized_ocr(raw: str) -> str:
    # Nothing learned here is treated as fact about game mechanics.
    return re.sub(r"\s+", " ", raw.lower())[:MAX_OCR_CHARS]


def recognize_idea(raw: str) -> tuple[str, str] | None:
    """Only recognize text; never invent damage formulas or read Discord Go Live."""
    text = normalized_ocr(raw)
    if len(text) < 15:
        return None
    pairs = [
        ("burn-poison", r"(?:thiêu đốt|burn|ignite).*(?:poison|venom|trúng độc|nhiễm độc)|(?:poison|venom|trúng độc|nhiễm độc).*(?:thiêu đốt|burn|ignite)",
         "Thấy dấu hiệu độc và thiêu đốt. Hãy thử riêng từng hiệu ứng rồi so."),
        ("crit", r"(?:chí mạng|bạo kích|critical chance|crit rate)",
         "Thấy thông tin chí mạng. So đòn thường và chí mạng trên cùng mục tiêu nhé."),
        ("fatebound", r"(?:fatebound|liên kết vận mệnh|ràng buộc vận mệnh)",
         "Thấy chữ Fatebound. Kiểm tra hiệu ứng trước và sau khi thay trang bị nhé."),
        ("cooldown", r"(?:hồi chiêu|cooldown)",
         "Thấy hồi chiêu. Cần so thời gian buff để đánh giá nhịp kỹ năng."),
        ("stack", r"(?:cộng dồn|tích tầng|stacks?)",
         "Thấy hiệu ứng cộng dồn. Thử đo riêng từng tầng trước khi phối."),
        ("armor", r"(?:xuyên giáp|armor penetration)",
         "Thấy xuyên giáp. Thử cùng đòn đánh trên các mục tiêu khác giáp."),
    ]
    for key, pattern, suggestion in pairs:
        if re.search(pattern, text):
            return key, suggestion
    return None


def confirmed_idea(old: tuple[str, str] | None,
                   new: tuple[str, str] | None) -> tuple[str, str] | None:
    # Require matching signal in two separate OCR frames to reduce false hints.
    return new if old is not None and new is not None and old[0] == new[0] else None


def read_n(pipe, n: int) -> bytes:
    result = bytearray()
    while len(result) < n:
        block = pipe.read(n - len(result))
        if not block:
            raise EOFError("video disconnected")
        result.extend(block)
    return bytes(result)


def next_png(pipe) -> bytes:
    """Read exactly one bounded PNG from ffmpeg stdout without file writes."""
    signature = read_n(pipe, 8)
    if signature != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG frame")
    result = bytearray(signature)
    while len(result) < MAX_PNG_BYTES:
        header = read_n(pipe, 8)
        length = int.from_bytes(header[:4], "big")
        if length > MAX_PNG_BYTES or len(result) + length + 12 > MAX_PNG_BYTES:
            raise ValueError("frame too large")
        data = read_n(pipe, length + 4)
        result.extend(header)
        result.extend(data)
        if header[4:] == b"IEND":
            return bytes(result)
    raise ValueError("frame too large")


def ocr_png(frame: bytes) -> str:
    # Tesseract stdin/stdout only, no temp screenshot file.
    proc = subprocess.run(
        ["tesseract", "stdin", "stdout", "-l", "eng+vie", "--psm", "11"],
        input=frame, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        timeout=12, check=False,
    )
    if proc.returncode != 0:
        return ""
    return proc.stdout.decode("utf-8", "replace")[:MAX_OCR_CHARS]


def post_discord(message: str) -> bool:
    if not WEBHOOK_URL:
        return False
    body = json.dumps({
        "username": "Linh",
        "content": "✦ Linh: " + message[:96],
        "allowed_mentions": {"parse": []},
    }, ensure_ascii=False).encode("utf-8")
    request = Request(
        WEBHOOK_URL, body,
        {"Content-Type": "application/json", "User-Agent": "Linh-Stream-Probe/1.0"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=6) as response:
            return response.status in (200, 204)
    except Exception:
        # Never log webhook URL, user-identifying content or token.
        return False


class LiveState:
    def __init__(self) -> None:
        self.lock = threading.RLock()
        self.active = False
        self.since: float | None = None
        self.last_frame: float | None = None
        self.last_idea: str | None = None
        self.last_idea_at: float | None = None
        self.last_kind: str | None = None
        self.processor: subprocess.Popen | None = None
        self.generation = 0
        self.last_sent_at = 0.0
        self.frames_seen = 0
        self.phase = 'idle'
        self.last_error_type = None

    def status(self) -> dict:
        with self.lock:
            return {
                "active": self.active,
                "since": self.since,
                "last_frame_at": self.last_frame,
                "last_idea_at": self.last_idea_at,
                "last_idea": self.last_idea,
                "last_kind": self.last_kind,
                "discord_configured": bool(WEBHOOK_URL),
                "frames_seen": self.frames_seen,
                "phase": self.phase,
                "last_error_type": self.last_error_type,
                "capture": "RTMP external broadcast only; no frames stored",
                "transport_security": "plain RTMP is NOT encrypted; use only a non-sensitive test screen",
            }

    def stop(self) -> None:
        with self.lock:
            self.generation += 1
            self.active = False
            self.since = None
            self.phase = 'stopped'
            proc = self.processor
            self.processor = None
        if proc is not None:
            try:
                proc.terminate()
            except ProcessLookupError:
                pass

    def start(self) -> bool:
        with self.lock:
            if self.active:
                return False
            self.active = True
            self.generation += 1
            gen = self.generation
            self.since = time.time()
            self.last_frame = None
            self.frames_seen = 0
            self.phase = 'publishing'
            self.last_error_type = None
        threading.Thread(target=self.process, args=(gen,), daemon=True).start()
        return True

    def process(self, gen: int) -> None:
        # Loopback play only (nginx blocks public RTMP playback).
        # Video never leaves the container except the short Discord text insight.
        time.sleep(0.8)
        cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "quiet", "-nostdin",
            # Streaming needs low probing latency, not full-file buffering.
            "-fflags", "nobuffer", "-flags", "low_delay",
            "-analyzeduration", "100000", "-probesize", "32768",
            "-i", f"rtmp://127.0.0.1:1935/live/{STREAM_KEY}",
            "-an", "-sn", "-dn", "-vf",
            "fps=1/6,scale=960:540:force_original_aspect_ratio=decrease,"
            "pad=960:540:(ow-iw)/2:(oh-ih)/2:color=black",
            "-f", "image2pipe", "-vcodec", "png", "pipe:1",
        ]
        try:
            proc = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL, bufsize=0,
            )
        except OSError:
            self.stop()
            return
        with self.lock:
            if not self.active or self.generation != gen:
                proc.terminate()
                return
            self.processor = proc
            self.phase = 'reading'
        previous = None
        try:
            while True:
                with self.lock:
                    if not self.active or self.generation != gen:
                        break
                frame = next_png(proc.stdout)
                with self.lock:
                    if self.generation == gen:
                        self.frames_seen += 1
                        self.last_frame = time.time()
                        self.phase = 'ocr-running'
                text = ocr_png(frame)
                # Release the frame bytes before storing or notifying anything.
                del frame
                current = recognize_idea(text)
                del text
                stable = confirmed_idea(previous, current)
                previous = current
                with self.lock:
                    if not self.active or self.generation != gen:
                        break
                    now = time.time()
                    self.phase = 'analyzed'
                    if stable and now - self.last_sent_at >= COOLDOWN_SECONDS:
                        self.last_sent_at = now
                        self.last_kind = stable[0]
                        self.last_idea = stable[1]
                        self.last_idea_at = now
                        idea_to_send = stable[1]
                    else:
                        idea_to_send = None
                if idea_to_send:
                    post_discord(idea_to_send)
        except (EOFError, ValueError, BrokenPipeError, OSError, subprocess.TimeoutExpired) as error:
            with self.lock:
                if self.generation == gen:
                    self.last_error_type = type(error).__name__
        finally:
            with self.lock:
                current_generation = self.generation == gen
                if current_generation:
                    self.active = False
                    self.since = None
                    self.phase = 'stopped'
                    self.processor = None
            try:
                proc.terminate()
                proc.wait(timeout=2)
            except (ProcessLookupError, subprocess.TimeoutExpired):
                proc.kill()


STATE = LiveState()


class Handler(BaseHTTPRequestHandler):
    server_version = "LinhRTMPProbe"
    sys_version = ""

    def log_message(self, *_args):
        # Never log RTMP stream keys, auth headers, URLs or webhook secrets.
        pass

    def respond(self, code: int, obj: dict) -> None:
        blob = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(blob)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(blob)

    def is_local(self) -> bool:
        return self.client_address[0] in ("127.0.0.1", "::1")

    def do_GET(self):
        if self.path == "/healthz":
            self.respond(200, {"alive": True, "service": "Linh RTMP probe"})
        elif self.path == "/status":
            auth = self.headers.get("Authorization", "")
            token = auth.removeprefix("Bearer ") if auth.startswith("Bearer ") else ""
            if not token_matches(token, STATUS_TOKEN):
                self.respond(401, {"error": "unauthorized"})
            else:
                self.respond(200, STATE.status())
        else:
            self.respond(404, {"error": "not_found"})

    def do_POST(self):
        if self.path not in ("/internal/publish", "/internal/done") or not self.is_local():
            self.respond(404, {"error": "not_found"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not (1 <= size <= 2048):
                raise ValueError()
            args = parse_qs(self.rfile.read(size).decode("ascii"))
            name = args.get("name", [""])[0]
            app = args.get("app", [""])[0]
        except (ValueError, UnicodeDecodeError):
            self.respond(400, {"error": "invalid"})
            return
        if app != "live" or not token_matches(name, STREAM_KEY):
            self.respond(403, {"error": "rejected"})
            return
        if self.path.endswith("/publish"):
            if not STATE.start():
                self.respond(409, {"error": "already_live"})
            else:
                self.respond(200, {"ok": True})
        else:
            STATE.stop()
            self.respond(200, {"ok": True})


def main() -> None:
    check_environment()
    # No metrics payloads, images, raw OCR or stream URL ever logged.
    print("Linh RTMP receiver ready: secure stream key required; no recording", flush=True)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    server.daemon_threads = True
    server.serve_forever()


if __name__ == "__main__":
    main()
