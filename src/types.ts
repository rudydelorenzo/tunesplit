import { MIME_TYPES as Mantine_MIME } from "@mantine/dropzone";

export const MIME_AUDIO_TYPES = {
  au: "audio/basic",
  snd: "audio/basic",
  Linear_PCM: "auido/L24",
  mid: "audio/mid",
  rmi: "audio/mid",
  mp3: "audio/mpeg",
  mp4_audio: "audio/mp4",
  aif: "audio/x-aiff",
  aifc: "audio/x-aiff",
  aiff: "audio/x-aiff",
  m3u: "audio/x-mpegurl",
  ra: "audio/vnd.rn-realaudio",
  ram: "audio/vnd.rn-realaudio",
  Ogg_Vorbis: "audio/ogg",
  Vorbis: "audio/vorbis",
  wav: "audio/vnd.wav",
} as const;

export const MIME_TYPES = {
  ...Mantine_MIME,
  ...MIME_AUDIO_TYPES,
} as const;
