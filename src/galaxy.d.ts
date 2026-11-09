/**
 * @file galaxy.d.ts
 * @description TypeScript declarations for the Galaxy visualization engine.
 * @author Vectorted
 * @repository https://github.com/Vectorted
 * @license MIT
 */

/**
 * @interface ToastTheme
 * @description Toast notification color configuration.
 */
export interface ToastTheme {
    /** Background CSS value (e.g. `rgba(255,255,255,0.98)`). */
    bg: string;
    /** Text color CSS value. */
    color: string;
    /** Border CSS shorthand. */
    border: string;
    /** Box-shadow CSS value. */
    shadow: string;
}

/**
 * @interface ButtonTheme
 * @description Button color configuration.
 */
export interface ButtonTheme {
    /** Background CSS value. */
    btnBg?: string;
    /** Text color CSS value. */
    btnColor?: string;
    /** Border CSS shorthand. */
    btnBorder?: string;
    /** Hover background CSS value. */
    btnHoverBg?: string;
    /** Hover border CSS shorthand. */
    btnHoverBorder?: string;
    /** Ripple background CSS value. */
    btnRipple?: string;
}

/**
 * @interface ThemeConfig
 * @description Full theme configuration object.
 */
export interface ThemeConfig {
    /** CSS `background` value applied to the canvas backdrop. */
    canvasBg: string;
    /** Comma-separated `"r,g,b"` string for the star field. */
    starColor: string;
    /** Comma-separated `"r,g,b"` string for text. */
    textColor: string;
    /** Base alpha for link lines. */
    lineAlpha: number;
    /** Darkening (`> 0`) or lightening (`< 0`) factor for strokes. */
    inkK: number;
    /** Toast notification colors. */
    toast: ToastTheme;
    /** Button colors. */
    btn: ButtonTheme;
}

/**
 * @interface NodeData
 * @description A single node in a galaxy level.
 */
export interface NodeData {
    /** Unique ID within the level. Auto-generated if omitted. */
    id?: string;
    /** Display label rendered under the node. */
    name: string;
    /** Base radius (before SCALE and animation multipliers). */
    r: number;
    /** `#rrggbb` source color. */
    color: string;
    /** If set, clicking this node warps into the `dataMap[children]` level. */
    children?: string;
    /** Any additional user-defined metadata. */
    [key: string]: unknown;
}

/**
 * @typedef {[string, string]} LinkTuple
 * @description Link tuple `[sourceId, targetId]`.
 */
export type LinkTuple = [string, string];

/**
 * @interface GraphData
 * @description One galaxy level: nodes and links.
 */
export interface GraphData {
    /** Array of node objects. */
    nodes: NodeData[];
    /** Array of link tuples. */
    links: LinkTuple[];
}

/**
 * @interface GalaxyDataMap
 * @description Dictionary mapping level keys to graph data.
 */
export interface GalaxyDataMap {
    [key: string]: GraphData;
}

/**
 * @typedef {'fade-slide-down' | 'fade-slide-up' | 'fade-scale'} LabelAnimation
 * @description Label entrance animation styles.
 */
export type LabelAnimation = 'fade-slide-down' | 'fade-slide-up' | 'fade-scale';

/**
 * @interface PerformanceMonitorOptions
 * @description Toggles for individual performance metrics.
 */
export interface PerformanceMonitorOptions {
    theme?: boolean;
    nodes?: boolean;
    fps?: boolean;
    latency?: boolean;
    memory?: boolean;
    freq?: boolean;
    load?: boolean;
}

/**
 * @interface GalaxyState
 * @description The snapshot state of the Galaxy engine.
 */
export interface GalaxyState {
    themeId: string;
    pendingThemeId: string | null;
    isSwitchingTheme: boolean;
    rootKey: string;
    currentRootId: string | null;
    navStack: Array<{ key: string; rootId: string }>;
    nodeCount: number;
    removingCount: number;
    linkCount: number;
    isWarping: boolean;
    focusId: string | null;
    clickedNodeId: string | null;
    dimensions: { W: number; H: number; scale: number; dpr: number };
    camera: { x: number; y: number; zoom: number };
    themes: string[];
}

