/**
 * @file GalaxyButton.js
 * @description A material-ripple button used by the Galaxy control layer.
 * @author Vectorted
 * @license MIT
 */

import { GalaxyStyleRefCount } from './vant.js';

/**
 * @class GalaxyButton
 * @description A material-ripple button used by the Galaxy control layer.
 */
class GalaxyButton {
    /**
     * @constructor
     * @param {Object} options - Button configuration.
     * @param {HTMLElement} options.container - Parent container.
     * @param {string} options.text - Button label.
     * @param {Function} options.onClick - Click event callback.
     * @param {string} [options.shape='pill'] - Button shape.
     * @param {Object} [options.theme] - Theme configuration.
     */
    constructor(options) {
        this.container = options.container;
        this.text = options.text;
        this.onClick = options.onClick;
        this.shape = options.shape || 'pill';
        this.theme = options.theme;
        this._destroyed = false;

        this._injectStyles();
        this._render();
    }

    /**
     * @private
     * @description Injects CSS styles for the button component.
     */
    _injectStyles() {
        const styleId = 'galaxy-btn-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .galaxy-btn {
                    position: relative; overflow: hidden; border-radius: 999px;
                    border-width: 1px; border-style: solid; border-color: var(--galaxy-btn-border, transparent);
                    background: var(--galaxy-btn-bg, transparent);
                    color: var(--galaxy-btn-color, inherit);
                    font-weight: 500; cursor: pointer;
                    transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease, transform 0.1s, box-shadow 0.2s, opacity 0.2s;
                    outline: none; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
                    display: inline-flex; align-items: center; justify-content: center;
                    white-space: nowrap; word-break: keep-all; text-align: center;
                    min-height: 36px; box-sizing: border-box;
                    will-change: transform; transform: translateZ(0);
                    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
                    -webkit-tap-highlight-color: transparent !important;
                    width: 100%;
                }
                .galaxy-btn:hover { background: var(--galaxy-btn-hover-bg, rgba(127,127,127,0.1)); }
                .galaxy-btn:active { transform: scale(0.94); }
                .galaxy-btn:disabled, .galaxy-btn.is-disabled { opacity: 0.5; cursor: not-allowed; }
                .galaxy-btn:disabled:hover, .galaxy-btn.is-disabled:hover { background: var(--galaxy-btn-bg, transparent); }
                .galaxy-btn-pill { padding: 8px 16px; font-size: 13px; letter-spacing: 0.05em; line-height: 1.4; }
                .galaxy-btn-circle { width: 48px; height: 48px; padding: 0; font-size: 20px; border-radius: 50%; flex-shrink: 0; }
                .galaxy-ripple {
                    position: absolute; border-radius: 50%; background: var(--galaxy-btn-ripple, rgba(127, 127, 127, 0.25));
                    transform: scale(0); animation: galaxy-ripple-effect 0.6s linear; pointer-events: none;
                }
                @keyframes galaxy-ripple-effect { to { transform: scale(4); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }
        GalaxyStyleRefCount.btn++;
    }

    /**
     * @private
     * @description Renders the button element into the DOM.
     */
    _render() {
        this.el = document.createElement('button');
        this.el.className = `galaxy-btn galaxy-btn-${this.shape}`;
        this.el.type = 'button';

        const span = document.createElement('span');
        span.style.cssText = 'position:relative; z-index:1; pointer-events: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        span.textContent = this.text;
        this.el.appendChild(span);
        this._labelEl = span;

        this.updateTheme(this.theme);

        this._onPointerDown = (e) => this._createRipple(e);
        this.el.addEventListener('pointerdown', this._onPointerDown);
        this.el.addEventListener('click', this.onClick);
        this.container.appendChild(this.el);
    }

    /**
     * @description Updates the button text.
     * @param {string} text - The new label.
     */
    setText(text) {
        this.text = text;
        if (this._labelEl) this._labelEl.textContent = text;
    }

    /**
     * @description Sets the disabled state of the button.
     * @param {boolean} disabled - Whether the button is disabled.
     */
    setDisabled(disabled) {
        if (!this.el) return;
        this.el.disabled = !!disabled;
        this.el.classList.toggle('is-disabled', !!disabled);
    }

    /**
     * @description Updates button styling variables based on a theme.
     * @param {Object} [theme] - Theme configuration object.
     */
    updateTheme(theme) {
        this.theme = theme;
        if (this.theme && this.el) {
            if (this.theme.btnBg) this.el.style.setProperty('--galaxy-btn-bg', this.theme.btnBg);
            else this.el.style.removeProperty('--galaxy-btn-bg');

            if (this.theme.btnColor) this.el.style.setProperty('--galaxy-btn-color', this.theme.btnColor);
            else this.el.style.removeProperty('--galaxy-btn-color');

            if (this.theme.btnHoverBg) this.el.style.setProperty('--galaxy-btn-hover-bg', this.theme.btnHoverBg);
            else this.el.style.removeProperty('--galaxy-btn-hover-bg');

            if (this.theme.btnRipple) this.el.style.setProperty('--galaxy-btn-ripple', this.theme.btnRipple);
            else this.el.style.removeProperty('--galaxy-btn-ripple');

            if (this.theme.btnBorder && this.theme.btnBorder !== 'none') {
                this.el.style.setProperty('--galaxy-btn-border', 'var(--galaxy-theme-border, rgba(127,127,127,0.2))');
            } else {
                this.el.style.setProperty('--galaxy-btn-border', 'transparent');
            }
        }
    }

    /**
     * @private
     * @description Creates a ripple effect on pointer down.
     * @param {PointerEvent} e - The pointer event.
     */
    _createRipple(e) {
        if (this._destroyed || !this.el || this.el.disabled) return;
        const rect = this.el.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const ripple = document.createElement('span');
        ripple.className = 'galaxy-ripple';
        const diameter = Math.max(rect.width, rect.height), radius = diameter / 2;
        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${x - radius}px`;
        ripple.style.top = `${y - radius}px`;
        ripple.addEventListener('animationend', () => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); });
        this.el.appendChild(ripple);
    }

    /**
     * @description Destroys the button and cleans up styles.
     */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        if (this.el) {
            this.el.removeEventListener('pointerdown', this._onPointerDown);
            this.el.removeEventListener('click', this.onClick);
            if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
            this.el = null;
            this._labelEl = null;
        }
        GalaxyStyleRefCount.btn = Math.max(0, GalaxyStyleRefCount.btn - 1);
        if (GalaxyStyleRefCount.btn === 0) {
            const styleEl = document.getElementById('galaxy-btn-styles');
            if (styleEl) styleEl.remove();
        }
    }
}

export { GalaxyButton };
export default GalaxyButton;