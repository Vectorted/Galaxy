# 🌌 Galaxy Engine

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/badge/GitHub-Vectorted%2Fgalaxy-orange.svg)](https://github.com/Vectorted)

A lightweight, highly-interactive nested galaxy graph visualization engine. 
It comes with a built-in Material Design 3 ClickGui component library and a 10-million-level virtual list.

一个轻量级、高交互的嵌套星图关系链可视化引擎。
内置了高度可定制的 Material Design 3 ClickGui 组件库与千万级虚拟列表。

---

## ✨ Core Features | 核心特性

- 🚀 **High Performance | 极致性能**:
  Built with HTML5 Canvas, supporting smooth 60/120/165fps animation rendering for hundreds of nodes.
  基于 HTML5 Canvas 构建，支持数百节点 60/120/165fps 的平滑动画渲染。
  
- 📦 **Virtual Recycler List | 千万级虚拟列表**:
  Built-in virtual list adopting an Android RecyclerView-like architecture. The DOM count remains constant, supporting silky-smooth scrolling, partial updates, and dynamic CRUD operations for 10 million items.
  内置类似 Android RecyclerView 架构的虚拟列表。DOM 数量恒定，支持 1000 万条数据丝滑滚动、局部刷新与动态增删。

- 🌌 **Nested Galaxies | 嵌套星图**:
  Seamlessly warp into sub-galaxies through transition animations, with a smooth back navigation.
  通过跃迁动画无缝穿越至子星系，支持丝滑返回。

- 🎨 **Advanced Theming | 高级主题**:
  Built-in light and dark themes, supporting custom themes and smooth color transition animations.
  内置明暗主题，支持自定义主题及平滑的色彩过渡动画。

- 🧩 **Compose API | 声明式 UI**:
  Supports a Jetpack Compose style declarative API to build complex control panels effortlessly.
  支持 Jetpack Compose 风格的声明式 API，轻松构建复杂的控制面板。

- 📊 **Performance Monitor | 性能监控**:
  Built-in draggable debugging panel for FPS, memory, and latency.
  内置可拖拽的 FPS、内存及延迟调试面板。

- 💬 **M3 Dialogs | M3 弹窗**:
  Built-in Material Design 3 style dialogs, perfectly adapted for mobile keyboards and touch.
  内置 Material Design 3 风格对话框，完美适配移动端键盘与触控。

---

## 📦 Installation | 安装

```bash
npm install vectorted-galaxy
```

---

## 🚀 Quick Start (Runnable Example) | 快速开始 (完整可运行示例)

Create an `index.html` file and open it in your browser to see the engine in action.

创建一个 `index.html` 文件，直接将以下代码复制进去即可在浏览器中运行。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Galaxy Engine Example</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #fff; font-family: sans-serif; }
    </style>
</head>
<body>
    <script type="module">
        import { Galaxy, GalaxyClickGui } from './src/galaxy.js';
        import { Column, Row, Button, Text, Card, VirtualRecyclerList } from './src/compose.js';

        // 1. Prepare Graph Data | 准备星图数据
        const myDataMap = {
            'root': {
                nodes: [
                    { id: '1', name: 'JavaScript', r: 26, color: '#f7df1e' },
                    { id: '2', name: 'ES6+', r: 18, color: '#3f8fc4', children: 'es6' },
                    { id: '3', name: 'Node.js', r: 16, color: '#68a063' }
                ],
                links: [['1', '2'], ['1', '3']]
            },
            'es6': {
                nodes: [
                    { id: '2.1', name: 'Promise', r: 16, color: '#e74c3c' },
                    { id: '2.2', name: 'Arrow Func', r: 12, color: '#e67e22' }
                ],
                links: [['2.1', '2.2']]
            }
        };

        // 2. Initialize Engine | 初始化引擎
        const galaxy = new Galaxy({
            container: document.body,
            dataMap: myDataMap,
            rootKey: 'root',
            theme: 'light',
            performanceMonitor: true
        });

        // 3. Prepare Virtual List Adapter | 准备虚拟列表适配器
        const listAdapter = {
            items: Array.from({ length: 5000 }).map((_, i) => ({ title: `Item ${i}`, enabled: i % 2 === 0 })),
            getItemCount() { return this.items.length; },
            getItemViewType() { return 0; },
            onCreateViewHolder(parent, viewType, api) {
                // Build component tree with Compose API | 使用 Compose API 一次性构建组件树
                const holder = api.compose([
                    Row({ style: { padding: '10px', justifyContent: 'space-between', width: '100%' } }, [
                        Text('', { key: 'title', style: { fontSize: '14px', flex: '1' } }),
                        Button('Toggle', () => {
                            const item = this.items[holder.adapterPosition];
                            if (!item) return;
                            const pos = holder.adapterPosition;
                            this.items[pos].enabled = !this.items[pos].enabled;
                            holder.get('statusText').setContent(this.items[pos].enabled ? 'ON' : 'OFF');
                        }, { key: 'btn', style: { width: '80px', flex: 'none' } }),
                        Text('OFF', { key: 'statusText', style: { width: '40px', textAlign: 'center' } })
                    ])
                ]);
                return holder;
            },
            onBindViewHolder(holder, position) {
                const item = this.items[position];
                if (!item) return;
                const item = this.items[position];
                holder.get('title').setContent(`#${position} ${item.title}`);
                holder.get('statusText').setContent(item.enabled ? 'ON' : 'OFF');
            }
        };

        // 4. Initialize ClickGui Panel | 初始化 ClickGui 面板
        const gui = new GalaxyClickGui(galaxy, {
            clicks: [
                Column({}, [
                    Card('Galaxy Controls', [
                        Row({}, [
                            Button('Relayout', () => galaxy.relayout()),
                            Button('Go Back', () => galaxy.canGoBack() ? galaxy.goBack() : galaxy.poll('Root reached'))
                        ])
                    ]),
                    Card('Virtual List (5000 Items)', [
                        Text('Using Recycler View architecture for high performance.'),
                        VirtualRecyclerList({
                            key: 'demoList',
                            maxHeight: 250,
                            itemHeight: 50,
                            extend: listAdapter
                        })
                    ])
                ])
            ]
        });

        // 5. Set Position & Expand | 设置面板位置并展开
        gui.setClickPosition(0, 20, 20);
        setTimeout(() => gui.getClick(0).expand(), 500);
    </script>
</body>
</html>
```

---

## 📖 Core API | 核心 API

### 1. Galaxy Engine | 星图引擎 (`Galaxy`)

```javascript
// Add a new node | 动态新增节点
galaxy.addNode({ name: 'Vue', r: 15, color: '#42b883' }, ['existing_node_id']);

// Update node properties with smooth transition | 修改节点属性（支持平滑过渡动画）
galaxy.updateNode('node_id', { name: 'React', color: '#61dafb' });

// Remove node and its links | 移除节点与连线
galaxy.removeNode('node_id');

// Switch theme with smooth transition | 切换主题（平滑渐变过渡）
galaxy.setTheme('dark');

// Show a toast message | 弹出一个顶部提示
galaxy.poll('Operation successful');

// Reset view layout | 重置视图布局
galaxy.relayout();

// Destroy engine and free memory | 销毁引擎释放内存
galaxy.destroy();
```

### 2. Control Panel | 控制台 (`GalaxyClickGui`)

```javascript
const panel = gui.getClick(0); // Get panel by index or name | 通过索引或名称获取面板

// Panel controls | 面板控制
panel.collapse();
panel.expand();
panel.setTitle('New Title');
panel.bringToFront();

// Get component handle inside the panel (supports deep recursion) | 获取面板内的组件句柄
const slider = panel.getComponent('my_slider_key');

// Component operations | 组件操作
slider.setValue(42);           // Update value | 更新值
const val = slider.getValue(); // Get value | 获取值
slider.setDisabled(true);      // Disable component | 禁用组件
slider.setLabel('New Label');  // Update label | 修改标签
```

### 3. Compose API | 声明式组件库 (`compose.js`)

We provide a declarative API similar to Android Jetpack Compose, making it easy to build complex UI trees instead of writing large JSON configs.

我们提供了一套类似于 Android Jetpack Compose 的声明式 API，方便你快速构建复杂的 UI 树，而不是写一大堆 JSON。

```javascript
import { Column, Row, Card, Button, Text, Switch, Slider } from './src/compose.js';

const myPanel = Column({}, [
    Text('Settings:'),
    Switch('Enable Feature', true, (val) => console.log('Switched:', val)),
    Slider('Volume', 50, 0, 100, 1, (val) => console.log('Volume:', val)),
    Card('Actions', [
        Button('Click Me', () => alert('Clicked!'))
    ])
]);
```

### 4. Virtual List | 虚拟列表 (`VirtualRecyclerList`)

A virtual list based on ViewHolder pooling. Regardless of the data size, the DOM count remains around 100.

基于 ViewHolder 池化的千万级数据列表，无论多少数据，DOM 数量恒定在 100 左右。

```javascript
const config = VirtualRecyclerList({
    maxHeight: 300,
    itemHeight: 60,
    extend: {
        items: myMillionDataArray,
        onCreateViewHolder: (parent, vt, api) => {
            // Create DOM once declaratively | 创建一次 DOM，通过 api.compose 声明式构建
            return api.compose([ ... ]);
        },
        onBindViewHolder: (holder, position) => {
            // Update data when scrolled into view | 每次滚入屏幕时更新数据
            holder.get('title').setContent(`#${position}`);
        }
    }
});
```

#### Advanced Features: CRUD Operations | 高级特性：增删改查

```javascript
const list = panel.getComponent('my_list_key');

// Insert data | 插入数据
list.extend.items.unshift({ title: 'New Item' });
list.notifyItemInserted(0);

// Remove data | 删除数据
list.extend.items.splice(10, 1);
list.notifyItemRemoved(10);

// Update partial data | 更新局部数据
list.extend.items[5].title = 'Updated!';
list.notifyItemChanged(5);

// Instantly scroll to the 999,999th item | 瞬间跳转到第 999,999 个元素
list.scrollToIndex(999999);
```

---

## 📄 TypeScript Support | TypeScript 支持

This library is fully written in TypeScript, including a detailed `galaxy.d.ts` type declaration. All APIs, callbacks, and generics (especially the Item type inference for `VirtualRecyclerList`) are perfectly supported, providing a first-class IDE experience.

本库完全使用 TypeScript 编写，包含极其详尽的 `galaxy.d.ts` 类型声明。所有 API、回调函数、泛型（`VirtualRecyclerList` 的 Item 类型推导）都得到了完美支持。

---

## 🛠️ Local Development | 本地开发

Because this engine is written in native ES modules without any build steps (like Webpack or Vite), you only need a simple static server to run and debug it locally.

因为本引擎使用原生 ES6 模块编写，无需任何构建步骤（如 Webpack 或 Vite），你只需要一个简单的静态文件服务器即可在本地运行和调试。

### 1. Clone the repository | 克隆仓库

```bash
git clone https://github.com/Vectorted/Galaxy.git
cd theme
```

### 2. Start the local server | 启动本地服务器

We provide zero-dependency static servers for both Node.js and Python. Choose the one that fits your environment.

我们为 Node.js 和 Python 提供了零依赖的静态服务器。选择适合你环境的一种即可：

**Option A: Using npm (Recommended) | 方案 A：使用 npm（推荐）**

If you have Node.js installed (which comes with npm), just run:

如果你安装了 Node.js（自带 npm），只需运行：

```bash
npm run live
```

*(This runs the pre-configured `live.js` script on port 8080. | 这会在 8080 端口运行预先配置好的 `live.js` 服务。)*

**Option B: Using Node.js directly | 方案 B：直接使用 Node.js**

Requires Node.js 22+.
需要 Node.js 22+。

```bash
node live.js --index theme.html
```

**Option C: Using Python 3 | 方案 C：使用 Python 3**

Requires Python 3.7+.
需要 Python 3.7+。

```bash
python python-live/live.py --root . --index theme.html
```
*(Note: If `live.py` is placed in the current directory, just run `python live.py --index theme.html`)*
*(注：如果 `live.py` 放在当前目录下，直接运行 `python live.py --index theme.html` 即可)*

### 3. Open in browser | 在浏览器中打开

Navigate to [http://localhost:8080](http://localhost:8080) (or port 3000 if using Python directly) in your browser. You should see the `theme.html` example page. The terminal console will log requests and file sizes (e.g., `Send xxx bytes`).

在浏览器中访问 [http://localhost:8080](http://localhost:8080)（如果直接用 Python 则是 3000 端口）即可看到 `theme.html` 示例页面。终端控制台将实时打印请求日志和文件大小（如 `Send xxx bytes`）。

## 📝 License | 许可证

This project is licensed under the MIT License.
