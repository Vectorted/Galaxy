/**
 * @file Galaxy.js
 * @description Canvas-based nested galaxy graph visualization engine.
 * @author Vectorted
 * @license MIT
 */

import { GalaxyStyleRefCount, GALAXY_DEFAULT_COLOR, HEX_COLOR_RE } from './vant.js';
import { GalaxyDialog } from './GalaxyDialog.js';

/**
 * @class Galaxy
 * @description Canvas-based nested galaxy graph visualization engine.
 */
class Galaxy {
    /**
     * @param {Object} options - Engine configuration.
     * @param {HTMLElement} options.container - Parent container.
     * @param {Object} options.dataMap - All graph levels.
     * @param {string} options.rootKey - Initial data key.
     * @param {string} [options.theme='light'] - Initial theme.
     * @param {string} [options.labelAnimation='fade-slide-down'] - Label animation style.
     * @param {number} [options.maxNodes=10] - Max nodes per level.
     * @param {boolean|Object} [options.performanceMonitor=false] - Performance monitor options.
     */
    constructor(options) {
        this.container = options.container;
        this.dataMap = options.dataMap || {};
        this.rootKey = options.rootKey || 'root';
        this.labelAnimation = options.labelAnimation || 'fade-slide-down';
        this.maxNodes = options.maxNodes || 10;
        this._layoutOffset = { x: 0, y: 0 };

        this.perfOptions = options.performanceMonitor || false;
        this._perfMetrics = { theme: true, nodes: true, fps: true, latency: true, memory: true, freq: true, load: true, ...(typeof this.perfOptions === 'object' ? this.perfOptions : {}) };
        this._perfTime = 0; this._frameCount = 0; this._renderTime = 0; this._perfCollapsed = false; this._perfPanelShown = false; this.perfDom = {};

        this.THEMES = {
            light: this._normalizeTheme({
                dark: false,
                background: 'radial-gradient(ellipse 60% 50% at 50% 46%, rgba(120,165,255,.055), transparent 70%), radial-gradient(ellipse 50% 45% at 15% 85%, rgba(160,120,255,.045), transparent 70%), #ffffff',
                surface: 'rgba(255, 255, 255, 0.98)',
                primary: '#4e6c9e',
                onBackground: '#263858',
                onSurface: '#3d5b8c'
            }),
            dark: this._normalizeTheme({
                dark: true,
                background: 'radial-gradient(ellipse 60% 50% at 50% 46%, rgba(70,90,120,.15), transparent 70%), radial-gradient(ellipse 50% 45% at 15% 85%, rgba(50,70,100,.1), transparent 70%), #121212',
                surface: 'rgba(40, 40, 40, 0.95)',
                primary: '#b4c8e6',
                onBackground: '#e6f0ff',
                onSurface: '#e0e6ed'
            })
        };

        this.currentThemeId = options.theme || 'light';
        if (!this.THEMES[this.currentThemeId]) this.currentThemeId = 'light';

        this.currentTheme = this.THEMES[this.currentThemeId];
        this.targetTheme = this.currentTheme;
        this.themeMix = 1;
        this.isSwitchingTheme = false;
        this._pendingThemeId = null;
        this._themeStartTime = 0;
        this._themeDuration = 400;

        this.customToastTheme = options.toastTheme;
        this.toastTheme = Object.assign({}, this.currentTheme.toast, options.toastTheme);

        this.onClick = options.onClick || function() {};
        this.onLeafClickAsync = options.onLeafClickAsync || function(node) { return Promise.resolve(node); };
        this.onEnter = options.onEnter || function() {};
        this.onBack = options.onBack || function() {};
        this.onRootClick = options.onRootClick || function(g, node) { g.poll('Already at the root galaxy'); };

        this._injectStyles();
        this._createUI();

        this.W = 0; this.H = 0; this.DPR = 1; this.SCALE = 1; this.stars = [];
        this.t0 = null; this.lastNow = null; this.rafId = null;
        this.focusId = null; this.mouse = { x: -9999, y: -9999 }; this.ripples = [];

        this.nodes = []; this.removingNodes = []; this.links = []; this.currentRootId = null;
        this.navStack = [];
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.targetCam = { x: 0, y: 0, zoom: 1 };
        this.clickedNode = null;
        this._leafTimer = null; this._rzTimer = null; this._toastTimer = null; this._preRenderTimer = null;
        this._destroyed = false;

        this.isWarping = false; this.warpPhase = 0; this.warpTarget = null;
        this.warpCallback = null; this.warpAlpha = 1;

        this.glyphCache = new Map();
        this._glyphCacheLimit = 16;
        this._activeDialogs = new Set();

        this.GLYPH_SIZE = 640; this.GLYPH_C = 320; this.GLYPH_R = 640 * 0.45;
        this.CONTOUR_DEFS = [
            { layer: 3, delay: 0.00, dur: 0.45, len: R => Math.PI * 2 * R * 0.98, draw: (g, R) => { g.arc(0, 0, R * 0.98, 0, Math.PI * 2); } },
            { layer: 2, delay: 0.16, dur: 0.40, len: R => Math.PI * 2 * R * 0.86, draw: (g, R) => { g.arc(0, 0, R * 0.86, 0, Math.PI * 2); } },
            { layer: 2, delay: 0.28, dur: 0.55, len: R => (5 * 2 * Math.sin(Math.PI * 2 / 5)) * R * 0.82, draw: (g, R) => { this._pentaPath(g, R * 0.82); } },
            { layer: 1, delay: 0.46, dur: 0.32, len: R => Math.PI * 2 * R * 0.56, draw: (g, R) => { g.arc(0, 0, R * 0.56, 0, Math.PI * 2); } },
            { layer: 1, delay: 0.52, dur: 0.30, len: R => Math.PI * 2 * R * 0.42, draw: (g, R) => { g.arc(0, 0, R * 0.42, 0, Math.PI * 2); } },
            { layer: 0, delay: 0.60, dur: 0.32, len: R => Math.PI * 2 * R * 0.30, draw: (g, R) => { g.arc(0, 0, R * 0.30, 0, Math.PI * 2); } },
        ];

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onResize = this._onResize.bind(this);
        this._preventDefault = e => e.preventDefault();

        this._bindEvents();
        this.resize();

        this._initGraph(this.rootKey, null);
        this._boundLoop = this._loop.bind(this);
        this._loop();

        this._preRenderTimer = setTimeout(() => {
            if (this._destroyed) return;
            this._preRenderAllColors();
        }, 1000);
    }