/**
 * @interface GalaxyOptions
 * @description Constructor options for the `Galaxy` engine.
 * 
 * @example
 * ```typescript
 * const galaxy = new Galaxy({
 *     container: document.body,
 *     dataMap: {
 *         root: {
 *             nodes: [{ id: 'a', name: 'Node A', r: 20, color: '#ff0000' }],
 *             links: []
 *         }
 *     },
 *     rootKey: 'root',
 *     theme: 'light'
 * });
 * ```
 */
export interface GalaxyOptions {
    /** Parent DOM element to mount the canvas into. */
    container: HTMLElement;
    /** All graph levels keyed by level name. */
    dataMap: GalaxyDataMap;
    /** The `dataMap` key to render first. */
    rootKey: string;
    /** Initial theme ID. Defaults to `'light'`. */
    theme?: string;
    /** Node label entrance animation. */
    labelAnimation?: LabelAnimation;
    /** Maximum nodes per level. Defaults to `10`. */
    maxNodes?: number;
    /** Partial toast theme overrides. */
    toastTheme?: Partial<ToastTheme>;
    /** Performance monitor toggle or per-metric toggles. */
    performanceMonitor?: boolean | PerformanceMonitorOptions;
    /** Fired immediately when any node is clicked. */
    onClick?: (node: NodeData) => void;
    /** Fired 1.2s after a leaf node is clicked (debounced). */
    onLeafClickAsync?: (node: NodeData) => Promise<unknown>;
    /** Fired when warping into a child galaxy. */
    onEnter?: (childKey: string, node: NodeData) => void;
    /** Fired when returning to the parent galaxy. */
    onBack?: (prevNode: NodeData | undefined, backKey: string) => void;
    /** Fired when the root node is clicked at the root level. */
    onRootClick?: (galaxy: Galaxy, node: NodeData) => void;
}

/**
 * @interface DialogOptions
 * @description Configuration options for GalaxyDialog.
 */
export interface DialogOptions {
    title: string;
    content?: string;
    showInput?: boolean;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

/**
 * @interface BaseComponentConfig
 * @description Base configuration for all UI components in the Compose API.
 */
export interface BaseComponentConfig {
    type?: string;
    key?: string;
    style?: Partial<CSSStyleDeclaration>;
    [key: string]: any;
}

/**
 * @interface ComponentHandle
 * @description Base interface for any UI component handle inside ClickGui.
 * @template T - The type of the value this component holds.
 */
export interface ComponentHandle<T = any> {
    el: HTMLElement;
    type: string;
    key: string | null;
    config: any;
    
    getValue(): T;
    setValue(value: T): void;
    setDisabled(disabled: boolean): void;
    isDisabled(): boolean;
    setLabel(label: string): void;
    onChange(fn: (value: T) => void): void;
    destroy(): void;

    setStyle(styles: Partial<CSSStyleDeclaration>): this;
    getStyle(): Partial<CSSStyleDeclaration>;
    setTheme(theme: Record<string, string>): this;
    getTheme(): Record<string, string>;
    setWidth(width: number | string): this;
    getWidth(): number;
    setHeight(height: number | string): this;
    getHeight(): number;

