"""
Coqui TTS service wrapper.

Responsibilities:
- Provide access to the Coqui TTS engine.
- Receive text input from the Node backend (routes/tts.js).
- Generate synthetic speech as an audio file/stream.
- Return the audio to the calling layer.

This isolates AI/ML logic from the HTTP API, making it easier
to swap or upgrade the TTS engine later.
"""
