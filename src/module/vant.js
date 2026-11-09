/**
 * @file constants.js
 * @description Shared constants for the Galaxy engine.
 * @author Vectorted
 * @license MIT
 */

/**
 * Module-level reference counters for the injected `<style>` tags.
 * Counted globally across all Galaxy instances on the page.
 * @type {{core: number, btn: number, clickgui: number}}
 */
export const GalaxyStyleRefCount = { core: 0, btn: 0, clickgui: 0 };

/**
 * Default fallback color for nodes (used when a color string is invalid).
 * @type {string}
 */
export const GALAXY_DEFAULT_COLOR = '#7890b0';

/**
 * Regular expression to validate standard 6-digit hex colors.
 * @type {RegExp}
 */
export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;