    isAttached(): boolean;
    onAttach(fn: (handle: this) => void): this;
    onDetach(fn: (handle: this) => void): this;
}

/**
 * @interface PanelConfig
 * @description Configuration for a GUI panel.
 */
export interface PanelConfig {
    name: string;
    icon?: string | Icon;
    collapsed?: boolean;
    groups: Array<{
        layout?: 'row' | 'column';
        components: Array<BaseComponentConfig>;
    }>;
}

/**
 * @interface PanelHandle
 * @description Handle for interacting with a created panel.
 * 
 * @example
 * ```typescript
 * const panel = gui.getClick(0);
 * panel.setTitle("New Title");
 * panel.collapse();
 * ```
 */
export interface PanelHandle {
    el: HTMLElement;
    bodyEl: HTMLElement;
    headerEl: HTMLElement;
    name: string;
    index: number;
    collapse(): void;
    expand(): void;
    toggle(): void;
    isCollapsed(): boolean;
    setTitle(title: string): void;
    setIcon(iconStr: string | Icon): void;
    addComponent(config: BaseComponentConfig, groupIndex?: number): ComponentHandle;
    getComponent(ref: number | string): ComponentHandle | null;
    getComponents(): ComponentHandle[];
    removeComponent(ref: number | string): boolean;
    setWidth(px: number): void;
    setMaxHeight(height: number | string): void;
    bringToFront(): void;
    destroy(): void;
}

/**
 * @class Icon
 * @description Unified Icon class supporting text, local files, and network URLs.
 */
export declare class Icon {
    constructor(value: string, forceType?: 'text' | 'network' | 'local');
    value: string;
    type: 'text' | 'network' | 'local';
    static create(val: string): Icon;
    static text(val: string): Icon;
    static network(val: string): Icon;
    static image(val: string): Icon;
    toString(): string;
}

/**
 * @class GalaxyButton
 * @description A material-ripple button used by the Galaxy control layer.
 */
export declare class GalaxyButton {
    constructor(options: {
        container: HTMLElement;
        text: string;
        onClick: (galaxy?: Galaxy, handle?: any) => void;
        shape?: string;
        theme?: ButtonTheme;
    });
    el: HTMLButtonElement;
    setText(text: string): void;
    setDisabled(disabled: boolean): void;
    updateTheme(theme?: ButtonTheme): void;
    destroy(): void;
}

/**
 * @class GalaxyDialog
 * @description A Material 3 styled dialog component.
 */
export declare class GalaxyDialog {
    constructor(galaxy: Galaxy);
    build(options: DialogOptions): GalaxyDialog;
    show(): Promise<boolean | string | null>;
}

/**
 * @interface ViewHolder
 * @description A ViewHolder instance used by the VirtualRecyclerList.
 * @template T - The data item type.
 * 
 * @example
 * ```typescript
 * // Accessing data
 * const data = holder.getData();
 * console.log(data.title);
 * 
 * // Updating a specific part
 * holder.updateData({ title: "New Title" });
 * ```
 */
export interface ViewHolder<T = any> {
    itemView: HTMLElement;
    readonly adapterPosition: number;
    viewType: number;
    getData(): T;
    updateData(patch: Partial<T>): void;
    notifyItemChanged(): void;
    get<K extends string>(key: K): ComponentHandle | null;
    getMap(): Record<string, ComponentHandle>;
    getComponents(): ComponentHandle[];
}

/**
 * @interface ComposeApi
 * @description API provided to the ViewHolder creation lifecycle.
 */
export interface ComposeApi {
    createComponent(el: HTMLElement, cfg: BaseComponentConfig): ComponentHandle | null;
    createComponents(el: HTMLElement, cfgs: BaseComponentConfig[]): ComponentHandle[];
    createIcon(cfg: string | Icon, className?: string): HTMLElement | null;
    /**
     * Declarative composition. Builds a component tree once and returns a ViewHolder.
     * 
     * @example
     * ```typescript
     * const holder = api.compose([
     *     Row({ style: { padding: '10px' } }, [
     *         Text('', { key: 'title' }),
     *         Chip('Active', { key: 'status' })
     *     ])
     * ]);
     * // Later, in onBindViewHolder:
     * // holder.get('title').setContent('Hello');
     * ```
     */
    compose(configs: BaseComponentConfig | BaseComponentConfig[], options?: { className?: string; cssText?: string }): ViewHolder;
}

/**
 * @interface VirtualRecyclerListConfig
 * @description Configuration for the high-performance virtual list.
 * @template T - The data item type.
 * 
 * @example
 * ```typescript
 * const listConfig = VirtualRecyclerList({
 *     maxHeight: 300,
 *     itemHeight: 60,
 *     extend: {
 *         items: myDataArray,
 *         onCreateViewHolder: (parent, vt, api) => {
 *             // Setup view
 *             return api.compose(...);
 *         },
 *         onBindViewHolder: (holder, pos) => {
 *             // Update view
 *         }
 *     }
 * });
 * ```
 */
export interface VirtualRecyclerListConfig<T = any> extends BaseComponentConfig {
    type: 'virtual-recycler-list';
    maxHeight?: number | string;
    itemHeight?: number;
    pageSize?: number;
    devAssertions?: boolean;
    recycledViewPoolMaxSize?: number;
    extend: {
        items: T[];
        getItemCount?: () => number;
        getItemViewType?: (position: number) => number;
        onCreateViewHolder?: (parent: HTMLElement, viewType: number, api: ComposeApi) => ViewHolder<T>;
        onBindViewHolder?: (holder: ViewHolder<T>, position: number, api: ComposeApi) => void;
        onViewRecycled?: (holder: ViewHolder<T>, api: ComposeApi) => void;
    };
    onChange?: (items: T[]) => void;
}

/**
 * @interface RecyclerStats
 * @description Performance metrics of the VirtualRecyclerList.
 */
export interface RecyclerStats {
    created: number;
    bound: number;
    recycled: number;
    destroyed: number;
    active: number;
    poolSize: Record<number, number>;
    currentPage: number;
    totalPages: number;
    itemCount: number;
}

/**
 * @interface VirtualRecyclerListHandle
 * @description Handle for interacting with the VirtualRecyclerList.
 * @template T - The data item type.
 * 
 * @example
 * ```typescript
 * // Adding a new item
 * list.extend.items.unshift(newItem);
 * list.notifyItemInserted(0);
 * 
 * // Jumping to a specific item
 * list.scrollToIndex(500);
 * ```
 */
export interface VirtualRecyclerListHandle<T = any> extends ComponentHandle<T[]> {
    extend: VirtualRecyclerListConfig<T>['extend'];
    
