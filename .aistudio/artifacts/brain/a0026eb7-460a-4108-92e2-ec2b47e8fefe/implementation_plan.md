# Implementation Plan: Lotus Polar Coordinate Spiral & Mobile Retina Wallpaper WYSIWYG Calibration

## Title & Summary
# 极坐标螺旋 Lotus 重塑与移动端全平台壁纸下载所见即所得（WYSIWYG）像素级校准
全面重塑 Lotus 图案纯正的「极坐标阿基米德双螺旋（$r = b \cdot \theta$）」数学骨架与动态切线旋转，彻底拉开其与 Bloom 同心圆环的花序形态差异；深入排查并彻底解决移动设备（手机和平板）因屏幕高像素比（Retina / OLED `devicePixelRatio`）引起的视口坐标系倍率分裂问题，实现移动端下载壁纸与预览框的 100% 绝对一致。

## User Review & Critical Decisions

> [!IMPORTANT]
> 针对您反馈的两个核心问题：
> 1. **Lotus 螺旋特性丢失问题**：由于此前修改单圆心时将半径写成了按层累加的离散圆环，使得 Lotus 变成了与 Bloom 几乎无差别的同心圆形。已设计将其升级为真正连续的「极坐标阿基米德双螺旋花序」，具有世界原点 (0, 0) 唯一定位、层间距与弧长严密微分（严格保证 42px 以上净间距零重叠）、以及随螺旋流向动态旋转的生机韵律。
> 2. **移动端下载壁纸与预览框不符（放大版）深层根因**：移动端（手机与平板）屏幕普遍具备 2x~3x 的视网膜屏（Retina / OLED，`window.devicePixelRatio = 2 或 3`）。代码在预览画布中错误地将 `contW * dpr` 作为逻辑绘图空间，导致在移动端视口内 Emoji 被缩小了 2 倍显示（塞入了过多内容）；而在点击下载时使用的是标准设计逻辑基准，导致导出的壁纸看起来正好放大了 2~3 倍。选择“桌面端网页”不会改变移动设备屏幕物理的 devicePixelRatio，因此无法消除偏差。

- **关键决策 1（Lotus 极坐标连续螺旋）**：采用阿基米德双臂对称极坐标螺旋方程 $r = b \cdot \theta$，以 (0, 0) 为唯一起始核，双臂交错呈 180° 中心对称，通过微分弧长积分沿曲线等弧长排布，并在视口拖拽时保持连续性。
- **关键决策 2（移动端 DPR 视口坐标系统一）**：重构 `WallpaperCanvas` 与 `canvasRenderer` 的高清渲染契约——将容器 CSS 像素作为唯一的逻辑世界坐标系基准，通过 `ctx.scale(dpr, dpr)` 承接 Retina 高清栅格化，彻底剥离触控事件与画布尺寸中的非对称 dpr 因子，保证全设备、全分辨率 100% 构图绝对复刻。

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Lotus 极坐标连续螺旋花序**：在世界原点 (0, 0) 周围延展出两条优美蜿蜒的极坐标螺旋臂，每个 Emoji 沿着螺旋切线动态偏转，展现出向外旋转绽放的独特韵律，与同心圆环 Bloom 呈现完全不同的几何质感。
  2. **移动端与平板端全真所见即所得（WYSIWYG）**：无论用户使用的是 Windows PC、MacBook、iPhone、iPad 还是 Android 手机，预览框中所圈定的图案构图、Emoji 大小、中心位置与排布细节，与下载保存到相册/本地的壁纸保持 1:1 绝对一致。
- **Target Audience / Persona**: 习惯在手机或平板上直接制作、预览并导出个性化手机壁纸的移动端用户，以及要求高精度构图与几何美感的设计爱好者。
- **Key Value**: 消除平台间显示倍率分裂导致的心理落差，保证在移动设备上“所见即所定，所定即所得”。

---

