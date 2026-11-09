/**
 * @file GalaxyDialog.js
 * @description A Material 3 styled dialog component for the Galaxy engine.
 * @author Vectorted
 * @license MIT
 */

import { GalaxyButton } from './GalaxyButton.js';

/**
 * @class GalaxyDialog
 * @description A Material 3 styled dialog component.
 */
class GalaxyDialog {
    /**
     * @constructor
     * @param {Galaxy} galaxy - The parent Galaxy instance.
     */
    constructor(galaxy) {
        this.galaxy = galaxy;
        this._options = { title: '', content: '', showInput: false, defaultValue: '', placeholder: '', confirmText: 'OK', cancelText: 'Cancel', showCancel: true };
        this._dom = null;
        this._buttons = [];
        this._closeHandler = null;
    }

    /**
     * @description Builds the dialog configuration.
     * @param {Object} options - Configuration options.
     * @returns {GalaxyDialog} This instance for chaining.
     */
    build(options) {
        this._options = Object.assign(this._options, options);
        return this;
    }

    /**
     * @description Shows the dialog and returns a Promise.
     * @returns {Promise<boolean|string|null>} Resolves true or input string on confirm, false or null on cancel.
     */
    show() {
        return new Promise((resolve) => {
            if (this._closeHandler) this._closeHandler(false, true);
            const opts = this._options;
            const theme = this.galaxy.targetTheme;

            this._dom = document.createElement('div');
            this._dom.className = 'galaxy-dialog-backdrop';

            const dialog = document.createElement('div');
            dialog.className = 'galaxy-dialog';
            dialog.style.backgroundColor = theme.toast.bg;
            dialog.style.color = theme.toast.color;
            dialog.style.border = theme.toast.border;
            dialog.style.boxShadow = theme.toast.shadow;

            if (opts.title) {
                const titleEl = document.createElement('h2');
                titleEl.className = 'galaxy-dialog-title';
                titleEl.textContent = opts.title;
                dialog.appendChild(titleEl);
            }
            if (opts.content) {
                const contentEl = document.createElement('div');
                contentEl.className = 'galaxy-dialog-content';
                contentEl.innerHTML = opts.content;
                dialog.appendChild(contentEl);
            }

            let inputEl = null;
            if (opts.showInput) {
                inputEl = document.createElement('input');
                inputEl.className = 'galaxy-dialog-input';
                inputEl.type = 'text';
                inputEl.value = opts.defaultValue;
                inputEl.placeholder = opts.placeholder;
                inputEl.style.background = 'rgba(127,127,127,0.1)';
                inputEl.style.color = theme.btn.btnColor;
                dialog.appendChild(inputEl);
            }

            const actionsEl = document.createElement('div');
            actionsEl.className = 'galaxy-dialog-actions';
            const buttons = [];
            this._buttons = buttons;
            const cleanups = [];

            const close = (isConfirm, immediate = false) => {
                if (!this._dom) return;
                const val = isConfirm ? (opts.showInput ? inputEl.value : true) : (opts.showInput ? null : false);
                if (this.galaxy && typeof this.galaxy._unregisterDialog === 'function') this.galaxy._unregisterDialog(this);
                this._closeHandler = null;

                cleanups.forEach(fn => { try { fn(); } catch (e) {} });
                cleanups.length = 0;
                buttons.forEach(btn => { try { btn.destroy(); } catch (e) {} });
                buttons.length = 0;
                this._buttons = [];

                const dom = this._dom;
                this._dom = null;

                if (immediate) {
                    if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
                    resolve(val); return;
                }
                dialog.style.animation = 'galaxy-dialog-out 0.2s cubic-bezier(0.4, 0, 1, 1) forwards';
                dom.style.animation = 'galaxy-backdrop-out 0.2s ease-in forwards';
                setTimeout(() => {
                    if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
                    resolve(val);
                }, 200);
            };
            this._closeHandler = close;

            if (opts.showCancel) {
                buttons.push(new GalaxyButton({
                    container: actionsEl, text: opts.cancelText, shape: 'pill', onClick: () => close(false),
                    theme: { btnBg: 'transparent', btnColor: theme.btn.btnColor, btnHoverBg: theme.btn.btnHoverBg, btnBorder: 'none', btnRipple: theme.btn.btnRipple }
                }));
            }
            buttons.push(new GalaxyButton({
                container: actionsEl, text: opts.confirmText, shape: 'pill', onClick: () => close(true),
                theme: { btnBg: theme.btn.btnColor, btnColor: theme.toast.bg, btnBorder: 'none', btnHoverBg: theme.btn.btnColor, btnRipple: 'rgba(255,255,255,0.3)' }
            }));

            dialog.appendChild(actionsEl);
            this._dom.appendChild(dialog);
            document.body.appendChild(this._dom);

            this._injectStyles();
            if (this.galaxy && typeof this.galaxy._registerDialog === 'function') this.galaxy._registerDialog(this);

            if (inputEl) {
                inputEl.focus();
                if (window.visualViewport) {
                    const onResize = () => {
                        if (!this._dom) return;
                        const isKeyboardOpen = window.visualViewport.height < window.innerHeight - 100;
                        this._dom.style.height = `${window.visualViewport.height}px`;
                        this._dom.style.top = `${window.visualViewport.offsetTop}px`;
                        this._dom.style.alignItems = isKeyboardOpen ? 'flex-end' : 'center';
                        this._dom.style.paddingBottom = isKeyboardOpen ? '10px' : '0';
                    };
                    window.visualViewport.addEventListener('resize', onResize);
                    window.visualViewport.addEventListener('scroll', onResize);
                    cleanups.push(() => {
                        window.visualViewport.removeEventListener('resize', onResize);
                        window.visualViewport.removeEventListener('scroll', onResize);
                    });
                    onResize();
                }
            }

            const onDocKeydown = (e) => {
                if (e.key === 'Enter' && opts.showInput) close(true);
                if (e.key === 'Escape') close(false);
            };
            document.addEventListener('keydown', onDocKeydown);
            cleanups.push(() => document.removeEventListener('keydown', onDocKeydown));
            this._dom.addEventListener('pointerdown', (e) => { if (e.target === this._dom) close(false); });
        });
    }

