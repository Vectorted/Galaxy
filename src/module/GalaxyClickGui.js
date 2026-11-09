/**
 * @file GalaxyClickGui.js
 * @description Draggable click-panel system with a built-in component library.
 * @author Vectorted
 * @repository https://github.com/Vectorted
 * @license MIT
 */

import { GalaxyStyleRefCount } from './vant.js';
import { GalaxyButton } from './GalaxyButton.js';
import { Icon } from './Icon.js';

class GalaxyClickGui {
    static _styleTemplates = {};

    /**
     * @constructor
     * @param {Galaxy} galaxy - The parent Galaxy instance.
     * @param {Object} options - Configuration options.
     * @param {Array} [options.clicks=[]] - Initial panels configuration.
     */
    constructor(galaxy, options) {
        this.galaxy = galaxy;
        this.options = Object.assign({ clicks: [] }, options);
        this._clickHandles = [];
        this._destroyed = false;
        this._zIndexCounter = 1000;
        this._defaultWidth = 260;
        this._injectStyles();
        this._render();
        this._onWindowResize = () => this._clampClicks();
        window.addEventListener('resize', this._onWindowResize);
        window.addEventListener('orientationchange', this._onWindowResize);
    }

    /**
     * @description Registers a static style template.
     * @param {string} id - Template ID.
     * @param {Object} style - Style object.
     * @returns {boolean} True if successful.
     */
    static registerStyleTemplate(id, style) {
        if (!id || typeof id !== 'string') return false;
        GalaxyClickGui._styleTemplates[id] = Object.assign({}, style);
        return true;
    }

    /**
     * @description Unregisters a static style template.
     * @param {string} id - Template ID.
     * @returns {boolean} True if successful.
     */
    static unregisterStyleTemplate(id) {
        if (!id) return false;
        if (GalaxyClickGui._styleTemplates[id]) { delete GalaxyClickGui._styleTemplates[id]; return true; }
        return false;
    }

    /**
     * @description Gets a static style template.
     * @param {string} id - Template ID.
     * @returns {Object|null} Cloned style object or null.
     */
    static getStyleTemplate(id) {
        const t = GalaxyClickGui._styleTemplates[id];
        return t ? Object.assign({}, t) : null;
    }

    /**
     * @private
     * @description Injects CSS styles for the component library.
     */
    _injectStyles() {
        const styleId = 'galaxy-clickgui-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .galaxy-gui-container{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:500;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent!important;-webkit-touch-callout:none!important}
                .galaxy-gui-panel{position:absolute;width:var(--gui-panel-width,260px);display:flex;flex-direction:column;border-radius:12px;overflow:hidden;pointer-events:auto;box-shadow:0 10px 30px rgba(0,0,0,0.15);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--galaxy-theme-border,rgba(127,127,127,0.2));background:var(--galaxy-theme-surface,rgba(255,255,255,0.95));color:var(--galaxy-theme-color,#333);transition:background 0.4s ease,color 0.4s ease,border-color 0.4s ease;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent!important;-webkit-touch-callout:none!important;will-change:transform;transform:translateZ(0)}
                .galaxy-gui-header{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;font-size:14px;font-weight:600;cursor:grab;border-bottom:1px solid rgba(127,127,127,0.1);gap:8px}
                .galaxy-gui-header:active{cursor:grabbing}
                .galaxy-gui-header-title{display:flex;align-items:center;gap:8px;min-width:0;flex:1}
                .galaxy-gui-header-title>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;justify-content:center}
                .galaxy-gui-header-icon{width:16px;height:16px;display:flex;align-items:center;justify-content:center;}
                .galaxy-gui-collapse-btn{background:transparent;border:none;color:inherit;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);flex-shrink:0}
                .galaxy-gui-collapse-btn svg{width:16px;height:16px;fill:currentColor}
                .galaxy-gui-body-wrapper{display:grid;grid-template-rows:1fr;transition:grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.3s ease;opacity:1}
                .galaxy-gui-panel.is-collapsed .galaxy-gui-body-wrapper{grid-template-rows:0fr;opacity:0}
                .galaxy-gui-panel.is-collapsed .galaxy-gui-header{border-bottom-color:transparent}
                .galaxy-gui-panel.is-collapsed .galaxy-gui-collapse-btn{transform:rotate(-90deg)}
                .galaxy-gui-body-inner{overflow:hidden;display:flex;flex-direction:column;width:100%;min-height:0}
                .galaxy-gui-body{display:flex;flex-direction:column;padding:12px;gap:12px;overflow-y:auto;overflow-x:hidden;max-height:var(--gui-panel-max-height,calc(100vh - 150px));scrollbar-width:none;-ms-overflow-style:none;width:100%;box-sizing:border-box}
                .galaxy-gui-body::-webkit-scrollbar{display:none}
                .galaxy-gui-group{display:flex;gap:10px;width:100%;box-sizing:border-box;min-width:0}
                .galaxy-gui-group.layout-row{flex-direction:row;align-items:center;flex-wrap:wrap}
                .galaxy-gui-group.layout-row > :not(.galaxy-gui-chip) { flex: 1 1 0%; min-width: 0; max-width: 100%; overflow: hidden; }
                .galaxy-gui-group.layout-row > .galaxy-gui-chip { flex: 0 0 auto !important; width: auto !important; min-width: max-content !important; max-width: 100%; }
                .galaxy-gui-group.layout-column{flex-direction:column;align-items:stretch}
                .galaxy-gui-group.layout-column>*{width:100%;max-width:100%;box-sizing:border-box;min-width:0}
                .galaxy-gui-group > .galaxy-gui-text, .galaxy-gui-group > .galaxy-gui-module, .galaxy-gui-group > .galaxy-gui-switch-row, .galaxy-gui-group > .galaxy-gui-input-container, .galaxy-gui-group > .galaxy-gui-dropdown, .galaxy-gui-group > .galaxy-gui-choice-group, .galaxy-gui-group > .galaxy-gui-time-wrap, .galaxy-gui-group > .galaxy-gui-console, .galaxy-gui-group > .galaxy-gui-divider, .galaxy-gui-group > .galaxy-gui-progress-container, .galaxy-gui-group > .galaxy-gui-image, .galaxy-gui-group > .galaxy-gui-color-container, .galaxy-gui-group > .galaxy-gui-tabs-container, .galaxy-gui-group > .galaxy-gui-kv-container, .galaxy-gui-group > .galaxy-gui-multi-dropdown, .galaxy-gui-group > .galaxy-gui-card, .galaxy-gui-group > .galaxy-gui-list, .galaxy-gui-group > .galaxy-btn { width: 100%; max-width: 100%; box-sizing: border-box; }
                .galaxy-gui-body .galaxy-btn{min-height:36px;border-radius:8px;font-size:13px;padding:6px 12px;max-width:100%;overflow:hidden}
                .galaxy-gui-text{font-size:12px;opacity:0.7;line-height:1.4}
                .galaxy-gui-module{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:8px;font-size:13px;cursor:pointer;transition:background 0.2s;border:1px solid rgba(127,127,127,0.15);width:100%;box-sizing:border-box}
                .galaxy-gui-module:hover{background:rgba(127,127,127,0.08)}
                .galaxy-gui-module.is-active{color:var(--galaxy-theme-primary,#4e6c9e);font-weight:600;border-color:var(--galaxy-theme-primary,rgba(78,108,158,0.5));background:rgba(127,127,127,0.05)}
                .galaxy-gui-switch-row{display:flex;justify-content:space-between;align-items:center;padding:6px 4px;font-size:13px;cursor:pointer;width:100%;box-sizing:border-box}
                .galaxy-gui-switch-left{display:flex;align-items:center;gap:8px;min-width:0}
                .galaxy-gui-switch-left>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .galaxy-gui-switch-icon{width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
                .galaxy-gui-switch-track{width:42px;height:24px;border-radius:12px;background:rgba(127,127,127,0.3);position:relative;flex-shrink:0;transition:background 0.3s;border:1px solid rgba(127,127,127,0.1);box-sizing:border-box}
                .galaxy-gui-switch-thumb{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275),width 0.2s,height 0.2s,top 0.2s,left 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.2);box-sizing:border-box}
                .galaxy-gui-switch-track.is-active{background:var(--galaxy-theme-primary,#4e6c9e)}
                .galaxy-gui-switch-track.is-active .galaxy-gui-switch-thumb{transform:translateX(18px);width:20px;height:20px;top:1px;left:1px}
                .galaxy-gui-accordion{display:flex;flex-direction:column;box-sizing:border-box;min-width:0;width:100%}
                .galaxy-gui-accordion-header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:13px;font-weight:500;cursor:pointer;border-radius:8px;box-sizing:border-box;width:100%}
                .galaxy-gui-accordion-header:hover{background:rgba(127,127,127,0.08)}
                .galaxy-gui-accordion-arrow{transition:transform 0.3s;width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:inherit;}
                .galaxy-gui-accordion-arrow svg{width:100%;height:100%;fill:currentColor;display:block;}
                .galaxy-gui-accordion.is-expanded>.galaxy-gui-accordion-header .galaxy-gui-accordion-arrow{transform:rotate(90deg)}
                .galaxy-gui-accordion>.galaxy-gui-accordion-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1);width:100%;box-sizing:border-box}
                .galaxy-gui-accordion.is-expanded>.galaxy-gui-accordion-body{grid-template-rows:1fr}
                .galaxy-gui-accordion>.galaxy-gui-accordion-body>.galaxy-gui-accordion-inner{overflow:hidden;width:100%;box-sizing:border-box;min-height:0}
                .galaxy-gui-accordion-children{display:flex;flex-direction:column;gap:8px;margin-left:8px;padding-left:12px;border-left:1px solid rgba(127,127,127,0.2);margin-top:4px;margin-bottom:8px;width:calc(100% - 20px);box-sizing:border-box;overflow-x:auto;scrollbar-width:thin}
                .galaxy-gui-accordion-children::-webkit-scrollbar{height:4px}
                .galaxy-gui-accordion-children::-webkit-scrollbar-thumb{background:rgba(127,127,127,0.3);border-radius:2px}
                .galaxy-gui-accordion-children .galaxy-gui-group { width: max-content; min-width: 100%; }
                .galaxy-gui-accordion-children .galaxy-gui-group > :not(.galaxy-gui-chip) { max-width: none; }
                .galaxy-gui-accordion-children .galaxy-gui-group.layout-row > :not(.galaxy-gui-chip) { flex: 1 0 auto; width: auto; min-width: max-content; }

