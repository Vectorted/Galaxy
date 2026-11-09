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

This is a template example. Create an `index.html` file with the code below and open it in your browser to see the engine in action.

这是一个模板示例。创建一个 `index.html` 文件并将以下代码复制进去，即可在浏览器中运行。。

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
    <title>Galaxy Engine - Compose Style</title>
    <style>
        html,
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
    </style>
</head>

<body>
    <script type="module">
        import {
            Galaxy,
            GalaxyClickGui
        } from './src/galaxy.js';
        import {
            Icon
        } from './src/module/Icon.js';
        import {
            Column,
            Row,
            Button,
            Text,
            Accordion,
            Switch,
            Slider,
            Input,
            Dropdown,
            Tabs,
            Tab,
            TimePicker,
            Card,
            Chip,
            VirtualRecyclerList,
            Divider,
            Progress,
            Image,
            KeyValue,
            Console,
            ColorPicker,
            RadioGroup,
            CheckboxGroup,
            MultiDropdown
        } from './src/compose.js';

        (function() {
            'use strict';

            let autoJumpTimer = null;

            /**
             * The root graph representing the core JavaScript ecosystem.
             * Nodes are highly interconnected to represent actual dependencies.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_ROOT = {
                nodes: [{
                        id: 'js_ecosystem',
                        name: 'JS Ecosystem',
                        r: 16,
                        color: '#f7df1e'
                    },
                    {
                        id: 'ecma',
                        name: 'ECMAScript',
                        r: 14,
                        color: '#f39c12',
                        children: 'data_ecma'
                    },
                    {
                        id: 'ts',
                        name: 'TypeScript',
                        r: 13,
                        color: '#3178c6',
                        children: 'data_ts'
                    },
                    {
                        id: 'engines',
                        name: 'JS Engines',
                        r: 12,
                        color: '#4a90e2',
                        children: 'data_engines'
                    },
                    {
                        id: 'runtime',
                        name: 'Runtimes',
                        r: 13,
                        color: '#68a063',
                        children: 'data_runtime'
                    },
                    {
                        id: 'frontend',
                        name: 'Frameworks',
                        r: 14,
                        color: '#61dafb',
                        children: 'data_frontend'
                    },
                    {
                        id: 'build',
                        name: 'Build Tools',
                        r: 14,
                        color: '#646cff',
                        children: 'data_build'
                    },
                    {
                        id: 'db_edge',
                        name: 'DB & Edge',
                        r: 13,
                        color: '#3ecf8e',
                        children: 'data_db_edge'
                    }
                ],
                links: [
                    ['js_ecosystem', 'ecma'],
                    ['js_ecosystem', 'ts'],
                    ['js_ecosystem', 'engines'],
                    ['js_ecosystem', 'runtime'],
                    ['js_ecosystem', 'frontend'],
                    ['js_ecosystem', 'build'],
                    ['js_ecosystem', 'db_edge'],
                    ['ts', 'ecma'], // TS compiles to JS
                    ['engines', 'runtime'], // Runtimes use engines
                    ['build', 'frontend'], // Build tools support frameworks
                    ['db_edge', 'runtime'] // DBs run on runtimes
                ]
            };

            /**
             * ECMAScript versions and core language features.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_ECMA = {
                nodes: [{
                        id: 'ecma_root',
                        name: 'ECMAScript',
                        r: 16,
                        color: '#f39c12'
                    },
                    {
                        id: 'es5',
                        name: 'ES5',
                        r: 10,
                        color: '#f39c12'
                    },
                    {
                        id: 'es6',
                        name: 'ES6+',
                        r: 14,
                        color: '#d35400',
                        children: 'data_es6'
                    },
                    {
                        id: 'es2020',
                        name: 'ES2020+',
                        r: 12,
                        color: '#e67e22',
                        children: 'data_es2020'
                    },
                    {
                        id: 'ts_related',
                        name: 'TypeScript',
                        r: 11,
                        color: '#3178c6',
                        children: 'data_ts'
                    }
                ],
                links: [
                    ['ecma_root', 'es5'],
                    ['ecma_root', 'es6'],
                    ['ecma_root', 'es2020'],
                    ['ecma_root', 'ts_related'],
                    ['es5', 'es6'],
                    ['es6', 'es2020'],
                    ['es6', 'ts_related'] // TS builds on ES6
                ]
            };

            /**
             * Core features introduced in ES6 (ES2015).
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_ES6 = {
                nodes: [{
                        id: 'es6_root',
                        name: 'ES6',
                        r: 14,
                        color: '#d35400'
                    },
                    {
                        id: 'promise',
                        name: 'Promise',
                        r: 11,
                        color: '#e74c3c'
                    },
                    {
                        id: 'arrow',
                        name: 'Arrow Func',
                        r: 10,
                        color: '#c0392b'
                    },
                    {
                        id: 'module',
                        name: 'ES Modules',
                        r: 12,
                        color: '#c0392b'
                    }
                ],
                links: [
                    ['es6_root', 'promise'],
                    ['es6_root', 'arrow'],
                    ['es6_root', 'module'],
                    ['module', 'promise'] // Modules often export Promises
                ]
            };

            /**
             * Modern features introduced from ES2020 onwards.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_ES2020 = {
                nodes: [{
                        id: 'es2020_root',
                        name: 'ES2020+',
                        r: 12,
                        color: '#e67e22'
                    },
                    {
                        id: 'optional',
                        name: 'Optional Chaining',
                        r: 11,
                        color: '#16a085'
                    },
                    {
                        id: 'nullish',
                        name: 'Nullish Coalescing',
                        r: 11,
                        color: '#1abc9c'
                    },
                    {
                        id: 'bigint',
                        name: 'BigInt',
                        r: 9,
                        color: '#16a085'
                    }
                ],
                links: [
                    ['es2020_root', 'optional'],
                    ['es2020_root', 'nullish'],
                    ['es2020_root', 'bigint'],
                    ['optional', 'nullish'] // Often used together for safe defaults
                ]
            };

            /**
             * TypeScript versions and toolchain.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_TS = {
                nodes: [{
                        id: 'ts_root',
                        name: 'TypeScript',
                        r: 14,
                        color: '#3178c6'
                    },
                    {
                        id: 'ts5',
                        name: 'TS 5.x',
                        r: 12,
                        color: '#3498db'
                    },
                    {
                        id: 'tsc',
                        name: 'tsc Compiler',
                        r: 11,
                        color: '#2c3e50'
                    },
                    {
                        id: 'esm_dep',
                        name: 'ES Modules',
                        r: 10,
                        color: '#c0392b',
                        children: 'data_es6'
                    }
                ],
                links: [
                    ['ts_root', 'ts5'],
                    ['ts_root', 'tsc'],
                    ['ts_root', 'esm_dep'],
                    ['ts5', 'tsc'],
                    ['tsc', 'esm_dep'] // tsc compiles to ES Modules
                ]
            };

            /**
             * JavaScript engines and their dependencies.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_ENGINES = {
                nodes: [{
                        id: 'engines_root',
                        name: 'JS Engines',
                        r: 14,
                        color: '#4a90e2'
                    },
                    {
                        id: 'v8',
                        name: 'V8',
                        r: 13,
                        color: '#4a90e2',
                        children: 'data_v8'
                    },
                    {
                        id: 'jsc',
                        name: 'JSCore',
                        r: 11,
                        color: '#e74c3c',
                        children: 'data_jsc'
                    },
                    {
                        id: 'sm',
                        name: 'SpiderMonkey',
                        r: 11,
                        color: '#e67e22',
                        children: 'data_sm'
                    }
                ],
                links: [
                    ['engines_root', 'v8'],
                    ['engines_root', 'jsc'],
                    ['engines_root', 'sm'],
                    ['v8', 'sm'] // Shared specifications
                ]
            };

            /**
             * V8 engine internal components.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_V8 = {
                nodes: [{
                        id: 'v8_root',
                        name: 'V8 Engine',
                        r: 13,
                        color: '#4a90e2'
                    },
                    {
                        id: 'ignition',
                        name: 'Ignition',
                        r: 11,
                        color: '#8e44ad'
                    },
                    {
                        id: 'turbofan',
                        name: 'TurboFan',
                        r: 11,
                        color: '#9b59b6'
                    },
                    {
                        id: 'maglev',
                        name: 'Maglev',
                        r: 9,
                        color: '#732d91'
                    }
                ],
                links: [
                    ['v8_root', 'ignition'],
                    ['v8_root', 'turbofan'],
                    ['v8_root', 'maglev'],
                    ['ignition', 'turbofan'],
                    ['turbofan', 'maglev'] // Pipeline flow
                ]
            };

            /**
             * JSCore engine internal components.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_JSC = {
                nodes: [{
                        id: 'jsc_root',
                        name: 'JSCore',
                        r: 13,
                        color: '#e74c3c'
                    },
                    {
                        id: 'llint',
                        name: 'LLInt',
                        r: 11,
                        color: '#e74c3c'
                    },
                    {
                        id: 'baseline',
                        name: 'Baseline JIT',
                        r: 11,
                        color: '#c0392b'
                    },
                    {
                        id: 'dfg',
                        name: 'DFG JIT',
                        r: 11,
                        color: '#e74c3c'
                    },
                    {
                        id: 'ftl',
                        name: 'FTL JIT',
                        r: 11,
                        color: '#c0392b'
                    }
                ],
                links: [
                    ['jsc_root', 'llint'],
                    ['jsc_root', 'baseline'],
                    ['jsc_root', 'dfg'],
                    ['jsc_root', 'ftl'],
                    ['llint', 'baseline'],
                    ['baseline', 'dfg'],
                    ['dfg', 'ftl']
                ]
            };

            /**
             * SpiderMonkey engine internal components.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_SM = {
                nodes: [{
                        id: 'sm_root',
                        name: 'SpiderMonkey',
                        r: 13,
                        color: '#e67e22'
                    },
                    {
                        id: 'ion',
                        name: 'IonMonkey',
                        r: 11,
                        color: '#e67e22'
                    },
                    {
                        id: 'baseline2',
                        name: 'Baseline',
                        r: 11,
                        color: '#d35400'
                    }
                ],
                links: [
                    ['sm_root', 'ion'],
                    ['sm_root', 'baseline2'],
                    ['baseline2', 'ion']
                ]
            };

            /**
             * JavaScript runtimes and their ecosystems.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_RUNTIME = {
                nodes: [{
                        id: 'runtime_root',
                        name: 'Runtimes',
                        r: 15,
                        color: '#68a063'
                    },
                    {
                        id: 'node',
                        name: 'Node.js',
                        r: 14,
                        color: '#68a063',
                        children: 'data_node'
                    },
                    {
                        id: 'deno',
                        name: 'Deno',
                        r: 12,
                        color: '#2f2f2f',
                        children: 'data_deno'
                    },
                    {
                        id: 'bun',
                        name: 'Bun',
                        r: 12,
                        color: '#f472b6',
                        children: 'data_bun'
                    },
                    {
                        id: 'v8_dep',
                        name: 'V8 Engine',
                        r: 11,
                        color: '#4a90e2',
                        children: 'data_v8'
                    }
                ],
                links: [
                    ['runtime_root', 'node'],
                    ['runtime_root', 'deno'],
                    ['runtime_root', 'bun'],
                    ['runtime_root', 'v8_dep'],
                    ['node', 'v8_dep'],
                    ['deno', 'v8_dep'], // Node and Deno use V8
                    ['bun', 'v8_dep'] // Bun uses JavaScriptCore, but linked to V8 for ecosystem comparison
                ]
            };

            /**
             * Node.js ecosystem and package managers.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_NODE = {
                nodes: [{
                        id: 'node_root',
                        name: 'Node.js',
                        r: 14,
                        color: '#68a063'
                    },
                    {
                        id: 'npm',
                        name: 'npm',
                        r: 12,
                        color: '#cb3837'
                    },
                    {
                        id: 'pnpm',
                        name: 'pnpm',
                        r: 11,
                        color: '#f69220'
                    },
                    {
                        id: 'yarn',
                        name: 'Yarn',
                        r: 11,
                        color: '#2c8ebb'
                    },
                    {
                        id: 'express',
                        name: 'Express',
                        r: 10,
                        color: '#888888'
                    }
                ],
                links: [
                    ['node_root', 'npm'],
                    ['node_root', 'pnpm'],
                    ['node_root', 'yarn'],
                    ['node_root', 'express'],
                    ['npm', 'express'],
                    ['pnpm', 'express'],
                    ['yarn', 'express'] // Packages install frameworks
                ]
            };

            /**
             * Deno ecosystem deployments.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_DENO = {
                nodes: [{
                        id: 'deno_root',
                        name: 'Deno',
                        r: 12,
                        color: '#2f2f2f'
                    },
                    {
                        id: 'deno_deploy',
                        name: 'Deno Deploy',
                        r: 11,
                        color: '#6366f1'
                    },
                    {
                        id: 'jupyter',
                        name: 'Deno Jupyter',
                        r: 9,
                        color: '#a78bfa'
                    }
                ],
                links: [
                    ['deno_root', 'deno_deploy'],
                    ['deno_root', 'jupyter'],
                    ['deno_deploy', 'jupyter']
                ]
            };

            /**
             * Bun ecosystem tooling.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_BUN = {
                nodes: [{
                        id: 'bun_root',
                        name: 'Bun',
                        r: 12,
                        color: '#f472b6'
                    },
                    {
                        id: 'bun_bundler',
                        name: 'Bun Bundler',
                        r: 11,
                        color: '#f472b6'
                    },
                    {
                        id: 'bun_test',
                        name: 'Bun Test',
                        r: 9,
                        color: '#db2777'
                    }
                ],
                links: [
                    ['bun_root', 'bun_bundler'],
                    ['bun_root', 'bun_test'],
                    ['bun_bundler', 'bun_test']
                ]
            };

            /**
             * Frontend frameworks and their actual cross-dependencies.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_FRONTEND = {
                nodes: [{
                        id: 'fe_root',
                        name: 'Frontend',
                        r: 16,
                        color: '#94a3b8'
                    },
                    {
                        id: 'react',
                        name: 'React',
                        r: 14,
                        color: '#61dafb',
                        children: 'data_react'
                    },
                    {
                        id: 'vue',
                        name: 'Vue.js',
                        r: 14,
                        color: '#42b883',
                        children: 'data_vue'
                    },
                    {
                        id: 'angular',
                        name: 'Angular',
                        r: 13,
                        color: '#dd0031',
                        children: 'data_angular'
                    },
                    {
                        id: 'svelte',
                        name: 'Svelte',
                        r: 12,
                        color: '#ff3e00',
                        children: 'data_svelte'
                    },
                    {
                        id: 'solid',
                        name: 'SolidJS',
                        r: 11,
                        color: '#2c3e50'
                    },
                    {
                        id: 'vite',
                        name: 'Vite',
                        r: 13,
                        color: '#646cff',
                        children: 'data_vite'
                    },
                    {
                        id: 'tailwind',
                        name: 'Tailwind',
                        r: 12,
                        color: '#38bdf8',
                        children: 'data_ui_libs'
                    },
                    {
                        id: 'redux',
                        name: 'Redux',
                        r: 11,
                        color: '#764abc',
                        children: 'data_state_mgmt'
                    }
                ],
                links: [
                    ['fe_root', 'react'],
                    ['fe_root', 'vue'],
                    ['fe_root', 'angular'],
                    ['fe_root', 'svelte'],
                    ['fe_root', 'solid'],
                    ['react', 'vite'],
                    ['vue', 'vite'],
                    ['svelte', 'vite'], // Vite is the standard bundler for React/Vue/Svelte
                    ['react', 'redux'], // React strongly depends on Redux
                    ['react', 'tailwind'],
                    ['vue', 'tailwind'],
                    ['angular', 'tailwind'],
                    ['svelte', 'tailwind'], // All use Tailwind
                    ['react', 'vue'] // Often compared/coexist
                ]
            };

            /**
             * React ecosystem and meta-frameworks.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_REACT = {
                nodes: [{
                        id: 'react_root',
                        name: 'React',
                        r: 14,
                        color: '#61dafb'
                    },
                    {
                        id: 'next',
                        name: 'Next.js',
                        r: 13,
                        color: '#000000',
                        children: 'data_next'
                    },
                    {
                        id: 'remix',
                        name: 'Remix',
                        r: 11,
                        color: '#6366f1'
                    },
                    {
                        id: 'redux_dep',
                        name: 'Redux',
                        r: 12,
                        color: '#764abc',
                        children: 'data_state_mgmt'
                    }
                ],
                links: [
                    ['react_root', 'next'],
                    ['react_root', 'remix'],
                    ['react_root', 'redux_dep'],
                    ['next', 'redux_dep'],
                    ['remix', 'redux_dep'] // Meta-frameworks use Redux
                ]
            };

            /**
             * Next.js internal ecosystem.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_NEXT = {
                nodes: [{
                        id: 'next_root',
                        name: 'Next.js',
                        r: 13,
                        color: '#000000'
                    },
                    {
                        id: 'next_auth',
                        name: 'NextAuth',
                        r: 11,
                        color: '#10b981'
                    },
                    {
                        id: 'next_rsc',
                        name: 'Server Components',
                        r: 11,
                        color: '#000000'
                    },
                    {
                        id: 'webpack_dep',
                        name: 'Webpack',
                        r: 10,
                        color: '#8dd6f9',
                        children: 'data_webpack'
                    }
                ],
                links: [
                    ['next_root', 'next_auth'],
                    ['next_root', 'next_rsc'],
                    ['next_root', 'webpack_dep'],
                    ['next_rsc', 'webpack_dep'] // RSC relies on bundler
                ]
            };

            /**
             * Vue ecosystem and meta-frameworks.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_VUE = {
                nodes: [{
                        id: 'vue_root',
                        name: 'Vue.js',
                        r: 14,
                        color: '#42b883'
                    },
                    {
                        id: 'nuxt',
                        name: 'Nuxt.js',
                        r: 13,
                        color: '#00dc82',
                        children: 'data_nuxt'
                    },
                    {
                        id: 'pinia_dep',
                        name: 'Pinia',
                        r: 11,
                        color: '#ffd859',
                        children: 'data_state_mgmt'
                    },
                    {
                        id: 'vitepress',
                        name: 'VitePress',
                        r: 10,
                        color: '#646cff'
                    }
                ],
                links: [
                    ['vue_root', 'nuxt'],
                    ['vue_root', 'pinia_dep'],
                    ['vue_root', 'vitepress'],
                    ['nuxt', 'pinia_dep'],
                    ['nuxt', 'vitepress'] // Nuxt uses Pinia and VitePress
                ]
            };

            /**
             * Nuxt.js modules and tooling.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_NUXT = {
                nodes: [{
                        id: 'nuxt_root',
                        name: 'Nuxt.js',
                        r: 13,
                        color: '#00dc82'
                    },
                    {
                        id: 'nuxt_auth',
                        name: 'Nuxt Auth',
                        r: 10,
                        color: '#00dc82'
                    },
                    {
                        id: 'nuxt_image',
                        name: 'Nuxt Image',
                        r: 10,
                        color: '#00dc82'
                    },
                    {
                        id: 'nuxt_tailwind',
                        name: 'Nuxt Tailwind',
                        r: 9,
                        color: '#38bdf8'
                    }
                ],
                links: [
                    ['nuxt_root', 'nuxt_auth'],
                    ['nuxt_root', 'nuxt_image'],
                    ['nuxt_root', 'nuxt_tailwind'],
                    ['nuxt_image', 'nuxt_tailwind'] // Images often paired with CSS
                ]
            };

            /**
             * Angular ecosystem.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_ANGULAR = {
                nodes: [{
                        id: 'angular_root',
                        name: 'Angular',
                        r: 13,
                        color: '#dd0031'
                    },
                    {
                        id: 'analog',
                        name: 'Analog',
                        r: 10,
                        color: '#dd0031'
                    },
                    {
                        id: 'rxjs',
                        name: 'RxJS',
                        r: 12,
                        color: '#b7178c'
                    },
                    {
                        id: 'ngrx',
                        name: 'NgRx',
                        r: 10,
                        color: '#dd0031'
                    }
                ],
                links: [
                    ['angular_root', 'analog'],
                    ['angular_root', 'rxjs'],
                    ['angular_root', 'ngrx'],
                    ['rxjs', 'ngrx'],
                    ['analog', 'rxjs'] // RxJS is the core of Angular reactivity
                ]
            };

            /**
             * Svelte ecosystem.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_SVELTE = {
                nodes: [{
                        id: 'svelte_root',
                        name: 'Svelte',
                        r: 12,
                        color: '#ff3e00'
                    },
                    {
                        id: 'sveltekit',
                        name: 'SvelteKit',
                        r: 11,
                        color: '#ff3e00'
                    },
                    {
                        id: 'svelte_superforms',
                        name: 'Superforms',
                        r: 9,
                        color: '#ff3e00'
                    }
                ],
                links: [
                    ['svelte_root', 'sveltekit'],
                    ['svelte_root', 'svelte_superforms'],
                    ['sveltekit', 'svelte_superforms']
                ]
            };

            /**
             * Build tools, bundlers, and their framework dependencies.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_BUILD = {
                nodes: [{
                        id: 'build_root',
                        name: 'Build Tools',
                        r: 16,
                        color: '#646cff'
                    },
                    {
                        id: 'vite',
                        name: 'Vite',
                        r: 14,
                        color: '#646cff',
                        children: 'data_vite'
                    },
                    {
                        id: 'webpack',
                        name: 'Webpack',
                        r: 13,
                        color: '#8dd6f9',
                        children: 'data_webpack'
                    },
                    {
                        id: 'esbuild',
                        name: 'esbuild',
                        r: 11,
                        color: '#ffcf00'
                    },
                    {
                        id: 'rollup',
                        name: 'Rollup',
                        r: 11,
                        color: '#f7c948'
                    },
                    {
                        id: 'babel',
                        name: 'Babel',
                        r: 12,
                        color: '#f9dc3e'
                    },
                    {
                        id: 'vitest',
                        name: 'Vitest',
                        r: 12,
                        color: '#729b1b',
                        children: 'data_testing'
                    }
                ],
                links: [
                    ['build_root', 'vite'],
                    ['build_root', 'webpack'],
                    ['build_root', 'esbuild'],
                    ['build_root', 'rollup'],
                    ['build_root', 'babel'],
                    ['build_root', 'vitest'],
                    ['vite', 'esbuild'],
                    ['vite', 'rollup'], // Vite is built on esbuild and rollup
                    ['vite', 'vitest'], // Vitest runs on Vite
                    ['webpack', 'babel'], // Webpack relies heavily on babel
                    ['esbuild', 'babel'] // Both are transpilers
                ]
            };

            /**
             * Vite plugins and tools.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_VITE = {
                nodes: [{
                        id: 'vite_root',
                        name: 'Vite',
                        r: 14,
                        color: '#646cff'
                    },
                    {
                        id: 'vitest',
                        name: 'Vitest',
                        r: 11,
                        color: '#729b1b'
                    },
                    {
                        id: 'vite_plugin',
                        name: 'Vite Plugins',
                        r: 10,
                        color: '#646cff'
                    },
                    {
                        id: 'react_vite',
                        name: 'React Vite',
                        r: 10,
                        color: '#61dafb'
                    }
                ],
                links: [
                    ['vite_root', 'vitest'],
                    ['vite_root', 'vite_plugin'],
                    ['vite_root', 'react_vite'],
                    ['vite_plugin', 'react_vite'],
                    ['vitest', 'react_vite'] // Testing React components
                ]
            };

            /**
             * Webpack ecosystem and loaders.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_WEBPACK = {
                nodes: [{
                        id: 'webpack_root',
                        name: 'Webpack',
                        r: 13,
                        color: '#8dd6f9'
                    },
                    {
                        id: 'module_fed',
                        name: 'Module Federation',
                        r: 11,
                        color: '#8dd6f9'
                    },
                    {
                        id: 'swc',
                        name: 'SWC Loader',
                        r: 11,
                        color: '#f59e0b'
                    },
                    {
                        id: 'babel_loader',
                        name: 'Babel Loader',
                        r: 10,
                        color: '#f9dc3e'
                    }
                ],
                links: [
                    ['webpack_root', 'module_fed'],
                    ['webpack_root', 'swc'],
                    ['webpack_root', 'babel_loader'],
                    ['module_fed', 'swc'],
                    ['module_fed', 'babel_loader']
                ]
            };

            /**
             * Testing frameworks and their integrations.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_TESTING = {
                nodes: [{
                        id: 'testing_root',
                        name: 'Testing',
                        r: 13,
                        color: '#729b1b'
                    },
                    {
                        id: 'vitest',
                        name: 'Vitest',
                        r: 11,
                        color: '#729b1b'
                    },
                    {
                        id: 'jest',
                        name: 'Jest',
                        r: 11,
                        color: '#99425b'
                    },
                    {
                        id: 'playwright',
                        name: 'Playwright',
                        r: 11,
                        color: '#2ead33'
                    },
                    {
                        id: 'storybook',
                        name: 'Storybook',
                        r: 11,
                        color: '#ff4785'
                    }
                ],
                links: [
                    ['testing_root', 'vitest'],
                    ['testing_root', 'jest'],
                    ['testing_root', 'playwright'],
                    ['testing_root', 'storybook'],
                    ['vitest', 'playwright'],
                    ['jest', 'playwright'],
                    ['vitest', 'storybook'],
                    ['jest', 'storybook'] // E2E and Component testing integration
                ]
            };

            /**
             * Database ORMs, BaaS, and edge computing platforms.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_DB_EDGE = {
                nodes: [{
                        id: 'db_edge_root',
                        name: 'DB & Edge',
                        r: 15,
                        color: '#3ecf8e'
                    },
                    {
                        id: 'prisma',
                        name: 'Prisma',
                        r: 13,
                        color: '#2d3748',
                        children: 'data_prisma'
                    },
                    {
                        id: 'drizzle',
                        name: 'Drizzle ORM',
                        r: 11,
                        color: '#c5f74f'
                    },
                    {
                        id: 'supabase',
                        name: 'Supabase',
                        r: 12,
                        color: '#3ecf8e'
                    },
                    {
                        id: 'edge',
                        name: 'Edge Computing',
                        r: 13,
                        color: '#f39c12',
                        children: 'data_edge'
                    },
                    {
                        id: 'postgres',
                        name: 'PostgreSQL',
                        r: 12,
                        color: '#336791'
                    }
                ],
                links: [
                    ['db_edge_root', 'prisma'],
                    ['db_edge_root', 'drizzle'],
                    ['db_edge_root', 'supabase'],
                    ['db_edge_root', 'edge'],
                    ['db_edge_root', 'postgres'],
                    ['prisma', 'postgres'],
                    ['drizzle', 'postgres'],
                    ['supabase', 'postgres'], // ORMs connect to Postgres
                    ['supabase', 'edge'],
                    ['prisma', 'edge'],
                    ['drizzle', 'edge'] // Edge support for ORMs
                ]
            };

            /**
             * Prisma tools and client libraries.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_PRISMA = {
                nodes: [{
                        id: 'prisma_root',
                        name: 'Prisma',
                        r: 13,
                        color: '#2d3748'
                    },
                    {
                        id: 'prisma_client',
                        name: 'Prisma Client',
                        r: 10,
                        color: '#2d3748'
                    },
                    {
                        id: 'prisma_studio',
                        name: 'Prisma Studio',
                        r: 9,
                        color: '#4a5568'
                    },
                    {
                        id: 'prisma_postgres',
                        name: 'PostgreSQL',
                        r: 10,
                        color: '#336791'
                    }
                ],
                links: [
                    ['prisma_root', 'prisma_client'],
                    ['prisma_root', 'prisma_studio'],
                    ['prisma_root', 'prisma_postgres'],
                    ['prisma_client', 'prisma_postgres']
                ]
            };

            /**
             * Serverless and edge computing platforms.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_EDGE = {
                nodes: [{
                        id: 'edge_root',
                        name: 'Edge',
                        r: 13,
                        color: '#f39c12'
                    },
                    {
                        id: 'workers',
                        name: 'CF Workers',
                        r: 11,
                        color: '#f39c12'
                    },
                    {
                        id: 'vercel_edge',
                        name: 'Vercel Edge',
                        r: 11,
                        color: '#000000'
                    },
                    {
                        id: 'netlify_edge',
                        name: 'Netlify Edge',
                        r: 10,
                        color: '#00c7b7'
                    },
                    {
                        id: 'aws_lambda',
                        name: 'AWS Lambda',
                        r: 10,
                        color: '#ff9900'
                    }
                ],
                links: [
                    ['edge_root', 'workers'],
                    ['edge_root', 'vercel_edge'],
                    ['edge_root', 'netlify_edge'],
                    ['edge_root', 'aws_lambda'],
                    ['workers', 'vercel_edge'],
                    ['vercel_edge', 'netlify_edge'],
                    ['netlify_edge', 'aws_lambda']
                ]
            };

            /**
             * Popular UI component libraries and CSS frameworks with cross-dependencies.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_UI_LIBS = {
                nodes: [{
                        id: 'ui_root',
                        name: 'UI Libraries',
                        r: 13,
                        color: '#9b59b6'
                    },
                    {
                        id: 'mui',
                        name: 'Material UI',
                        r: 11,
                        color: '#007fff'
                    },
                    {
                        id: 'antd',
                        name: 'Ant Design',
                        r: 11,
                        color: '#1890ff'
                    },
                    {
                        id: 'chakra',
                        name: 'Chakra UI',
                        r: 10,
                        color: '#319795'
                    },
                    {
                        id: 'shadcn',
                        name: 'shadcn/ui',
                        r: 11,
                        color: '#000000'
                    },
                    {
                        id: 'tailwind',
                        name: 'Tailwind CSS',
                        r: 12,
                        color: '#38bdf8'
                    }
                ],
                links: [
                    ['ui_root', 'mui'],
                    ['ui_root', 'antd'],
                    ['ui_root', 'chakra'],
                    ['ui_root', 'shadcn'],
                    ['ui_root', 'tailwind'],
                    ['shadcn', 'tailwind'], // shadcn heavily relies on tailwind
                    ['mui', 'emotion_dep'],
                    ['chakra', 'emotion_dep'], // conceptually they rely on css-in-js
                    ['antd', 'less_dep'] // antd uses less
                ]
            };

            /**
             * State management libraries for various frameworks.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_STATE_MGMT = {
                nodes: [{
                        id: 'state_root',
                        name: 'State Mgmt',
                        r: 13,
                        color: '#e67e22'
                    },
                    {
                        id: 'redux',
                        name: 'Redux',
                        r: 11,
                        color: '#764abc'
                    },
                    {
                        id: 'zustand',
                        name: 'Zustand',
                        r: 11,
                        color: '#f59e0b'
                    },
                    {
                        id: 'jotai',
                        name: 'Jotai',
                        r: 10,
                        color: '#000000'
                    },
                    {
                        id: 'mobx',
                        name: 'MobX',
                        r: 10,
                        color: '#ff9955'
                    },
                    {
                        id: 'pinia',
                        name: 'Pinia',
                        r: 11,
                        color: '#ffd859'
                    },
                    {
                        id: 'xstate',
                        name: 'XState',
                        r: 10,
                        color: '#2c3e50'
                    }
                ],
                links: [
                    ['state_root', 'redux'],
                    ['state_root', 'zustand'],
                    ['state_root', 'jotai'],
                    ['state_root', 'mobx'],
                    ['state_root', 'pinia'],
                    ['state_root', 'xstate'],
                    ['redux', 'zustand'],
                    ['zustand', 'jotai'],
                    ['jotai', 'mobx'],
                    ['mobx', 'pinia'],
                    ['pinia', 'xstate'] // Conceptual lineage
                ]
            };

            /**
             * Data visualization and charting libraries.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_DATAVIZ = {
                nodes: [{
                        id: 'dataviz_root',
                        name: 'Data Viz',
                        r: 13,
                        color: '#3498db'
                    },
                    {
                        id: 'echarts',
                        name: 'ECharts',
                        r: 11,
                        color: '#aa344d'
                    },
                    {
                        id: 'chartjs',
                        name: 'Chart.js',
                        r: 11,
                        color: '#ff6384'
                    },
                    {
                        id: 'd3',
                        name: 'D3.js',
                        r: 12,
                        color: '#f9a03c'
                    },
                    {
                        id: 'recharts',
                        name: 'Recharts',
                        r: 10,
                        color: '#8884d8'
                    },
                    {
                        id: 'highcharts',
                        name: 'Highcharts',
                        r: 10,
                        color: '#0088cc'
                    }
                ],
                links: [
                    ['dataviz_root', 'echarts'],
                    ['dataviz_root', 'chartjs'],
                    ['dataviz_root', 'd3'],
                    ['dataviz_root', 'recharts'],
                    ['dataviz_root', 'highcharts'],
                    ['recharts', 'd3'], // Recharts uses D3 under the hood
                    ['echarts', 'chartjs'],
                    ['chartjs', 'highcharts'] // Comparables
                ]
            };

            /**
             * Animation and transition libraries.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_ANIMATION = {
                nodes: [{
                        id: 'anim_root',
                        name: 'Animation',
                        r: 13,
                        color: '#e74c3c'
                    },
                    {
                        id: 'framer',
                        name: 'Framer Motion',
                        r: 11,
                        color: '#0055ff'
                    },
                    {
                        id: 'gsap',
                        name: 'GSAP',
                        r: 11,
                        color: '#8cc63f'
                    },
                    {
                        id: 'react_spring',
                        name: 'React Spring',
                        r: 10,
                        color: '#e74c3c'
                    },
                    {
                        id: 'lottie',
                        name: 'Lottie',
                        r: 10,
                        color: '#00c1a2'
                    }
                ],
                links: [
                    ['anim_root', 'framer'],
                    ['anim_root', 'gsap'],
                    ['anim_root', 'react_spring'],
                    ['anim_root', 'lottie'],
                    ['framer', 'react_spring'],
                    ['gsap', 'lottie'] // Often compared for micro-interactions
                ]
            };

            /**
             * Form handling and validation libraries.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_FORMS = {
                nodes: [{
                        id: 'forms_root',
                        name: 'Forms',
                        r: 13,
                        color: '#2ecc71'
                    },
                    {
                        id: 'rhf',
                        name: 'React Hook Form',
                        r: 11,
                        color: '#ec5990'
                    },
                    {
                        id: 'formik',
                        name: 'Formik',
                        r: 10,
                        color: '#000000'
                    },
                    {
                        id: 'zod',
                        name: 'Zod',
                        r: 11,
                        color: '#3068b7'
                    },
                    {
                        id: 'yup',
                        name: 'Yup',
                        r: 10,
                        color: '#e67e22'
                    }
                ],
                links: [
                    ['forms_root', 'rhf'],
                    ['forms_root', 'formik'],
                    ['forms_root', 'zod'],
                    ['forms_root', 'yup'],
                    ['rhf', 'zod'],
                    ['formik', 'yup'], // Standard pairings
                    ['zod', 'yup'] // Schema validation alternatives
                ]
            };

            /**
             * Cross-platform and desktop/mobile application frameworks.
             * @type {import('./src/galaxy.js').GraphData}
             */
            const DATA_XPLAT = {
                nodes: [{
                        id: 'xplat_root',
                        name: 'Cross-Platform',
                        r: 14,
                        color: '#53b9ff'
                    },
                    {
                        id: 'electron',
                        name: 'Electron',
                        r: 11,
                        color: '#47848f'
                    },
                    {
                        id: 'tauri',
                        name: 'Tauri',
                        r: 11,
                        color: '#ffc131'
                    },
                    {
                        id: 'react_native',
                        name: 'React Native',
                        r: 11,
                        color: '#61dafb'
                    },
                    {
                        id: 'capacitor',
                        name: 'Capacitor',
                        r: 10,
                        color: '#53b9ff'
                    }
                ],
                links: [
                    ['xplat_root', 'electron'],
                    ['xplat_root', 'tauri'],
                    ['xplat_root', 'react_native'],
                    ['xplat_root', 'capacitor'],
                    ['electron', 'tauri'],
                    ['react_native', 'capacitor'] // Grouped by use cases (Desktop vs Mobile)
                ]
            };

            /**
             * The fully assembled data map dictionary required by the Galaxy engine.
             * @type {import('./src/galaxy.js').GalaxyDataMap}
             */
            const DATABASE = {
                data_root: DATA_ROOT,
                data_ecma: DATA_ECMA,
                data_es6: DATA_ES6,
                data_es2020: DATA_ES2020,
                data_ts: DATA_TS,
                data_engines: DATA_ENGINES,
                data_v8: DATA_V8,
                data_jsc: DATA_JSC,
                data_sm: DATA_SM,

                data_runtime: DATA_RUNTIME,
                data_node: DATA_NODE,
                data_deno: DATA_DENO,
                data_bun: DATA_BUN,

                data_frontend: DATA_FRONTEND,
                data_react: DATA_REACT,
                data_next: DATA_NEXT,
                data_vue: DATA_VUE,
                data_nuxt: DATA_NUXT,
                data_angular: DATA_ANGULAR,
                data_svelte: DATA_SVELTE,

                data_ui_libs: DATA_UI_LIBS,
                data_state_mgmt: DATA_STATE_MGMT,
                data_dataviz: DATA_DATAVIZ,
                data_animation: DATA_ANIMATION,
                data_forms: DATA_FORMS,

                data_build: DATA_BUILD,
                data_vite: DATA_VITE,
                data_webpack: DATA_WEBPACK,
                data_testing: DATA_TESTING,

                data_db_edge: DATA_DB_EDGE,
                data_prisma: DATA_PRISMA,
                data_edge: DATA_EDGE,

                data_xplat: DATA_XPLAT
            };

            const galaxy = new Galaxy({
                container: document.body,
                dataMap: DATABASE,
                rootKey: 'data_root',
                theme: 'light',
                performanceMonitor: true,
                maxNodes: 15
            });
            galaxy.registerTheme('purple', {
                dark: false,
                background: '#fef7ff',
                surface: 'rgba(254, 247, 255, 0.98)',
                primary: '#6750a4',
                onBackground: '#1d1b20',
                onSurface: '#1d1b20'
            });
            galaxy.registerTheme('green', {
                dark: false,
                background: '#f7fbf2',
                surface: 'rgba(247, 251, 242, 0.98)',
                primary: '#386a20',
                onBackground: '#191d16',
                onSurface: '#191d16'
            });
            galaxy.registerTheme('blue', {
                dark: false,
                background: '#f3f8ff',
                surface: 'rgba(243, 248, 255, 0.98)',
                primary: '#0b57d0',
                onBackground: '#0a0f1c',
                onSurface: '#0a0f1c'
            });
            galaxy.registerTheme('red', {
                dark: false,
                background: '#fff8f7',
                surface: 'rgba(255, 248, 247, 0.98)',
                primary: '#ba1a1a',
                onBackground: '#201a1a',
                onSurface: '#201a1a'
            });
            galaxy.registerTheme('ocean', {
                dark: false,
                background: '#f9f9ff',
                surface: 'rgba(249, 249, 255, 0.98)',
                primary: '#0b57d0',
                onBackground: '#0b57d0',
                onSurface: '#0b57d0'
            });

            const stressTabs = [];
            for (let i = 1; i <= 20; i++) {
                stressTabs.push(Tab(`Tab ${i}`, `stress_tab_${i}`, [Text(`This is the content of Tab ${i}.`)]));
            }

            /**
             * RecyclerView Adapter using declarative Compose API with ViewHolder pooling.
             * @type {import('./src/compose.js').VirtualRecyclerListConfig['extend']}
             */
            const stressAdapter = {
                items: [],

                getItemCount() {
                    return this.items.length;
                },

                getItemViewType(position) {
                    return 0;
                },

                onCreateViewHolder(parent, viewType, api) {
                    const holder = api.compose([
                        Row({
                            style: {
                                width: '100%',
                                height: '100%',
                                padding: '10px 12px',
                                gap: '12px',
                                alignItems: 'center',
                                boxSizing: 'border-box'
                            }
                        }, [
                            Text('', {
                                key: 'title',
                                style: {
                                    flex: '1 1 0',
                                    minWidth: 0,
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }
                            }),
                            Chip('Inactive', {
                                key: 'status',
                                active: false,
                                onClick: () => {
                                    const pos = holder.adapterPosition;
                                    if (pos >= 0 && pos < stressAdapter.items.length) {
                                        const item = stressAdapter.items[pos];
                                        item.enabled = !item.enabled;
                                        const status = holder.get('status');
                                        if (status) {
                                            status.setLabel(item.enabled ? 'Active' : 'Inactive');
                                            status.setValue(item.enabled);
                                        }
                                    }
                                }
                            })
                        ])
                    ]);
                    return holder;
                },

                onBindViewHolder(holder, position) {
                    const item = this.items[position];
                    if (!item) return;
                    const title = holder.get('title');
                    const status = holder.get('status');
                    if (title) title.setContent(`#${position} ${item.title}`);
                    if (status) {
                        status.setLabel(item.enabled ? 'Active' : 'Inactive');
                        status.setValue(item.enabled);
                    }
                },

                onViewRecycled(holder) {}
            };

            const originalPanel = {
                name: 'Module',
                icon: './image/icon.png',
                collapsed: false,
                groups: [
                    Column({}, [
                        Row({}, [
                            Button('Relayout', () => galaxy.relayout()),
                            Button('Go Back', () => {
                                if (galaxy.canGoBack()) galaxy.goBack();
                                else galaxy.poll('Root reached');
                            })
                        ]),

                        Accordion('Visuals & Themes', [
                            Accordion('Theme Palette', [
                                Dropdown(
                                    [{
                                        label: 'Light',
                                        value: 'light'
                                    }, {
                                        label: 'Dark',
                                        value: 'dark'
                                    }, {
                                        label: 'Purple',
                                        value: 'purple'
                                    }, {
                                        label: 'Green',
                                        value: 'green'
                                    }, {
                                        label: 'Blue',
                                        value: 'blue'
                                    }, {
                                        label: 'Red',
                                        value: 'red'
                                    }, {
                                        label: 'Ocean',
                                        value: 'ocean'
                                    }],
                                    'light', (v) => galaxy.setTheme(v), {
                                        key: 'themeDropdown'
                                    }
                                )
                            ], true),
                            Switch('Performance Monitor', true, (v) => {
                                if (galaxy.perfPanelEl) galaxy.perfPanelEl.style.display = v ? 'flex' : 'none';
                            }, {
                                key: 'perfSwitch'
                            })
                        ], true),

                        Accordion('Layout & Offset', [
                            Slider('Offset X', 0, -200, 200, 10, (v) => {
                                galaxy.setLayoutOffset(v, galaxy._layoutOffset.y || 0);
                            }, {
                                key: 'offsetX'
                            }),
                            Slider('Offset Y', 0, -200, 200, 10, (v) => {
                                galaxy.setLayoutOffset(galaxy._layoutOffset.x || 0, v);
                            }, {
                                key: 'offsetY'
                            })
                        ], true),

                        Tabs(
                            [
                                Tab('Clock', 'tab_clock', [
                                    Text('Time:'),
                                    TimePicker(14, 30, null, {
                                        key: 'clock',
                                        dialSize: 140,
                                        amText: 'AM',
                                        pmText: 'PM',
                                        separator: ':'
                                    })
                                ]),
                                Tab('UI', 'ui', [
                                    Text('Material Design 3 Components:'),
                                    Card('Card Title', [
                                        Text('This is a text inside a Card. You can put anything here.'),
                                        Switch('Enable Settings', true, () => {})
                                    ]),
                                    Divider(),
                                    Text('Chips (Testing Icon Alignment):'),
                                    Row({}, [
                                        Chip('Normal', {
                                            onClick: () => galaxy.poll('Clicked Normal')
                                        }),
                                        Chip('Selected', {
                                            active: true
                                        }),
                                        Chip('With Icon', {
                                            icon: './image/file.png'
                                        }),
                                        Chip('Closable', {
                                            closable: true,
                                            closeIcon: '✕',
                                            onClose: () => galaxy.poll('Chip Closed')
                                        })
                                    ]),
                                    Divider(),
                                    Text('Choice Groups:'),
                                    RadioGroup('Radio', [{
                                        label: 'Option A',
                                        value: 'a'
                                    }, {
                                        label: 'Option B',
                                        value: 'b'
                                    }], 'a', () => {}, {
                                        layout: 'row'
                                    }),
                                    CheckboxGroup('Checkbox', [{
                                        label: 'Option 1',
                                        value: '1'
                                    }, {
                                        label: 'Option 2',
                                        value: '2'
                                    }], ['1'], () => {}, {
                                        layout: 'row'
                                    }),
                                    Divider(),
                                    Text('Other Input Components:'),
                                    MultiDropdown(
                                        [{
                                                label: 'Vue',
                                                value: 'vue'
                                            }, {
                                                label: 'React',
                                                value: 'react'
                                            }, {
                                                label: 'Angular',
                                                value: 'angular'
                                            },
                                            {
                                                label: 'Node.js',
                                                value: 'node.js'
                                            },
                                            {
                                                label: 'Express',
                                                value: 'express'
                                            }
                                        ],
                                        ['vue', 'react'],
                                        () => {}, {
                                            label: 'Framework Selection',
                                            displayMode: 'chip',
                                            maxChips: 2,
                                            formatMoreText: (count) => `+${count}`,
                                            placeholder: 'Select frameworks...',
                                            allSelectedText: 'All Selected'
                                        }
                                    ),
                                    ColorPicker('Color Picker', '#ff0000', () => {}, {
                                        colors: ['#ff0000', '#00ff00', '#0000ff']
                                    }),
                                    Progress('Loading Progress', 65, {
                                        unit: '%'
                                    }),
                                    Image(Icon.image('./image/image.jpg'), {
                                        style: {
                                            borderRadius: '8px',
                                            height: 260
                                        }
                                    }),
                                    KeyValue({
                                            'key1': 'value1'
                                        },
                                        () => {}, {
                                            keyPlaceholder: 'Key',
                                            valPlaceholder: 'Value',
                                            addIcon: 'Add Property',
                                            deleteIcon: 'Delete',
                                            defaultKeyPrefix: 'prop_'
                                        }
                                    ),
                                    Console(50, {
                                        style: {
                                            height: '80px'
                                        },
                                        prefix: '$ '
                                    }),
                                ]),
                                Tab('VirtualRecycler', 'virtual', [
                                    Text('1. Deep Nested Content:'),
                                    Accordion('Expand Nested Layers', [Accordion('Layer 2', [Accordion('Layer 3', [Row({}, [Button('Very Long Button A', () => {}, {
                                        style: {
                                            minWidth: '300px'
                                        }
                                    }), Button('Very Long Button B', () => {}, {
                                        style: {
                                            minWidth: '300px'
                                        }
                                    })])], true)], true)], true),
                                    Divider(),

                                    Card('Million-Level Virtual List Test (Text + Chip)', [
                                        Text('Using ViewHolder pooling + Text/Chip combination. DOM count stays ~100 while scrolling 1M items.'),
                                        Button('Generate 1M Items', async () => {
                                            const p = gui.getClick(0);
                                            const listComp = p.getComponent('stressList');
                                            if (!listComp) return;

                                            listComp.setValue([]);
                                            galaxy.poll('Generating data, please wait...');

                                            const total = 1000001;
                                            const batchSize = 50000;
                                            let current = 0;

                                            const generateBatch = () => {
                                                if (!document.body.contains(listComp.el)) return;

                                                const arr = [];
                                                for (let i = 0; i < batchSize && current < total; i++, current++) {
                                                    arr.push({
                                                        title: `Item ${current}`,
                                                        enabled: current % 2 === 0
                                                    });
                                                }
                                                listComp.append(arr, true);

                                                if (current < total) {
                                                    if (current % 100000 === 0) galaxy.poll(`Generated ${current} / ${total}`);
                                                    requestAnimationFrame(() => setTimeout(generateBatch, 0));
                                                } else {
                                                    galaxy.poll('Data generated!');
                                                }
                                            };
                                            generateBatch();
                                        }),
                                        Button('Jump to 1,000,000th', () => {
                                            const p = gui.getClick(0);
                                            const listComp = p.getComponent('stressList');
                                            if (listComp) {
                                                listComp.scrollToIndex(1000000);
                                                galaxy.poll('Jumped to 1M items');
                                            }
                                        }),
                                        Button('Print Recycler Stats', () => {
                                            const p = gui.getClick(0);
                                            const listComp = p.getComponent('stressList');
                                            if (listComp) {
                                                const stats = listComp.getRecyclerStats();
                                                galaxy.poll(`created=${stats.created} active=${stats.active} recycled=${stats.recycled}`);
                                            }
                                        }),
                                        Button('Random Jump', () => {
                                            if (autoJumpTimer) clearInterval(autoJumpTimer);

                                            autoJumpTimer = setInterval(() => {
                                                const p = gui.getClick(0);
                                                const listComp = p.getComponent('stressList');
                                                if (!listComp || listComp.getValue().length === 0) {
                                                    galaxy.poll('No data to jump');
                                                    return;
                                                }

                                                const total = listComp.getValue().length;
                                                const targetIndex = Math.floor(Math.random() * total);

                                                galaxy.poll(`Auto jump to ${targetIndex}...`);

                                                setTimeout(() => {
                                                    if (autoJumpTimer) listComp.scrollToIndex(targetIndex);
                                                }, 600);

                                            }, 5000);
                                            galaxy.poll('Auto Jump Started (Every 5s)');
                                        }),
                                        Button('Stop Jump', () => {
                                            if (autoJumpTimer) {
                                                clearInterval(autoJumpTimer);
                                                autoJumpTimer = null;
                                                galaxy.poll('Auto Jump Stopped');
                                            } else {
                                                galaxy.poll('No auto jump running');
                                            }
                                        }),

                                        Divider(),
                                        Text('RecyclerView Dynamic Operations:'),
                                        Row({}, [
                                            Button('Insert at Top', () => {
                                                const p = gui.getClick(0);
                                                const listComp = p.getComponent('stressList');
                                                if (!listComp || listComp.getValue().length === 0) return galaxy.poll('Please generate data first');
                                                stressAdapter.items.unshift({
                                                    title: 'NEW TOP ITEM',
                                                    enabled: true
                                                });
                                                listComp.notifyItemInserted(0);
                                                galaxy.poll('Inserted at index 0');
                                            }),
                                            Button('Remove at Top', () => {
                                                const p = gui.getClick(0);
                                                const listComp = p.getComponent('stressList');
                                                if (!listComp || listComp.getValue().length === 0) return galaxy.poll('List is empty');
                                                stressAdapter.items.splice(0, 1);
                                                listComp.notifyItemRemoved(0);
                                                galaxy.poll('Removed at index 0');
                                            })
                                        ]),
                                        Row({}, [
                                            Button('Insert in Current View', () => {
                                                const p = gui.getClick(0);
                                                const listComp = p.getComponent('stressList');
                                                if (!listComp || listComp.getValue().length === 0) return galaxy.poll('Please generate data first');
                                                const stats = listComp.getRecyclerStats();
                                                const insertIndex = stats.currentPage * 100 + 50;
                                                if (insertIndex < stressAdapter.items.length) {
                                                    stressAdapter.items.splice(insertIndex, 0, {
                                                        title: 'NEW MIDDLE ITEM',
                                                        enabled: false
                                                    });
                                                    listComp.notifyItemInserted(insertIndex);
                                                    galaxy.poll(`Inserted at index ${insertIndex}`);
                                                }
                                            }),
                                            Button('Remove in Current View', () => {
                                                const p = gui.getClick(0);
                                                const listComp = p.getComponent('stressList');
                                                if (!listComp || listComp.getValue().length === 0) return galaxy.poll('List is empty');
                                                const stats = listComp.getRecyclerStats();
                                                const removeIndex = stats.currentPage * 100 + 10;
                                                if (removeIndex < stressAdapter.items.length) {
                                                    stressAdapter.items.splice(removeIndex, 1);
                                                    listComp.notifyItemRemoved(removeIndex);
                                                    galaxy.poll(`Removed at index ${removeIndex}`);
                                                }
                                            })
                                        ]),
                                        Row({}, [
                                            Button('Update Current View', () => {
                                                const p = gui.getClick(0);
                                                const listComp = p.getComponent('stressList');
                                                if (!listComp || listComp.getValue().length === 0) return galaxy.poll('List is empty');
                                                const stats = listComp.getRecyclerStats();
                                                const updateIndex = stats.currentPage * 100 + 5;
                                                if (updateIndex < stressAdapter.items.length) {
                                                    stressAdapter.items[updateIndex].title = 'UPDATED TITLE!';
                                                    stressAdapter.items[updateIndex].enabled = !stressAdapter.items[updateIndex].enabled;
                                                    listComp.notifyItemChanged(updateIndex);
                                                    galaxy.poll(`Updated index ${updateIndex}`);
                                                }
                                            }),
                                            Button('Get ViewHolder', () => {
                                                const p = gui.getClick(0);
                                                const listComp = p.getComponent('stressList');
                                                if (!listComp || listComp.getValue().length === 0) return galaxy.poll('List is empty');
                                                const stats = listComp.getRecyclerStats();
                                                const targetIndex = stats.currentPage * 100 + 2;
                                                const holder = listComp.getViewHolder(targetIndex);
                                                if (holder) {
                                                    holder.get('title').setContent('DOM DIRECTLY MUTATED!');
                                                    holder.get('status').setLabel('Hacked');
                                                    holder.get('status').setValue(true);
                                                    galaxy.poll(`Got ViewHolder at ${targetIndex}, direct DOM mutated!`);
                                                } else {
                                                    galaxy.poll('ViewHolder not on screen');
                                                }
                                            })
                                        ]),

                                        VirtualRecyclerList({
                                            key: 'stressList',
                                            maxHeight: 250,
                                            itemHeight: 60,
                                            extend: stressAdapter
                                        })
                                    ]),

                                    Divider(),
                                    Text('2. 20 Tabs Test:'),
                                    Tabs(stressTabs, 'stress_tab_1', null)
                                ]),
                                Tab('Scroll Test', 'tab_scroll_test', [
                                    Text('Test long scrolling of List and Accordion:'),
                                    Column({
                                        style: {
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            border: '1px solid rgba(127,127,127,0.2)',
                                            borderRadius: '8px',
                                            padding: '8px'
                                        }
                                    }, [
                                        ...Array.from({
                                            length: 12
                                        }).map((_, i) => Accordion(`Test Submenu ${i + 1}`, [Text(`Content ${i + 1}`)]))
                                    ])
                                ]),
                                ...Array.from({
                                    length: 15
                                }).map((_, i) =>
                                    Tab(`Empty ${i + 1}`, `empty_tab_${i}`, [Text(`This is empty Tab ${i + 1}.`)])
                                )
                            ],
                            'tab_clock', null, {
                                style: {
                                    marginTop: '10px'
                                }
                            }
                        )
                    ])
                ]
            };

            const gui = new GalaxyClickGui(galaxy, {
                clicks: [originalPanel]
            });
            gui.setClickPosition(0, 20, 40);
            setTimeout(() => {
                gui.getClick(0).expand();
            }, 500);

        })();
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

This project is licensed under the Apache 2.0 License.
