#!/usr/bin/env python3
"""No device/no secrets tests for the Discord RTMP experiment."""
import io
import json
import pathlib
import struct
import unittest
import zlib

import server


def make_png(width=1, height=1):
    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data
                + struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    pixels = b"\x00\x32\x64\x96"
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(pixels)) + chunk(b"IEND", b""))


class LinhStreamProbeTests(unittest.TestCase):
    def test_strict_secret_configuration(self):
        a = "a" * 32
        b = "b" * 32
        old = server.STREAM_KEY, server.STATUS_TOKEN, server.WEBHOOK_URL
        try:
            server.STREAM_KEY, server.STATUS_TOKEN = a, b
            server.WEBHOOK_URL = ""
            server.check_environment()
            self.assertTrue(server.token_matches(a, a))
            self.assertFalse(server.token_matches(b, a))
            self.assertFalse(server.token_matches("", a))
            server.STATUS_TOKEN = a
            with self.assertRaises(RuntimeError):
                server.check_environment()
            server.STATUS_TOKEN = b
            server.STREAM_KEY = "short"
            with self.assertRaises(RuntimeError):
                server.check_environment()
        finally:
            server.STREAM_KEY, server.STATUS_TOKEN, server.WEBHOOK_URL = old

    def test_discord_destination_rejects_impersonation(self):
        old = server.STREAM_KEY, server.STATUS_TOKEN, server.WEBHOOK_URL
        try:
            server.STREAM_KEY = "a" * 32
            server.STATUS_TOKEN = "b" * 32
            for bad in (
                "http://discord.com/api/webhooks/123/abc",
                "https://discord.com.evil.example/api/webhooks/123/abc",
                "https://example.org/api/webhooks/123/abc",
                "https://discord.com/api/webhooks/123/abc?token=leak",
                "https://discord.com@evil.example/api/webhooks/123/abc",
            ):
                server.WEBHOOK_URL = bad
                with self.assertRaises(RuntimeError, msg=bad):
                    server.check_environment()
            server.WEBHOOK_URL = "https://discord.com/api/webhooks/123/abc_ABC-91"
            server.check_environment()
        finally:
            server.STREAM_KEY, server.STATUS_TOKEN, server.WEBHOOK_URL = old

    def test_png_is_bounded_and_no_image_is_saved(self):
        p = make_png()
        self.assertEqual(server.next_png(io.BytesIO(p)), p)
        # Multiple frames can be consumed in sequence; each stays in memory.
        frames = io.BytesIO(p * 2)
        self.assertEqual(server.next_png(frames), p)
        self.assertEqual(server.next_png(frames), p)
        with self.assertRaises(ValueError):
            server.next_png(io.BytesIO(b"\x89PNG\r\n\x1a\n" +
                 struct.pack(">I", server.MAX_PNG_BYTES + 1) + b"IDAT"))
        with self.assertRaises(EOFError):
            server.next_png(io.BytesIO(p[:30]))

    def test_real_ocr_text_required_for_advice(self):
        self.assertIsNone(server.recognize_idea(""))
        self.assertIsNone(server.recognize_idea("64,324 18,920"))
        self.assertIsNone(server.recognize_idea("Bệ hạ hãy mua hàng"))
        a = server.recognize_idea("Fatebound activated, bonus value unknown")
        b = server.recognize_idea("Another Fatebound ability shown")
        self.assertEqual(a[0], "fatebound")
        self.assertIsNone(server.confirmed_idea(None, a))
        self.assertEqual(server.confirmed_idea(a, b), b)
        self.assertIsNone(server.confirmed_idea(a,
                          server.recognize_idea("Critical chance: 24%")))
        poison = server.recognize_idea("Burn and poison effects on this weapon")
        self.assertEqual(poison[0], "burn-poison")
        self.assertIn("thử riêng", poison[1])
        self.assertLessEqual(len(poison[1]), 96)

    def test_nginx_security_settings(self):
        nginx = pathlib.Path("nginx.conf").read_text()
        self.assertIn("record off;", nginx)
        self.assertIn("deny play all;", nginx)
        self.assertIn("allow play 127.0.0.1;", nginx)
        self.assertIn("on_publish http://127.0.0.1:8080/internal/publish;", nginx)
        self.assertNotIn("hls on", nginx)
        entrypoint = pathlib.Path("start.sh").read_text()
        self.assertIn("STREAM_KEY", entrypoint)
        self.assertIn("STATUS_TOKEN", entrypoint)
        docker = pathlib.Path("Dockerfile").read_text()
        self.assertIn("tesseract-ocr-vie", docker)
        self.assertIn("libnginx-mod-rtmp", docker)
        self.assertNotIn("COPY . .", docker)
        rail = json.loads(pathlib.Path("railway.json").read_text())
        self.assertEqual(rail["build"]["builder"], "DOCKERFILE")

    def test_no_discord_contact_without_config(self):
        old = server.WEBHOOK_URL
        try:
            server.WEBHOOK_URL = ""
            self.assertFalse(server.post_discord("No webhook has been set"))
        finally:
            server.WEBHOOK_URL = old

    def test_status_contains_no_raw_frame_or_stream_secret(self):
        state = server.LiveState()
        obj = state.status()
        self.assertFalse(obj["active"])
        self.assertNotIn("screenshot", obj)
        self.assertNotIn("stream_key", obj)
        self.assertNotIn("raw_ocr", obj)
        self.assertIn("NOT encrypted", obj["transport_security"])


if __name__ == "__main__":
    unittest.main()
