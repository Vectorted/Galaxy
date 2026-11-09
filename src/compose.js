/**
 * @file compose.js
 * @description Jetpack Compose style declarative API for GalaxyClickGui.
 */

/**
 * @function Column
 * @description Creates a vertical layout group.
 * @param {Object} options - Group options.
 * @param {Array} children - Child components.
 * @returns {Object} Component configuration.
 */
export const Column = (options, children) => ({ type: 'group', layout: 'column', ...options, components: children });

/**
 * @function Row
 * @description Creates a horizontal layout group.
 * @param {Object} options - Group options.
 * @param {Array} children - Child components.
 * @returns {Object} Component configuration.
 */
export const Row = (options, children) => ({ type: 'group', layout: 'row', ...options, components: children });

/**
 * @function Button
 * @description Creates a material button.
 * @param {string} text - Button label.
 * @param {Function} onClick - Click callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Button = (text, onClick, options = {}) => ({ type: 'button', text, onClick, ...options });

/**
 * @function Text
 * @description Creates a text display component.
 * @param {string} content - Text content.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Text = (content, options = {}) => ({ type: 'text', content, ...options });

/**
 * @function Divider
 * @description Creates a horizontal divider line.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Divider = (options = {}) => ({ type: 'divider', ...options });

/**
 * @function Accordion
 * @description Creates a collapsible accordion.
 * @param {string} label - Accordion title.
 * @param {Array} children - Child components.
 * @param {boolean} [expanded=false] - Initial expansion state.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Accordion = (label, children, expanded = false, options = {}) => ({ type: 'accordion', label, children, expanded, ...options });

/**
 * @function Switch
 * @description Creates a toggle switch.
 * @param {string} label - Switch label.
 * @param {boolean} value - Initial value.
 * @param {Function} onChange - Change callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Switch = (label, value, onChange, options = {}) => ({ type: 'switch', label, value, onChange, ...options });

/**
 * @function Slider
 * @description Creates a range slider.
 * @param {string} label - Slider label.
 * @param {number} value - Initial value.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @param {number} step - Step increment.
 * @param {Function} onChange - Change callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Slider = (label, value, min, max, step, onChange, options = {}) => ({ type: 'slider', label, value, min, max, step, onChange, ...options });

/**
 * @function Input
 * @description Creates a text input field.
 * @param {string} label - Input label.
 * @param {string} value - Initial value.
 * @param {Function} onChange - Change callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Input = (label, value, onChange, options = {}) => ({ type: 'input', label, value, onChange, ...options });

/**
 * @function Dropdown
 * @description Creates a single-select dropdown.
 * @param {Array} options - Dropdown options list.
 * @param {string} value - Initial selected value.
 * @param {Function} onChange - Change callback.
 * @param {Object} [config={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Dropdown = (options, value, onChange, config = {}) => ({ type: 'dropdown', options, value, onChange, ...config });

/**
 * @function MultiDropdown
 * @description Creates a multi-select dropdown.
 * @param {Array} options - Dropdown options list.
 * @param {Array} value - Initial selected values.
 * @param {Function} onChange - Change callback.
 * @param {Object} [config={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const MultiDropdown = (options, value, onChange, config = {}) => ({ type: 'multi-dropdown', options, value, onChange, ...config });

/**
 * @function RadioGroup
 * @description Creates a single-choice radio group.
 * @param {string} label - Group label.
 * @param {Array} options - Option items.
 * @param {string} value - Initial selected value.
 * @param {Function} onChange - Change callback.
 * @param {Object} [config={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const RadioGroup = (label, options, value, onChange, config = {}) => ({ type: 'radio-group', label, options, value, onChange, ...config });

/**
 * @function CheckboxGroup
 * @description Creates a multi-choice checkbox group.
 * @param {string} label - Group label.
 * @param {Array} options - Option items.
 * @param {Array} value - Initial selected values.
 * @param {Function} onChange - Change callback.
 * @param {Object} [config={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const CheckboxGroup = (label, options, value, onChange, config = {}) => ({ type: 'checkbox-group', label, options, value, onChange, ...config });

/**
 * @function Tabs
 * @description Creates a tabbed layout container.
 * @param {Array} tabs - Tab configurations.
 * @param {string} activeKey - Key of the active tab.
 * @param {Function} onChange - Tab change callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Tabs = (tabs, activeKey, onChange, options = {}) => ({ type: 'tabs', tabs, activeKey, onChange, ...options });

/**
 * @function Tab
 * @description Creates a tab item for the Tabs component.
 * @param {string} label - Tab label.
 * @param {string} key - Tab unique key.
 * @param {Array} children - Tab content components.
 * @returns {Object} Tab configuration.
 */
export const Tab = (label, key, children) => ({ label, key, children });

/**
 * @function TimePicker
 * @description Creates a Material Design 3 time picker dial.
 * @param {number} hour - Initial hour.
 * @param {number} minute - Initial minute.
 * @param {Function} onChange - Change callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const TimePicker = (hour, minute, onChange, options = {}) => ({ type: 'time', hour, minute, onChange, ...options });

/**
 * @function ColorPicker
 * @description Creates a color selection component.
 * @param {string} label - Component label.
 * @param {string} value - Initial color hex.
 * @param {Function} onChange - Change callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const ColorPicker = (label, value, onChange, options = {}) => ({ type: 'color-picker', label, value, onChange, ...options });

/**
 * @function Progress
 * @description Creates a linear progress bar.
 * @param {string} label - Component label.
 * @param {number} value - Progress percentage (0-100).
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Progress = (label, value, options = {}) => ({ type: 'progress', label, value, ...options });

/**
 * @function Image
 * @description Creates an image viewer component.
 * @param {string} src - Image source URL.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Image = (src, options = {}) => ({ type: 'image', src, ...options });

/**
 * @function KeyValue
 * @description Creates a key-value pair editor.
 * @param {Object} value - Initial key-value object.
 * @param {Function} onChange - Change callback.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const KeyValue = (value, onChange, options = {}) => ({ type: 'key-value', value, onChange, ...options });

/**
 * @function Console
 * @description Creates a terminal-like console output.
 * @param {number} [maxLines=50] - Maximum lines to keep.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Console = (maxLines = 50, options = {}) => ({ type: 'console', maxLines, ...options });

/**
 * @function Card
 * @description Creates a Material Design 3 card container.
 * @param {string} title - Card title.
 * @param {Array} children - Card content components.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Card = (title, children, options = {}) => ({ type: 'card', title, children, ...options });

/**
 * @function Chip
 * @description Creates a Material Design 3 chip.
 * @param {string} label - Chip label.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const Chip = (label, options = {}) => ({ type: 'chip', label, ...options });

/**
 * @function VirtualRecyclerList
 * @description Creates a highly performant virtual list with ViewHolder pooling (RecyclerView style).
 * @param {Object} options - List configuration.
 * @param {string} [options.key] - Component key.
 * @param {number} [options.maxHeight=300] - Maximum viewport height.
 * @param {number} [options.itemHeight=60] - Fixed height of each item.
 * @param {Object} options.extend - Adapter configuration containing items and binding methods.
 * @returns {Object} Component configuration.
 */
export const VirtualRecyclerList = (options = {}) => ({ type: 'virtual-recycler-list', ...options });

/**
 * @function List
 * @description Creates a legacy simplified list. (Not recommended, use VirtualRecyclerList instead).
 * @param {Array} items - Data array.
 * @param {Object} [options={}] - Additional configurations.
 * @returns {Object} Component configuration.
 */
export const List = (items, options = {}) => ({ type: 'list', items, ...options });