    /**
     * Normalizes a theme definition into a complete theme config.
     * @private
     */
    _normalizeTheme(def) {
        let isDark = def.dark;
        if (isDark === undefined) {
            const bg = def.background || def.bg || def.canvasBg || '#ffffff';
            if (bg.startsWith('#')) {
                const n = parseInt(bg.slice(1), 16);
                const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
                isDark = ((r * 0.299 + g * 0.587 + b * 0.114) / 255) < 0.5;
            } else {
                isDark = false;
            }
        }

        const parseRgb = (colorStr, fallback) => {
            if (!colorStr) return fallback;
            if (typeof colorStr !== 'string') return fallback;

            if (colorStr.startsWith('#')) {
                let hex = colorStr.slice(1);
                if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                if (hex.length === 6) {
                    const n = parseInt(hex, 16);
                    if (Number.isFinite(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
                }
                return fallback;
            }

            const rgbMatch = colorStr.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
            if (rgbMatch) {
                return [Math.round(+rgbMatch[1]), Math.round(+rgbMatch[2]), Math.round(+rgbMatch[3])];
            }

            if (colorStr.includes(',')) {
                const parts = colorStr.split(',').map(Number);
                if (parts.length === 3 && !parts.some(isNaN)) return parts;
            }
            return fallback;
        };

        const toRgbString = (arr) => arr.join(',');
        const rgbToHex = (arr) => '#' + ((1 << 24) + (arr[0] << 16) + (arr[1] << 8) + arr[2]).toString(16).slice(1);

        const primary = parseRgb(def.primary || def.starColor, isDark ? [208, 188, 255] : [103, 80, 164]);
        const background = def.background || def.canvasBg || def.bg || (isDark ? '#1C1B1F' : '#FFFFFF');
        const surface = def.surface || def.toast?.bg || (isDark ? '#2B2930' : '#F3EDF7');
        const onBackground = parseRgb(def.onBackground || def.textColor, isDark ? [230, 225, 229] : [28, 27, 31]);
        const onSurface = parseRgb(def.onSurface || def.text || def.toast?.color, isDark ? [230, 225, 229] : [28, 27, 31]);

        const inkK = isDark ? -0.5 : 0.45;
        const lineAlpha = isDark ? 0.85 : 0.55;
        const pStr = toRgbString(primary);
        const obStr = toRgbString(onBackground);
        const osStr = toRgbString(onSurface);
        const primaryRgba = (alpha) => `rgba(${pStr},${alpha})`;

        const toastBorder = def.toast?.border || (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)');
        const toastShadow = def.toast?.shadow || (isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.15)');
        const btnBg = def.btn?.btnBg || surface;
        const btnColor = def.btn?.btnColor || rgbToHex(onSurface);
        const btnBorder = def.btn?.btnBorder || (isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)');
        const btnHoverBg = def.btn?.btnHoverBg || primaryRgba(isDark ? 0.15 : 0.08);
        const btnRipple = def.btn?.btnRipple || primaryRgba(isDark ? 0.25 : 0.25);

        return {
            canvasBg: background, starColor: pStr, textColor: obStr, lineAlpha: def.lineAlpha !== undefined ? def.lineAlpha : lineAlpha, inkK: def.inkK !== undefined ? def.inkK : inkK,
            toast: { bg: surface, color: rgbToHex(onSurface), border: toastBorder, shadow: toastShadow },
            btn: { btnBg: btnBg, btnColor: btnColor, btnBorder: btnBorder, btnHoverBg: btnHoverBg, btnRipple: btnRipple }
        };
    }

    /**
     * Creates a new GalaxyDialog instance.
     * @returns {GalaxyDialog}
     */
    createDialog() { return new GalaxyDialog(this); }

    /**
     * Registers a dialog to be tracked.
     * @private
     * @param {GalaxyDialog} dialog
     */
    _registerDialog(dialog) { this._activeDialogs.add(dialog); }

    /**
     * Unregisters a dialog.
     * @private
     * @param {GalaxyDialog} dialog
     */
    _unregisterDialog(dialog) { this._activeDialogs.delete(dialog); }

    /**
     * Gets a snapshot of the current engine state.
     * @returns {Object}
     */
    getState() {
        return {
            themeId: this.currentThemeId,
            pendingThemeId: this._pendingThemeId,
            isSwitchingTheme: this.isSwitchingTheme,
            rootKey: this.rootKey,
            currentRootId: this.currentRootId,
            navStack: this.getNavStack(),
            nodeCount: this.nodes.length,
            removingCount: this.removingNodes.length,
            linkCount: this.links.length,
            isWarping: this.isWarping,
            focusId: this.focusId,
            clickedNodeId: this.clickedNode ? this.clickedNode.id : null,
            dimensions: { W: this.W, H: this.H, scale: this.SCALE, dpr: this.DPR },
            camera: { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom },
            themes: this.getThemes()
        };
    }

    /**
     * Gets the current level data info.
     * @returns {Object|null}
     */
    getCurrentLevel() {
        const top = this.navStack[this.navStack.length - 1];
        if (!top) return null;
        return { key: top.key, rootId: top.rootId, depth: this.navStack.length };
    }

    /**
     * Gets a node by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getNode(id) { return this.nodes.find(n => n.id === id) || null; }

    /**
     * Gets a safe copy of all nodes in the current level.
     * @returns {Array<Object>}
     */
    getNodes() {
        return this.nodes.map(n => ({
            id: n.id, name: n.name, r: n.r, color: n.color, children: n.children,
            reveal: n.reveal, dim: n.dim
        }));
    }

    /**
     * Gets the navigation stack.
     * @returns {Array<Object>}
     */
    getNavStack() { return this.navStack.map(s => ({ key: s.key, rootId: s.rootId })); }

    /**
     * Checks if can navigate back.
     * @returns {boolean}
     */
    canGoBack() { return this.navStack.length > 1 && !this.isWarping; }

    /**
     * Checks if a node can be entered.
     * @param {string} id
     * @returns {boolean}
     */
    canEnter(id) {
        if (this.isWarping) return false;
        const n = this.getNode(id);
        if (!n || !n.children) return false;
        const data = this.dataMap[n.children];
        return !!(data && Array.isArray(data.nodes) && data.nodes.length > 0);
    }

    /**
     * Gets all registered theme IDs.
     * @returns {Array<string>}
     */
    getThemes() { return Object.keys(this.THEMES); }

    /**
     * Gets the current theme ID.
     * @returns {string}
     */
    getThemeId() { return this.currentThemeId; }

    /**
     * Focuses a node.
     * @param {string} id
     * @returns {boolean}
     */
    focusNode(id) {
        const n = this.getNode(id);
        if (!n) return false;
        this.clickedNode = n;
        return true;
    }

    /**
     * Clears node focus.
     * @returns {void}
     */
    clearFocus() { this.clickedNode = null; }

    /**
     * Resets the view.
     * @returns {void}
     */
    resetView() { this.relayout(); }

    /**
     * Sets a global layout offset for the graph center.
     * @param {number} x
     * @param {number} y
     */
    setLayoutOffset(x, y) {
        if (this._destroyed) return;
        this._layoutOffset = { x, y };
        this._calcLayout();
    }

    /**
     * Registers a custom theme.
     * @param {string} themeId
     * @param {Object} config
     */
    registerTheme(themeId, config) {
        if (this._destroyed) return;
        this.THEMES[themeId] = this._normalizeTheme(config);
    }

    /**
     * Gets a deep copy of the data map.
     * @returns {Object}
     */
    getGraphData() { return JSON.parse(JSON.stringify(this.dataMap)); }

    /**
     * Replaces the entire data map and resets the view.
     * @param {Object} newDataMap
     * @returns {boolean}
     */
    setGraphData(newDataMap) {
        if (this._destroyed) return false;
        if (!newDataMap || typeof newDataMap !== 'object') return false;
        this.dataMap = JSON.parse(JSON.stringify(newDataMap));
        if (!this.dataMap[this.rootKey]) {
            const keys = Object.keys(this.dataMap);
            if (keys.length === 0) return false;
            this.rootKey = keys[0];
        }
        this.navStack = [];
        this._initGraph(this.rootKey, null);
        return true;
    }

    /**
     * Adds a new node to the current level.
     * @param {Object} nodeData
     * @param {Array<string>} [linkTargets=[]]
     * @returns {boolean}
     */
    addNode(nodeData, linkTargets = []) {
        if (this._destroyed) return false;
        if (this.nodes.length + this.removingNodes.length >= this.maxNodes) return false;
        const newId = nodeData.id || ('n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
        if (this.nodes.some(n => n.id === newId)) return false;

        const t = this.t0 === null ? 0 : (performance.now() - this.t0) / 1000;
        const newNode = {
            ...nodeData, id: newId,
            appear: t + 0.1,
            phase: Math.random() * Math.PI * 2,
            angles: [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28],
            spinFactor: 0.75 + Math.random() * 0.5,
            reveal: 0, dim: 0, p: 0, pRaw: 0,
            wx: this.W / 2, wy: this.H / 2, tx: this.W / 2, ty: this.H / 2
        };
        this.nodes.push(newNode);
        this.neighbors.set(newNode.id, new Set());

        const rawTargets = Array.isArray(linkTargets) ? linkTargets : [];
        const uniqueTargets = Array.from(new Set(rawTargets.filter(tid => typeof tid === 'string' && tid !== newId)));
        const validLinks = [];
        uniqueTargets.forEach(targetId => {
            const targetNode = this.nodes.find(n => n.id === targetId);
            if (targetNode) {
                this.links.push({
                    a: newNode, b: targetNode,
                    delay: newNode.appear + 0.2, prog: 0, dim: 0,
                    offset: Math.random(),
                    ia: this._ink(this._adaptColor(newNode.color), 0.45),
                    ib: this._ink(this._adaptColor(targetNode.color), 0.45)
                });
                this.neighbors.get(newNode.id).add(targetId);
                this.neighbors.get(targetId).add(newNode.id);
                validLinks.push([newNode.id, targetId]);
            }
        });

        this._calcLayout();
        const isDark = this.targetTheme.inkK < 0;
        const inkK = isDark ? -0.6 : 0.45;
        newNode._adaptedColor = this._adaptColor(newNode.color);
        newNode._layers = this._getGlyphLayers(newNode.color);
        newNode._inkColor = this._ink(newNode._adaptedColor, inkK);

        const currStack = this.navStack[this.navStack.length - 1];
        if (currStack && this.dataMap[currStack.key]) {
            const level = this.dataMap[currStack.key];
            if (!Array.isArray(level.nodes)) level.nodes = [];
            if (!Array.isArray(level.links)) level.links = [];
            level.nodes.push({ ...nodeData, id: newId });
            validLinks.forEach(l => level.links.push(l));
        }
        return true;
    }

    /**
     * Removes a node from the current level.
     * @param {string} id
     * @returns {boolean}
     */
    removeNode(id) {
        if (this._destroyed) return false;
        if (id === this.currentRootId) return false;
        const index = this.nodes.findIndex(n => n.id === id);
        if (index === -1) return false;

        const node = this.nodes[index];
        node.isRemoving = true;
        node.removeProgress = 1;
        this.nodes.splice(index, 1);
        this.removingNodes.push(node);
        this.neighbors.delete(id);

        if (this.clickedNode && this.clickedNode.id === id) this.clickedNode = null;
        if (this.focusId === id) this.focusId = null;

        this.links = this.links.filter(l => {
            if (l.a.id === id || l.b.id === id) {
                if (l.a.id === id && this.neighbors.has(l.b.id)) this.neighbors.get(l.b.id).delete(id);
                if (l.b.id === id && this.neighbors.has(l.a.id)) this.neighbors.get(l.a.id).delete(id);
                return false;
            }
            return true;
        });

        const currStack = this.navStack[this.navStack.length - 1];
        if (currStack && this.dataMap[currStack.key]) {
            const level = this.dataMap[currStack.key];
            if (Array.isArray(level.nodes)) level.nodes = level.nodes.filter(n => n.id !== id);
            if (Array.isArray(level.links)) level.links = level.links.filter(l => Array.isArray(l) && l[0] !== id && l[1] !== id);
        }
        this._calcLayout();
        return true;
    }

    /**
     * Updates a node's properties.
     * @param {string} id
     * @param {Object} updates
     * @returns {boolean}
     */
    updateNode(id, updates) {
        if (this._destroyed) return false;
        const node = this.nodes.find(n => n.id === id);
        if (!node) return false;

        const { id: _ignoredId, appear, p, pRaw, wx, wy, tx, ty, reveal, dim, phase, angles, spinFactor, ...safeUpdates } = updates;
        const oldColor = node.color;
        Object.assign(node, safeUpdates);

        if (safeUpdates.color && safeUpdates.color !== oldColor) {
            const isDark = this.targetTheme.inkK < 0;
            const inkK = isDark ? -0.6 : 0.45;
            node._adaptedColor = this._adaptColor(safeUpdates.color);
            node._layers = this._getGlyphLayers(safeUpdates.color);
            node._inkColor = this._ink(node._adaptedColor, inkK);
            this.links.forEach(L => {
                if (L.a.id === id) L.ia = this._ink(node._adaptedColor, 0.45);
                if (L.b.id === id) L.ib = this._ink(node._adaptedColor, 0.45);
            });
        }

        const currStack = this.navStack[this.navStack.length - 1];
        if (currStack && this.dataMap[currStack.key]) {
            const level = this.dataMap[currStack.key];
            if (Array.isArray(level.nodes)) {
                const dNode = level.nodes.find(n => n.id === id);
                if (dNode) Object.assign(dNode, safeUpdates);
            }
        }
        this._calcLayout();
        return true;
    }

    /**
     * Switches to a new theme with a transition.
     * @param {string} themeName
     */
    setTheme(themeName) {
        if (this._destroyed) return;
        if (!this.THEMES[themeName]) return;
        if (this.isSwitchingTheme) {
            this._pendingThemeId = themeName;
            return;
        }
        if (themeName === this.currentThemeId) return;
        this._applyTheme(themeName);
    }

    /**
     * Applies a theme immediately and starts the transition.
     * @private
     * @param {string} themeName
     */
    _applyTheme(themeName) {
        this.currentThemeId = themeName;
        this.isSwitchingTheme = true;
        this._pendingThemeId = null;
        this.targetTheme = this.THEMES[themeName];
        this.themeMix = 0;
        this._themeStartTime = performance.now();

        this.glyphCache.clear();

        if (this.wrapperEl) {
            this.wrapperEl.style.setProperty('--galaxy-theme-surface', this.targetTheme.toast.bg);
            this.wrapperEl.style.setProperty('--galaxy-theme-color', this.targetTheme.toast.color);
            this.wrapperEl.style.setProperty('--galaxy-theme-primary', this.targetTheme.btn.btnColor);
            this.wrapperEl.style.setProperty('--galaxy-theme-border', this.targetTheme.toast.border);
            this.wrapperEl.style.setProperty('--galaxy-theme-hover', this.targetTheme.btn.btnHoverBg);
        }

        if (this.bgEl) {
            if (this.transBgEl && this.transBgEl.parentNode) this.transBgEl.parentNode.removeChild(this.transBgEl);
            this.transBgEl = document.createElement('div');
            this.transBgEl.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; background:${this.targetTheme.canvasBg}; opacity:0; transition: opacity ${this._themeDuration}ms ease; z-index: 0; pointer-events: none;`;
            this.wrapperEl.appendChild(this.transBgEl);
            requestAnimationFrame(() => { if (this.transBgEl) this.transBgEl.style.opacity = '1'; });
        }

        this.toastTheme = Object.assign({}, this.targetTheme.toast, this.customToastTheme);
        if (this.toastEl) {
            this.toastEl.style.background = this.toastTheme.bg;
            this.toastEl.style.color = this.toastTheme.color;
            this.toastEl.style.border = this.toastTheme.border;
            this.toastEl.style.boxShadow = this.toastTheme.shadow;
        }

        requestAnimationFrame(() => {
            if (this._destroyed) return;
            this._updateNodeColors();
            this._updatePerfTheme();
            if (this.perfDom.theme) this.perfDom.theme.textContent = themeName;
        });
    }

    /**
     * Updates colors of all nodes and links to match the new theme.
     * @private
     */
    _updateNodeColors() {
        const isDark = this.targetTheme.inkK < 0;
        const inkK = isDark ? -0.6 : 0.45;
        for (const n of this.nodes) {
            n._adaptedColor = this._adaptColor(n.color);
            n._layers = this._getGlyphLayers(n.color);
            n._inkColor = this._ink(n._adaptedColor, inkK);
        }
        for (const rn of this.removingNodes) {
            rn._adaptedColor = this._adaptColor(rn.color);
            rn._inkColor = this._ink(rn._adaptedColor, inkK);
        }
        for (const L of this.links) {
            L.ia = this._ink(L.a._adaptedColor, 0.45);
            L.ib = this._ink(L.b._adaptedColor, 0.45);
        }
    }

    /**
     * Pre-renders glyphs for all known node colors asynchronously.
     * Uses requestIdleCallback to avoid blocking the main thread.
     * @private
     * @returns {void}
     */
    _preRenderAllColors() {
        if (this._destroyed) return;
        const allColors = new Set();
        Object.values(this.dataMap).forEach(data => {
            if (!data || !Array.isArray(data.nodes)) return;
            data.nodes.forEach(n => {
                if (n && typeof n.color === 'string' && HEX_COLOR_RE.test(n.color)) allColors.add(n.color);
            });
        });

        const colorsToRender = Array.from(allColors);
        let idx = 0;

        /**
         * @param {IdleDeadline} [deadline]
         */
        const renderBatch = (deadline) => {
            if (this._destroyed) return;
            
            // Render up to 2 glyphs per idle cycle or until time runs out
            while (idx < colorsToRender.length) {
                this._getGlyphLayers(colorsToRender[idx]);
                idx++;
                
                if (deadline && deadline.timeRemaining() < 5) break;
                if (!deadline && idx % 2 === 0) break;
            }

            if (idx < colorsToRender.length) {
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(renderBatch);
                } else {
                    setTimeout(() => renderBatch(), 50);
                }
            }
        };

        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(renderBatch);
        } else {
            setTimeout(() => renderBatch(), 0);
        }
    }

    /**
     * Shows a toast message.
     * @param {string} text
     */
    poll(text) {
        if (this._destroyed) return;
        if (!this.toastEl) {
            this.toastEl = document.createElement('div');
            this.toastEl.className = 'galaxy-toast';
            this.toastEl.style.background = this.toastTheme.bg;
            this.toastEl.style.color = this.toastTheme.color;
            this.toastEl.style.border = this.toastTheme.border;
            this.toastEl.style.boxShadow = this.toastTheme.shadow;
            this.wrapperEl.appendChild(this.toastEl);
        }
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this.toastEl.getAnimations().forEach(anim => anim.cancel());

        this.toastEl.innerText = text;
        this.toastEl.style.transform = 'translate(-50%, -20px) scale(0.8)';
        this.toastEl.style.opacity = '0';
        void this.toastEl.offsetWidth;

        this.toastEl.animate([
            { transform: 'translate(-50%, -20px) scale(0.8)', opacity: 0 },
            { transform: 'translate(-50%, 0) scale(1.05)', opacity: 1, offset: 0.7 },
            { transform: 'translate(-50%, 0) scale(1)', opacity: 1 }
        ], { duration: 500, easing: 'ease-out', fill: 'forwards' });

        this._toastTimer = setTimeout(() => {
            if (this._destroyed || !this.toastEl) return;
            this.toastEl.animate([
                { transform: 'translate(-50%, 0) scale(1)', opacity: 1 },
                { transform: 'translate(-50%, -20px) scale(0.9)', opacity: 0 }
            ], { duration: 400, easing: 'ease-in', fill: 'forwards' });
        }, 2500);
    }

    /**
     * Destroys the engine.
     */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;

        cancelAnimationFrame(this.rafId);
        if (this._leafTimer) clearTimeout(this._leafTimer);
        if (this._toastTimer) clearTimeout(this._toastTimer);
        if (this._rzTimer) clearTimeout(this._rzTimer);
        if (this._preRenderTimer) clearTimeout(this._preRenderTimer);
        this._pendingThemeId = null;

        if (this._activeDialogs) {
            const dialogs = Array.from(this._activeDialogs);
            this._activeDialogs.clear();
            dialogs.forEach(d => { try { d._forceClose(); } catch (e) {} });
        }

        if (this.canvas) {
            this.canvas.removeEventListener('pointerdown', this._onPointerDown);
            this.canvas.removeEventListener('mousemove', this._onMouseMove);
            this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
            this.canvas.removeEventListener('touchstart', this._preventDefault);
            this.canvas.removeEventListener('touchmove', this._preventDefault);
            this.canvas.removeEventListener('mousedown', this._preventDefault);
        }

        window.removeEventListener('resize', this._onResize);
        window.removeEventListener('orientationchange', this._onResize);
        if (window.visualViewport) window.visualViewport.removeEventListener('resize', this._onResize);
        if (this.resizeObserver) this.resizeObserver.disconnect();

        if (this.wrapperEl && this.wrapperEl.parentNode) this.wrapperEl.parentNode.removeChild(this.wrapperEl);

        this.nodes = []; this.removingNodes = []; this.links = []; this.ripples = []; this.stars = [];
        this.glyphCache.clear();
        this.neighbors = new Map();
        this.wrapperEl = null; this.canvas = null; this.ctx = null;
        this.toastEl = null; this.bgEl = null; this.transBgEl = null;
        this.perfPanelEl = null; this.perfToggleEl = null; this.perfWrapperEl = null;

        GalaxyStyleRefCount.core = Math.max(0, GalaxyStyleRefCount.core - 1);
        if (GalaxyStyleRefCount.core === 0) {
            const styleEl = document.getElementById('galaxy-engine-core-styles');
            if (styleEl) styleEl.remove();
            const dialogStyle = document.getElementById('galaxy-dialog-styles');
            if (dialogStyle) dialogStyle.remove();
        }
    }

    /**
     * Navigates back to the parent level.
     */
    goBack() {
        if (this._destroyed || this.navStack.length <= 1 || this.isWarping) return;
        const currentRootNode = this.nodes.find(n => n.id === this.currentRootId);
        this._warpTo(null, () => {
            this.navStack.pop();
            const prev = this.navStack[this.navStack.length - 1];
            if (!prev) return;
            this._initGraph(prev.key, prev.rootId);
            this.onBack(currentRootNode, prev.key);
        });
    }

    /**
     * Replays the entrance animation.
     */
    relayout() {
        if (this._destroyed) return;
        this.t0 = null;
        this.clickedNode = null;
        if (this._leafTimer) clearTimeout(this._leafTimer);
        this.camera.x = this.W / 2 + this._layoutOffset.x;
        this.camera.y = this.H / 2 + this._layoutOffset.y;
        this.camera.zoom = 1;
        this.targetCam.x = this.W / 2 + this._layoutOffset.x;
        this.targetCam.y = this.H / 2 + this._layoutOffset.y;
        this.targetCam.zoom = 1;
        this.nodes.forEach(n => { n.wx = this.W / 2 + this._layoutOffset.x; n.wy = this.H / 2 + this._layoutOffset.y; n.dim = 0; n.p = 0; n.pRaw = 0; n.reveal = 0; });
        this._calcLayout();
        this.links.forEach(L => { L.dim = 0; L.prog = 0; });
    }

    /**
     * Injects CSS styles for the core engine.
     * @private
     */
    _injectStyles() {
        const styleId = 'galaxy-engine-core-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .galaxy-wrapper ::selection { background: transparent; }
                .galaxy-wrapper ::-moz-selection { background: transparent; }
                .galaxy-wrapper input::selection,
                .galaxy-wrapper textarea::selection,
                .galaxy-dialog-input::selection {
                    background: rgba(78, 108, 158, 0.35);
                    color: inherit;
                }
                .galaxy-wrapper input::-moz-selection,
                .galaxy-wrapper textarea::-moz-selection,
                .galaxy-dialog-input::-moz-selection {
                    background: rgba(78, 108, 158, 0.35);
                    color: inherit;
                }

                .galaxy-wrapper {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;
                    user-select: none !important; -webkit-user-select: none !important;
                    touch-action: none; -webkit-touch-callout: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                .galaxy-wrapper * {
                    box-sizing: border-box;
                    user-select: none !important; -webkit-user-select: none !important;
                    -webkit-touch-callout: none !important; -webkit-tap-highlight-color: transparent !important;
                }
                .galaxy-wrapper input, .galaxy-wrapper textarea {
                    user-select: text !important; -webkit-user-select: text !important;
                }

                .galaxy-canvas {
                    display: block; width: 100%; height: 100%; will-change: transform; transform: translateZ(0);
                    position: absolute; top: 0; left: 0; z-index: 1;
                }
                .galaxy-toast {
                    position: absolute; top: 30px; left: 50%; transform: translate(-50%, 0) scale(1);
                    padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;
                    letter-spacing: 0.02em; pointer-events: none; z-index: 9999; white-space: nowrap;
                    text-align: center; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
                    will-change: transform, opacity; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: background 0.4s ease, color 0.4s ease, border-color 0.4s ease;
                }

                .galaxy-perf-wrapper { position: absolute; top: 20px; right: 20px; z-index: 600; padding-top: env(safe-area-inset-top); padding-right: env(safe-area-inset-right); pointer-events: none; }
                .galaxy-perf-panel {
                    display: none; flex-direction: row; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 12px;
                    font-variant-numeric: tabular-nums; box-sizing: border-box; pointer-events: auto; touch-action: none; cursor: grab;
                    user-select: none !important; -webkit-user-select: none !important;
                    -webkit-touch-callout: none !important; -webkit-tap-highlight-color: transparent !important;
                    width: max-content; max-width: calc(100vw - 40px); overflow: hidden;
                }
                .galaxy-perf-panel * { user-select: none !important; -webkit-user-select: none !important; -webkit-touch-callout: none !important; }
                .galaxy-perf-panel:active { cursor: grabbing; }
                .galaxy-perf-metrics { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; transition: opacity 0.35s ease; flex: 1; }
                .galaxy-perf-metrics.hidden { opacity: 0; }
                .galaxy-perf-item { display: flex; align-items: center; white-space: nowrap; }
                .galaxy-perf-item span { margin-left: 4px; transition: opacity 0.15s ease; }
                .galaxy-perf-item span.updating { opacity: 0.4; }
                .galaxy-perf-panel.is-vertical { width: max-content; align-items: flex-start; cursor: pointer; }
                .galaxy-perf-panel.is-vertical .galaxy-perf-metrics { flex-direction: column; align-items: flex-start; gap: 6px; }
                .galaxy-perf-panel.is-vertical .galaxy-perf-toggle { display: none; }
                .galaxy-perf-toggle { display: none; position: relative; right: auto; top: auto; transform: none; flex-shrink: 0; width: 24px; height: 24px; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid currentColor; color: inherit; cursor: pointer; padding: 0; background: transparent; outline: none; user-select: none; transition: background 0.2s, transform 0.3s; }
                .galaxy-perf-toggle:hover { background: rgba(127, 127, 127, 0.15); }
                .galaxy-perf-toggle svg { width: 14px; height: 14px; fill: currentColor; pointer-events: none; transition: transform 0.3s; }
                .galaxy-perf-toggle.is-vertical svg { transform: rotate(90deg); }
            `;
            document.head.appendChild(style);
        }
        GalaxyStyleRefCount.core++;
    }

    /**
     * Creates the core UI structure.
     * @private
     */
    _createUI() {
        this.wrapperEl = document.createElement('div');
        this.wrapperEl.className = 'galaxy-wrapper';

        if (this.container === document.body) {
            this.wrapperEl.style.position = 'fixed';
            this.wrapperEl.style.width = '100dvw';
            this.wrapperEl.style.height = '100dvh';
        } else if (getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }
        this.container.appendChild(this.wrapperEl);

        this.wrapperEl.style.setProperty('--galaxy-theme-surface', this.currentTheme.toast.bg);
        this.wrapperEl.style.setProperty('--galaxy-theme-color', this.currentTheme.toast.color);
        this.wrapperEl.style.setProperty('--galaxy-theme-primary', this.currentTheme.btn.btnColor);
        this.wrapperEl.style.setProperty('--galaxy-theme-border', this.currentTheme.toast.border);
        this.wrapperEl.style.setProperty('--galaxy-theme-hover', this.currentTheme.btn.btnHoverBg);

        this.bgEl = document.createElement('div');
        this.bgEl.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; background:${this.currentTheme.canvasBg}; z-index: 0; pointer-events: none;`;
        this.wrapperEl.appendChild(this.bgEl);

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'galaxy-canvas';
        this.wrapperEl.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        if (this.perfOptions) this._createPerfPanel();
    }

    /**
     * Creates the performance monitor panel.
     * @private
     */
    _createPerfPanel() {
        const anyEnabled = Object.values(this._perfMetrics).some(v => v === true);
        if (!anyEnabled) return;
        this.perfWrapperEl = document.createElement('div');
        this.perfWrapperEl.className = 'galaxy-perf-wrapper';
        this.perfPanelEl = document.createElement('div');
        this.perfPanelEl.className = 'galaxy-perf-panel';
        this.perfMetricsEl = document.createElement('div');
        this.perfMetricsEl.className = 'galaxy-perf-metrics hidden';

        const metrics = [];
        if (this._perfMetrics.nodes) metrics.push('<div class="galaxy-perf-item">Galaxy:<span class="perf-nodes">--</span></div>');
        if (this._perfMetrics.theme) metrics.push(`<div class="galaxy-perf-item">Theme:<span class="perf-theme">${this.currentThemeId}</span></div>`);
        if (this._perfMetrics.fps) metrics.push('<div class="galaxy-perf-item">FPS:<span class="perf-fps">--</span></div>');
        if (this._perfMetrics.latency) metrics.push('<div class="galaxy-perf-item">Delay:<span class="perf-latency">--</span></div>');
        if (this._perfMetrics.memory) metrics.push('<div class="galaxy-perf-item">Mem:<span class="perf-mem">--</span></div>');
        if (this._perfMetrics.freq) metrics.push('<div class="galaxy-perf-item">Freq:<span class="perf-freq">--</span></div>');
        if (this._perfMetrics.load) metrics.push('<div class="galaxy-perf-item">Load:<span class="perf-load">--</span></div>');
        this.perfMetricsEl.innerHTML = metrics.join('');
        this.perfPanelEl.appendChild(this.perfMetricsEl);

        this.perfDom.nodes = this.perfMetricsEl.querySelector('.perf-nodes');
        this.perfDom.theme = this.perfMetricsEl.querySelector('.perf-theme');
        this.perfDom.fps = this.perfMetricsEl.querySelector('.perf-fps');
        this.perfDom.latency = this.perfMetricsEl.querySelector('.perf-latency');
        this.perfDom.memory = this.perfMetricsEl.querySelector('.perf-mem');
        this.perfDom.freq = this.perfMetricsEl.querySelector('.perf-freq');
        this.perfDom.load = this.perfMetricsEl.querySelector('.perf-load');
        this.perfSpans = this.perfMetricsEl.querySelectorAll('span');

        this.perfToggleEl = document.createElement('button');
        this.perfToggleEl.className = 'galaxy-perf-toggle';
        this.perfToggleEl.type = 'button';
        this.perfToggleEl.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
        this.perfToggleEl.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });

        this._togglePerfOrientation = (forceVertical) => {
            if (this._perfCollapsed === forceVertical) return;
            const parentRect = this.wrapperEl.getBoundingClientRect();
            let rect = this.perfWrapperEl.getBoundingClientRect();
            let currentLeft = rect.left - parentRect.left;
            let currentTop = rect.top - parentRect.top;
            this.perfWrapperEl.style.right = 'auto';
            this.perfWrapperEl.style.left = `${currentLeft}px`;
            this.perfWrapperEl.style.top = `${currentTop}px`;
            const first = this.perfPanelEl.getBoundingClientRect();
            this.perfMetricsEl.style.opacity = '0';
            this._perfCollapsed = forceVertical;
            if (this._perfCollapsed) this.perfPanelEl.classList.add('is-vertical');
            else this.perfPanelEl.classList.remove('is-vertical');

            const last = this.perfPanelEl.getBoundingClientRect();
            const anims = [];
            if (first.width !== last.width || first.height !== last.height) {
                anims.push(this.perfPanelEl.animate([{ width: `${first.width}px`, height: `${first.height}px` }, { width: `${last.width}px`, height: `${last.height}px` }], { duration: 350, easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)' }));
            }
            let newLeft = currentLeft, newTop = currentTop;
            if (newLeft + last.width > parentRect.width) newLeft = Math.max(0, parentRect.width - last.width);
            if (newTop + last.height > parentRect.height) newTop = Math.max(0, parentRect.height - last.height);
            if (newLeft !== currentLeft || newTop !== currentTop) {
                const anim = this.perfWrapperEl.animate([{ left: `${currentLeft}px`, top: `${currentTop}px` }, { left: `${newLeft}px`, top: `${newTop}px` }], { duration: 350, easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)', fill: 'forwards' });
                anims.push(anim);
                this.perfWrapperEl.style.left = `${newLeft}px`;
                this.perfWrapperEl.style.top = `${newTop}px`;
            }
            Promise.all(anims.map(a => a.finished)).then(() => { if (!this._destroyed) { anims.forEach(a => a.cancel()); this.perfMetricsEl.style.opacity = '1'; } });
        };

        this.perfToggleEl.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._togglePerfOrientation(true); });
        this.perfPanelEl.addEventListener('selectstart', e => e.preventDefault());
        this.perfPanelEl.addEventListener('contextmenu', e => e.preventDefault());
        this.perfPanelEl.appendChild(this.perfToggleEl);
        this.perfWrapperEl.appendChild(this.perfPanelEl);
        this.wrapperEl.appendChild(this.perfWrapperEl);
        this._updatePerfTheme();
        this._initPerfDrag();
    }

    /**
     * Initializes drag logic for the performance panel.
     * @private
     */
    _initPerfDrag() {
        let isDragging = false, startX, startY, startLeft, startTop, startDragX = 0, startDragY = 0, lastTapTime = 0;
        this.perfPanelEl.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.galaxy-perf-toggle')) return;
            e.preventDefault();
            isDragging = true;
            this.perfPanelEl.setPointerCapture(e.pointerId);
            startDragX = e.clientX; startDragY = e.clientY;
            const rect = this.perfWrapperEl.getBoundingClientRect();
            const parentRect = this.wrapperEl.getBoundingClientRect();
            startX = e.clientX; startY = e.clientY;
            startLeft = rect.left - parentRect.left; startTop = rect.top - parentRect.top;
            this.perfWrapperEl.style.right = 'auto';
            this.perfWrapperEl.style.left = `${startLeft}px`;
            this.perfWrapperEl.style.top = `${startTop}px`;
        });
        this.perfPanelEl.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - startX, dy = e.clientY - startY;
            const parentRect = this.wrapperEl.getBoundingClientRect();
            const rect = this.perfWrapperEl.getBoundingClientRect();
            let newLeft = startLeft + dx, newTop = startTop + dy;
            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - rect.width));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - rect.height));
            this.perfWrapperEl.style.left = `${newLeft}px`; this.perfWrapperEl.style.top = `${newTop}px`;
        });
        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            try { this.perfPanelEl.releasePointerCapture(e.pointerId); } catch (err) {}
            const dx = Math.abs(e.clientX - startDragX), dy = Math.abs(e.clientY - startDragY);
            if (dx < 5 && dy < 5) {
                const now = Date.now();
                if (now - lastTapTime < 300) { this._togglePerfOrientation(!this._perfCollapsed); lastTapTime = 0; }
                else lastTapTime = now;
            }
        };
        this.perfPanelEl.addEventListener('pointerup', endDrag);
        this.perfPanelEl.addEventListener('pointercancel', endDrag);
    }

    /**
     * Clamps the performance panel within bounds.
     * @private
     */
    _clampPerfPosition() {
        if (!this.perfWrapperEl || !this.perfWrapperEl.style.left) return;
        const parentRect = this.wrapperEl.getBoundingClientRect();
        const rect = this.perfWrapperEl.getBoundingClientRect();
        let currentLeft = parseFloat(this.perfWrapperEl.style.left) || 0;
        let currentTop = parseFloat(this.perfWrapperEl.style.top) || 0;
        this.perfWrapperEl.style.left = `${Math.max(0, Math.min(currentLeft, parentRect.width - rect.width))}px`;
        this.perfWrapperEl.style.top = `${Math.max(0, Math.min(currentTop, parentRect.height - rect.height))}px`;
    }

    /**
     * Updates the theme of the performance panel.
     * @private
     */
    _updatePerfTheme() {
        if (!this.perfPanelEl || !this.perfToggleEl) return;
        const theme = this.targetTheme.toast;
        this.perfPanelEl.style.background = theme.bg;
        this.perfPanelEl.style.color = theme.color;
        this.perfPanelEl.style.border = theme.border;
        this.perfPanelEl.style.boxShadow = theme.shadow;
        this.perfToggleEl.style.color = theme.color;
    }

    /**
     * Initializes the graph level.
     * @private
     * @param {string} key
     * @param {string|null} targetRootId
     */
    _initGraph(key, targetRootId) {
        const data = this.dataMap[key];
        if (!data || !Array.isArray(data.nodes) || data.nodes.length === 0) return;
        this.nodes = JSON.parse(JSON.stringify(data.nodes));
        this.links = Array.isArray(data.links) ? data.links : [];
        this._initData();
        this.currentRootId = targetRootId || this.nodes[0].id;
        const top = this.navStack[this.navStack.length - 1];
        if (!top || top.key !== key) this.navStack.push({ key, rootId: this.currentRootId });
        else top.rootId = this.currentRootId;
        this.relayout();
    }

    /**
     * Initializes node properties for animation.
     * @private
     */
    _initData() {
        const nodeMap = new Map();
        this.nodes.forEach((n, i) => {
            n.id = n.id || 'n' + i;
            n.appear = 0.2 + i * 0.05;
            n.phase = Math.random() * Math.PI * 2;
            n.angles = [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28];
            n.spinFactor = 0.75 + Math.random() * 0.5;
            n.reveal = 0; n.dim = 0; n.p = 0; n.pRaw = 0;
            nodeMap.set(n.id, n);
        });
        this.links = (Array.isArray(this.links) ? this.links : [])
            .filter(l => Array.isArray(l) && l.length >= 2 && nodeMap.has(l[0]) && nodeMap.has(l[1]))
            .map(([a, b], i) => {
                const A = nodeMap.get(a), B = nodeMap.get(b);
                return { a: A, b: B, delay: Math.max(A.appear, B.appear) + 0.2 + (i % 8) * 0.03, prog: 0, dim: 0, offset: Math.random(), ia: '#000000', ib: '#000000' };
            });
        this.neighbors = new Map(this.nodes.map(n => [n.id, new Set()]));
        for (const L of this.links) {
            this.neighbors.get(L.a.id).add(L.b.id);
            this.neighbors.get(L.b.id).add(L.a.id);
        }
        this._updateNodeColors();
    }

    /**
     * Calculates node target positions based on layout.
     * @private
     */
    _calcLayout() {
        const cx = this.W / 2 + this._layoutOffset.x;
        const cy = this.H / 2 + this._layoutOffset.y;
        const root = this.nodes.find(n => n.id === this.currentRootId);
        if (root) { root.tx = cx; root.ty = cy; }
        const outerNodes = this.nodes.filter(n => n.id !== this.currentRootId);
        const count = outerNodes.length;
        if (count === 0) return;
        let baseR = Math.min(this.W, this.H) * 0.36;
        if (count <= 3) baseR *= 0.7; else if (count <= 5) baseR *= 0.85;
        outerNodes.forEach((n, i) => {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            n.tx = cx + Math.cos(angle) * baseR;
            n.ty = cy + Math.sin(angle) * baseR;
        });
    }

    /**
     * Binds canvas and window events.
     * @private
     */
    _bindEvents() {
        this.canvas.addEventListener('pointerdown', this._onPointerDown);
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mouseleave', this._onMouseLeave);
        this.canvas.addEventListener('touchstart', this._preventDefault, { passive: false });
        this.canvas.addEventListener('touchmove', this._preventDefault, { passive: false });
        this.canvas.addEventListener('mousedown', this._preventDefault);
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => this._onResize());
            this.resizeObserver.observe(this.wrapperEl);
        } else {
            window.addEventListener('resize', this._onResize);
        }
    }

    /**
     * Handles mouse move events.
     * @private
     * @param {MouseEvent} e
     */
    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    /**
     * Handles mouse leave events.
     * @private
     */
    _onMouseLeave() { this.mouse.x = -9999; this.mouse.y = -9999; }

    /**
     * Handles resize events with debounce.
     * @private
     */
    _onResize() {
        if (this._destroyed) return;
        clearTimeout(this._rzTimer);
        this._rzTimer = setTimeout(() => {
            if (this._destroyed) return;
            this.resize();
            this._clampPerfPosition();
        }, 100);
    }

    /**
     * Handles pointer down on the canvas.
     * @private
     * @param {PointerEvent} e
     */
    _onPointerDown(e) {
        if (this.isWarping || this._destroyed) return;
        if (e.button !== undefined && e.button !== 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        let hitNode = null;
        for (const n of this.nodes) {
            if (n.pRaw > 0.4) {
                const sx = (n.wx - this.camera.x) * this.camera.zoom + this.W / 2;
                const sy = (n.wy - this.camera.y) * this.camera.zoom + this.H / 2;
                const sr = n.r * this.SCALE * 2.2 * n.p * this.camera.zoom;
                if (Math.hypot(sx - mx, sy - my) < sr + 15) { hitNode = n; break; }
            }
        }

        if (hitNode) {
            if (hitNode.id === this.currentRootId) {
                if (this.navStack.length <= 1) this.onRootClick(this, hitNode);
                else this.goBack();
                return;
            }
            if (hitNode.children) {
                const childData = this.dataMap[hitNode.children];
                if (!childData || !Array.isArray(childData.nodes) || childData.nodes.length === 0) {
                    this.poll('No data for this galaxy'); return;
                }
                this.onClick(hitNode);
                this._warpTo(hitNode, () => {
                    this._initGraph(hitNode.children, null);
                    this.onEnter(hitNode.children, hitNode);
                });
                return;
            }
            this.onClick(hitNode);
            this.clickedNode = hitNode;
            if (this._leafTimer) clearTimeout(this._leafTimer);

            const rippleInk = this.targetTheme.inkK < 0 ? -0.6 : 0.45;
            this.ripples.push({ x: hitNode.wx, y: hitNode.wy, color: this._ink(hitNode._adaptedColor, rippleInk), t0: performance.now() });

            this._leafTimer = setTimeout(() => {
                this._leafTimer = null;
                if (this._destroyed) return;
                Promise.resolve(this.onLeafClickAsync(hitNode)).catch(err => console.error(err));
            }, 1200);
            return;
        }

        this.clickedNode = null;
        if (this._leafTimer) {
            clearTimeout(this._leafTimer);
            this._leafTimer = null;
        }
    }

    /**
     * Starts the warp transition to another node or level.
     * @private
     * @param {Object|null} node
     * @param {Function} callback
     */
    _warpTo(node, callback) {
        if (this.isWarping || this._destroyed) return;
        if (this._leafTimer) { clearTimeout(this._leafTimer); this._leafTimer = null; }
        this.isWarping = true; this.warpPhase = 0;
        this.warpTarget = node; this.warpCallback = callback;
    }

    /**
     * Recalculates canvas size and rendering properties.
     */
    resize() {
        if (this._destroyed) return;
        this.DPR = Math.min(window.devicePixelRatio || 1, 3);
        const rect = this.wrapperEl.getBoundingClientRect();
        this.W = rect.width || window.innerWidth || 800;
        this.H = rect.height || window.innerHeight || 600;
        this.canvas.width = Math.round(this.W * this.DPR);
        this.canvas.height = Math.round(this.H * this.DPR);
        this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
        this.SCALE = Math.max(0.6, Math.min(1.5, Math.min(this.W, this.H) / 780));
        this.camera.x = this.W / 2 + this._layoutOffset.x;
        this.camera.y = this.H / 2 + this._layoutOffset.y;
        this.camera.zoom = 1;
        this.targetCam.x = this.W / 2 + this._layoutOffset.x;
        this.targetCam.y = this.H / 2 + this._layoutOffset.y;
        this.targetCam.zoom = 1;
        this._calcLayout();
        const count = Math.min(600, Math.round((this.W * this.H) / 5000));
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({ x: Math.random() * this.W, y: Math.random() * this.H, r: Math.random() * 1.8 + 0.4, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 1.8, base: 0.15 + Math.random() * 0.45 });
        }
    }

    /**
     * Creates a path for a pentagram.
     * @private
     * @param {CanvasRenderingContext2D} g
     * @param {number} rV
     */
    _pentaPath(g, rV) {
        for (let i = 0; i <= 5; i++) {
            const idx = (i * 2) % 5;
            const a = (idx / 5) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(a) * rV, y = Math.sin(a) * rV;
            i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
    }

    /**
     * Converts a hex color to rgba string.
     * @private
     * @param {string} hex
     * @param {number} a
     * @returns {string}
     */
    _rgba(hex, a) {
        if (typeof hex !== 'string' || !HEX_COLOR_RE.test(hex)) hex = GALAXY_DEFAULT_COLOR;
        const n = parseInt(hex.slice(1), 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
    }

    /**
     * Darkens or lightens a hex color.
     * @private
     * @param {string} hex
     * @param {number} [k=0.45]
     * @returns {string}
     */
    _ink(hex, k = 0.45) {
        if (typeof hex !== 'string' || !HEX_COLOR_RE.test(hex)) hex = GALAXY_DEFAULT_COLOR;
        const n = parseInt(hex.slice(1), 16);
        let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        if (k >= 0) {
            r = Math.round(r * (1 - k)); g = Math.round(g * (1 - k)); b = Math.round(b * (1 - k));
        } else {
            const nk = Math.abs(k);
            r = Math.round(r + (255 - r) * nk); g = Math.round(g + (255 - g) * nk); b = Math.round(b + (255 - b) * nk);
        }
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Adapts a node color to the current theme.
     * @private
     * @param {string} originalColor
     * @returns {string}
     */
    _adaptColor(originalColor) {
        if (typeof originalColor !== 'string' || !HEX_COLOR_RE.test(originalColor)) originalColor = GALAXY_DEFAULT_COLOR;
        const theme = this.targetTheme;
        if (!theme) return originalColor;
        let r = parseInt(originalColor.slice(1, 3), 16), g = parseInt(originalColor.slice(3, 5), 16), b = parseInt(originalColor.slice(5, 7), 16);
        const starStr = typeof theme.starColor === 'string' ? theme.starColor : '128,128,128';
        const parts = starStr.split(',').map(Number);
        const envR = Number.isFinite(parts[0]) ? parts[0] : 128, envG = Number.isFinite(parts[1]) ? parts[1] : 128, envB = Number.isFinite(parts[2]) ? parts[2] : 128;
        const blendRatio = 0.35;
        let nr = r * (1 - blendRatio) + envR * blendRatio, ng = g * (1 - blendRatio) + envG * blendRatio, nb = b * (1 - blendRatio) + envB * blendRatio;
        const lum = (nr * 0.299 + ng * 0.587 + nb * 0.114) / 255;
        if (theme.inkK < 0) {
            if (lum < 0.4) { const factor = 0.4 / (lum + 0.01); nr = Math.min(255, nr * factor); ng = Math.min(255, ng * factor); nb = Math.min(255, nb * factor); }
        } else {
            if (lum > 0.8) { const factor = 0.8 / (lum + 0.01); nr = Math.max(0, nr * factor); ng = Math.max(0, ng * factor); nb = Math.max(0, nb * factor); }
        }
        return '#' + ((1 << 24) + (Math.round(nr) << 16) + (Math.round(ng) << 8) + Math.round(nb)).toString(16).slice(1);
    }

    /**
     * Interpolates between two RGB strings.
     * @private
     * @param {string} c1Str
     * @param {string} c2Str
     * @param {number} t
     * @returns {string}
     */
    _lerpRGB(c1Str, c2Str, t) {
        const parse = (str) => {
            if (typeof str !== 'string') return [0, 0, 0];
            const arr = str.split(',').map(Number);
            return arr.length === 3 && !arr.some(isNaN) ? arr : [0, 0, 0];
        };
        const c1 = parse(c1Str), c2 = parse(c2Str);
        return `${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)}`;
    }

    /**
     * Gets the canvas layers for a specific color, using cache if available.
     * @private
     * @param {string} color
     * @returns {Array<HTMLCanvasElement>}
     */
    _getGlyphLayers(color) {
        const adaptedColor = this._adaptColor(color);
        const isDark = this.targetTheme.inkK < 0;
        const themeKey = isDark ? 'dark' : 'light';
        const cacheKey = `${adaptedColor}_${themeKey}`;

        if (this.glyphCache.has(cacheKey)) {
            const cached = this.glyphCache.get(cacheKey);
            this.glyphCache.delete(cacheKey);
            this.glyphCache.set(cacheKey, cached);
            return cached;
        }

        const inkC = this._ink(adaptedColor, isDark ? -0.6 : 0.45);
        const R = this.GLYPH_R;
        const layers = [];
        const make = () => {
            const cv = document.createElement('canvas');
            cv.width = cv.height = this.GLYPH_SIZE;
            const g = cv.getContext('2d');
            g.translate(this.GLYPH_C, this.GLYPH_C);
            g.lineCap = 'round'; g.lineJoin = 'round';
            return { cv, g };
        };

        {
            const { cv, g } = make();
            const glow = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.30);
            glow.addColorStop(0, this._rgba(adaptedColor, isDark ? 0.7 : 0.45));
            glow.addColorStop(0.42, this._rgba(adaptedColor, isDark ? 0.2 : 0.12));
            glow.addColorStop(1, this._rgba(adaptedColor, 0));
            g.fillStyle = glow; g.beginPath(); g.arc(0, 0, R * 0.30, 0, Math.PI * 2); g.fill();
            for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.09, Math.sin(a) * R * 0.09); g.lineTo(Math.cos(a) * R * 0.26, Math.sin(a) * R * 0.26); g.strokeStyle = this._rgba(inkC, 0.4); g.lineWidth = 4.5; g.stroke(); }
            g.beginPath();
            for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 - Math.PI / 2, a2 = a + Math.PI / 4; g.lineTo(Math.cos(a) * R * 0.125, Math.sin(a) * R * 0.125); g.lineTo(Math.cos(a2) * R * 0.052, Math.sin(a2) * R * 0.052); }
            g.closePath(); g.fillStyle = this._rgba(adaptedColor, 0.85); g.fill(); g.strokeStyle = this._rgba(inkC, 0.8); g.lineWidth = 5.5; g.stroke();
            g.beginPath(); g.arc(0, 0, R * 0.30, 0, Math.PI * 2); g.strokeStyle = this._rgba(inkC, 0.6); g.lineWidth = 6; g.stroke();
            g.beginPath(); g.arc(0, 0, R * 0.032, 0, Math.PI * 2); g.fillStyle = isDark ? '#ffffff' : this._rgba(adaptedColor, 0.95); g.fill();
            layers[0] = cv;
        }
        {
            const { cv, g } = make();
            const rOut = R * 0.56, rIn = R * 0.42, rText = R * 0.49;
            g.beginPath(); g.arc(0, 0, rOut, 0, Math.PI * 2); g.strokeStyle = this._rgba(inkC, 0.4); g.lineWidth = 5.5; g.stroke();
            g.beginPath(); g.arc(0, 0, rIn, 0, Math.PI * 2); g.strokeStyle = this._rgba(inkC, 0.4); g.lineWidth = 5.5; g.stroke();
            const pool = ('ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ✦✧✶❖◈⟡∴∵∷ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ').split('');
            const N = 32, fs = Math.round(R * 0.088);
            g.font = `600 ${fs}px "Times New Roman","Palatino Linotype",Georgia,serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
            for (let i = 0; i < N; i++) { g.save(); g.rotate((i / N) * Math.PI * 2 - Math.PI / 2); g.translate(0, -rText); g.fillStyle = this._rgba(inkC, 0.85); g.fillText(pool[i % pool.length], 0, 0); g.restore(); }
            layers[1] = cv;
        }
        {
            const { cv, g } = make();
            const rV = R * 0.82;
            g.beginPath(); g.arc(0, 0, R * 0.86, 0, Math.PI * 2); g.strokeStyle = this._rgba(inkC, 0.4); g.lineWidth = 5.5; g.stroke();
            g.beginPath(); g.arc(0, 0, R * 0.60, 0, Math.PI * 2); g.strokeStyle = this._rgba(inkC, 0.25); g.lineWidth = 4.5; g.stroke();
            g.beginPath(); this._pentaPath(g, rV); g.strokeStyle = this._rgba(inkC, 0.75); g.lineWidth = 8; g.stroke();
            for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2, x = Math.cos(a) * rV, y = Math.sin(a) * rV; g.beginPath(); g.arc(x, y, R * 0.026, 0, Math.PI * 2); g.fillStyle = this._rgba(adaptedColor, 0.85); g.fill(); g.strokeStyle = this._rgba(inkC, 0.8); g.lineWidth = 4; g.stroke(); }
            layers[2] = cv;
        }
        {
            const { cv, g } = make();
            g.beginPath(); g.arc(0, 0, R * 0.98, 0, Math.PI * 2); g.strokeStyle = this._rgba(inkC, 0.65); g.lineWidth = 6.5; g.stroke();
            g.beginPath(); g.arc(0, 0, R * 0.93, 0, Math.PI * 2); g.strokeStyle = this._rgba(inkC, 0.35); g.lineWidth = 3.5; g.stroke();
            for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, major = i % 6 === 0; const r1 = R * 0.93, r2 = major ? R * 0.855 : R * 0.898; g.beginPath(); g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); g.strokeStyle = this._rgba(inkC, major ? 0.65 : 0.35); g.lineWidth = major ? 4.5 : 2.5; g.stroke(); }
            for (let i = 0; i < 8; i++) { g.save(); g.rotate((i / 8) * Math.PI * 2 + Math.PI / 8); g.beginPath(); g.moveTo(-R * 0.032, -R * 1.00); g.lineTo(0, -R * 1.055); g.lineTo(R * 0.032, -R * 1.00); g.strokeStyle = this._rgba(inkC, 0.5); g.lineWidth = 4; g.stroke(); g.restore(); }
            layers[3] = cv;
        }
        this.glyphCache.set(cacheKey, layers);
        while (this.glyphCache.size > this._glyphCacheLimit) {
            const oldestKey = this.glyphCache.keys().next().value;
            this.glyphCache.delete(oldestKey);
        }
        return layers;
    }

    /**
     * Main animation and rendering loop.
     * @private
     * @param {number} now
     */
    _loop(now) {
        if (this._destroyed) return;
        this.rafId = requestAnimationFrame(this._boundLoop);
        if (!now) now = performance.now();
        const loopStart = performance.now();
        if (this.t0 === null) { this.t0 = now; this.lastNow = now; }
        const t = (now - this.t0) / 1000;
        const dt = Math.min((now - this.lastNow) / 1000, 0.05);
        this.lastNow = now;

        if (this.themeMix < 1) {
            const elapsed = now - this._themeStartTime;
            this.themeMix = Math.min(1, elapsed / this._themeDuration);
            if (this.themeMix >= 1) {
                if (this.isSwitchingTheme) {
                    this.isSwitchingTheme = false;
                    this.currentTheme = this.targetTheme;
                    if (this.bgEl) this.bgEl.style.background = this.currentTheme.canvasBg;
                    if (this.transBgEl && this.transBgEl.parentNode) this.transBgEl.parentNode.removeChild(this.transBgEl);
                    this.transBgEl = null;
                    if (this._pendingThemeId) {
                        const pending = this._pendingThemeId;
                        this._pendingThemeId = null;
                        if (pending !== this.currentThemeId) this._applyTheme(pending);
                    }
                }
            }
        }

        this.ctx.clearRect(0, 0, this.W, this.H);
        const mixT = this.themeMix < 0.5 ? 4 * this.themeMix ** 3 : 1 - Math.pow(-2 * this.themeMix + 2, 3) / 2;
        const curStar = this._lerpRGB(this.currentTheme.starColor, this.targetTheme.starColor, mixT);
        const curText = this._lerpRGB(this.currentTheme.textColor, this.targetTheme.textColor, mixT);
        const curLineAlpha = this.currentTheme.lineAlpha + (this.targetTheme.lineAlpha - this.currentTheme.lineAlpha) * mixT;
        const isDark = mixT > 0.5 ? this.targetTheme.inkK < 0 : this.currentTheme.inkK < 0;

        if (this.isWarping) {
            this.warpPhase += dt;
            const phase1 = 0.7, phase2 = 0.5;
            if (this.warpPhase < phase1) {
                const p = this.warpPhase / phase1;
                const easeP = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                const tx = this.warpTarget ? this.warpTarget.wx : (this.W / 2 + this._layoutOffset.x);
                const ty = this.warpTarget ? this.warpTarget.wy : (this.H / 2 + this._layoutOffset.y);
                this.camera.x = tx + (this.camera.x - tx) * (1 - easeP);
                this.camera.y = ty + (this.camera.y - ty) * (1 - easeP);
                this.camera.zoom = this.camera.zoom + (5.0 - this.camera.zoom) * easeP; this.warpAlpha = 1 - easeP;
            } else if (this.warpPhase < phase1 + phase2) {
                if (this.warpCallback) {
                    this.warpCallback();
                    this.warpCallback = null;
                    this.camera.x = this.W / 2 + this._layoutOffset.x;
                    this.camera.y = this.H / 2 + this._layoutOffset.y;
                    this.camera.zoom = 0.2;
                }
                const p2 = (this.warpPhase - phase1) / phase2;
                const easeP2 = p2 < 0.5 ? 4 * p2 * p2 * p2 : 1 - Math.pow(-2 * p2 + 2, 3) / 2;
                this.warpAlpha = easeP2; this.camera.zoom = 0.2 + (1.0 - 0.2) * easeP2;
                this.nodes.forEach(n => { n.wx += (n.tx - n.wx) * 0.15; n.wy += (n.ty - n.wy) * 0.15; });
            } else {
                this.warpAlpha = 1; this.isWarping = false;
            }
            this.focusId = null; this.canvas.style.cursor = 'default';
        } else {
            this.warpAlpha = 1;
            this.nodes.forEach(n => { n.wx += (n.tx - n.wx) * 0.06; n.wy += (n.ty - n.wy) * 0.06; });
            let targetX = this.W / 2 + this._layoutOffset.x, targetY = this.H / 2 + this._layoutOffset.y, targetZ = 1.0;
            if (this.clickedNode) { targetX = this.clickedNode.wx; targetY = this.clickedNode.wy; targetZ = 1.35; }
            this.camera.x += (targetX - this.camera.x) * 0.08;
            this.camera.y += (targetY - this.camera.y) * 0.08;
            this.camera.zoom += (targetZ - this.camera.zoom) * 0.08;
            if (Math.abs(this.camera.zoom - 1) < 0.002) this.camera.zoom = 1;
            let best = null, bestD = Infinity;
            if (this.mouse.x > -9000) {
                for (const n of this.nodes) {
                    if (n.pRaw < 0.4) continue;
                    const sx = (n.wx - this.camera.x) * this.camera.zoom + this.W / 2, sy = (n.wy - this.camera.y) * this.camera.zoom + this.H / 2;
                    const sr = n.r * this.SCALE * 2.2 * n.p * this.camera.zoom, dx = sx - this.mouse.x, dy = sy - this.mouse.y, distSq = dx * dx + dy * dy, hitRadius = sr + 15;
                    if (distSq < hitRadius * hitRadius && distSq < bestD) { bestD = distSq; best = n; }
                }
            }
            this.focusId = best ? best.id : null; this.canvas.style.cursor = best ? 'pointer' : 'default';
        }

        const focusNeighbors = this.focusId ? this.neighbors.get(this.focusId) : null;
        const near = id => !this.focusId || id === this.focusId || (focusNeighbors && focusNeighbors.has(id));

        this.ctx.save();
        this.ctx.globalAlpha = this.warpAlpha;
        this.ctx.translate(this.W / 2, this.H / 2); this.ctx.scale(this.camera.zoom, this.camera.zoom); this.ctx.translate(-this.camera.x, -this.camera.y);
        this.ctx.fillStyle = `rgb(${curStar})`;
        for (let i = 0; i < this.stars.length; i++) {
            const s = this.stars[i], sinVal = Math.sin(t * s.speed + s.phase);
            this.ctx.globalAlpha = s.base * (0.40 + 0.60 * sinVal) * this.warpAlpha;
            this.ctx.beginPath(); this.ctx.arc(s.x, s.y, Math.max(0.1, s.r * (0.7 + 0.3 * sinVal)), 0, Math.PI * 2); this.ctx.fill();
        }
        this.ctx.globalAlpha = this.warpAlpha;

        for (const n of this.nodes) {
            const raw = Math.max(0, Math.min(1, (t - n.appear) / 0.65));
            n.pRaw = raw; n.p = 1 + 2.70158 * Math.pow(raw - 1, 3) + 1.70158 * Math.pow(raw - 1, 2);
            for (let i = 0; i < 4; i++) n.angles[i] += [0.070, -0.090, 0.060, -0.045][i] * n.spinFactor * dt;
            const rs = (this.focusId === n.id ? 1 : 0) > n.reveal ? 0.50 : 1.80;
            n.reveal += Math.max(-rs * dt, Math.min(rs * dt, (this.focusId === n.id ? 1 : 0) - n.reveal));
            n.dim += ((near(n.id) ? 0 : 1) - n.dim) * 0.14;
        }

        for (let i = this.removingNodes.length - 1; i >= 0; i--) {
            const rn = this.removingNodes[i];
            rn.removeProgress -= dt * 2.5; rn.angles[0] += dt * 2; rn.angles[2] += dt * 2;
            if (rn.removeProgress <= 0) this.removingNodes.splice(i, 1);
        }

        for (const L of this.links) {
            const raw = Math.max(0, Math.min(1, (t - L.delay) / 0.75));
            L.prog = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
            L.dim += (((near(L.a.id) || near(L.b.id)) ? 0 : 1) - L.dim) * 0.14;
        }

        for (const L of this.links) {
            if (L.prog <= 0.001) continue;
            const A = L.a, B = L.b, ex = A.wx + (B.wx - A.wx) * L.prog, ey = A.wy + (B.wy - A.wy) * L.prog;
            const a = (1 - L.dim * (isDark ? 0.3 : 0.6)); if (a <= 0.03) continue;
            const grad = this.ctx.createLinearGradient(A.wx, A.wy, ex, ey);
            grad.addColorStop(0, this._rgba(L.ia, curLineAlpha * a)); grad.addColorStop(1, this._rgba(L.ib, curLineAlpha * a));
            this.ctx.beginPath(); this.ctx.moveTo(A.wx, A.wy); this.ctx.lineTo(ex, ey); this.ctx.lineCap = 'round'; this.ctx.strokeStyle = grad;
            this.ctx.globalAlpha = this.warpAlpha * 0.10; this.ctx.lineWidth = 5 * this.SCALE; this.ctx.stroke();
            this.ctx.globalAlpha = this.warpAlpha; this.ctx.lineWidth = 1.1 * this.SCALE; this.ctx.stroke();
            if (L.prog > 0.995 && !this.isWarping) {
                const pos = (t * 0.18 + L.offset) % 1, gx = A.wx + (B.wx - A.wx) * pos, gy = A.wy + (B.wy - A.wy) * pos;
                this.ctx.fillStyle = this._rgba(L.ia, 0.20 * a); this.ctx.beginPath(); this.ctx.arc(gx, gy, 4.5 * this.SCALE, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.fillStyle = this._rgba(L.ia, 0.85 * a); this.ctx.beginPath(); this.ctx.arc(gx, gy, 1.4 * this.SCALE, 0, Math.PI * 2); this.ctx.fill();
            }
        }

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const rp = this.ripples[i], age = (now - rp.t0) / 1000;
            if (age > 1.2) { this.ripples.splice(i, 1); continue; }
            const k = age / 1.2;
            this.ctx.save(); this.ctx.globalAlpha = this.warpAlpha * 0.28 * (1 - k); this.ctx.strokeStyle = rp.color;
            this.ctx.lineWidth = 1.5 * this.SCALE * (1 - k * 0.6); this.ctx.setLineDash([]);
            this.ctx.beginPath(); this.ctx.arc(rp.x, rp.y, (18 + 95 * k) * this.SCALE, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.restore();
        }

        for (const rn of this.removingNodes) {
            const fade = Math.max(0, rn.removeProgress), R = rn.r * this.SCALE * fade * 2.2;
            if (R < 0.1) continue;
            const adaptedColor = rn._adaptedColor, haloR = R * 2.1;
            const halo = this.ctx.createRadialGradient(rn.wx, rn.wy, 0, rn.wx, rn.wy, haloR);
            halo.addColorStop(0, this._rgba(adaptedColor, 0.15 * fade)); halo.addColorStop(0.42, this._rgba(adaptedColor, 0.05 * fade)); halo.addColorStop(1, this._rgba(adaptedColor, 0));
            this.ctx.fillStyle = halo; this.ctx.beginPath(); this.ctx.arc(rn.wx, rn.wy, haloR, 0, Math.PI * 2); this.ctx.fill();
            const layers = rn._layers; if (!layers) continue;
            const size = this.GLYPH_SIZE * (R / this.GLYPH_R);
            this.ctx.save(); this.ctx.translate(rn.wx, rn.wy); this.ctx.globalAlpha = this.warpAlpha * 0.85 * fade;
            for (let i = 0; i < 4; i++) { this.ctx.save(); this.ctx.rotate(rn.angles[i]); this.ctx.drawImage(layers[i], -size / 2, -size / 2, size, size); this.ctx.restore(); }
            this.ctx.restore();
        }

        for (const n of this.nodes) {
            if (n.pRaw <= 0.001) continue;
            const breath = Math.sin(t * 1.5 + n.phase), R = n.r * this.SCALE * n.p * 2.2 * (1 + 0.04 * breath) * (1 + 0.05 * n.reveal);
            if (R < 0.8) continue;
            const a = 1 - n.dim * (isDark ? 0.3 : 0.6); if (a <= 0.03) continue;
            const adaptedColor = n._adaptedColor;

            if (n.children) {
                const pulse = (Math.sin(t * 3) + 1) / 2, ringR = R * (1.5 + 0.3 * pulse);
                this.ctx.beginPath(); this.ctx.arc(n.wx, n.wy, ringR, 0, Math.PI * 2); this.ctx.strokeStyle = this._rgba(adaptedColor, 0.6 * a * (1 - pulse * 0.5)); this.ctx.lineWidth = 2.5 * this.SCALE; this.ctx.stroke();
                const haloR = R * 3.5, halo = this.ctx.createRadialGradient(n.wx, n.wy, R * 0.8, n.wx, n.wy, haloR);
                halo.addColorStop(0, this._rgba(adaptedColor, 0.4 * a)); halo.addColorStop(1, this._rgba(adaptedColor, 0));
                this.ctx.fillStyle = halo; this.ctx.beginPath(); this.ctx.arc(n.wx, n.wy, haloR, 0, Math.PI * 2); this.ctx.fill();
            }

            const haloR = R * 2.1, halo = this.ctx.createRadialGradient(n.wx, n.wy, 0, n.wx, n.wy, haloR);
            halo.addColorStop(0, this._rgba(adaptedColor, (0.15 + 0.15 * n.reveal) * a * (0.85 + 0.15 * breath))); halo.addColorStop(0.42, this._rgba(adaptedColor, 0.05 * a)); halo.addColorStop(1, this._rgba(adaptedColor, 0));
            this.ctx.fillStyle = halo; this.ctx.beginPath(); this.ctx.arc(n.wx, n.wy, haloR, 0, Math.PI * 2); this.ctx.fill();

            const layers = n._layers; if (!layers) continue;
            const size = this.GLYPH_SIZE * (R / this.GLYPH_R);
            this.ctx.save(); this.ctx.translate(n.wx, n.wy); this.ctx.globalAlpha = this.warpAlpha * 0.85 * a;
            for (let i = 0; i < 4; i++) { this.ctx.save(); this.ctx.rotate(n.angles[i]); this.ctx.drawImage(layers[i], -size / 2, -size / 2, size, size); this.ctx.restore(); }
            this.ctx.restore();

            if (n.reveal > 0.002) {
                this.ctx.save(); this.ctx.translate(n.wx, n.wy);
                for (const p of this.CONTOUR_DEFS) {
                    const kk = Math.max(0, Math.min(1, (n.reveal - p.delay) / p.dur)); if (kk <= 0.002) continue;
                    const e = kk < 0.5 ? 4 * kk * kk * kk : 1 - Math.pow(-2 * kk + 2, 3) / 2, total = p.len(R);
                    this.ctx.save(); this.ctx.rotate(n.angles[p.layer]); this.ctx.beginPath(); p.draw(this.ctx, R);
                    this.ctx.setLineDash([total * e, total * 60]); this.ctx.strokeStyle = this._rgba(n._inkColor, 0.6 * a * (0.15 + 0.85 * e)); this.ctx.lineWidth = Math.max(0.6, 0.7 * this.SCALE); this.ctx.stroke(); this.ctx.setLineDash([]);
                    this.ctx.restore();
                }
                this.ctx.restore();
            }

            const la = Math.max(0, Math.min(1, (n.pRaw - 0.55) / 0.45)) * a;
            if (la > 0.01) {
                this.ctx.save(); const easeLa = la < 0.5 ? 4 * la * la * la : 1 - Math.pow(-2 * la + 2, 3) / 2;
                const baseR = n.r * this.SCALE * 2.2, finalY = baseR * 1.25 + 8 * this.SCALE;
                this.ctx.translate(n.wx, n.wy);
                if (this.labelAnimation === 'fade-slide-up') { const startY = baseR * 1.8; this.ctx.translate(0, startY + (finalY - startY) * easeLa); }
                else if (this.labelAnimation === 'fade-scale') { this.ctx.translate(0, finalY); this.ctx.scale(easeLa, easeLa); }
                else { const startY = baseR * 0.6; this.ctx.translate(0, startY + (finalY - startY) * easeLa); }
                this.ctx.scale(1 / this.camera.zoom, 1 / this.camera.zoom);

                const isChild = !!n.children, fs = Math.max(12, Math.round(13.5 * this.SCALE));
                this.ctx.font = `${isChild ? 600 : 500} ${fs}px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif`;
                this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'top';
                let alpha = (isChild ? 0.95 : 0.70) * easeLa * this.warpAlpha * a;
                if (isNaN(alpha)) alpha = 0.85;
                let colStr = curText; if (!colStr || colStr.includes('NaN')) colStr = this.targetTheme.textColor; if (!colStr || colStr.includes('NaN')) colStr = '38,56,88';
                this.ctx.fillStyle = `rgba(${colStr},${alpha.toFixed(3)})`;
                this.ctx.fillText(n.name, 0, 0);
                this.ctx.restore();
            }
        }

        this.ctx.restore();

        if (this.perfOptions && this.perfPanelEl) {
            this._renderTime = performance.now() - loopStart; this._frameCount++;
            if (!this._perfTime) this._perfTime = now;
            if (now - this._perfTime >= 1000) {
                const elapsed = now - this._perfTime, fps = Math.round((this._frameCount * 1000) / elapsed), freq = (this._frameCount / (elapsed / 1000)).toFixed(1), latency = this._renderTime.toFixed(1) + 'ms';
                let memory = 'N/A'; if (window.performance && window.performance.memory) memory = (window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) + 'MB';
                const cpuLoad = Math.min(100, Math.round((this._renderTime / (elapsed / this._frameCount)) * 100)), load = `CPU:${cpuLoad}%`;
                if (!this._perfPanelShown) {
                    this._perfPanelShown = true; this.perfPanelEl.style.display = 'flex';
                    this.perfPanelEl.animate([{ opacity: 0, transform: 'translateY(-20px) scale(0.9)' }, { opacity: 1, transform: 'translateY(0) scale(1.02)', offset: 0.7 }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 500, easing: 'ease-out', fill: 'forwards' }).onfinish = () => { if (!this._destroyed) this.perfMetricsEl.classList.remove('hidden'); };
                }
                this.perfSpans.forEach(span => { span.classList.add('updating'); void span.offsetWidth; span.classList.remove('updating'); });
                if (this.perfDom.nodes) this.perfDom.nodes.textContent = this.nodes.length + this.removingNodes.length;
                if (this.perfDom.theme) this.perfDom.theme.textContent = this.currentThemeId;
                if (this.perfDom.fps) this.perfDom.fps.textContent = fps;
                if (this.perfDom.latency) this.perfDom.latency.textContent = latency;
                if (this.perfDom.memory) this.perfDom.memory.textContent = memory;
                if (this.perfDom.freq) this.perfDom.freq.textContent = freq + 'Hz';
                if (this.perfDom.load) this.perfDom.load.textContent = load;
                this._frameCount = 0; this._perfTime = now;
            }
        }
    }
}

export { Galaxy };
export default Galaxy;