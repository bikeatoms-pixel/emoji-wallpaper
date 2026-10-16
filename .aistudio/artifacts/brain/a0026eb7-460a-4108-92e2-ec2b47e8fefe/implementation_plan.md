# Implementation Plan: 3-Style Emoji Engine, SVG Eyes Recolor Fix, and Whole-Word Chinese Input

## Title & Summary
# 3-Style Emoji Engine, SVG Vector Recolor Hardening, & Whole Chinese Word Support
全面升级 Emoji 图案渲染与交互引擎：支持「线条化（Monochrome Outline）」、「半线条化（Illustrated Vector）」与「原图（Native System 3D）」3 种独立风格切换与批量控制；彻底修复老虎等 Emoji 眼睛/瞳孔与特定线条变色残留黑色的问题；重构输入解析系统，支持中文词语与自定义词组整词保留及自适应排版。

## User Review & Critical Decisions

> [!IMPORTANT]
> 根据您在 Clarification 阶段确认的交互方案：
> 1. **3 种风格切换控制**：在每个 Emoji 标签上提供直观的「三态循环切换按钮（线条化 ➔ 半线条 ➔ 原图 ➔ 线条化）」，并在面板顶部增加「批量一键切换（全部线条化 / 全部半线条 / 全部原图）」控件。
> 2. **中文词组与元素分词规则**：采用空格或逗号（包括中文逗号/顿号）作为分词界标，整词保持完整元素不拆散（例如输入「吃火锅 奶茶」或「吃」，保留为完整的「吃火锅」、「奶茶」、「吃」词语图元），同时对未加空格的纯 Emoji 符号串智能分段。

- **确认决定 1（风格体系）**：保留「线条化（OpenMoji 纯单色轮廓）」、「半线条化（OpenMoji 矢量彩色插画）」与「原图（原生系统高精 3D/全彩 Emoji，不被网络矢量覆盖）」三位一体。
- **确认决定 2（变色修复）**：彻底净化与重构 SVG Recolor 引擎，拦截 OpenMoji 中所有隐藏的黑色属性、未声明 fill/stroke 的默认黑色元素（如眼睛、瞳孔、胡须），使其 100% 遵循调色盘主题色。
- **确认决定 3（整词保留）**：重构文本输入解析与 Canvas 绘制逻辑，中文词组在 Canvas 单元格内自适应字号与基线对齐，支持线条化与彩色排版。

---

## 1. Overview & Core Concept

- **What It Does**:
  1. 用户可以自由组合或批量指定当前壁纸中的 Emoji 使用「纯单色线条」、「扁平矢量半线条插画」或「系统原生 3D 原图」。
  2. 修复单色线条模式下老虎等图标眼睛、瞳孔仍为黑色的视觉瑕疵，实现完全一致的 Material You 色彩融合。
  3. 用户输入自定义文字（如中文词语「吃火锅」、「暴富」、「猫猫」）时，整词作为一个图元元素参与壁纸平铺、缩放与透镜交互。
- **Target Audience / Persona**: 追求高品质壁纸定制、喜欢将个性化汉字/词语与 Emoji 混合排布的手机与电脑用户。
- **Key Value**: 消除视觉瑕疵与风格覆盖闪烁，赋予用户完全可控的图形表现力与中文文字排版自由度。

---

## 2. User Experience & Visual Design

### 2.1 风格切换三态交互与微交互
- **单个 Emoji 标签项**：
  - 展示当前图元字符（如 🐯、🌲、吃）。
  - 右侧配有 **3 态微交互切换按钮**：
    - `outline`（线条化）：笔刷图标 `Paintbrush`，深色线框微态。
    - `vector`（半线条化）：调色盘图标 `Palette`，琥珀色亮起。
    - `native`（原图）：星芒光泽图标 `Sparkles`，柔和翠蓝紫渐变光圈。
  - 点击按钮在 `outline -> vector -> native` 间平滑循环，附带轻微缩放弹性反馈（`active:scale-95`）。
- **面板顶部批量快捷栏**：
  - 提供轻量、非胶囊的精巧 Segmented Control：`[全部线条] [全部半线条] [全部原图]`。
  - 点击即可批量同步当前所有图元的展示风格。

