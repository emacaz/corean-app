/**
 * TTS (Text-to-Speech) route handler.
 *
 * Responsibilities:
 * - Expose an HTTP endpoint for generating speech from text.
 * - Receive text input from the frontend.
 * - Forward the request to the Coqui TTS service.
 * - Return the generated audio back to the client.
 *
 * This file only handles transport (HTTP layer), not TTS logic.
 */