    setValue(newItems: T[]): void;
    append(newItems: T[], silent?: boolean): void;
    
    /**
     * Notifies the list that a specific item has been updated.
     * Note: You MUST update the underlying `extend.items` array first.
     */
    notifyItemChanged(pos: number): void;
    
    /**
     * Notifies the list that the entire dataset has changed (resets scroll to top).
     */
    notifyDataSetChanged(): void;
    
    /**
     * Notifies the list that items were inserted.
     * @param index - The starting index of the inserted items.
     * @param count - Number of items inserted.
     */
    notifyItemInserted(index: number, count?: number): void;
    
    /**
     * Notifies the list that items were removed.
     * @param index - The starting index of the removed items.
     * @param count - Number of items removed.
     */
    notifyItemRemoved(index: number, count?: number): void;
    
    scrollToIndex(index: number): void;
    
    /**
     * Gets the ViewHolder currently rendered on screen at the given index.
     * Returns null if the index is outside the current visible page.
     */
    getViewHolder(index: number): ViewHolder<T> | null;
    
    getRecyclerStats(): RecyclerStats;
    getRenderedCount(): number;
}

/**
 * @class Galaxy
 * @description Canvas-based nested galaxy graph visualization engine.
 */
export declare class Galaxy {
    /**
     * @constructor
     * @param {GalaxyOptions} options - Engine configuration.
     */
    constructor(options: GalaxyOptions);
    
    container: HTMLElement;
    dataMap: GalaxyDataMap;
    rootKey: string;
    nodes: NodeData[];
    currentRootId: string | null;
    currentThemeId: string;
    THEMES: Record<string, ThemeConfig>;
    perfPanelEl: HTMLElement | null;

    /**
     * Creates a new GalaxyDialog instance for displaying Material 3 dialogs.
     * @example
     * ```typescript
     * const dialog = galaxy.createDialog();
     * const result = await dialog.build({ title: 'Alert', content: 'Are you sure?' }).show();
     * if (result) { ... }
     * ```
     */
    createDialog(): GalaxyDialog;