### 2.2 SVG 颜色注入与老虎眼睛修复
- 老虎等 Emoji 在单色模式下，SVG 中的 `<circle>` 或 `<ellipse>` 瞳孔往往缺少明确的 fill 属性（依赖浏览器默认的 black 渲染）或使用了 `#231f20` / `#000000` / `class`。
- 新增深度重色与默认属性注入：
  - 递归遍历/替换所有硬编码黑色（`#000000`、`#000`、`#231F20`、`#1a1a1a`、`rgb(0,0,0)`、`black`）。
  - 给 SVG 根节点强制设定 `color: outlineColor; fill: outlineColor; stroke: outlineColor;`，确保没有明确指定颜色的几何体全部被强制染色。
  - 彻底杜绝任何黑斑残留。

### 2.3 中文词语与整词排版
- 输入框支持自由输入：例如 `吃火锅 奶茶 🐯` 或 `暴富, 开心`。
- 按空格、换行、半角/全角逗号（`,`、`，`、`、`）分割词语，中文整词完整保留。
- 在 Canvas 渲染中：
  - 单字 Emoji/汉字居中标准尺寸展示；
  - 多字中文词组（如 2~4 个字）自动计算适配比例与字号，利用系统原生粗体中文字体（`"PingFang SC", "Microsoft YaHei", sans-serif`）绘制，线条模式下呈现饱满质感，彩色模式下呈现鲜活文字。

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      EmojiTab UI                       │
│  - Input Box with Smart Word Segmenter                 │
│  - Batch Style Switcher (Outline | Vector | Native)    │
│  - Chips with 3-State Toggle (Paintbrush/Palette/Spark)│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   types.ts Data Model                  │
│  EmojiStyle = 'outline' | 'vector' | 'native'          │
│  EmojiItem: { id: string; char: string; style: ... }   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 emojiService & Assets                  │
│  - outline: fetchRawMonochromeSvg + deepRecolorSvg     │
│             (eliminates #231F20, eye pupils & black)   │
│  - vector: fetchRawColorSvg (OpenMoji flat vector)     │
│  - native: Direct canvas OS glyph (Apple/Noto emoji)   │
│  - text/word: Immediate fallback (zero network delay)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                canvasRenderer Pipeline                 │
│  - drawEmoji(ctx, item, x, y, size, rot, outlineColor) │
│    * 'outline' -> recolored SVG image / styled text    │
│    * 'vector'  -> OpenMoji color SVG image             │
│    * 'native'  -> OS Native Emoji / text (no SVG flash)│
│    * Chinese Word -> Dynamic auto-scaled typography    │
└────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Steps

1. **类型定义升级 (`src/types.ts`)**：
   - 扩充 `EmojiStyle` 为 `'outline' | 'vector' | 'native'`。
   - 向后兼容已有的旧配置。
2. **SVG 重色与资源加载器修复 (`src/services/emojiService.ts`)**：
   - 增强 `recolorSvgString`：涵盖 `#231F20`、`#231f20`、`rgb(0,0,0)`、行内 style、以及无 fill 的眼珠几何体，彻底消除黑眼珠/黑斑。
   - 明确缓存与加载通道：`'outline'` 走单色重色缓存，`'vector'` 走 OpenMoji 彩色矢量，`'native'` 直接跳过网络拉取，避免原图变半线条化的闪变。
3. **Canvas 绘制器优化 (`src/services/canvasRenderer.ts`)**：
   - 更新 `drawEmoji` 逻辑：当 style 为 `'native'` 时，直接通过 `drawColorTextFallback` 绘制原生系统全彩表情，不再触发或等待 OpenMoji 矢量覆盖。
   - 强化多字中文词排版：根据字符长度自适应字号（如 2 字 0.55x，3 字 0.42x），避免多字词在网格中溢出。
4. **Emoji 控制面板升级 (`src/components/EmojiTab.tsx`)**：
   - 升级输入框分词逻辑：以空格、逗号等符号保留整词，连续纯 Emoji 自动析构。
   - 芯片增加 3 态循环切换控件与清晰视觉反馈。
   - 顶部增加批量一键切换器（全部线条化 / 全部半线条 / 全部原图）。
5. **多比例导出与预览联动**：
   - 确保 `DownloadModal` 离屏高清 Canvas 渲染与主画布完全同步 3 种风格与中文词组排版。
6. **编译与全流程验证**：
   - 执行 `lint_applet` 与 `compile_applet`，并在浏览器中验证老虎眼睛变色、3 种风格切换、中文词组输入无拆散。