## 2. Technical Root-Cause Analysis (移动端壁纸放大根因排查)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        为什么移动端导出的壁纸是放大版？                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. PC 端 (devicePixelRatio = 1):                                            │
│    容器宽 contW = 200px                                                     │
│    customWidth = contW * 1 = 200px (逻辑宽度)                               │
│    Emoji 尺寸 = 46px                                                        │
│    Emoji 相对视口占比 = 46 / 200 = 23%                                      │
│    导出时: targetWidth = 1080px, resScale = 1080/200, 相对占比 = 46/200 = 23%│
│    ==> 预览与导出完全一致!                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. 移动端/平板 (devicePixelRatio = 2 或 3):                                 │
│    容器宽 contW = 200px, dpr = 2                                            │
│    原本写法: customWidth = contW * 2 = 400px! (逻辑宽度变成了 400px)        │
│    Emoji 尺寸仍为 46px                                                      │
│    Emoji 相对视口占比 = 46 / 400 = 11.5% (视觉上变小了一倍，塞入更多 Emoji) │
│    导出时: customWidth = frameW = 200px (使用的是 200px 基准!)              │
│    导出后 Emoji 相对视口占比 = 46 / 200 = 23%                               │
│    ==> 导致导出的壁纸在移动设备上看比预览框整整放大了 2 倍 (放大版)!        │
│    同时，触控拖拽乘以了 dpr，导致手指拖 10px 画布移动 20px~30px。           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Steps & Architectural Changes

### 3.1 Lotus 极坐标阿基米德螺旋重塑
- **数学模型**：
  $$r = b \cdot \theta \quad \text{其中 } b = \frac{\text{pitch}}{2\pi}$$
  - 双臂交错：$\theta_0 = \theta_{\text{initial}}$, $\theta_1 = \theta_{\text{initial}} + \pi$。
  - 恒定弧长步进：基于弧长微分 $ds = \sqrt{r^2 + b^2} \, d\theta$，每次递增角度 $d\theta = \frac{\Delta s}{\sqrt{r^2 + b^2}}$，确保每个 Emoji 沿螺旋曲线间距严格恒定为 48px。
  - 动态切线旋转：$\alpha = \theta + \arctan(b/r) + \frac{\pi}{2}$，让 Emoji 头部朝向螺旋外旋流向，灵动盛放。
  - 视口裁剪加速：快速判断 $(x, y)$ 是否在当前可视范围内，避免越界绘制。
  - 保证与 Bloom（同心阶梯圆环）在视觉与几何逻辑上的彻底独立。

### 3.2 移动端与全端 Retina 视口坐标系统一修复
- **修改 `src/components/WallpaperCanvas.tsx`**：
  - 将传入 `renderWallpaper` 的 `customWidth` 和 `customHeight` 固定为容器逻辑尺寸（`contW`、`contH`），并将 `resolutionScale` 设为 `dpr`（`Math.min(window.devicePixelRatio || 1, 2)`）。
  - 修正手势拖拽（Mouse Drag & Single Finger Touch Drag）：移除多余的 `* dpr` 换算，直接使用物理触摸差值 `dx`、`dy`，使得屏幕上移动多少像素，画布就平移多少逻辑坐标。
  - 修正双指捏合缩放（Pinch-to-zoom）与中心定位计算，去掉触摸点中心坐标中多余的 `* dpr`。
- **修改 `src/components/DownloadModal.tsx`**：
  - 确保模态窗中内嵌的 `<WallpaperCanvas>` 呈现的预览比例，与 `handleExport` 使用离屏画布渲染时的基准比例完全一致（两者逻辑基准尺寸均为 `frameDimensions.width` 和 `frameDimensions.height`）。
  - 保持离屏导出时的清晰度倍率：`resMultiplier = targetWidth / frameW`，通过 `renderWallpaper({ customWidth: frameW, customHeight: frameH, resolutionScale: resMultiplier })` 实现任何分辨率（1080P/2K/4K）下的完全等比例栅格化。

---

## 4. Verification Plan

- **验证 1：Lotus 极坐标连续螺旋特性验证**：
  - 切换到 Lotus 布局，观察中心核心与向外舒展的双臂螺旋曲线；
  - 确认每个 Emoji 沿螺旋流线排列，具有动态切线倾斜角度；
  - 与 Bloom 进行切换对比，确认 Bloom 为圆环形层层绽放，而 Lotus 为连续向外旋转的涡旋，特征泾渭分明。
- **验证 2：移动端与平板端下载与预览 1:1 对比测试**：
  - 在移动端模拟器（设置 DPR=2 或 DPR=3）以及实际触摸设备上打开壁纸编辑与下载模态框；
  - 观察下载模态框内的预览框，记下边角切入的特定 Emoji 位置与大小；
  - 点击“下载高清壁纸”并打开下载所得图片，与预览框完全重叠比对，验证位置、间距、缩放比例 100% 吻合，彻底杜绝“放大版”问题；
  - 触摸拖动壁纸，确认移动端手指移动速率与画布位移完全 1:1 跟手，无加速跳跃。
- **验证 3：全项目编译与代码规范检查**：
  - 运行 `compile_applet` 和 `lint_applet`，确保构建完全通过，无任何语法或类型错误。