    /**
     * @private
     * @description Forces the dialog to close immediately.
     */
    _forceClose() {
        if (this._closeHandler) this._closeHandler(false, true);
    }

    /**
     * @private
     * @description Injects CSS styles for the dialog.
     */
    _injectStyles() {
        if (document.getElementById('galaxy-dialog-styles')) return;
        const style = document.createElement('style');
        style.id = 'galaxy-dialog-styles';
        style.innerHTML = `
            .galaxy-dialog-backdrop {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
                display: flex; align-items: center; justify-content: center;
                z-index: 10000; opacity: 0; animation: galaxy-backdrop-in 0.3s ease-out forwards;
                font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
                transition: align-items 0.2s ease, padding-bottom 0.2s ease;
            }
            .galaxy-dialog {
                width: 90%; max-width: 400px; border-radius: 28px; padding: 24px; box-sizing: border-box;
                display: flex; flex-direction: column; max-height: calc(100% - 40px);
                transform: scale(0.9) translateY(20px); opacity: 0;
                animation: galaxy-dialog-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            .galaxy-dialog-title { margin: 0 0 16px 0; font-size: 24px; font-weight: 400; flex-shrink: 0; }
            .galaxy-dialog-content { font-size: 14px; line-height: 1.5; margin-bottom: 24px; opacity: 0.8; flex: 1; overflow-y: auto; min-height: 0; }
            
            .galaxy-dialog-input {
                width: 100%; padding: 16px; border-radius: 8px; margin-bottom: 24px;
                font-size: 16px; outline: none; box-sizing: border-box; 
                border: 2px solid transparent;
                transition: border-color 0.2s, box-shadow 0.2s; flex-shrink: 0;
                user-select: text; -webkit-user-select: text;
            }
            .galaxy-dialog-input:focus { 
                border-color: var(--galaxy-theme-primary, #4e6c9e) !important; 
                box-shadow: 0 0 10px var(--galaxy-theme-primary, rgba(78, 108, 158, 0.3)); 
            }
            .galaxy-dialog-input::selection { background: rgba(78,108,158,0.35); color: inherit; }
            .galaxy-dialog-input::-moz-selection { background: rgba(78,108,158,0.35); color: inherit; }
            .galaxy-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0; }
            .galaxy-dialog-actions .galaxy-btn { min-height: 40px; width: auto; min-width: 80px; border-radius: 20px; font-weight: 600; }
            
            @keyframes galaxy-backdrop-in { to { opacity: 1; } }
            @keyframes galaxy-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
            @keyframes galaxy-dialog-in { to { transform: scale(1) translateY(0); opacity: 1; } }
            @keyframes galaxy-dialog-out { from { transform: scale(1) translateY(0); opacity: 1; } to { transform: scale(0.9) translateY(20px); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
}

export { GalaxyDialog };
export default GalaxyDialog;