    /**
     * Sets a global layout offset for the graph center. Used to shift the entire galaxy visually.
     * @param x - Horizontal offset in pixels.
     * @param y - Vertical offset in pixels.
     */
    setLayoutOffset(x: number, y: number): void;

    /**
     * Registers a custom theme dynamically.
     * @example
     * ```typescript
     * galaxy.registerTheme('cyberpunk', {
     *     background: '#000000',
     *     primary: '#00ff00',
     *     onBackground: '#ffffff'
     * });
     * galaxy.setTheme('cyberpunk');
     * ```
     */
    registerTheme(themeId: string, config: Partial<ThemeConfig>): void;

    /**
     * Gets a deep-cloned snapshot of all graph data.
     */
    getGraphData(): GalaxyDataMap;

    /**
     * Replaces the entire graph data and resets the view to the root level.
     */
    setGraphData(newDataMap: GalaxyDataMap): boolean;

    /**
     * Adds a new node to the current level dynamically.
     * Note: Returns false if the level has reached `maxNodes`.
     * @param nodeData - The node configuration.
     * @param linkTargets - Array of node IDs to create links to.
     * @returns True if successful.
     */
    addNode(nodeData: NodeData, linkTargets?: string[]): boolean;

    /**
     * Removes a node and all its links from the current level.
     * Note: Cannot remove the root node.
     * @param id - The ID of the node to remove.
     */
    removeNode(id: string): boolean;

    /**
     * Updates an existing node's properties (e.g., name, color, radius).
     * @param id - The ID of the node.
     * @param updates - The properties to update.
     */
    updateNode(id: string, updates: Partial<NodeData>): boolean;

    /**
     * Smoothly switches to another theme.
     * @param themeName - The ID of the registered theme.
     */
    setTheme(themeName: string): void;

    /**
     * Shows a transient Material-style toast message at the top of the screen.
     * @param text - The message to display.
     */
    poll(text: string): void;

    /**
     * Destroys the engine, removing all DOM elements and event listeners.
     */
    destroy(): void;

    /**
     * Navigates back to the parent galaxy level if available.
     */
    goBack(): void;

    /**
     * Replays the entrance animation for the current level.
     */
    relayout(): void;

    /**
     * Recalculates canvas size, DPR, and layout metrics.
     */
    resize(): void;
    
    getState(): GalaxyState;
    getCurrentLevel(): { key: string; rootId: string; depth: number } | null;
    getNode(id: string): NodeData | null;
    getNodes(): NodeData[];
    getNavStack(): Array<{ key: string; rootId: string }>;
    canGoBack(): boolean;
    canEnter(id: string): boolean;
    getThemes(): string[];
    getThemeId(): string;
    focusNode(id: string): boolean;
    clearFocus(): void;
    resetView(): void;
}

/**
 * @class GalaxyClickGui
 * @description Draggable panel system with a built-in component library.
 * 
 * @example
 * ```typescript
 * const gui = new GalaxyClickGui(galaxy, {
 *     clicks: [{
 *         name: 'My Module',
 *         icon: 'icon',
 *         groups: [
 *             { layout: 'row', components: [Button('Click Me', () => {})] }
 *         ]
 *     }]
 * });
 * gui.setClickPosition(0, 20, 20);
 * ```
 */
export declare class GalaxyClickGui {
    constructor(galaxy: Galaxy, options: { clicks?: PanelConfig[] });
    getGalaxy(): Galaxy;
    getClicks(): PanelHandle[];
    
    /**
     * Gets a specific panel by index or name.
     * @param ref - The panel index (number) or panel name (string).
     */
    getClick(ref: number | string): PanelHandle | null;
    
