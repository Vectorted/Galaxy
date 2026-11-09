/**
 * @file Icon.js
 * @description Shared constants for the Galaxy engine.
 * @author Vectorted
 * @license MIT
 */

/**
 * @file Icon.js
 * @description Unified Icon class supporting text, local files, and network URLs.
 */

export class Icon {
    /**
     * @constructor
     * @param {string} value - The icon source or text.
     * @param {string} [forceType] - Force a specific type ('text', 'network', 'local').
     */
    constructor(value, forceType) {
        this.value = value || '';

        if (forceType) {
            this.type = forceType;
            return;
        }

        this.type = 'text';
        if (typeof value === 'string') {
            if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
                this.type = 'network';
            } else if (/\.(png|jpe?g|gif|svg|webp)$/i.test(value) || value.startsWith('./') || value.startsWith('../') || value.startsWith('/')) {
                this.type = 'local';
            }
        }
    }

    /**
     * @description Smart creation (auto-infers type).
     * @param {string} val - The icon source.
     * @returns {Icon} New Icon instance.
     */
    static create(val) {
        return new Icon(val);
    }

    /**
     * @description Force treat as plain text.
     * @param {string} val - The text.
     * @returns {Icon} New Icon instance.
     */
    static text(val) {
        return new Icon(val, 'text');
    }

    /**
     * @description Force treat as network image URL.
     * @param {string} val - The URL.
     * @returns {Icon} New Icon instance.
     */
    static network(val) {
        return new Icon(val, 'network');
    }

    /**
     * @description Force treat as local image path.
     * @param {string} val - The path.
     * @returns {Icon} New Icon instance.
     */
    static image(val) {
        return new Icon(val, 'local');
    }

    /**
     * @description Returns the raw string value of the icon.
     * @returns {string} The value.
     */
    toString() {
        return this.value;
    }
}