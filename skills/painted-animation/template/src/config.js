// config.js: project settings.
//   duration: the video's length in seconds.
//   bpm:      the rhythm that bounces, dances and pulse() follow. Clawd always moves to some beat; if the video has music,
//             set this to the song's tempo, and set offset to the time in seconds of its first downbeat.
//   style:    the look (src/styles/<style>.js; see docs/styles.jpg): watercolor (default), pixel, cutout, crayon, chalk,
//             neon, riso. Scenes are written once; the style decides how every paint() / inkLine() / glow() is drawn.
//             Style options: pixel → pixel: 6 (screen px per art pixel); riso → risoKick: 1 (misregistration jumps on the beat).
const PROJECT = { duration: 11, bpm: 120, offset: 0, style: 'watercolor' };