    setClickPosition(ref: number | string, x: number, y: number): boolean;
    addClick(config: PanelConfig): PanelHandle | null;
    removeClick(ref: number | string): boolean;
    bringToFront(ref: number | string): boolean;
    setTheme(name: string): boolean;
    isClickExpanded(index?: number): boolean;
    setClickWidth(width: number): void;
    setClickMaxHeight(height: number | string): void;
    destroy(): void;
}

/**
 * @description Jetpack Compose style declarative API for GalaxyClickGui.
 * These functions generate configuration objects used to build the UI tree.
 * 
 * @example
 * ```typescript
 * Card('Settings', [
 *     Switch('Enable Feature', true, (val) => console.log(val)),
 *     Slider('Volume', 50, 0, 100, 1, (val) => {})
 * ])
 * ```
 */

export declare function Column(options: BaseComponentConfig, children: BaseComponentConfig[]): BaseComponentConfig;
export declare function Row(options: BaseComponentConfig, children: BaseComponentConfig[]): BaseComponentConfig;

export declare function Button(text: string, onClick: (galaxy: Galaxy, handle: ComponentHandle) => void, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Text(content: string, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Divider(options?: BaseComponentConfig): BaseComponentConfig;

export declare function Accordion(label: string, children: BaseComponentConfig[], expanded?: boolean, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Switch(label: string, value: boolean, onChange: (value: boolean) => void, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Slider(label: string, value: number, min: number, max: number, step: number, onChange: (value: number) => void, options?: BaseComponentConfig): BaseComponentConfig;

export declare function Input(label: string, value: string, onChange: (value: string) => void, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Dropdown(optionsList: { label: string; value: string }[], value: string, onChange: (value: string) => void, config?: BaseComponentConfig): BaseComponentConfig;
export declare function MultiDropdown(optionsList: { label: string; value: string }[], value: string[], onChange: (value: string[]) => void, config?: BaseComponentConfig): BaseComponentConfig;

export declare function RadioGroup(label: string, optionsList: { label: string; value: string }[], value: string, onChange: (value: string) => void, config?: BaseComponentConfig): BaseComponentConfig;
export declare function CheckboxGroup(label: string, optionsList: { label: string; value: string }[], value: string[], onChange: (value: string[]) => void, config?: BaseComponentConfig): BaseComponentConfig;

export declare function Tabs(tabs: TabConfig[], activeKey: string, onChange?: (key: string) => void, options?: BaseComponentConfig): BaseComponentConfig;
export interface TabConfig {
    label: string;
    key: string;
    children: BaseComponentConfig[];
}
export declare function Tab(label: string, key: string, children: BaseComponentConfig[]): TabConfig;

export declare function TimePicker(hour: number, minute: number, onChange?: (time: { hour: number; minute: number }) => void, options?: BaseComponentConfig): BaseComponentConfig;
export declare function ColorPicker(label: string, value: string, onChange?: (hex: string) => void, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Progress(label: string, value: number, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Image(src: string | Icon, options?: BaseComponentConfig): BaseComponentConfig;
export declare function KeyValue(value: Record<string, string>, onChange?: (val: Record<string, string>) => void, options?: BaseComponentConfig): BaseComponentConfig;
export declare function Console(maxLines?: number, options?: BaseComponentConfig): BaseComponentConfig;

export declare function Card(title: string, children: BaseComponentConfig[], options?: BaseComponentConfig): BaseComponentConfig;
export declare function Chip(label: string, options?: BaseComponentConfig): BaseComponentConfig;

/**
 * @description Creates a highly performant virtual list with ViewHolder pooling (RecyclerView style).
 * Supports up to 10M+ items without lagging the browser.
 */
export declare function VirtualRecyclerList<T = any>(options: VirtualRecyclerListConfig<T>): BaseComponentConfig;

export declare function List(items: any[], options?: BaseComponentConfig): BaseComponentConfig;

declare global {
    interface Window {
        Galaxy: typeof Galaxy;
        GalaxyButton: typeof GalaxyButton;
        GalaxyDialog: typeof GalaxyDialog;
        GalaxyClickGui: typeof GalaxyClickGui;
        Icon: typeof Icon;
    }
}