                .galaxy-gui-input-container{display:flex;flex-direction:column;gap:4px;width:100%;box-sizing:border-box}
                .galaxy-gui-input-label{font-size:11px;opacity:0.7;margin-left:4px}
                .galaxy-gui-input-wrapper{display:flex;align-items:center;position:relative;background:rgba(127,127,127,0.08);border:1px solid rgba(127,127,127,0.2);border-radius:8px;padding:0 10px;transition:border-color 0.2s,background 0.2s;width:100%;box-sizing:border-box}
                .galaxy-gui-input-wrapper:focus-within{border-color:var(--galaxy-theme-primary,#4e6c9e);background:transparent}
                .galaxy-gui-input-icon{display:flex;align-items:center;justify-content:center;width:20px;height:20px;opacity:0.6;margin-right:8px;flex-shrink:0}
                .galaxy-gui-input{flex:1;min-width:0;padding:10px 0;font-size:14px;background:transparent;border:none;color:inherit;outline:none;user-select:text;-webkit-user-select:text;box-sizing:border-box}
                .galaxy-gui-input-clear{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:none;background:rgba(127,127,127,0.4);color:var(--galaxy-theme-surface,#fff);font-size:12px;cursor:pointer;margin-left:8px;flex-shrink:0;opacity:0;pointer-events:none;transition:opacity 0.2s}
                .galaxy-gui-input-wrapper.has-value .galaxy-gui-input-clear{opacity:1;pointer-events:auto}
                .galaxy-gui-input-hint{font-size:10px;opacity:0.5;margin-left:4px}
                .galaxy-gui-slider-container{display:flex;flex-direction:column;gap:4px;width:100%;box-sizing:border-box;padding-top:22px;margin-top:-6px}
                .galaxy-gui-slider-header{display:flex;justify-content:space-between;font-size:12px;opacity:0.8;width:100%;gap:8px}
                .galaxy-gui-slider-header>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .galaxy-gui-slider-track-wrapper{position:relative;height:24px;display:flex;align-items:center;width:100%;box-sizing:border-box;padding:0 8px}
                .galaxy-gui-slider{-webkit-appearance:none;appearance:none;width:100%;height:24px;outline:none;margin:0;padding:0;position:relative;z-index:2;box-sizing:border-box;touch-action:none;background:transparent!important;border:none!important;box-shadow:none!important}
                .galaxy-gui-slider:focus{outline:none}
                .galaxy-gui-slider::-webkit-slider-runnable-track{width:100%;height:2px;cursor:pointer;background:linear-gradient(to right,var(--galaxy-theme-primary,#4e6c9e) 0%,var(--galaxy-theme-primary,#4e6c9e) var(--val,0%),rgba(127,127,127,0.2) var(--val,0%),rgba(127,127,127,0.2) 100%);border-radius:1px;border:none;transition:height 0.2s}
                .galaxy-gui-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--galaxy-theme-primary,#4e6c9e);cursor:pointer;box-shadow:none!important;border:none;margin-top:-7px;transform:translateZ(0)}
                .galaxy-gui-slider-container.is-discrete .galaxy-gui-slider::-webkit-slider-runnable-track{height:4px;border-radius:2px}
                .galaxy-gui-slider-container.is-discrete .galaxy-gui-slider::-webkit-slider-thumb{margin-top:-6px}
                .galaxy-gui-slider::-moz-range-track{width:100%;height:2px;cursor:pointer;border-radius:1px;background:rgba(127,127,127,0.2)}
                .galaxy-gui-slider::-moz-range-progress{background:var(--galaxy-theme-primary,#4e6c9e);height:2px;border-radius:1px}
                .galaxy-gui-slider-container.is-discrete .galaxy-gui-slider::-moz-range-track,.galaxy-gui-slider-container.is-discrete .galaxy-gui-slider::-moz-range-progress{height:4px;border-radius:2px}
                .galaxy-gui-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--galaxy-theme-primary,#4e6c9e);cursor:pointer;box-shadow:none!important;border:none}
                .galaxy-gui-slider-ticks{position:absolute;left:16px;right:16px;top:0;bottom:0;pointer-events:none;z-index:1}
                .galaxy-gui-slider-tick{position:absolute;top:50%;transform:translate(-50%,-50%);width:1.5px;height:1.5px;border-radius:50%;background:rgba(127,127,127,0.7);transition:width 0.2s,height 0.2s}
                .galaxy-gui-slider-container.is-discrete .galaxy-gui-slider-tick{width:2px;height:2px}
                .galaxy-gui-slider-tooltip{position:absolute;top:-26px;background:var(--galaxy-theme-primary,#4e6c9e);color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:bold;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:10;white-space:nowrap}
                .galaxy-gui-slider-tooltip::after{content:'';position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);border-width:4px 4px 0;border-style:solid;border-color:var(--galaxy-theme-primary,#4e6c9e) transparent transparent}
                .galaxy-gui-slider-tooltip.is-visible{opacity:1}
                .galaxy-gui-dropdown{position:relative;display:flex;flex-direction:column;gap:6px;width:100%;box-sizing:border-box}
                .galaxy-gui-dropdown-trigger{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;font-size:14px;background:rgba(127,127,127,0.08);border:1px solid rgba(127,127,127,0.2);cursor:pointer;user-select:none;box-sizing:border-box;width:100%;gap:8px}
                .galaxy-gui-dropdown-trigger>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1;text-align:left}
                .galaxy-gui-dropdown-trigger svg{width:16px;height:16px;fill:currentColor;transition:transform 0.3s;flex-shrink:0;display:block}
                .galaxy-gui-dropdown.is-open .galaxy-gui-dropdown-trigger svg{transform:rotate(180deg)}
                .galaxy-gui-dropdown-menu-wrapper{display:grid;grid-template-rows:0fr;transition:grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1),margin-top 0.3s ease,opacity 0.3s ease;margin-top:0;opacity:0;width:100%}
                .galaxy-gui-dropdown.is-open .galaxy-gui-dropdown-menu-wrapper{grid-template-rows:1fr;margin-top:4px;opacity:1}
                .galaxy-gui-dropdown-menu-inner{overflow:hidden;min-height:0;border-radius:8px}
                .galaxy-gui-dropdown-menu{display:flex;flex-direction:column;background:var(--galaxy-theme-surface,#fff);border:1px solid rgba(127,127,127,0.2);border-radius:8px;overflow:hidden;width:100%;box-sizing:border-box}
                .galaxy-gui-dropdown-item{padding:10px 12px;font-size:13px;cursor:pointer;transition:background 0.2s;border-bottom:1px solid rgba(127,127,127,0.1);box-sizing:border-box;text-align:left}
                .galaxy-gui-dropdown-item:last-child{border-bottom:none}
                .galaxy-gui-dropdown-item:hover{background:rgba(127,127,127,0.1)}
                .galaxy-gui-dropdown-item.is-active{color:var(--galaxy-theme-primary,#4e6c9e);font-weight:600}
                .galaxy-gui-choice-group{display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box}
                .galaxy-gui-choice-group.layout-row{flex-direction:row;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
                .galaxy-gui-choice-group.layout-row::-webkit-scrollbar{display:none}
                .galaxy-gui-choice-group.layout-row>.galaxy-gui-choice-item{width:auto}
                .galaxy-gui-choice-item{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;flex-shrink:0;width:100%;box-sizing:border-box}
                .galaxy-gui-choice-icon{width:20px;height:20px;border-radius:4px;border:2px solid rgba(127,127,127,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.2s,border-color 0.2s;box-sizing:border-box}
                .galaxy-gui-choice-icon svg{width:14px;height:14px;fill:#fff;opacity:0;transition:opacity 0.2s}
                .galaxy-gui-choice-item.is-active .galaxy-gui-choice-icon{background:var(--galaxy-theme-primary,#4e6c9e);border-color:var(--galaxy-theme-primary,#4e6c9e)}
                .galaxy-gui-choice-item.is-active .galaxy-gui-choice-icon svg{opacity:1}
                .galaxy-gui-choice-icon.is-radio{border-radius:50%}
                .galaxy-gui-choice-icon.is-radio::after{content:'';width:10px;height:10px;border-radius:50%;background:#fff;opacity:0;transition:opacity 0.2s}
                .galaxy-gui-choice-item.is-active .galaxy-gui-choice-icon.is-radio::after{opacity:1}
                .galaxy-gui-time-wrap{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:8px;background:rgba(127,127,127,0.08);border:1px solid rgba(127,127,127,0.2);width:100%;box-sizing:border-box}
                .galaxy-gui-time-display{font-size:20px;font-weight:600;text-align:center;color:var(--galaxy-theme-primary,#4e6c9e);margin-bottom:4px}
                .galaxy-gui-time-slider-row{display:flex;align-items:center;gap:8px;font-size:11px;opacity:0.8;width:100%;box-sizing:border-box}
                .galaxy-gui-time-slider-row>span{width:12px;text-align:center;flex-shrink:0}
                .galaxy-gui-time-slider-row .galaxy-gui-slider-track-wrapper{flex:1}
                .galaxy-gui-console{display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:rgba(127,127,127,0.06);border-radius:8px;padding:8px;max-height:200px;overflow-y:auto;font-family:"SF Mono",Consolas,monospace;font-size:11px;line-height:1.4;color:inherit;user-select:text;-webkit-user-select:text}
                .galaxy-gui-console-line{padding:2px 0;border-bottom:1px dashed rgba(127,127,127,0.2);word-break:break-all}
                .galaxy-gui-divider{margin:4px 0;border:none;background:rgba(127,127,127,0.2);height:1px;width:100%;box-sizing:border-box;flex-shrink:0}
                .galaxy-gui-progress-container{display:flex;flex-direction:column;gap:4px;width:100%}
                .galaxy-gui-progress-header{display:flex;justify-content:space-between;font-size:12px;opacity:0.8}
                .galaxy-gui-progress-track{width:100%;height:8px;background:rgba(127,127,127,0.2);border-radius:4px;overflow:hidden}
                .galaxy-gui-progress-fill{height:100%;background:var(--galaxy-theme-primary,#4e6c9e);width:0%;transition:width 0.3s ease}
                .galaxy-gui-image{width:100%;max-width:100%;border-radius:8px;object-fit:cover;display:block}
                .galaxy-gui-color-container{display:flex;flex-direction:column;gap:8px;width:100%}
                .galaxy-gui-color-preview-row{display:flex;align-items:center;gap:8px;width:100%}
                .galaxy-gui-color-preview{width:32px;height:32px;border-radius:8px;border:1px solid rgba(127,127,127,0.2);flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.2)}
                .galaxy-gui-color-text{flex:1;padding:8px 12px;border:1px solid rgba(127,127,127,0.2);border-radius:8px;font-family:monospace;background:rgba(127,127,127,0.08);color:inherit;outline:none;box-sizing:border-box}
                .galaxy-gui-color-swatches{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;width:100%;margin-top:4px}
                .galaxy-gui-color-swatch{width:100%;aspect-ratio:1;border-radius:6px;cursor:pointer;border:2px solid transparent;box-sizing:border-box;transition:transform 0.2s,border-color 0.2s}
                .galaxy-gui-color-swatch:hover{transform:scale(1.1)}
                .galaxy-gui-color-swatch.is-active{border-color:var(--galaxy-theme-primary,#4e6c9e);box-shadow:0 0 0 2px var(--galaxy-theme-surface,#fff)}
                .galaxy-gui-tabs-container{display:flex;flex-direction:column;width:100%;min-width:0;box-sizing:border-box}
                .galaxy-gui-tabs-header{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;position:relative;border-bottom:1px solid rgba(127,127,127,0.2)}
                .galaxy-gui-tabs-header::-webkit-scrollbar{display:none}
                .galaxy-gui-tab-btn{padding:8px 12px;font-size:13px;cursor:pointer;border-radius:8px 8px 0 0;opacity:0.6;white-space:nowrap;transition:background 0.2s,opacity 0.2s;flex-shrink:0}
                .galaxy-gui-tab-btn.is-active{opacity:1;font-weight:600;background:rgba(127,127,127,0.08)}
                .galaxy-gui-tabs-indicator{position:absolute;bottom:0;height:2px;background:var(--galaxy-theme-primary,#4e6c9e);transition:transform 0.3s ease,width 0.3s ease;border-radius:2px;left:0}
                .galaxy-gui-tabs-body{padding-top:8px;display:flex;flex-direction:column;gap:8px;width:100%;min-width:0;box-sizing:border-box}
                .galaxy-gui-tab-pane{display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box;min-width:0}
                .galaxy-gui-kv-container{display:flex;flex-direction:column;gap:6px;width:100%;box-sizing:border-box}
                .galaxy-gui-kv-row{display:flex;gap:4px;align-items:center;width:100%;box-sizing:border-box}
                .galaxy-gui-kv-input{flex:1;width:0;min-width:0;padding:6px 8px;font-size:12px;background:rgba(127,127,127,0.08);border:1px solid rgba(127,127,127,0.2);border-radius:6px;color:inherit;outline:none;box-sizing:border-box}
                .galaxy-gui-kv-btn{padding:6px;background:rgba(127,127,127,0.1);border:none;border-radius:6px;color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
                .galaxy-gui-kv-btn:hover{background:rgba(127,127,127,0.2)}
                .galaxy-gui-multi-dropdown{position:relative;display:flex;flex-direction:column;gap:6px;width:100%;box-sizing:border-box}
                .galaxy-gui-multi-trigger{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;font-size:14px;background:rgba(127,127,127,0.08);border:1px solid rgba(127,127,127,0.2);cursor:pointer;user-select:none;box-sizing:border-box;width:100%;gap:8px;min-height:42px;}
                .galaxy-gui-multi-trigger > div { overflow: hidden; flex: 1; text-align: left; display: flex; flex-wrap: nowrap; gap: 4px; align-items: center; }
                .galaxy-gui-multi-trigger svg{width:16px;height:16px;fill:currentColor;transition:transform 0.3s;flex-shrink:0;display:block}
                .galaxy-gui-multi-dropdown.is-open .galaxy-gui-multi-trigger svg{transform:rotate(180deg)}
                .galaxy-gui-multi-dropdown.is-open .galaxy-gui-dropdown-menu-wrapper{grid-template-rows:1fr;margin-top:4px;opacity:1}
                .galaxy-gui-multi-menu{display:flex;flex-direction:column;background:var(--galaxy-theme-surface,#fff);border:1px solid rgba(127,127,127,0.2);border-radius:8px;overflow:hidden;width:100%;box-sizing:border-box}
                .galaxy-gui-multi-item{display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:13px;cursor:pointer;border-bottom:1px solid rgba(127,127,127,0.1);box-sizing:border-box;text-align:left}
                .galaxy-gui-multi-item:last-child{border-bottom:none}
                .galaxy-gui-multi-item:hover{background:rgba(127,127,127,0.1)}
                .galaxy-gui-multi-checkbox{width:16px;height:16px;border-radius:4px;border:2px solid rgba(127,127,127,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.2s,border-color 0.2s;box-sizing:border-box}
                .galaxy-gui-multi-item.is-active .galaxy-gui-multi-checkbox{background:var(--galaxy-theme-primary,#4e6c9e);border-color:var(--galaxy-theme-primary,#4e6c9e)}
                .galaxy-gui-multi-item.is-active .galaxy-gui-multi-checkbox::after{content:'';width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);margin-bottom:2px}
                .galaxy-gui-multi-chip { background: rgba(127,127,127,0.12); color: inherit; padding: 0 8px; border-radius: 6px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; display: inline-flex; align-items: center; justify-content: center; height: 24px; flex-shrink: 0; box-sizing: border-box; }
                .galaxy-gui-multi-chip.is-more { background: transparent; border: none; color: inherit; padding: 0; margin-left: 4px; }
                .galaxy-gui-card{display:flex;flex-direction:column;background:var(--galaxy-theme-surface,#fff);border:1px solid rgba(127,127,127,0.2);border-radius:12px;padding:12px;width:100%;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
                .galaxy-gui-card-header{font-size:14px;font-weight:600;margin-bottom:8px;color:var(--galaxy-theme-color)}
                .galaxy-gui-card-body{display:flex;flex-direction:column;gap:8px}
                .galaxy-gui-chip{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 12px;border-radius:8px;border:1px solid rgba(127,127,127,0.3);font-size:13px;font-weight:500;color:var(--galaxy-theme-color);background:transparent;cursor:pointer;transition:background 0.2s,border-color 0.2s;box-sizing:border-box;flex-shrink:0;white-space:nowrap;gap:6px;}
                .galaxy-gui-chip:hover{background:rgba(127,127,127,0.08)}
                .galaxy-gui-chip.is-active{background:var(--galaxy-theme-primary);color:#fff;border-color:var(--galaxy-theme-primary)}
                .galaxy-gui-chip-icon{display:flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;}
                .galaxy-gui-chip-icon img { width: 100%; height: 100%; object-fit: contain; }
                .galaxy-gui-chip-text{display:flex;align-items:center;justify-content:center;line-height:1;}
                .galaxy-gui-chip-close{display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;opacity:0.7;transition:opacity 0.2s;margin-left:2px;flex-shrink:0;}
                .galaxy-gui-chip-close:hover{opacity:1;background:rgba(0,0,0,0.1)}
                .galaxy-gui-chip.is-active .galaxy-gui-chip-close:hover{background:rgba(255,255,255,0.2)}
                .galaxy-gui-list{display:flex;flex-direction:column;width:100%;box-sizing:border-box}
                .galaxy-gui-list-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(127,127,127,0.1);gap:12px;width:100%;box-sizing:border-box;height:60px;}
                .galaxy-gui-list-item:last-child{border-bottom:none}
                .galaxy-gui-list-item-content{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
                .galaxy-gui-list-icon{width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
                .galaxy-gui-list-text{display:flex;flex-direction:column;min-width:0}
                .galaxy-gui-list-title{font-size:14px;color:var(--galaxy-theme-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .galaxy-gui-list-subtitle{font-size:12px;opacity:0.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .galaxy-gui-list-action{flex-shrink:0}
                .galaxy-gui-accordion.is-disabled,.galaxy-gui-input-container.is-disabled,.galaxy-gui-slider-container.is-disabled,.galaxy-gui-dropdown.is-disabled,.galaxy-gui-choice-group.is-disabled,.galaxy-gui-time-wrap.is-disabled,.galaxy-gui-module.is-disabled,.galaxy-gui-switch-row.is-disabled,.galaxy-gui-console.is-disabled{opacity:0.5;pointer-events:none}
                .galaxy-gui-time-md3{display:flex;flex-direction:column;align-items:center;width:100%;max-width:100%;box-sizing:border-box;padding:10px 0;gap:12px;overflow:hidden}
                .md3-time-header{display:flex;align-items:center;justify-content:center;gap:4px;font-size:clamp(24px, 8vw, 36px);font-weight:400;color:var(--galaxy-theme-color);font-family:sans-serif;width:100%;box-sizing:border-box;flex-wrap:nowrap}
                .md3-time-part{cursor:pointer;padding:4px 6px;border-radius:8px;transition:background 0.2s;white-space:nowrap}
                .md3-time-part.is-active{background:var(--galaxy-theme-primary);color:#fff}
                .md3-time-sep{opacity:0.5;margin-bottom:4px}
                .md3-time-period{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:500;margin-left:4px;flex-shrink:0}
                .md3-period-btn{padding:2px 6px;border-radius:4px;cursor:pointer;border:1px solid rgba(127,127,127,0.3);text-align:center}
                .md3-period-btn.is-active{background:rgba(127,127,127,0.2);border-color:transparent}
                .md3-dial{position:relative;width:85%;aspect-ratio:1;border-radius:50%;background:rgba(127,127,127,0.08);user-select:none;touch-action:none;margin:0 auto}
                .md3-dial-center{position:absolute;left:50%;top:50%;width:8px;height:8px;border-radius:50%;background:var(--galaxy-theme-primary);transform:translate(-50%,-50%);z-index:3}
                .md3-dial-hand{position:absolute;left:50%;bottom:50%;width:2px;height:38%;background:var(--galaxy-theme-primary);margin-left:-1px;transform-origin:bottom center;z-index:2;pointer-events:none}
                .md3-dial-pointer{position:absolute;width:32px;height:32px;border-radius:50%;background:var(--galaxy-theme-primary);transform:translate(-50%, -50%);pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:6;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:500}
                .md3-dial-number{position:absolute;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;transform:translate(-50%,-50%);border-radius:50%;z-index:5;cursor:pointer;color:var(--galaxy-theme-color);font-weight:500;transition:background 0.2s,color 0.2s}
            `;
            document.head.appendChild(style);
        }
        GalaxyStyleRefCount.clickgui++;
    }

    /**
     * @private
     * @description Creates an icon element from a configuration.
     * @param {string|Icon} iconConfig - Icon configuration.
     * @param {string} [className] - Additional class names.
     * @returns {HTMLElement|null} The icon element.
     */
    _createIcon(iconConfig, className) {
        if (!iconConfig) return null;
        let iconObj = iconConfig;
        if (typeof iconConfig === 'string') iconObj = new Icon(iconConfig);

        const el = document.createElement('span');
        if (className) el.className = className;

        if (iconObj instanceof Icon) {
            if (iconObj.type === 'network' || iconObj.type === 'local') {
                const img = document.createElement('img');
                img.src = iconObj.value;
                img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
                el.appendChild(img);
            } else {
                el.textContent = iconObj.value;
            }
            return el;
        }
        return null;
    }

    /**
     * @private
     * @description Renders the main container and initial panels.
     */
    _render() {
        this.container = document.createElement('div');
        this.container.className = 'galaxy-gui-container';
        this.galaxy.wrapperEl.appendChild(this.container);
        if (Array.isArray(this.options.clicks)) {
            this.options.clicks.forEach((clickConfig, index) => this._createClick(clickConfig, index));
        }
    }

    /**
     * @description Gets the parent Galaxy instance.
     * @returns {Galaxy} The galaxy instance.
     */
    getGalaxy() { return this.galaxy; }

    /**
     * @description Gets all click panel handles.
     * @returns {Array<Object>} Array of panel handles.
     */
    getClicks() { return this._clickHandles.slice(); }

    /**
     * @description Retrieves a specific click panel by index or name.
     * @param {number|string} ref - Panel index or name.
     * @returns {Object|null} Panel handle or null.
     */
    getClick(ref) {
        if (ref === undefined || ref === null) return null;
        if (typeof ref === 'number') return this._clickHandles[ref] || null;
        return this._clickHandles.find(h => h.name === ref) || null;
    }

    /**
     * @description Sets the position of a specific panel.
     * @param {number|string} ref - Panel index or name.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @returns {boolean} True if successful.
     */
    setClickPosition(ref, x, y) {
        const handle = this.getClick(ref);
        if (!handle) return false;
        handle.el.style.left = `${x}px`;
        handle.el.style.top = `${y}px`;
        return true;
    }

    /**
     * @description Adds a new panel dynamically.
     * @param {Object} config - Panel configuration.
     * @returns {Object|null} Panel handle.
     */
    addClick(config) {
        if (this._destroyed) return null;
        return this._createClick(config || {}, this._clickHandles.length);
    }

    /**
     * @description Removes a panel.
     * @param {number|string} ref - Panel index or name.
     * @returns {boolean} True if successful.
     */
    removeClick(ref) {
        const handle = this.getClick(ref);
        if (!handle) return false;
        const i = this._clickHandles.indexOf(handle);
        if (i >= 0) this._clickHandles.splice(i, 1);
        handle.destroy();
        return true;
    }

    /**
     * @description Brings a panel to the front.
     * @param {number|string} ref - Panel index or name.
     * @returns {boolean} True if successful.
     */
    bringToFront(ref) {
        const handle = this.getClick(ref);
        if (!handle) return false;
        this._zIndexCounter++;
        handle.el.style.zIndex = this._zIndexCounter;
        return true;
    }

    /**
     * @description Sets the Galaxy theme.
     * @param {string} name - Theme name.
     * @returns {boolean} True if successful.
     */
    setTheme(name) {
        if (this.galaxy && typeof this.galaxy.setTheme === 'function') {
            this.galaxy.setTheme(name);
            return true;
        }
        return false;
    }

    /**
     * @description Checks if a panel is expanded.
     * @param {number} [index=0] - Panel index.
     * @returns {boolean} True if expanded.
     */
    isClickExpanded(index = 0) {
        const handle = this._clickHandles[index];
        return handle ? !handle.isCollapsed() : false;
    }

    /**
     * @description Sets the default width for all panels.
     * @param {number} width - Width in pixels.
     */
    setClickWidth(width) {
        this._defaultWidth = width;
        this.container.style.setProperty('--gui-panel-width', `${width}px`);
        this._clampClicks();
    }

    /**
     * @description Sets the max height for panels.
     * @param {number|string} height - Max height.
     */
    setClickMaxHeight(height) {
        const val = typeof height === 'number' ? `${height}px` : height;
        this.container.style.setProperty('--gui-panel-max-height', val);
        this._clampClicks();
    }

    /**
     * @description Destroys the GUI and cleans up styles.
     */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        window.removeEventListener('resize', this._onWindowResize);
        window.removeEventListener('orientationchange', this._onWindowResize);
        this._clickHandles.forEach(h => { try { h.destroy(); } catch (e) {} });
        this._clickHandles = [];
        if (this.container && this.container.parentNode) this.container.parentNode.removeChild(this.container);
        this.container = null;
        GalaxyStyleRefCount.clickgui = Math.max(0, GalaxyStyleRefCount.clickgui - 1);
        if (GalaxyStyleRefCount.clickgui === 0) {
            const styleEl = document.getElementById('galaxy-clickgui-styles');
            if (styleEl) styleEl.remove();
        }
    }

    /**
     * @private
     * @description Creates a click panel.
     * @param {Object} config - Panel configuration.
     * @param {number} index - Panel index.
     * @returns {Object} Panel handle.
     */
    _createClick(config, index) {
        const panel = document.createElement('div');
        panel.className = 'galaxy-gui-panel';
        panel.style.top = '60px';
        panel.style.left = `${20 + index * (this._defaultWidth + 20)}px`;
        if (config.collapsed) panel.classList.add('is-collapsed');

        const header = document.createElement('div');
        header.className = 'galaxy-gui-header';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'galaxy-gui-header-title';
        const iconEl = this._createIcon(config.icon, 'galaxy-gui-header-icon');
        if (iconEl) titleWrap.appendChild(iconEl);
        const nameSpan = document.createElement('span');
        nameSpan.textContent = config.name || '';
        titleWrap.appendChild(nameSpan);

        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'galaxy-gui-collapse-btn';
        collapseBtn.type = 'button';
        collapseBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;
        header.appendChild(titleWrap); header.appendChild(collapseBtn);

        const bodyWrapper = document.createElement('div');
        bodyWrapper.className = 'galaxy-gui-body-wrapper';
        const bodyInner = document.createElement('div');
        bodyInner.className = 'galaxy-gui-body-inner';
        const body = document.createElement('div');
        body.className = 'galaxy-gui-body';

        const components = [];
        let handle = null;
        const pushComponent = (h) => { if (h) components.push(h); return h; };

        if (Array.isArray(config.groups)) {
            config.groups.forEach(groupConf => {
                const groupEl = document.createElement('div');
                groupEl.className = `galaxy-gui-group layout-${groupConf.layout || 'column'}`;
                if (Array.isArray(groupConf.components)) {
                    groupConf.components.forEach(compConf => pushComponent(this._createComponent(groupEl, compConf)));
                }
                body.appendChild(groupEl);
            });
        }

        bodyInner.appendChild(body); bodyWrapper.appendChild(bodyInner);
        panel.appendChild(header); panel.appendChild(bodyWrapper);
        this.container.appendChild(panel);

        const applyCollapse = () => {
            this._clampClicks();
            setTimeout(() => { if (!this._destroyed) this._clampClicks(); }, 320);
        };

        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); panel.classList.toggle('is-collapsed'); applyCollapse();
        });
        this._initDrag(panel, header);

        const findRecursive = (list, ref) => {
            for (let c of list) {
                if (typeof ref !== 'number' && c.key === ref) return c;
                if (c.type === 'accordion') { const f = c.getChild(ref); if (f) return f; }
                if (c.type === 'group') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'card') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'tabs') { const f = c.getComponent(ref); if (f) return f; }
            }
            return null;
        };

        handle = {
            el: panel, bodyEl: body, headerEl: header, bodyWrapperEl: bodyWrapper,
            index, name: config.name || '', config,
            collapse: () => { panel.classList.add('is-collapsed'); applyCollapse(); },
            expand: () => { panel.classList.remove('is-collapsed'); applyCollapse(); },
            toggle: () => { panel.classList.toggle('is-collapsed'); applyCollapse(); },
            isCollapsed: () => panel.classList.contains('is-collapsed'),
            setTitle: (t) => { nameSpan.textContent = t; handle.name = t; },
            setIcon: (iconData) => {
                if (iconEl) iconEl.remove();
                const newIcon = this._createIcon(iconData, 'galaxy-gui-header-icon');
                if (newIcon) titleWrap.insertBefore(newIcon, nameSpan);
            },
            addComponent: (cfg, groupIndex = 0) => {
                const groups = body.querySelectorAll('.galaxy-gui-group');
                const target = groups[groupIndex] || body;
                return pushComponent(this._createComponent(target, cfg));
            },
            getComponent: (ref) => {
                if (ref === undefined || ref === null) return null;
                if (typeof ref === 'number') return components[ref] || null;
                return findRecursive(components, ref);
            },
            getComponents: () => components.slice(),
            removeComponent: (ref) => {
                const h = handle.getComponent(ref);
                if (!h) return false;
                const i = components.indexOf(h);
                if (i >= 0) components.splice(i, 1);
                try { h.destroy(); } catch (e) {}
                return true;
            },
            setWidth: (px) => { panel.style.setProperty('--gui-panel-width', `${px}px`); this._clampClicks(); },
            setMaxHeight: (h) => { const v = typeof h === 'number' ? `${h}px` : h; panel.style.setProperty('--gui-panel-max-height', v); this._clampClicks(); },
            bringToFront: () => { this._zIndexCounter++; panel.style.zIndex = this._zIndexCounter; },
            destroy: () => {
                if (handle._destroyed) return;
                handle._destroyed = true;
                components.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} });
                components.length = 0;
                if (panel.parentNode) panel.parentNode.removeChild(panel);
            },
            _destroyed: false
        };

        components.forEach(c => { c._panel = handle; });
        this._clickHandles.push(handle);
        requestAnimationFrame(() => { if (!this._destroyed) this._clampClicks(); });
        return handle;
    }

    /**
     * @private
     * @description Resolves a style configuration.
     * @param {Object|string} styleConfig - Style configuration or template ID.
     * @returns {Object|null} Resolved style object.
     */
    _resolveStyle(styleConfig) {
        if (!styleConfig) return null;
        if (typeof styleConfig === 'string') { const tpl = GalaxyClickGui._styleTemplates[styleConfig]; return tpl ? Object.assign({}, tpl) : null; }
        if (typeof styleConfig === 'object') return Object.assign({}, styleConfig);
        return null;
    }

    /**
     * @private
     * @description Decorates a component handle with styling and lifecycle methods.
     * @param {Object} handle - The base handle object.
     * @param {HTMLElement} el - The root element.
     * @param {Object} [opts={}] - Options.
     * @returns {Object} Decorated handle.
     */
    _decorateHandle(handle, el, opts = {}) {
        const styleTargets = Array.isArray(opts.styleTargets) && opts.styleTargets.length ? opts.styleTargets : [el];
        const themeTargets = Array.isArray(opts.themeTargets) && opts.themeTargets.length ? opts.themeTargets : [el];
        const inlineStyle = {};
        const themeStyle = {};
        const toKebab = (s) => s.replace(/([A-Z])/g, '-$1').toLowerCase();
        const PX_PROPS = new Set(['width', 'height', 'padding', 'margin', 'borderRadius', 'fontSize']);

        const applyOne = (t, key, value) => {
            const cssKey = toKebab(key);
            if (value === null || value === undefined) { t.style.removeProperty(cssKey); return; }
            let v = value; if (PX_PROPS.has(key) && typeof v === 'number') v = v + 'px';
            t.style.setProperty(cssKey, String(v));
        };
        const applyAll = () => styleTargets.forEach(t => Object.keys(inlineStyle).forEach(k => applyOne(t, k, inlineStyle[k])));
        const themeCssMap = { background: 'background', color: 'color', primary: '--galaxy-theme-primary', border: 'border', hover: '--galaxy-theme-hover' };
        const applyTheme = () => {
            themeTargets.forEach(t => {
                Object.keys(themeStyle).forEach(k => {
                    const cssKey = themeCssMap[k] || k;
                    const v = themeStyle[k];
                    if (v === null || v === undefined) t.style.removeProperty(cssKey);
                    else t.style.setProperty(cssKey, String(v));
                });
            });
        };
        const setStyle = (partial) => { if (!partial || typeof partial !== 'object') return handle; Object.assign(inlineStyle, partial); applyAll(); return handle; };
        const setThemePartial = (partial) => { if (!partial || typeof partial !== 'object') return handle; Object.assign(themeStyle, partial); applyTheme(); return handle; };

        const single = (prop) => ({
            ['set' + prop.charAt(0).toUpperCase() + prop.slice(1)]: (v) => { inlineStyle[prop] = v; applyAll(); return handle; },
            ['get' + prop.charAt(0).toUpperCase() + prop.slice(1)]: () => inlineStyle[prop] !== undefined ? inlineStyle[prop] : null
        });

        const attachCbs = [];
        const detachCbs = [];
        let attached = false;
        const originalDestroy = handle.destroy;

        Object.assign(handle, {
            setStyle,
            getStyle: () => Object.assign({}, inlineStyle),
            resetStyle: () => {
                Object.keys(inlineStyle).forEach(k => delete inlineStyle[k]);
                const allProps = ['width', 'height', 'padding', 'margin', 'background', 'color', 'border', 'borderRadius', 'boxShadow', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'visibility'];
                styleTargets.forEach(t => allProps.forEach(k => t.style.removeProperty(toKebab(k))));
                return handle;
            },
            setTheme: setThemePartial,
            getTheme: () => Object.assign({}, themeStyle),
            resetTheme: () => {
                Object.keys(themeStyle).forEach(k => delete themeStyle[k]);
                themeTargets.forEach(t => Object.keys(themeCssMap).forEach(k => t.style.removeProperty(themeCssMap[k])));
                return handle;
            },
            setWidth: (v) => { inlineStyle.width = v; applyAll(); return handle; },
            getWidth: () => el.getBoundingClientRect().width,
            getMeasuredWidth: () => el.getBoundingClientRect().width,
            getLayoutWidth: () => inlineStyle.width !== undefined ? inlineStyle.width : null,
            setHeight: (v) => { inlineStyle.height = v; applyAll(); return handle; },
            getHeight: () => el.getBoundingClientRect().height,
            getMeasuredHeight: () => el.getBoundingClientRect().height,
            getLayoutHeight: () => inlineStyle.height !== undefined ? inlineStyle.height : null,
            ...single('padding'), ...single('margin'), ...single('background'), ...single('color'),
            ...single('border'), ...single('borderRadius'), ...single('boxShadow'), ...single('opacity'),
            ...single('fontSize'), ...single('fontWeight'), ...single('textAlign'), ...single('visibility'),
            onAttach: (fn) => { if (typeof fn !== 'function') return handle; if (attached) { try { fn(handle); } catch (e) {} } else attachCbs.push(fn); return handle; },
            onDetach: (fn) => { if (typeof fn === 'function') detachCbs.push(fn); return handle; },
            isAttached: () => attached,
            destroy: () => {
                if (handle._destroyed) return;
                detachCbs.forEach(fn => { try { fn(handle); } catch (e) {} });
                detachCbs.length = 0;
                attached = false;
                originalDestroy();
            }
        });

        if (opts.initialStyle) setStyle(opts.initialStyle);
        requestAnimationFrame(() => {
            if (handle._destroyed) return;
            attached = true;
            attachCbs.forEach(fn => { try { fn(handle); } catch (e) {} });
            attachCbs.length = 0;
        });
        return handle;
    }

    /**
     * @private
     * @description Component factory routing.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Component configuration.
     * @returns {Object|null} Component handle.
     */
    _createComponent(container, config) {
        if (!config || !config.type) return null;
        let handle = null;
        switch (config.type) {
            case 'button': handle = this._createButton(container, config); break;
            case 'toggle': handle = this._createToggle(container, config); break;
            case 'switch': handle = this._createSwitch(container, config); break;
            case 'accordion': handle = this._createAccordion(container, config); break;
            case 'text': handle = this._createText(container, config); break;
            case 'input': handle = this._createInput(container, config); break;
            case 'slider': handle = this._createSlider(container, config); break;
            case 'dropdown': handle = this._createDropdown(container, config); break;
            case 'checkbox-group':
            case 'radio-group': handle = this._createChoiceGroup(container, config); break;
            case 'time': handle = this._createTime(container, config); break;
            case 'console': handle = this._createConsole(container, config); break;
            case 'group': handle = this._createGroup(container, config); break;
            case 'divider': handle = this._createDivider(container, config); break;
            case 'progress': handle = this._createProgress(container, config); break;
            case 'image': handle = this._createImage(container, config); break;
            case 'color-picker': handle = this._createColorPicker(container, config); break;
            case 'tabs': handle = this._createTabs(container, config); break;
            case 'key-value': handle = this._createKeyValue(container, config); break;
            case 'multi-dropdown': handle = this._createMultiDropdown(container, config); break;
            case 'card': handle = this._createCard(container, config); break;
            case 'chip': handle = this._createChip(container, config); break;
            case 'list': handle = this._createList(container, config); break;
            case 'virtual-recycler-list': handle = this._createVirtualRecyclerList(container, config); break;
            default: return null;
        }
        if (handle) {
            handle.key = config.key || null;
            handle.type = config.type;
            handle.config = config;
            handle._destroyed = false;
            const baseDestroy = handle.destroy.bind(handle);
            handle.destroy = () => { if (handle._destroyed) return; handle._destroyed = true; try { baseDestroy(); } catch (e) {} };
        }
        return handle;
    }

    /**
     * @private
     * @description Creates a button component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createButton(container, config) {
        let disabled = false;
        let onClickCb = config.onClick;
        let handle = null;
        const fire = () => { if (!disabled && typeof onClickCb === 'function') onClickCb(this.galaxy, handle); };
        const btn = new GalaxyButton({ container, text: config.text || '', shape: config.shape || '', onClick: fire, theme: this.galaxy.currentTheme.btn });
        btn.el.style.setProperty('--galaxy-btn-bg', 'transparent');
        btn.el.style.setProperty('--galaxy-btn-color', 'var(--galaxy-theme-color)');
        btn.el.style.setProperty('--galaxy-btn-border', 'var(--galaxy-theme-border)');
        btn.el.style.setProperty('--galaxy-btn-hover-bg', 'var(--galaxy-theme-hover)');
        if (config.width) btn.el.style.width = typeof config.width === 'number' ? `${config.width}px` : config.width;
        if (config.height) btn.el.style.height = typeof config.height === 'number' ? `${config.height}px` : config.height;
        handle = {
            el: btn.el, click: fire, setText: (s) => btn.setText(s),
            setDisabled: (b) => { disabled = !!b; btn.setDisabled(disabled); }, isDisabled: () => disabled,
            getValue: () => null, setValue: () => {}, setLabel: (s) => btn.setText(s),
            onClick: (fn) => { onClickCb = fn; }, destroy: () => btn.destroy()
        };
        return this._decorateHandle(handle, btn.el, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a toggle component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createToggle(container, config) {
        const el = document.createElement('div');
        el.className = 'galaxy-gui-module';
        let active = !!config.value, disabled = false, onChangeCb = config.onChange;
        if (active) el.classList.add('is-active');
        el.textContent = config.label || '';
        el.addEventListener('click', () => {
            if (disabled) return; active = !active; el.classList.toggle('is-active', active);
            if (onChangeCb) onChangeCb(active);
        });
        container.appendChild(el);
        const setVal = (v) => { active = !!v; el.classList.toggle('is-active', active); };
        const handle = {
            el, getValue: () => active, setValue: setVal, setActive: setVal, isActive: () => active,
            toggle: () => setVal(!active), setLabel: (t) => { el.textContent = t; },
            setDisabled: (b) => { disabled = !!b; el.classList.toggle('is-disabled', disabled); },
            isDisabled: () => disabled, onChange: (fn) => { onChangeCb = fn; },
            destroy: () => { if (el.parentNode) el.parentNode.removeChild(el); }
        };
        return this._decorateHandle(handle, el, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a switch component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createSwitch(container, config) {
        const wrap = document.createElement('div');
        wrap.className = 'galaxy-gui-switch-row';
        const leftWrap = document.createElement('div');
        leftWrap.className = 'galaxy-gui-switch-left';

        const iconEl = this._createIcon(config.icon, 'galaxy-gui-switch-icon');
        if (iconEl) leftWrap.appendChild(iconEl);

        const label = document.createElement('span');
        label.textContent = config.label || '';
        leftWrap.appendChild(label);
        const track = document.createElement('div');
        track.className = 'galaxy-gui-switch-track';
        const thumb = document.createElement('div');
        thumb.className = 'galaxy-gui-switch-thumb'; track.appendChild(thumb);
        let active = !!config.value, disabled = false, onChangeCb = config.onChange;
        if (active) track.classList.add('is-active');
        wrap.appendChild(leftWrap); wrap.appendChild(track);
        wrap.addEventListener('click', () => {
            if (disabled) return; active = !active; track.classList.toggle('is-active', active);
            if (onChangeCb) onChangeCb(active);
        });
        container.appendChild(wrap);
        const setVal = (v) => { active = !!v; track.classList.toggle('is-active', active); };
        const handle = {
            el: wrap, getValue: () => active, setValue: setVal, setOn: setVal, isOn: () => active,
            toggle: () => setVal(!active), setLabel: (t) => { label.textContent = t; },
            setDisabled: (b) => { disabled = !!b; wrap.classList.toggle('is-disabled', disabled); },
            isDisabled: () => disabled, onChange: (fn) => { onChangeCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates an accordion component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createAccordion(container, config) {
        const wrap = document.createElement('div');
        wrap.className = 'galaxy-gui-accordion';
        if (config.expanded) wrap.classList.add('is-expanded');
        const header = document.createElement('div');
        header.className = 'galaxy-gui-accordion-header';
        const title = document.createElement('span');
        title.textContent = config.label || '';
        const arrow = document.createElement('div');
        arrow.className = 'galaxy-gui-accordion-arrow';

        const customArrow = this._createIcon(config.arrowIcon);
        if (customArrow) {
            arrow.appendChild(customArrow);
        } else {
            arrow.innerHTML = `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
        }

        header.appendChild(title); header.appendChild(arrow);
        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'galaxy-gui-accordion-body';
        const bodyInner = document.createElement('div');
        bodyInner.className = 'galaxy-gui-accordion-inner';
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'galaxy-gui-accordion-children';
        const children = [];
        let disabled = false;
        if (Array.isArray(config.children)) {
            config.children.forEach(childConf => { const h = this._createComponent(childrenContainer, childConf); if (h) children.push(h); });
        }
        bodyInner.appendChild(childrenContainer); bodyWrap.appendChild(bodyInner);
        wrap.appendChild(header); wrap.appendChild(bodyWrap);
        header.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault(); if (disabled) return; wrap.classList.toggle('is-expanded');
        });
        container.appendChild(wrap);
        const findRecursive = (list, ref) => {
            for (let c of list) {
                if (typeof ref !== 'number' && c.key === ref) return c;
                if (c.type === 'accordion') { const f = c.getChild(ref); if (f) return f; }
                if (c.type === 'group') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'card') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'tabs') { const f = c.getComponent(ref); if (f) return f; }
            }
            return null;
        };
        const handle = {
            el: wrap, bodyEl: childrenContainer,
            expand: () => wrap.classList.add('is-expanded'),
            collapse: () => wrap.classList.remove('is-expanded'),
            toggle: () => wrap.classList.toggle('is-expanded'),
            isExpanded: () => wrap.classList.contains('is-expanded'),
            setLabel: (t) => { title.textContent = t; },
            addChild: (cfg) => { const h = this._createComponent(childrenContainer, cfg); if (h) children.push(h); return h; },
            getChildren: () => children.slice(),
            getChild: (ref) => typeof ref === 'number' ? children[ref] || null : findRecursive(children, ref),
            removeChild: (ref) => {
                const h = typeof ref === 'number' ? children[ref] : children.find(c => c.key === ref);
                if (!h) return false;
                const i = children.indexOf(h); if (i >= 0) children.splice(i, 1);
                try { if (!h._destroyed) h.destroy(); } catch (e) {} return true;
            },
            setDisabled: (b) => { disabled = !!b; wrap.classList.toggle('is-disabled', disabled); },
            isDisabled: () => disabled,
            destroy: () => {
                children.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} });
                children.length = 0; if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a text component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createText(container, config) {
        const el = document.createElement('div');
        el.className = 'galaxy-gui-text'; el.textContent = config.content || '';
        container.appendChild(el);
        const handle = {
            el, getValue: () => el.textContent, setValue: (s) => { el.textContent = s; },
            setContent: (s) => { el.textContent = s; }, setLabel: (s) => { el.textContent = s; },
            setDisabled: () => {}, isDisabled: () => false, onChange: () => {},
            destroy: () => { if (el.parentNode) el.parentNode.removeChild(el); }
        };
        return this._decorateHandle(handle, el, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates an input component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createInput(container, config) {
        const wrap = document.createElement('div');
        wrap.className = 'galaxy-gui-input-container';
        let labelEl = null;
        if (config.label) {
            labelEl = document.createElement('div'); labelEl.className = 'galaxy-gui-input-label';
            labelEl.textContent = config.label; wrap.appendChild(labelEl);
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'galaxy-gui-input-wrapper';

        const iconEl = this._createIcon(config.icon, 'galaxy-gui-input-icon');
        if (iconEl) wrapper.appendChild(iconEl);

        const input = document.createElement('input');
        input.className = 'galaxy-gui-input'; input.type = 'text';
        input.placeholder = config.placeholder || ''; input.value = config.value || '';
        let disabled = false, onChangeCb = config.onChange, onFocusCb = null, onBlurCb = null;
        const clearBtn = document.createElement('button');
        clearBtn.className = 'galaxy-gui-input-clear';

        if (config.clearable) {
            const clearIconEl = this._createIcon(config.clearIcon);
            if (clearIconEl) clearBtn.appendChild(clearIconEl);
        }
        clearBtn.type = 'button';

        const updateHasValue = () => {
            if (input.value.length > 0 && config.clearable) wrapper.classList.add('has-value');
            else wrapper.classList.remove('has-value');
        };
        updateHasValue();
        input.addEventListener('input', (e) => {
            if (disabled) return; updateHasValue(); if (onChangeCb) onChangeCb(e.target.value);
        });
        input.addEventListener('focus', () => { if (onFocusCb) onFocusCb(input.value); });
        input.addEventListener('blur', () => { if (onBlurCb) onBlurCb(input.value); });
        clearBtn.addEventListener('click', () => {
            if (disabled) return; input.value = ''; updateHasValue(); if (onChangeCb) onChangeCb(''); input.focus();
        });
        wrapper.appendChild(input);
        if (config.clearable) wrapper.appendChild(clearBtn);
        wrap.appendChild(wrapper);
        let hintEl = null;
        if (config.hint) {
            hintEl = document.createElement('div'); hintEl.className = 'galaxy-gui-input-hint';
            hintEl.textContent = config.hint; wrap.appendChild(hintEl);
        }
        container.appendChild(wrap);
        const handle = {
            el: wrap, inputEl: input, getValue: () => input.value,
            setValue: (v) => { input.value = v; updateHasValue(); },
            setPlaceholder: (s) => { input.placeholder = s; },
            setLabel: (t) => { if (labelEl) labelEl.textContent = t; },
            setHint: (t) => {
                if (!hintEl) { hintEl = document.createElement('div'); hintEl.className = 'galaxy-gui-input-hint'; wrap.appendChild(hintEl); }
                hintEl.textContent = t;
            },
            focus: () => input.focus(), blur: () => input.blur(),
            select: () => { input.focus(); input.select(); },
            setDisabled: (b) => { disabled = !!b; input.disabled = disabled; wrap.classList.toggle('is-disabled', disabled); },
            isDisabled: () => disabled, onChange: (fn) => { onChangeCb = fn; },
            onFocus: (fn) => { onFocusCb = fn; }, onBlur: (fn) => { onBlurCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style), styleTargets: [wrap, input] });
    }

    /**
     * @private
     * @description Creates a slider component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createSlider(container, config) {
        const wrap = document.createElement('div');
        wrap.className = 'galaxy-gui-slider-container';
        const header = document.createElement('div');
        header.className = 'galaxy-gui-slider-header';
        const labelEl = document.createElement('span');
        labelEl.textContent = config.label || '';
        const valText = document.createElement('span');
        valText.textContent = config.value !== undefined ? config.value : '';
        header.appendChild(labelEl); header.appendChild(valText);
        const trackWrapper = document.createElement('div');
        trackWrapper.className = 'galaxy-gui-slider-track-wrapper';
        const slider = document.createElement('input');
        slider.className = 'galaxy-gui-slider'; slider.type = 'range';
        slider.min = config.min !== undefined ? config.min : 0;
        slider.max = config.max !== undefined ? config.max : 100;
        slider.step = config.step !== undefined ? config.step : 1;
        slider.value = config.value !== undefined ? config.value : 0;
        let disabled = false, onChangeCb = config.onChange, onFocusCb = null, onBlurCb = null;
        let ticksEl = null, tooltipEl = null, renderTicks = () => {};
        const isDiscrete = config.discrete || config.showTicks;
        const showTooltip = config.showTooltip !== false;
        if (isDiscrete) {
            wrap.classList.add('is-discrete'); ticksEl = document.createElement('div');
            ticksEl.className = 'galaxy-gui-slider-ticks'; trackWrapper.appendChild(ticksEl);
        }
        if (showTooltip) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'galaxy-gui-slider-tooltip'; trackWrapper.appendChild(tooltipEl);
        }
        if (isDiscrete) {
            renderTicks = () => {
                ticksEl.innerHTML = '';
                const min = parseFloat(slider.min), max = parseFloat(slider.max), step = parseFloat(slider.step) || 1;
                const count = Math.floor((max - min) / step) + 1;
                let renderStep = 1; if (count > 30) renderStep = Math.ceil(count / 30);
                for (let i = 0; i < count; i += renderStep) {
                    if (i === 0 || i === count - 1) continue;
                    const tick = document.createElement('div'); tick.className = 'galaxy-gui-slider-tick';
                    const val = min + i * step;
                    tick.style.left = `calc(${(val - min) / (max - min) * 100}% - 0px)`;
                    ticksEl.appendChild(tick);
                }
            };
            renderTicks();
        }

        const updateUI = () => {
            const min = parseFloat(slider.min), max = parseFloat(slider.max), val = parseFloat(slider.value);
            const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
            slider.style.setProperty('--val', `${pct}%`); valText.textContent = slider.value;

            if (tooltipEl) {
                tooltipEl.textContent = slider.value;
                if (pct < 10) {
                    tooltipEl.style.left = `0%`;
                    tooltipEl.style.right = 'auto';
                    tooltipEl.style.transform = tooltipEl.classList.contains('is-visible') ? `translateX(0) scale(1)` : `translateX(0) scale(0.8)`;
                    tooltipEl.style.transformOrigin = 'left bottom';
                } else if (pct > 90) {
                    tooltipEl.style.left = 'auto';
                    tooltipEl.style.right = `0%`;
                    tooltipEl.style.transform = tooltipEl.classList.contains('is-visible') ? `translateX(0) scale(1)` : `translateX(0) scale(0.8)`;
                    tooltipEl.style.transformOrigin = 'right bottom';
                } else {
                    tooltipEl.style.left = `${pct}%`;
                    tooltipEl.style.right = 'auto';
                    tooltipEl.style.transform = tooltipEl.classList.contains('is-visible') ? `translateX(-50%) scale(1)` : `translateX(-50%) scale(0.8)`;
                    tooltipEl.style.transformOrigin = 'center bottom';
                }
            }
        };
        updateUI();
        slider.addEventListener('input', (e) => {
            if (disabled) return; updateUI(); if (onChangeCb) onChangeCb(parseFloat(e.target.value));
        });
        slider.addEventListener('focus', () => { if (onFocusCb) onFocusCb(parseFloat(slider.value)); });
        slider.addEventListener('blur', () => { if (onBlurCb) onBlurCb(parseFloat(slider.value)); });
        const showBubble = () => { if (tooltipEl && !disabled) { tooltipEl.classList.add('is-visible'); updateUI(); } };
        const hideBubble = () => { if (tooltipEl) { tooltipEl.classList.remove('is-visible'); updateUI(); } };
        slider.addEventListener('pointerdown', showBubble);
        slider.addEventListener('pointerup', hideBubble);
        slider.addEventListener('pointerleave', hideBubble);
        trackWrapper.appendChild(slider); wrap.appendChild(header); wrap.appendChild(trackWrapper); container.appendChild(wrap);
        const handle = {
            el: wrap, inputEl: slider, getValue: () => parseFloat(slider.value),
            setValue: (v) => { slider.value = v; updateUI(); },
            getPercent: () => {
                const min = parseFloat(slider.min), max = parseFloat(slider.max), val = parseFloat(slider.value);
                return max === min ? 0 : ((val - min) / (max - min)) * 100;
            },
            setRange: (min, max, step) => {
                slider.min = min; slider.max = max; if (step !== undefined) slider.step = step; renderTicks(); updateUI();
            },
            setLabel: (t) => { labelEl.textContent = t; },
            setDisabled: (b) => {
                disabled = !!b; slider.disabled = disabled; wrap.classList.toggle('is-disabled', disabled);
                if (disabled) hideBubble();
            },
            isDisabled: () => disabled, onChange: (fn) => { onChangeCb = fn; },
            onFocus: (fn) => { onFocusCb = fn; }, onBlur: (fn) => { onBlurCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a dropdown component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createDropdown(container, config) {
        const wrap = document.createElement('div');
        wrap.className = 'galaxy-gui-dropdown';
        let labelEl = null;
        if (config.label) {
            labelEl = document.createElement('div'); labelEl.className = 'galaxy-gui-input-label';
            labelEl.textContent = config.label; wrap.appendChild(labelEl);
        }
        const trigger = document.createElement('div');
        trigger.className = 'galaxy-gui-dropdown-trigger';
        const selectedText = document.createElement('span');

        const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrowSvg.setAttribute('viewBox', '0 0 24 24');
        arrowSvg.innerHTML = `<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>`;
        trigger.appendChild(selectedText); trigger.appendChild(arrowSvg);

        const menuWrapper = document.createElement('div');
        menuWrapper.className = 'galaxy-gui-dropdown-menu-wrapper';
        const menuInner = document.createElement('div');
        menuInner.className = 'galaxy-gui-dropdown-menu-inner';
        const menu = document.createElement('div');
        menu.className = 'galaxy-gui-dropdown-menu';
        let options = Array.isArray(config.options) ? config.options.slice() : [];
        let selectedValue = config.value !== undefined ? config.value : (options[0] ? options[0].value : null);
        let disabled = false, isOpen = false, onChangeCb = config.onChange, onFocusCb = null, onBlurCb = null;
        const updateDisplay = () => {
            const opt = options.find(o => o.value === selectedValue);
            selectedText.textContent = opt ? opt.label : (config.placeholder || '');
        };
        const rebuildMenu = () => {
            menu.innerHTML = '';
            options.forEach(opt => {
                const item = document.createElement('div');
                item.className = 'galaxy-gui-dropdown-item';
                if (opt.value === selectedValue) item.classList.add('is-active');
                item.textContent = opt.label;
                item.addEventListener('click', (e) => {
                    e.stopPropagation(); if (disabled) return;
                    selectedValue = opt.value; updateDisplay(); closeMenu();
                    if (onBlurCb) onBlurCb(selectedValue);
                    menu.querySelectorAll('.galaxy-gui-dropdown-item').forEach((c, idx) => {
                        c.classList.toggle('is-active', options[idx] && options[idx].value === selectedValue);
                    });
                    if (onChangeCb) onChangeCb(opt.value);
                });
                menu.appendChild(item);
            });
        };
        const openMenu = () => { if (disabled) return; wrap.classList.add('is-open'); isOpen = true; if (onFocusCb) onFocusCb(selectedValue); };
        const closeMenu = () => { wrap.classList.remove('is-open'); isOpen = false; };
        const toggleMenu = () => { if (isOpen) { closeMenu(); if (onBlurCb) onBlurCb(selectedValue); } else openMenu(); };
        trigger.addEventListener('click', (e) => { e.stopPropagation(); if (disabled) return; toggleMenu(); });
        menu.addEventListener('pointerdown', (e) => e.stopPropagation());
        rebuildMenu(); updateDisplay();
        menuInner.appendChild(menu); menuWrapper.appendChild(menuInner);
        wrap.appendChild(trigger); wrap.appendChild(menuWrapper); container.appendChild(wrap);
        const handle = {
            el: wrap, open: openMenu, close: closeMenu, toggle: toggleMenu, isOpen: () => isOpen,
            getValue: () => selectedValue,
            setValue: (v) => {
                selectedValue = v; updateDisplay();
                menu.querySelectorAll('.galaxy-gui-dropdown-item').forEach((c, idx) => {
                    c.classList.toggle('is-active', options[idx] && options[idx].value === selectedValue);
                });
            },
            setSelected: (v) => {
                selectedValue = v; updateDisplay();
                menu.querySelectorAll('.galaxy-gui-dropdown-item').forEach((c, idx) => {
                    c.classList.toggle('is-active', options[idx] && options[idx].value === selectedValue);
                });
            },
            getOptions: () => options.slice(),
            setOptions: (arr) => {
                options = Array.isArray(arr) ? arr.slice() : [];
                if (!options.some(o => o.value === selectedValue)) { selectedValue = options[0] ? options[0].value : null; }
                rebuildMenu(); updateDisplay();
            },
            setLabel: (t) => { if (labelEl) labelEl.textContent = t; },
            setDisabled: (b) => { disabled = !!b; wrap.classList.toggle('is-disabled', disabled); if (disabled) closeMenu(); },
            isDisabled: () => disabled, onChange: (fn) => { onChangeCb = fn; },
            onFocus: (fn) => { onFocusCb = fn; }, onBlur: (fn) => { onBlurCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a choice group component (Radio/Checkbox).
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createChoiceGroup(container, config) {
        const isRadio = config.type === 'radio-group';
        const wrap = document.createElement('div');
        wrap.className = `galaxy-gui-choice-group layout-${config.layout || 'column'}`;
        let currentValue = isRadio ? config.value : (Array.isArray(config.value) ? config.value.slice() : []);
        let disabled = false, onChangeCb = config.onChange;
        const options = Array.isArray(config.options) ? config.options : [];
        const items = [];
        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'galaxy-gui-choice-item';
            const icon = document.createElement('div');
            icon.className = 'galaxy-gui-choice-icon';
            if (isRadio) icon.classList.add('is-radio');
            else icon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
            const label = document.createElement('span');
            label.textContent = opt.label;
            item.appendChild(icon); item.appendChild(label);
            const checkActive = () => {
                const active = isRadio ? (currentValue === opt.value) : currentValue.includes(opt.value);
                item.classList.toggle('is-active', active);
            };
            checkActive();
            item.addEventListener('click', () => {
                if (disabled) return;
                if (isRadio) { currentValue = opt.value; items.forEach(fn => fn()); }
                else {
                    if (currentValue.includes(opt.value)) currentValue = currentValue.filter(v => v !== opt.value);
                    else currentValue = currentValue.concat([opt.value]);
                    checkActive();
                }
                if (onChangeCb) onChangeCb(isRadio ? currentValue : currentValue.slice());
            });
            items.push(checkActive); wrap.appendChild(item);
        });
        container.appendChild(wrap);
        const getVal = () => isRadio ? currentValue : currentValue.slice();
        const setVal = (v) => {
            if (isRadio) currentValue = v; else currentValue = Array.isArray(v) ? v.slice() : [];
            items.forEach(fn => fn());
        };
        const handle = {
            el: wrap, getValue: getVal, setValue: setVal, getSelected: getVal, setSelected: setVal,
            toggle: (v) => {
                if (isRadio) return;
                if (currentValue.includes(v)) currentValue = currentValue.filter(x => x !== v);
                else currentValue = currentValue.concat([v]);
                items.forEach(fn => fn());
            },
            setLabel: () => {}, setDisabled: (b) => { disabled = !!b; wrap.classList.toggle('is-disabled', disabled); },
            isDisabled: () => disabled, onChange: (fn) => { onChangeCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a Material Design 3 time picker component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createTime(container, config) {
        const wrap = document.createElement('div'); wrap.className = 'galaxy-gui-time-md3';
        let hour = config.hour !== undefined ? config.hour : 12;
        let minute = config.minute !== undefined ? config.minute : 0;
        let isHourMode = true;
        let isPM = hour >= 12;
        let disabled = false;
        let onChangeCb = config.onChange;
        let lastAngle = 0;

        const amText = config.amText || '';
        const pmText = config.pmText || '';
        const separator = config.separator || '';

        const header = document.createElement('div'); header.className = 'md3-time-header';
        const hourEl = document.createElement('div'); hourEl.className = 'md3-time-part';
        const sepEl = document.createElement('div'); sepEl.className = 'md3-time-sep'; sepEl.textContent = separator;
        const minEl = document.createElement('div'); minEl.className = 'md3-time-part';
        const periodEl = document.createElement('div'); periodEl.className = 'md3-time-period';
        const amBtn = document.createElement('div'); amBtn.className = 'md3-period-btn'; amBtn.textContent = amText;
        const pmBtn = document.createElement('div'); pmBtn.className = 'md3-period-btn'; pmBtn.textContent = pmText;
        periodEl.appendChild(amBtn); periodEl.appendChild(pmBtn);
        header.appendChild(hourEl); header.appendChild(sepEl); header.appendChild(minEl); header.appendChild(periodEl);

        const dial = document.createElement('div'); dial.className = 'md3-dial';
        if (config.dialSize) dial.style.maxWidth = config.dialSize + 'px';

        const hand = document.createElement('div'); hand.className = 'md3-dial-hand';
        const center = document.createElement('div'); center.className = 'md3-dial-center';
        const pointer = document.createElement('div'); pointer.className = 'md3-dial-pointer';

        dial.appendChild(hand); dial.appendChild(center); dial.appendChild(pointer);

        const renderFace = () => {
            dial.querySelectorAll('.md3-dial-number').forEach(n => n.remove());
            for (let i = 0; i < 12; i++) {
                let angle = (i / 12) * 360;
                let rad = (angle - 90) * Math.PI / 180;
                let x = 50 + Math.cos(rad) * 38;
                let y = 50 + Math.sin(rad) * 38;
                let text;
                if (isHourMode) text = i === 0 ? '12' : String(i);
                else text = String(i * 5).padStart(2, '0');

                const el = document.createElement('div');
                el.className = 'md3-dial-number';
                el.textContent = text;
                el.style.left = `${x}%`; el.style.top = `${y}%`;
                el.dataset.idx = i;

                el.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    if (isHourMode) {
                        setValueByIndex(i);
                    } else {
                        minute = i * 5;
                        updateSelection();
                        if (onChangeCb) onChangeCb({ hour, minute });
                    }
                });
                dial.appendChild(el);
            }
        };

        const updateSelection = () => {
            let displayHour = hour % 12; if (displayHour === 0) displayHour = 12;
            hourEl.textContent = String(displayHour).padStart(2, '0');
            minEl.textContent = String(minute).padStart(2, '0');
            hourEl.classList.toggle('is-active', isHourMode);
            minEl.classList.toggle('is-active', !isHourMode);
            amBtn.classList.toggle('is-active', !isPM);
            pmBtn.classList.toggle('is-active', isPM);

            let rawAngle = 0;
            let displayText = '';
            if (isHourMode) {
                let displayIdx = displayHour % 12;
                rawAngle = (displayIdx / 12) * 360;
                displayText = String(displayHour);
            } else {
                rawAngle = (minute / 60) * 360;
                displayText = String(minute).padStart(2, '0');
            }

            let delta = rawAngle - (lastAngle % 360);
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            lastAngle += delta;
            hand.style.transform = `rotate(${lastAngle}deg)`;

            const rad = (rawAngle - 90) * Math.PI / 180;
            const px = 50 + Math.cos(rad) * 38;
            const py = 50 + Math.sin(rad) * 38;

            pointer.style.left = `${px}%`;
            pointer.style.top = `${py}%`;
            pointer.textContent = displayText;

            dial.querySelectorAll('.md3-dial-number').forEach(el => {
                const idx = parseInt(el.dataset.idx);
                const isExact = rawAngle % 30 === 0;
                const isTarget = isHourMode ? (idx === displayHour % 12) : (idx === minute / 5);
                if (isExact && isTarget) {
                    el.style.opacity = '0';
                } else {
                    el.style.opacity = '1';
                }
            });
        };

        const setValueByIndex = (i) => {
            let h = i === 0 ? 12 : i;
            hour = isPM ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
            updateSelection();
            if (onChangeCb) onChangeCb({ hour, minute });
        };

        const handlePointer = (e) => {
            const rect = dial.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            let dx = e.clientX - cx;
            let dy = e.clientY - cy;
            let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;

            if (isHourMode) {
                let idx = Math.round(angle / 30) % 12;
                setValueByIndex(idx);
            } else {
                minute = Math.round(angle / 6) % 60;
                updateSelection();
                if (onChangeCb) onChangeCb({ hour, minute });
            }
        };

        let isDragging = false;
        dial.addEventListener('pointerdown', (e) => { if (disabled) return; isDragging = true; dial.setPointerCapture(e.pointerId); handlePointer(e); });
        dial.addEventListener('pointermove', (e) => { if (!isDragging) return; handlePointer(e); });
        dial.addEventListener('pointerup', (e) => { if (!isDragging) return; isDragging = false; dial.releasePointerCapture(e.pointerId); });
        dial.addEventListener('pointercancel', (e) => { if (!isDragging) return; isDragging = false; try { dial.releasePointerCapture(e.pointerId); } catch (err) {} });

        hourEl.addEventListener('click', () => { isHourMode = true; renderFace(); updateSelection(); });
        minEl.addEventListener('click', () => { isHourMode = false; renderFace(); updateSelection(); });
        amBtn.addEventListener('click', () => { if (isPM) { isPM = false; hour = (hour + 12) % 24; updateSelection(); if (onChangeCb) onChangeCb({ hour, minute }); } });
        pmBtn.addEventListener('click', () => { if (!isPM) { isPM = true; hour = (hour + 12) % 24; updateSelection(); if (onChangeCb) onChangeCb({ hour, minute }); } });

        wrap.appendChild(header); wrap.appendChild(dial); container.appendChild(wrap);
        renderFace(); updateSelection();

        const handle = {
            el: wrap,
            getValue: () => ({ hour, minute }),
            setValue: (v) => {
                if (!v) return;
                if (Number.isFinite(v.hour)) hour = v.hour;
                if (Number.isFinite(v.minute)) minute = v.minute;
                isPM = hour >= 12;
                updateSelection();
            },
            getTime: () => ({ hour, minute }),
            setTime: (h, m) => {
                if (Number.isFinite(h)) hour = h;
                if (Number.isFinite(m)) minute = m;
                isPM = hour >= 12;
                updateSelection();
            },
            setLabel: () => {},
            setDisabled: (b) => { disabled = !!b; wrap.style.opacity = b ? '0.5' : '1'; wrap.style.pointerEvents = b ? 'none' : 'auto'; },
            isDisabled: () => disabled,
            onChange: (fn) => { onChangeCb = fn; },
            setSize: (size) => { dial.style.maxWidth = typeof size === 'number' ? size + 'px' : size; },
            setDialSize: (size) => { dial.style.maxWidth = typeof size === 'number' ? size + 'px' : size; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a console component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createConsole(container, config) {
        const el = document.createElement('div');
        el.className = 'galaxy-gui-console'; container.appendChild(el);
        let disabled = false; const maxLines = config.maxLines || 50;
        const prefix = config.prefix !== undefined ? config.prefix : '';
        const log = (msg) => {
            if (disabled) return;
            const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
            const line = document.createElement('div');
            line.className = 'galaxy-gui-console-line'; line.textContent = `${prefix}${text}`;
            el.appendChild(line); el.scrollTop = el.scrollHeight;
            while (el.children.length > maxLines) el.removeChild(el.firstChild);
        };
        const clear = () => { el.innerHTML = ''; };
        const handle = {
            el, log, clear, getValue: () => el.textContent, setValue: (s) => { clear(); if (s) log(s); },
            setLabel: () => {}, setDisabled: (b) => { disabled = !!b; el.classList.toggle('is-disabled', disabled); },
            isDisabled: () => disabled, onChange: () => {},
            destroy: () => { if (el.parentNode) el.parentNode.removeChild(el); }
        };
        return this._decorateHandle(handle, el, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a group (Row/Column) component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createGroup(container, config) {
        const groupEl = document.createElement('div');
        groupEl.className = `galaxy-gui-group layout-${config.layout || 'column'}`;
        const components = [];
        const addChildInternal = (compConf) => {
            const h = this._createComponent(groupEl, compConf);
            if (h) components.push(h); return h;
        };
        if (Array.isArray(config.components)) config.components.forEach(addChildInternal);
        container.appendChild(groupEl);
        const findRecursive = (list, ref) => {
            for (let c of list) {
                if (typeof ref !== 'number' && c.key === ref) return c;
                if (c.type === 'accordion') { const f = c.getChild(ref); if (f) return f; }
                if (c.type === 'group') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'card') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'tabs') { const f = c.getComponent(ref); if (f) return f; }
            }
            return null;
        };
        const handle = {
            el: groupEl, addComponent: addChildInternal,
            getComponent: (ref) => {
                if (typeof ref === 'number') return components[ref] || null;
                return findRecursive(components, ref);
            },
            getComponents: () => components.slice(),
            removeComponent: (ref) => {
                const h = typeof ref === 'number' ? components[ref] : findRecursive(components, ref);
                if (!h) return false;
                const i = components.indexOf(h); if (i >= 0) components.splice(i, 1);
                try { if (!h._destroyed) h.destroy(); } catch (e) {} return true;
            },
            destroy: () => {
                components.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} });
                components.length = 0; if (groupEl.parentNode) groupEl.parentNode.removeChild(groupEl);
            }
        };
        return this._decorateHandle(handle, groupEl, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a divider component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createDivider(container, config) {
        const el = document.createElement('div'); el.className = 'galaxy-gui-divider'; container.appendChild(el);
        const handle = { el, getValue: () => null, setValue: () => {}, setLabel: () => {}, setDisabled: () => {}, isDisabled: () => false, onChange: () => {}, destroy: () => { if (el.parentNode) el.parentNode.removeChild(el); } };
        return this._decorateHandle(handle, el, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a progress bar component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createProgress(container, config) {
        const wrap = document.createElement('div'); wrap.className = 'galaxy-gui-progress-container';
        const header = document.createElement('div'); header.className = 'galaxy-gui-progress-header';
        const labelEl = document.createElement('span'); labelEl.textContent = config.label || '';
        const unit = config.unit !== undefined ? config.unit : '';
        const valText = document.createElement('span'); valText.textContent = (config.value || 0) + unit;
        header.appendChild(labelEl); header.appendChild(valText);
        const track = document.createElement('div'); track.className = 'galaxy-gui-progress-track';
        const fill = document.createElement('div'); fill.className = 'galaxy-gui-progress-fill';
        fill.style.width = Math.max(0, Math.min(100, config.value || 0)) + '%';
        track.appendChild(fill); wrap.appendChild(header); wrap.appendChild(track); container.appendChild(wrap);
        const handle = {
            el: wrap, getValue: () => parseFloat(fill.style.width) || 0,
            setValue: (v) => { const p = Math.max(0, Math.min(100, v)); fill.style.width = p + '%'; valText.textContent = p + unit; },
            setLabel: (t) => { labelEl.textContent = t; }, setDisabled: () => {}, isDisabled: () => false, onChange: () => {},
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates an image component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createImage(container, config) {
        const img = document.createElement('img'); img.className = 'galaxy-gui-image'; img.src = config.src || '';
        if (config.objectFit) img.style.objectFit = config.objectFit;
        container.appendChild(img);
        const handle = { el: img, getValue: () => img.src, setValue: (v) => { img.src = v; }, setLabel: () => {}, setDisabled: () => {}, isDisabled: () => false, onChange: () => {}, destroy: () => { if (img.parentNode) img.parentNode.removeChild(img); } };
        return this._decorateHandle(handle, img, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a color picker component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createColorPicker(container, config) {
        const wrap = document.createElement('div'); wrap.className = 'galaxy-gui-color-container';

        const previewRow = document.createElement('div'); previewRow.className = 'galaxy-gui-color-preview-row';
        const preview = document.createElement('div'); preview.className = 'galaxy-gui-color-preview'; preview.style.background = config.value || '#ffffff';
        const text = document.createElement('input'); text.type = 'text'; text.className = 'galaxy-gui-color-text'; text.value = config.value || '#ffffff';
        previewRow.appendChild(preview); previewRow.appendChild(text);

        const swatches = document.createElement('div'); swatches.className = 'galaxy-gui-color-swatches';
        const presetColors = Array.isArray(config.colors) ? config.colors : [];

        let currentColor = config.value || '#ffffff';
        let onChangeCb = config.onChange;
        const swatchEls = [];

        const updateColor = (hex) => {
            currentColor = hex;
            preview.style.background = hex;
            text.value = hex;
            swatchEls.forEach(el => {
                el.classList.toggle('is-active', el.dataset.color === hex);
            });
            if (onChangeCb) onChangeCb(hex);
        };

        presetColors.forEach(color => {
            const el = document.createElement('div');
            el.className = 'galaxy-gui-color-swatch';
            el.style.background = color === '#00000000' ? 'transparent' : color;
            if (color === '#00000000') {
                el.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';
                el.style.backgroundSize = '8px 8px';
                el.style.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px';
            }
            el.dataset.color = color;
            el.addEventListener('click', () => updateColor(color));
            swatches.appendChild(el);
            swatchEls.push(el);
        });

        text.addEventListener('change', (e) => {
            if (/^#[0-9a-fA-F]{6,8}$/.test(e.target.value)) updateColor(e.target.value);
        });

        updateColor(currentColor);

        wrap.appendChild(previewRow); wrap.appendChild(swatches); container.appendChild(wrap);
        const handle = {
            el: wrap, getValue: () => currentColor, setValue: (v) => { updateColor(v); },
            setLabel: () => {}, setDisabled: () => {}, isDisabled: () => false, onChange: (fn) => { onChangeCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a tabs container component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createTabs(container, config) {
        const wrap = document.createElement('div'); wrap.className = 'galaxy-gui-tabs-container';
        const header = document.createElement('div'); header.className = 'galaxy-gui-tabs-header';
        const indicator = document.createElement('div'); indicator.className = 'galaxy-gui-tabs-indicator';
        header.appendChild(indicator);

        const body = document.createElement('div'); body.className = 'galaxy-gui-tabs-body';
        const tabs = config.tabs || [];
        let activeKey = config.activeKey;
        if (!tabs.some(t => t.key === activeKey) && tabs[0]) activeKey = tabs[0].key;

        let onChangeCb = config.onChange;
        let disabled = false;
        const btns = [];
        const panes = [];

        const updateIndicator = (btn) => {
            if (!btn) return;
            const headerRect = header.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            indicator.style.width = btnRect.width + 'px';
            indicator.style.transform = `translateX(${btnRect.left - headerRect.left + header.scrollLeft}px)`;
        };

        const setActive = (key) => {
            let idx = tabs.findIndex(t => t.key === key);
            if (idx < 0) idx = 0;
            if (!tabs[idx]) return;
            activeKey = tabs[idx].key;
            btns.forEach((b, i) => b.classList.toggle('is-active', i === idx));
            panes.forEach(p => {
                p.el.style.display = p.key === activeKey ? 'flex' : 'none';
            });
            updateIndicator(btns[idx]);
            requestAnimationFrame(() => updateIndicator(btns[idx]));
        };

        tabs.forEach((tab) => {
            const pane = document.createElement('div');
            pane.className = 'galaxy-gui-tab-pane';
            pane.style.display = 'none';
            const comps = [];
            if (Array.isArray(tab.children)) {
                tab.children.forEach(ch => {
                    const h = this._createComponent(pane, ch);
                    if (h) comps.push(h);
                });
            }
            body.appendChild(pane);
            panes.push({ key: tab.key, el: pane, comps });

            const btn = document.createElement('div');
            btn.className = 'galaxy-gui-tab-btn';
            btn.textContent = tab.label;
            btn.addEventListener('click', () => {
                if (disabled) return;
                if (activeKey === tab.key) return;
                setActive(tab.key);
                if (onChangeCb) onChangeCb(activeKey);
            });
            btns.push(btn);
            header.appendChild(btn);
        });

        wrap.appendChild(header);
        wrap.appendChild(body);
        container.appendChild(wrap);

        setActive(activeKey);
        requestAnimationFrame(() => {
            const idx = tabs.findIndex(t => t.key === activeKey);
            if (idx >= 0 && btns[idx]) updateIndicator(btns[idx]);
        });

        const findRecursive = (list, ref) => {
            for (let c of list) {
                if (typeof ref !== 'number' && c.key === ref) return c;
                if (c.type === 'accordion') { const f = c.getChild(ref); if (f) return f; }
                if (c.type === 'group') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'card') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'tabs') { const f = c.getComponent(ref); if (f) return f; }
            }
            return null;
        };

        const handle = {
            el: wrap,
            getValue: () => activeKey,
            setValue: (k) => { if (!disabled) setActive(k); },
            getComponent: (ref) => {
                for (const pane of panes) {
                    const found = findRecursive(pane.comps, ref);
                    if (found) return found;
                }
                return null;
            },
            getComponents: () => {
                const all = [];
                panes.forEach(p => p.comps.forEach(c => all.push(c)));
                return all;
            },
            setLabel: () => {},
            setDisabled: (b) => { disabled = !!b; wrap.classList.toggle('is-disabled', disabled); },
            isDisabled: () => disabled,
            onChange: (fn) => { onChangeCb = fn; },
            destroy: () => {
                panes.forEach(p => p.comps.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} }));
                panes.length = 0;
                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a key-value editor component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createKeyValue(container, config) {
        const wrap = document.createElement('div'); wrap.className = 'galaxy-gui-kv-container';
        let data = Object.assign({}, config.value || {}); let onChangeCb = config.onChange;
        const keyPlaceholder = config.keyPlaceholder || '';
        const valPlaceholder = config.valPlaceholder || '';
        const addIcon = config.addIcon || '';
        const deleteIcon = config.deleteIcon || '';
        const defaultKeyPrefix = config.defaultKeyPrefix || '';

        const render = () => {
            wrap.innerHTML = '';
            Object.keys(data).forEach(k => {
                const row = document.createElement('div'); row.className = 'galaxy-gui-kv-row';
                const ki = document.createElement('input'); ki.className = 'galaxy-gui-kv-input'; ki.value = k; ki.placeholder = keyPlaceholder;
                const vi = document.createElement('input'); vi.className = 'galaxy-gui-kv-input'; vi.value = data[k]; vi.placeholder = valPlaceholder;

                const del = document.createElement('button'); del.className = 'galaxy-gui-kv-btn';
                const delIconEl = this._createIcon(deleteIcon);
                if (delIconEl) del.appendChild(delIconEl);

                ki.addEventListener('change', () => { const nk = ki.value.trim(); if (nk && nk !== k && !data[nk]) { data[nk] = data[k]; delete data[k]; render(); if (onChangeCb) onChangeCb(Object.assign({}, data)); } });
                vi.addEventListener('input', () => { data[k] = vi.value; if (onChangeCb) onChangeCb(Object.assign({}, data)); });
                del.addEventListener('click', () => { delete data[k]; render(); if (onChangeCb) onChangeCb(Object.assign({}, data)); });
                row.appendChild(ki); row.appendChild(vi); row.appendChild(del); wrap.appendChild(row);
            });

            const add = document.createElement('button');
            add.className = 'galaxy-gui-kv-btn'; add.style.width = '100%'; add.style.marginTop = '4px';
            const addIconEl = this._createIcon(addIcon);
            if (addIconEl) add.appendChild(addIconEl);

            add.addEventListener('click', () => {
                let i = 1;
                while (data[`${defaultKeyPrefix}${i}`] !== undefined) { i++; }
                data[`${defaultKeyPrefix}${i}`] = '';
                render();
                if (onChangeCb) onChangeCb(Object.assign({}, data));
            });
            wrap.appendChild(add);
        };
        container.appendChild(wrap); render();
        const handle = {
            el: wrap, getValue: () => Object.assign({}, data), setValue: (v) => { data = Object.assign({}, v); render(); },
            setLabel: () => {}, setDisabled: () => {}, isDisabled: () => false, onChange: (fn) => { onChangeCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a multi-select dropdown component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createMultiDropdown(container, config) {
        const wrap = document.createElement('div'); wrap.className = 'galaxy-gui-multi-dropdown';
        let labelEl = null;
        if (config.label) { labelEl = document.createElement('div'); labelEl.className = 'galaxy-gui-input-label'; labelEl.textContent = config.label; wrap.appendChild(labelEl); }

        const trigger = document.createElement('div'); trigger.className = 'galaxy-gui-multi-trigger';
        const triggerText = document.createElement('div');

        const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrowSvg.setAttribute('viewBox', '0 0 24 24');
        arrowSvg.innerHTML = `<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>`;

        trigger.appendChild(triggerText); trigger.appendChild(arrowSvg);
        const menuWrapper = document.createElement('div'); menuWrapper.className = 'galaxy-gui-dropdown-menu-wrapper';
        const menuInner = document.createElement('div'); menuInner.className = 'galaxy-gui-dropdown-menu-inner';
        const menu = document.createElement('div'); menu.className = 'galaxy-gui-multi-menu';
        let options = Array.isArray(config.options) ? config.options.slice() : [];
        let selected = Array.isArray(config.value) ? config.value.slice() : [];
        let isOpen = false; let onChangeCb = config.onChange;

        const placeholder = config.placeholder || '';
        const displayMode = config.displayMode || '';
        const maxChips = config.maxChips !== undefined ? config.maxChips : 0;
        const formatMoreText = config.formatMoreText || (() => '');
        const formatSelected = config.formatSelected || (() => '');
        const allSelectedText = config.allSelectedText || '';

        const updateText = () => {
            triggerText.innerHTML = '';

            if (selected.length === 0) {
                triggerText.textContent = placeholder;
                return;
            }

            if (typeof config.renderSelected === 'function') {
                const customEl = config.renderSelected(selected, options);
                if (typeof customEl === 'string') triggerText.innerHTML = customEl;
                else if (customEl instanceof Node) triggerText.appendChild(customEl);
                return;
            }

            if (displayMode === 'text') {
                if (selected.length === options.length) triggerText.textContent = allSelectedText;
                else triggerText.textContent = formatSelected(selected.length);
            } else {
                const chipWrap = document.createElement('div');
                chipWrap.style.cssText = 'display:flex; gap:4px; flex-wrap:nowrap; overflow:hidden; flex:1; align-items:center;';
                const showCount = Math.min(selected.length, maxChips);
                for (let i = 0; i < showCount; i++) {
                    const val = selected[i];
                    const opt = options.find(o => o.value === val);
                    if (!opt) continue;
                    const chip = document.createElement('span');
                    chip.className = 'galaxy-gui-multi-chip';
                    chip.textContent = opt.label;
                    chipWrap.appendChild(chip);
                }
                if (selected.length > maxChips) {
                    const more = document.createElement('span');
                    more.className = 'galaxy-gui-multi-chip is-more';
                    more.textContent = formatMoreText(selected.length - maxChips);
                    chipWrap.appendChild(more);
                }
                triggerText.appendChild(chipWrap);
            }
        };
        updateText();
        const renderMenu = () => {
            menu.innerHTML = '';
            options.forEach(opt => {
                const item = document.createElement('div'); item.className = 'galaxy-gui-multi-item' + (selected.includes(opt.value) ? ' is-active' : '');
                const cb = document.createElement('div'); cb.className = 'galaxy-gui-multi-checkbox';
                const txt = document.createElement('span'); txt.textContent = opt.label;
                item.appendChild(cb); item.appendChild(txt);
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (selected.includes(opt.value)) selected = selected.filter(v => v !== opt.value); else selected.push(opt.value);
                    item.classList.toggle('is-active', selected.includes(opt.value)); updateText(); if (onChangeCb) onChangeCb(selected.slice());
                });
                menu.appendChild(item);
            });
        };
        renderMenu();
        trigger.addEventListener('click', (e) => { e.stopPropagation(); wrap.classList.toggle('is-open'); isOpen = !isOpen; });
        menuInner.appendChild(menu); menuWrapper.appendChild(menuInner); wrap.appendChild(trigger); wrap.appendChild(menuWrapper); container.appendChild(wrap);
        const handle = {
            el: wrap, getValue: () => selected.slice(), setValue: (v) => { selected = Array.isArray(v) ? v.slice() : []; renderMenu(); updateText(); },
            setLabel: (t) => { if (labelEl) labelEl.textContent = t; }, setDisabled: () => {}, isDisabled: () => false, onChange: (fn) => { onChangeCb = fn; },
            destroy: () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a Card component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createCard(container, config) {
        const wrap = document.createElement('div'); wrap.className = 'galaxy-gui-card';
        if (config.title) {
            const title = document.createElement('div');
            title.className = 'galaxy-gui-card-header';
            title.textContent = config.title;
            wrap.appendChild(title);
        }
        const body = document.createElement('div'); body.className = 'galaxy-gui-card-body';
        const components = [];
        const addChildInternal = (compConf) => {
            const h = this._createComponent(body, compConf);
            if (h) components.push(h); return h;
        };
        if (Array.isArray(config.children)) config.children.forEach(addChildInternal);
        wrap.appendChild(body); container.appendChild(wrap);
        const findRecursive = (list, ref) => {
            for (let c of list) {
                if (typeof ref !== 'number' && c.key === ref) return c;
                if (c.type === 'accordion') { const f = c.getChild(ref); if (f) return f; }
                if (c.type === 'group') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'card') { const f = c.getComponent(ref); if (f) return f; }
                if (c.type === 'tabs') { const f = c.getComponent(ref); if (f) return f; }
            }
            return null;
        };
        const handle = {
            el: wrap, addComponent: addChildInternal,
            getComponent: (ref) => {
                if (typeof ref === 'number') return components[ref] || null;
                return findRecursive(components, ref);
            },
            getComponents: () => components.slice(),
            removeComponent: (ref) => {
                const h = typeof ref === 'number' ? components[ref] : findRecursive(components, ref);
                if (!h) return false;
                const i = components.indexOf(h); if (i >= 0) components.splice(i, 1);
                try { if (!h._destroyed) h.destroy(); } catch (e) {} return true;
            },
            setLabel: (t) => { if (title) title.textContent = t; }, setDisabled: () => {}, isDisabled: () => false, onChange: () => {},
            destroy: () => {
                components.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} });
                components.length = 0; if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            }
        };
        return this._decorateHandle(handle, wrap, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a Chip component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createChip(container, config) {
        const el = document.createElement('div'); el.className = 'galaxy-gui-chip';

        const iconEl = this._createIcon(config.icon, 'galaxy-gui-chip-icon');
        if (iconEl) el.appendChild(iconEl);

        const text = document.createElement('span');
        text.className = 'galaxy-gui-chip-text';
        text.textContent = config.label || '';
        el.appendChild(text);

        let active = !!config.active, disabled = false, onChangeCb = config.onChange;
        if (active) el.classList.add('is-active');

        let handle = null;
        if (config.closable) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'galaxy-gui-chip-close';
            const closeIconEl = this._createIcon(config.closeIcon);
            if (closeIconEl) closeBtn.appendChild(closeIconEl);

            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (disabled) return;
                if (config.onClose) config.onClose();
                if (handle) handle.destroy();
            });
            el.appendChild(closeBtn);
        }

        el.addEventListener('click', () => {
            if (disabled) return;
            if (config.closable) return;
            active = !active;
            el.classList.toggle('is-active', active);
            if (onChangeCb) onChangeCb(active);
        });
        container.appendChild(el);

        handle = {
            el, getValue: () => active, setValue: (v) => { active = !!v; el.classList.toggle('is-active', active); },
            setLabel: (t) => { text.textContent = t; }, setDisabled: (b) => { disabled = !!b; el.style.opacity = b ? '0.5' : '1'; },
            isDisabled: () => disabled, onChange: (fn) => { onChangeCb = fn; },
            destroy: () => { if (el.parentNode) el.parentNode.removeChild(el); }
        };
        return this._decorateHandle(handle, el, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a legacy simplified list component.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createList(container, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'galaxy-gui-list-viewport';

        const initialMaxH = typeof config.maxHeight === 'number' ? `${config.maxHeight}px` : (config.maxHeight || '300px');
        wrapper.style.cssText = `position:relative;width:100%;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;max-height:${initialMaxH};scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior-y:contain;`;

        if (!document.getElementById('galaxy-list-scrollbar-style')) {
            const style = document.createElement('style');
            style.id = 'galaxy-list-scrollbar-style';
            style.innerHTML = `.galaxy-gui-list-viewport::-webkit-scrollbar{display:none;}`;
            document.head.appendChild(style);
        }

        const phantom = document.createElement('div');
        phantom.className = 'galaxy-gui-list-phantom';
        phantom.style.cssText = 'width:100%;position:relative;pointer-events:none;';
        const content = document.createElement('div');
        content.className = 'galaxy-gui-list-content';
        content.style.cssText = 'position:absolute;top:0;left:0;right:0;will-change:transform;';

        wrapper.appendChild(phantom);
        wrapper.appendChild(content);
        container.appendChild(wrapper);

        let allItems = Array.isArray(config.items) ? config.items.slice() : [];
        let onChangeCb = config.onChange;
        let renderedMap = new Map();
        let rafId = null;

        const ITEM_HEIGHT = config.itemHeight || 60;
        const WINDOW_SIZE = config.windowSize || 30000;
        const RENDER_BUFFER = config.renderBuffer || 10;
        const MIGRATE_THRESHOLD = config.migrateThreshold || 5000;
        const renderViewFn = typeof config.renderView === 'function'
            ? config.renderView
            : (typeof config.renderItem === 'function' ? config.renderItem : null);

        let windowStart = 0;
        let windowEnd = Math.min(WINDOW_SIZE, allItems.length);
        let cachedVh = wrapper.clientHeight || 300;
        let migrating = false;
        let suppressScroll = false;
        let lastGlobalSt = 0;
        let isHidden = false;

        const updatePhantomHeight = () => {
            phantom.style.height = `${(windowEnd - windowStart) * ITEM_HEIGHT}px`;
        };
        updatePhantomHeight();

        const buildDefaultItemDom = (item, dom) => {
            const innerContent = document.createElement('div');
            innerContent.className = 'galaxy-gui-list-item-content';
            const iconEl = this._createIcon(item.icon, 'galaxy-gui-list-icon');
            if (iconEl) innerContent.appendChild(iconEl);
            const textWrap = document.createElement('div');
            textWrap.className = 'galaxy-gui-list-text';
            const titleEl = document.createElement('div');
            titleEl.className = 'galaxy-gui-list-title';
            titleEl.textContent = item.title || '';
            textWrap.appendChild(titleEl);
            if (item.subtitle) {
                const subEl = document.createElement('div');
                subEl.className = 'galaxy-gui-list-subtitle';
                subEl.textContent = item.subtitle;
                textWrap.appendChild(subEl);
            }
            innerContent.appendChild(textWrap);
            dom.appendChild(innerContent);
            if (item.action) {
                const actionWrap = document.createElement('div');
                actionWrap.className = 'galaxy-gui-list-action';
                this._createComponent(actionWrap, item.action);
                dom.appendChild(actionWrap);
            }
        };

        const createViewHolder = (globalIdx) => {
            const dom = document.createElement('div');
            dom.className = 'galaxy-gui-list-item';
            dom.style.cssText = `position:absolute;left:0;right:0;top:0;height:${ITEM_HEIGHT}px;box-sizing:border-box;will-change:transform;`;
            const comps = [];
            let curIndex = globalIdx;
            const destroySelf = () => {
                comps.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} });
                comps.length = 0;
                if (dom.parentNode) dom.parentNode.removeChild(dom);
            };
            const vh = {
                itemView: dom,
                get adapterPosition() { return curIndex; },
                getData: () => allItems[curIndex],
                updateData: (patch) => {
                    const cur = allItems[curIndex];
                    if (!cur) return;
                    Object.assign(cur, patch);
                    if (onChangeCb) onChangeCb(allItems);
                },
                notifyItemChanged: () => {
                    const cur = renderedMap.get(curIndex);
                    if (cur !== vh) return;
                    renderedMap.delete(curIndex);
                    destroySelf();
                    scheduleRender();
                },
                _setIndex: (i) => { curIndex = i; },
                _destroy: destroySelf,
                _comps: comps,
            };
            if (renderViewFn) {
                const rendered = renderViewFn(allItems[globalIdx], globalIdx, vh);
                if (rendered) {
                    const cfgs = Array.isArray(rendered) ? rendered : [rendered];
                    cfgs.forEach(cfg => {
                        if (!cfg) return;
                        const h = this._createComponent(dom, cfg);
                        if (h) comps.push(h);
                    });
                } else {
                    buildDefaultItemDom(allItems[globalIdx], dom);
                }
            } else {
                buildDefaultItemDom(allItems[globalIdx], dom);
            }
            return vh;
        };

        const destroyViewHolder = (vh) => { vh._destroy(); };

        const render = () => {
            const h = wrapper.clientHeight;
            if (h === 0) return;
            cachedVh = h;
            const st = wrapper.scrollTop;
            const globalSt = windowStart * ITEM_HEIGHT + st;
            lastGlobalSt = globalSt;
            content.style.transform = `translateY(${st}px)`;

            const firstVisibleGlobal = windowStart + Math.floor(st / ITEM_HEIGHT);
            const lastVisibleGlobal  = windowStart + Math.ceil((st + cachedVh) / ITEM_HEIGHT);
            const renderStartGlobal = Math.max(windowStart, firstVisibleGlobal - RENDER_BUFFER);
            const renderEndGlobal   = Math.min(windowEnd, lastVisibleGlobal + RENDER_BUFFER);

            for (const [g, vh] of renderedMap) {
                if (g < renderStartGlobal || g >= renderEndGlobal) {
                    destroyViewHolder(vh);
                    renderedMap.delete(g);
                }
            }
            for (let g = renderStartGlobal; g < renderEndGlobal; g++) {
                let vh = renderedMap.get(g);
                if (!vh) {
                    vh = createViewHolder(g);
                    content.appendChild(vh.itemView);
                    renderedMap.set(g, vh);
                } else {
                    vh._setIndex(g);
                }
                vh.itemView.style.transform = `translateY(${g * ITEM_HEIGHT - globalSt}px)`;
            }

            const localWindowPx = (windowEnd - windowStart) * ITEM_HEIGHT;
            const nearBottom = windowEnd < allItems.length && st > localWindowPx - cachedVh - MIGRATE_THRESHOLD;
            const nearTop    = windowStart > 0 && st < MIGRATE_THRESHOLD;
            if ((nearBottom || nearTop) && !migrating) {
                migrating = true;
                requestAnimationFrame(() => {
                    migrating = false;
                    migrateWindow();
                });
            }
        };

        const migrateWindow = () => {
            const st = wrapper.scrollTop;
            const globalSt = windowStart * ITEM_HEIGHT + st;
            const centerGlobal = Math.floor((globalSt + cachedVh / 2) / ITEM_HEIGHT);
            const half = Math.floor(WINDOW_SIZE / 2);
            let newStart = Math.max(0, centerGlobal - half);
            let newEnd = Math.min(allItems.length, newStart + WINDOW_SIZE);
            if (newEnd - newStart < WINDOW_SIZE) newStart = Math.max(0, newEnd - WINDOW_SIZE);
            if (newStart === windowStart) return;
            windowStart = newStart;
            windowEnd = newEnd;
            updatePhantomHeight();
            suppressScroll = true;
            const newSt = globalSt - newStart * ITEM_HEIGHT;
            wrapper.scrollTop = Math.max(0, Math.min(newSt, wrapper.scrollHeight - cachedVh));
            suppressScroll = false;
            render();
        };

        const scheduleRender = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                render();
            });
        };

        wrapper.addEventListener('scroll', () => {
            if (suppressScroll) return;
            scheduleRender();
        }, { passive: true });

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                const h = wrapper.clientHeight;
                if (h > 0) {
                    cachedVh = h;
                    if (isHidden) {
                        isHidden = false;
                        const restoredSt = lastGlobalSt - windowStart * ITEM_HEIGHT;
                        if (Number.isFinite(restoredSt) && restoredSt >= 0) {
                            suppressScroll = true;
                            wrapper.scrollTop = Math.min(restoredSt, Math.max(0, wrapper.scrollHeight - cachedVh));
                            suppressScroll = false;
                        }
                    }
                    scheduleRender();
                } else {
                    isHidden = true;
                }
            });
            ro.observe(wrapper);
        }

        scheduleRender();

        const handle = {
            el: wrapper,
            getValue: () => allItems,
            setValue: (newItems) => {
                allItems = Array.isArray(newItems) ? newItems.slice() : [];
                for (const vh of renderedMap.values()) destroyViewHolder(vh);
                renderedMap.clear();
                windowStart = 0;
                windowEnd = Math.min(WINDOW_SIZE, allItems.length);
                updatePhantomHeight();
                lastGlobalSt = 0;
                wrapper.scrollTop = 0;
                scheduleRender();
                if (onChangeCb) onChangeCb(allItems);
            },
            append: (newItems, silent = false) => {
                if (!Array.isArray(newItems) || newItems.length === 0) return;
                const oldLen = allItems.length;
                for (let i = 0; i < newItems.length; i++) allItems.push(newItems[i]);
                const newLen = allItems.length;
                if (windowEnd - windowStart < WINDOW_SIZE && windowEnd === oldLen) {
                    const extend = Math.min(WINDOW_SIZE - (windowEnd - windowStart), newLen - windowEnd);
                    if (extend > 0) { windowEnd += extend; updatePhantomHeight(); }
                }
                scheduleRender();
                if (!silent && onChangeCb) onChangeCb(allItems);
            },
            scrollToIndex: (index) => {
                if (index < 0 || index >= allItems.length) return;
                const maxSt = Math.max(0, (windowEnd - windowStart) * ITEM_HEIGHT - cachedVh);
                const st = (index - windowStart) * ITEM_HEIGHT;
                if (index >= windowStart && index < windowEnd && st <= maxSt) {
                    wrapper.scrollTop = st;
                    scheduleRender();
                    return;
                }
                const half = Math.floor(WINDOW_SIZE / 2);
                let newStart = Math.max(0, index - half);
                let newEnd = Math.min(allItems.length, newStart + WINDOW_SIZE);
                if (newEnd - newStart < WINDOW_SIZE) newStart = Math.max(0, newEnd - WINDOW_SIZE);
                windowStart = newStart;
                windowEnd = newEnd;
                updatePhantomHeight();
                suppressScroll = true;
                wrapper.scrollTop = Math.max(0, Math.min((index - newStart) * ITEM_HEIGHT, wrapper.scrollHeight - cachedVh));
                suppressScroll = false;
                scheduleRender();
            },
            updateItem: (index, newData) => {
                if (index < 0 || index >= allItems.length) return;
                allItems[index] = Object.assign({}, allItems[index], newData);
                const vh = renderedMap.get(index);
                if (vh) {
                    renderedMap.delete(index);
                    destroyViewHolder(vh);
                    scheduleRender();
                }
            },
            invalidate: () => {
                for (const vh of renderedMap.values()) destroyViewHolder(vh);
                renderedMap.clear();
                scheduleRender();
            },
            setMaxHeight: (h) => {
                wrapper.style.maxHeight = typeof h === 'number' ? `${h}px` : h;
                cachedVh = wrapper.clientHeight || 300;
                scheduleRender();
            },
            getMaxHeight: () => parseFloat(wrapper.style.maxHeight) || 300,
            getWindow: () => ({ start: windowStart, end: windowEnd, size: windowEnd - windowStart }),
            getRenderedCount: () => renderedMap.size,
            setLabel: () => {},
            setDisabled: () => {},
            isDisabled: () => false,
            onChange: (fn) => { onChangeCb = fn; },
            destroy: () => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
                for (const vh of renderedMap.values()) destroyViewHolder(vh);
                renderedMap.clear();
                content.innerHTML = '';
                if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            }
        };

        return this._decorateHandle(handle, wrapper, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Creates a high-performance virtual list with ViewHolder pooling.
     * @param {HTMLElement} container - Parent container.
     * @param {Object} config - Configuration.
     * @returns {Object} Component handle.
     */
    _createVirtualRecyclerList(container, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'galaxy-gui-list-viewport';
        const initialMaxH = typeof config.maxHeight === 'number' ? `${config.maxHeight}px` : (config.maxHeight || '300px');
        wrapper.style.cssText = `position:relative;width:100%;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;max-height:${initialMaxH};scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior-y:contain;`;

        if (!document.getElementById('galaxy-list-scrollbar-style')) {
            const style = document.createElement('style');
            style.id = 'galaxy-list-scrollbar-style';
            style.innerHTML = `.galaxy-gui-list-viewport::-webkit-scrollbar{display:none;}`;
            document.head.appendChild(style);
        }

        const phantom = document.createElement('div');
        phantom.className = 'galaxy-gui-list-phantom';
        phantom.style.cssText = 'width:100%;position:relative;pointer-events:none;';
        const content = document.createElement('div');
        content.className = 'galaxy-gui-list-content';
        content.style.cssText = 'position:absolute;top:0;left:0;right:0;opacity:1;will-change:opacity;';
        wrapper.appendChild(phantom);
        wrapper.appendChild(content);
        container.appendChild(wrapper);

        const ITEM_HEIGHT = config.itemHeight || 60;
        const PAGE_SIZE = config.pageSize || 100;
        const DEV_ASSERT = config.devAssertions !== false;

        const extend = config.extend || {};
        if (!Array.isArray(extend.items)) {
            extend.items = Array.isArray(config.items) ? config.items.slice() : [];
        }
        let onChangeCb = config.onChange;
        const renderViewFn = typeof config.renderView === 'function' ? config.renderView : null;

        const defaultOnCreate = (viewType) => {
            const dom = document.createElement('div');
            dom.className = 'galaxy-gui-list-item';
            dom.style.cssText = 'display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;height:100%;';

            if (renderViewFn) {
                return { itemView: dom, viewType, _position: -1, adapterPosition: -1, _comps: [] };
            }

            const textWrap = document.createElement('div');
            textWrap.className = 'galaxy-gui-list-text';
            textWrap.style.cssText = 'display:flex;flex-direction:column;flex:1;min-width:0;';
            const titleEl = document.createElement('div');
            titleEl.className = 'galaxy-gui-list-title';
            const subEl = document.createElement('div');
            subEl.className = 'galaxy-gui-list-subtitle';
            textWrap.appendChild(titleEl);
            textWrap.appendChild(subEl);
            dom.appendChild(textWrap);
            return { itemView: dom, viewType, _position: -1, adapterPosition: -1, _parts: { titleEl, subEl }, _comps: [] };
        };

        const defaultOnBind = (holder, position) => {
            if (renderViewFn) {
                const dom = holder.itemView;
                if (holder._comps) {
                    holder._comps.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} });
                    holder._comps = [];
                }
                dom.innerHTML = '';
                const rendered = renderViewFn(extend.items[position], position, adapterApi);
                if (rendered) {
                    const cfgs = Array.isArray(rendered) ? rendered : [rendered];
                    cfgs.forEach(cfg => {
                        if (!cfg) return;
                        const h = this._createComponent(dom, cfg);
                        if (h) holder._comps.push(h);
                    });
                }
                return;
            }

            const item = extend.items[position];
            if (!item || !holder._parts) return;
            holder._parts.titleEl.textContent = item.title || '';
            holder._parts.subEl.textContent = item.subtitle || '';
        };

        const getItemCount = () => (typeof extend.getItemCount === 'function') ? extend.getItemCount() : extend.items.length;
        const getItemViewType = (pos) => (typeof extend.getItemViewType === 'function') ? extend.getItemViewType(pos) : 0;

        const collectHandles = (h, map, list) => {
            if (!h) return;
            list.push(h);
            if (h.key) map[h.key] = h;
            if (typeof h.getComponents === 'function') {
                try { h.getComponents().forEach(c => collectHandles(c, map, list)); } catch (e) {}
            }
            if (typeof h.getChildren === 'function') {
                try { h.getChildren().forEach(c => collectHandles(c, map, list)); } catch (e) {}
            }
        };

        const adapterApi = {
            createComponent: (el, cfg) => this._createComponent(el, cfg),
            createComponents: (el, cfgs) => {
                if (!Array.isArray(cfgs)) return [];
                return cfgs.map(cfg => this._createComponent(el, cfg)).filter(Boolean);
            },
            createIcon: (cfg, className) => this._createIcon(cfg, className),
            compose: (configs, options = {}) => {
                const dom = document.createElement('div');
                dom.className = options.className || 'galaxy-gui-list-item';
                dom.style.cssText = options.cssText ||
                    'position:relative;width:100%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;';
                const list = [];
                const map = {};
                const arr = Array.isArray(configs) ? configs : [configs];
                arr.forEach(cfg => {
                    const h = this._createComponent(dom, cfg);
                    if (h) collectHandles(h, map, list);
                });
                return {
                    itemView: dom,
                    _comps: list,
                    get: (key) => map[key] || null,
                    getMap: () => ({ ...map }),
                    getComponents: () => list.slice(),
                };
            },
        };

        const activeViews = new Map();
        const recycledPool = new Map();
        const stats = { created: 0, bound: 0, recycled: 0, destroyed: 0 };

        let currentPage = 0;
        let isAnimating = false;
        let suppressScroll = false;
        let suppressScrollRaf = null;
        let lastSwitchTime = 0;

        const suppressNextScroll = () => {
            suppressScroll = true;
            if (suppressScrollRaf) cancelAnimationFrame(suppressScrollRaf);
            suppressScrollRaf = requestAnimationFrame(() => {
                suppressScrollRaf = requestAnimationFrame(() => {
                    suppressScroll = false;
                    suppressScrollRaf = null;
                });
            });
        };

        const POOL_MAX = config.recycledViewPoolMaxSize || 120;

        const assert = DEV_ASSERT
            ? (cond, msg) => { if (!cond) { const err = new Error('[VirtualRecyclerList ASSERT] ' + msg); throw err; } }
            : () => {};

        const destroyViewHolder = (holder) => {
            if (holder._comps) {
                holder._comps.forEach(c => { try { if (!c._destroyed) c.destroy(); } catch (e) {} });
                holder._comps = [];
            }
            if (holder.itemView && holder.itemView.parentNode) {
                holder.itemView.parentNode.removeChild(holder.itemView);
            }
            stats.destroyed++;
        };

        const recycleViewHolder = (pos, holder) => {
            if (!holder) return;
            activeViews.delete(pos);
            if (typeof extend.onViewRecycled === 'function') {
                try { extend.onViewRecycled(holder, adapterApi); } catch (e) {}
            }
            stats.recycled++;
            holder._position = -1;
            holder.adapterPosition = -1;

            if (holder.itemView && holder.itemView.getAnimations) {
                holder.itemView.getAnimations().forEach(anim => anim.cancel());
            }

            if (holder.itemView && holder.itemView.parentNode) {
                holder.itemView.parentNode.removeChild(holder.itemView);
            }
            const pool = recycledPool.get(holder.viewType) || [];
            if (pool.length < POOL_MAX) {
                pool.push(holder);
                recycledPool.set(holder.viewType, pool);
            } else {
                destroyViewHolder(holder);
            }
        };

        const obtainViewHolder = (pos) => {
            const viewType = getItemViewType(pos);
            const pool = recycledPool.get(viewType);
            let holder;
            if (pool && pool.length > 0) {
                holder = pool.pop();
            } else {
                try {
                    if (typeof extend.onCreateViewHolder === 'function') {
                        holder = extend.onCreateViewHolder(wrapper, viewType, adapterApi);
                    } else {
                        holder = defaultOnCreate(viewType);
                    }
                    stats.created++;
                } catch (e) {
                    holder = defaultOnCreate(viewType);
                }
            }
            if (!holder.itemView) throw new Error('ViewHolder must contain an itemView.');
            holder.viewType = viewType;
            holder.itemView.style.position = 'absolute';
            holder.itemView.style.left = '0';
            holder.itemView.style.right = '0';
            holder.itemView.style.top = '0';
            holder.itemView.style.height = `${ITEM_HEIGHT}px`;
            holder.itemView.style.boxSizing = 'border-box';
            content.appendChild(holder.itemView);
            return holder;
        };

        const bindViewHolder = (holder, pos) => {
            holder._position = pos;
            holder.adapterPosition = pos;
            try {
                if (renderViewFn) {
                    defaultOnBind(holder, pos);
                } else if (typeof extend.onBindViewHolder === 'function') {
                    extend.onBindViewHolder(holder, pos, adapterApi);
                } else {
                    defaultOnBind(holder, pos);
                }
            } catch (e) {}
            stats.bound++;
        };

        const getPageRange = (page) => {
            const total = getItemCount();
            if (total === 0) return { start: 0, end: 0, count: 0 };

            let start = page * PAGE_SIZE;
            let end = start + PAGE_SIZE;

            if (start >= total) {
                start = Math.max(0, (Math.ceil(total / PAGE_SIZE) - 1) * PAGE_SIZE);
                end = total;
            } else if (end > total) {
                end = total;
            }

            if (end - start < PAGE_SIZE && start > 0) {
                start = Math.max(0, total - PAGE_SIZE);
            }
            return { start, end, count: end - start };
        };

        const renderCurrentPage = (animate = false) => {
            const { start: startIdx, end: endIdx, count } = getPageRange(currentPage);
            phantom.style.height = `${count * ITEM_HEIGHT}px`;

            for (const [pos, holder] of activeViews) {
                recycleViewHolder(pos, holder);
            }
            activeViews.clear();

            for (let i = startIdx; i < endIdx; i++) {
                const holder = obtainViewHolder(i);
                bindViewHolder(holder, i);
                activeViews.set(i, holder);
                const localIndex = i - startIdx;
                holder.itemView.style.transform = `translateY(${localIndex * ITEM_HEIGHT}px)`;

                if (animate) {
                    holder.itemView.animate([
                        { opacity: 0, transform: `translateY(${localIndex * ITEM_HEIGHT + 20}px)` },
                        { opacity: 1, transform: `translateY(${localIndex * ITEM_HEIGHT}px)` }
                    ], {
                        duration: 350,
                        delay: Math.min(localIndex, 10) * 15,
                        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                        fill: 'both'
                    });
                }
            }
        };

        const switchPage = (direction) => {
            if (isAnimating) return;
            const now = Date.now();
            if (now - lastSwitchTime < 300) return;

            isAnimating = true;
            lastSwitchTime = now;

            try {
                const total = getItemCount();
                const totalPages = Math.ceil(total / PAGE_SIZE);

                if (direction === 'next') currentPage = Math.min(currentPage + 1, totalPages - 1);
                else if (direction === 'prev') currentPage = Math.max(0, currentPage - 1);

                renderCurrentPage(true);

                suppressNextScroll();
                const newRange = getPageRange(currentPage);

                if (direction === 'next') {
                    wrapper.scrollTop = 0;
                } else if (direction === 'prev') {
                    wrapper.scrollTop = Math.max(0, newRange.count * ITEM_HEIGHT - wrapper.clientHeight);
                }

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isAnimating = false;
                    });
                });
            } catch (e) {
                isAnimating = false;
            }
        };

        const onScroll = () => {
            if (suppressScroll || isAnimating) return;

            const st = wrapper.scrollTop;
            const vh = wrapper.clientHeight;
            const sh = wrapper.scrollHeight;
            const total = getItemCount();
            const totalPages = Math.ceil(total / PAGE_SIZE);

            if (st + vh >= sh - 5) {
                if (currentPage < totalPages - 1) switchPage('next');
            } else if (st <= 5) {
                if (currentPage > 0) switchPage('prev');
            }
        };

        wrapper.addEventListener('scroll', onScroll, { passive: true });

        const notifyDataSetChanged = () => {
            currentPage = 0;
            for (const [pos, holder] of [...activeViews]) recycleViewHolder(pos, holder);
            activeViews.clear();
            suppressNextScroll();
            wrapper.scrollTop = 0;
            renderCurrentPage();
        };

        renderCurrentPage();

        const handle = {
            el: wrapper,
            extend,
            getValue: () => extend.items,
            setValue: (newItems) => {
                extend.items.length = 0;
                if (Array.isArray(newItems)) newItems.forEach(i => extend.items.push(i));
                notifyDataSetChanged();
                if (onChangeCb) onChangeCb(extend.items);
            },
            append: (newItems, silent = false) => {
                if (!Array.isArray(newItems) || newItems.length === 0) return;
                newItems.forEach(i => extend.items.push(i));

                const range = getPageRange(currentPage);
                if (range.count > 0) {
                    let maxRendered = -1;
                    for (const pos of activeViews.keys()) {
                        if (pos > maxRendered) maxRendered = pos;
                    }
                    if (activeViews.size === 0 || range.end - 1 > maxRendered) {
                        renderCurrentPage();
                    }
                }

                if (!silent && onChangeCb) onChangeCb(extend.items);
            },
            notifyItemChanged: (pos) => {
                if (pos < 0 || pos >= getItemCount()) return;
                const holder = activeViews.get(pos);
                if (holder) bindViewHolder(holder, pos);
            },
            notifyDataSetChanged,
            scrollToIndex: (index) => {
                const total = getItemCount();
                if (index < 0 || index >= total) return;

                isAnimating = true;

                const targetPage = Math.floor(index / PAGE_SIZE);
                const currentRange = getPageRange(currentPage);

                if (targetPage === currentPage && index >= currentRange.start && index < currentRange.end) {
                    suppressNextScroll();
                    wrapper.scrollTo({ top: Math.max(0, (index - currentRange.start) * ITEM_HEIGHT), behavior: 'instant' });
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            isAnimating = false;
                        });
                    });
                    return;
                }

                currentPage = targetPage;
                renderCurrentPage();
                
                void wrapper.scrollHeight;

                suppressNextScroll();
                const newRange = getPageRange(targetPage);

                requestAnimationFrame(() => {
                    // If the target index is near the end of the list, scroll to the absolute bottom to avoid clamping issues.
                    if (index >= total - PAGE_SIZE) {
                        wrapper.scrollTo({ top: 9999999, behavior: 'instant' });
                    } else {
                        wrapper.scrollTo({ top: Math.max(0, (index - newRange.start) * ITEM_HEIGHT), behavior: 'instant' });
                    }
                    
                    requestAnimationFrame(() => {
                        isAnimating = false;
                    });
                });
            },
            getViewHolder: (index) => {
                return activeViews.get(index) || null;
            },
            notifyItemInserted: (index, count = 1) => {
                if (index < 0) return;
                const currentRange = getPageRange(currentPage);
                isAnimating = true;

                if (index <= currentRange.start && currentPage > 0) {
                    suppressNextScroll();
                    wrapper.scrollTop += count * ITEM_HEIGHT;
                }

                renderCurrentPage();

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isAnimating = false;
                    });
                });
            },
            notifyItemRemoved: (index, count = 1) => {
                if (index < 0) return;
                const currentRange = getPageRange(currentPage);
                isAnimating = true;

                if (index + count <= currentRange.start && currentPage > 0) {
                    suppressNextScroll();
                    wrapper.scrollTop = Math.max(0, wrapper.scrollTop - count * ITEM_HEIGHT);
                }

                const total = getItemCount();
                if (currentPage > 0 && currentPage * PAGE_SIZE >= total) {
                    currentPage = Math.max(0, currentPage - 1);
                }

                renderCurrentPage();

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isAnimating = false;
                    });
                });
            },
            setMaxHeight: (h) => {
                wrapper.style.maxHeight = typeof h === 'number' ? `${h}px` : h;
            },
            getMaxHeight: () => parseFloat(wrapper.style.maxHeight) || 300,
            getRecyclerStats: () => ({
                created: stats.created,
                bound: stats.bound,
                recycled: stats.recycled,
                destroyed: stats.destroyed,
                active: activeViews.size,
                poolSize: Object.fromEntries([...recycledPool].map(([t, arr]) => [t, arr.length])),
                currentPage,
                totalPages: Math.ceil(getItemCount() / PAGE_SIZE),
                itemCount: getItemCount()
            }),
            getRenderedCount: () => activeViews.size,
            setLabel: () => {},
            setDisabled: () => {},
            isDisabled: () => false,
            onChange: (fn) => { onChangeCb = fn; },
            destroy: () => {
                wrapper.removeEventListener('scroll', onScroll);
                if (suppressScrollRaf) { cancelAnimationFrame(suppressScrollRaf); suppressScrollRaf = null; }
                for (const [pos, holder] of [...activeViews]) recycleViewHolder(pos, holder);
                for (const [, pool] of recycledPool) pool.forEach(destroyViewHolder);
                recycledPool.clear();
                content.innerHTML = '';
                if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            }
        };

        return this._decorateHandle(handle, wrapper, { initialStyle: this._resolveStyle(config.style) });
    }

    /**
     * @private
     * @description Initializes drag logic for the panel.
     * @param {HTMLElement} panel - The panel element.
     * @param {HTMLElement} handle - The drag handle element.
     */
    _initDrag(panel, handle) {
        let isDragging = false, startX, startY, startLeft, startTop;
        const onPointerDown = (e) => {
            if (e.target.closest('button')) return;
            e.preventDefault();
            this._zIndexCounter++; panel.style.zIndex = this._zIndexCounter;
            const rect = panel.getBoundingClientRect(), parentRect = this.container.getBoundingClientRect();
            panel.style.transform = 'none'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
            panel.style.left = `${rect.left - parentRect.left}px`; panel.style.top = `${rect.top - parentRect.top}px`;
            isDragging = true; handle.setPointerCapture(e.pointerId);
            startX = e.clientX; startY = e.clientY;
            startLeft = rect.left - parentRect.left; startTop = rect.top - parentRect.top;
        };
        const onPointerMove = (e) => {
            if (!isDragging) return; e.preventDefault();
            const dx = e.clientX - startX, dy = e.clientY - startY;
            const parentRect = this.container.getBoundingClientRect(), rect = panel.getBoundingClientRect();
            let newLeft = startLeft + dx, newTop = startTop + dy;
            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - rect.width));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - rect.height));
            panel.style.left = `${newLeft}px`; panel.style.top = `${newTop}px`;
        };
        const endDrag = (e) => {
            if (!isDragging) return; isDragging = false;
            try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
        };
        handle.addEventListener('pointerdown', onPointerDown);
        handle.addEventListener('pointermove', onPointerMove);
        handle.addEventListener('pointerup', endDrag);
        handle.addEventListener('pointercancel', endDrag);
    }

    /**
     * @private
     * @description Clamps panel positions within the viewport.
     */
    _clampClicks() {
        if (this._destroyed || !this.container) return;
        const parentRect = this.container.getBoundingClientRect();
        this._clickHandles.forEach(h => {
            const panel = h.el;
            if (!panel || !panel.parentNode) return;
            const rect = panel.getBoundingClientRect();
            if (!rect.width && !rect.height) return;
            let currentLeft = parseFloat(panel.style.left), currentTop = parseFloat(panel.style.top);
            if (isNaN(currentLeft)) currentLeft = rect.left - parentRect.left;
            if (isNaN(currentTop)) currentTop = rect.top - parentRect.top;
            let newTop = rect.height >= parentRect.height ? 0 : Math.max(0, Math.min(currentTop, parentRect.height - rect.height));
            let newLeft = rect.width >= parentRect.width ? 0 : Math.max(0, Math.min(currentLeft, parentRect.width - rect.width));
            panel.style.left = `${newLeft}px`; panel.style.top = `${newTop}px`;
        });
    }
}

export { GalaxyClickGui };
export default GalaxyClickGui;