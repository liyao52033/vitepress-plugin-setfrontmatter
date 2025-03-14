---
date: 2025-03-14 00:03:50
title: README
permalink: /pages/eb5aff
author:
  name: 华总
  link: https://xiaoying.org.cn
categories:
  - 
---

# vitepress-plugin-setfrontmatter

这是一个适用于 `vitepress` 的 Vite 插件，`vitepress` 启动时，插件会给指定的 markdown 自动生成 `frontmatter`。

## ✨ 特性

- 🚀 自动生成 `frontmatter`
- 🚀 支持自定义新的 `frontmatter`

## 🕯️ 安装

安装 `vitepress-plugin-setfrontmatter` 插件

::: code-group

```npm
npm install vitepress-plugin-setfrontmatter -D
```

```yarn
yarn add vitepress-plugin-setfrontmatter -D
```

```pnpm
pnpm i vitepress-plugin-setfrontmatter -D
```

:::

## 基本使用

添加 `vitepress-plugin-setfrontmatter` 插件到 `.vitepress/config.ts`

```typescript
import AutoFrontmatter from "vitepress-plugin-auto-frontmatter";

export default defineConfig({
  vite: {
    plugins: [AutoFrontmatter({
       pattern: "**/*.md",
       globOptions: { ignore: [""] } //忽略的文件夹
    })],
  },
});
```

> 说明：该插件仅限项目启动时生效。

## 参数

```typescript
import type { GlobOptions } from "tinyglobby";

export interface AutoFrontmatterOption {
  /**
   * 扫描的文件路径表达式，为 global 表达式
   */
  pattern?: string | string[];
  /**
   * tinyglobby 的配置项
   * 插件默认已经忽略 node_modules 和 dist 目录的所有文件
   */
  globOptions?: GlobOptions;
  
  /**
   * 转换处理好的 frontmatter，该函数需要返回一个新的 frontmatter 或只返回 undefined，如果返回 {}，则清空 MD 文件本身存在的 frontmatter
   */
  transform?: (frontmatter: Record<string, any>, fileInfo: FileInfo) => Record<string, any> | void;
}

export interface FileInfo {
  /**
   * 文件绝对路径
   */
  filePath: string;
  /**
   * 文件相对路径
   */
  relativePath: string;
}
```



插件默认忽略 ["node_modules", "dist"]` 目录下的文件，且只扫描 markdown 文档。

插件默认给 markdown 文件生成 `title` 和 `date` 两个属性，其中 `title` 为文件名（支持带序号的文件名，如 `01.xx.md`），`date` 为文件的创建日期。

```yaml
---
title: 文件名
date: yyyy-MM-dd hh:mm:ss
---
```


## 📖 自定义新的 `frontmatter`

如果想拓展 `frontmatter` 的内容，则使用 `transform` 函数。

想排除某个md文档不想自动生成 `frontmatter`，在`frontmatter` 中添加 `article: false` 或者 `layout: home`，则不会生成 `frontmatter`。

```yaml
//要排除的话二选一即可
---
article: false 
layout: home
---
```

通过 `transform` 函数来添加一个唯一的永久链接和分类标签

### 1、安装vitepress-plugin-catalogue

::: code-group

```npm
npm install vitepress-plugin-catalogue -D
```

```yarn
yarn add vitepress-plugin-catalogue -D
```

```pnpm
pnpm i vitepress-plugin-catalogue -D
```

:::

### 2、新建types.ts

```typescript
import type { CatalogueOption } from "vitepress-plugin-catalogue";
import type { AutoFrontmatterOption } from "vitepress-plugin-auto-frontmatter";

export interface vpThemeConfig {
  /**
   * 内置 Vite 插件配置
   */
  vitePlugins?: Plugins;
}

export interface Plugins {
  /**
   * catalogues 插件配置项
   */
  catalogueOption?: CatalogueOption;
  /**
   * autoFrontmatter 插件配置项，并拓展出其他配置项
   */
  autoFrontmatterOption?: AutoFrontmatterOption & { permalinkPrefix?: string;};
}

```

### 3、配置

```typescript
export default function vpThemeConfig(config: vpThemeConfig = {}): UserConfig {
  const { vitePlugins,  ...tkThemeConfig } = config;
  const {
    autoFrontmatter = true,
    autoFrontmatterOption = {},
  } = vitePlugins || {};

  const plugins: PluginOption[] = [];

  // 定义插件扫描时忽略的目录
  const ignoreDir = {
    autoFrontmatter: ["**/@pages/**"],
  };

  // 自动生成 frontmatter 插件
    const {
      pattern,
      globOptions = {},
      transform,
      permalinkPrefix = "pages",
    } = autoFrontmatterOption;

    // 默认扫描全部 MD 文件
    if (!pattern) autoFrontmatterOption.pattern = "**/*.md";

    autoFrontmatterOption.globOptions = {
      ...autoFrontmatterOption.globOptions,
      ignore: [...ignoreDir.autoFrontmatter, ...(globOptions.ignore || [])],
    };

    // 自定义 frontmatter 内容，添加永久链接和分类
    autoFrontmatterOption.transform = (frontmatter, fileInfo) => {
      let transformResult = transform?.(frontmatter, fileInfo) || {};

     if (permalink) {
      transformResult = { ...transformResult, ...createPermalink(permalinkPrefix) };
    }
    if (!frontmatter.categories) {
      transformResult = { ...transformResult, ...createCategory(fileInfo, ["@fragment"]) };
      }
	  
	  /** 继续添加你想要的字段，仿照创建 permalink 永久链接在下面实现即可，
        返回值结构{ key: value } 
   **/

      return Object.keys(transformResult).length ? { ...frontmatter, ...transformResult } : undefined;
    };

    plugins.push(AutoFrontmatter(autoFrontmatterOption));
  
  return {
    // 使用永久链接插件需要忽略死链提醒
    ignoreDeadLinks: true,
    vite: {
      plugins: plugins as any,
      // 解决项目启动后终端打印 Scss 的废弃警告：The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.
      css: { preprocessorOptions: { scss: { api: "modern" } } },
      optimizeDeps: {
        include: ["element-plus", "@giscus/vue", "@waline/client"],
      },
    },
    themeConfig: tkThemeConfig,
  };
}


/**
 * 创建 permalink 永久链接
 */
export const createPermalink = () => {
  return {
    permalink: `/pages/${(Math.random() + Math.random()).toString(16).slice(2, 8)}`,
  };
};

/**
 * 创建 categories 分类列表
 *
 * @param fileInfo 文件信息
 * @param ignore 需要忽略的文件名或目录名
 */
export const createCategory = (fileInfo: FileInfo, ignore: string[] = []) => {
  const siteConfig: SiteConfig = (globalThis as any).VITEPRESS_CONFIG;
  const { locales = {} } = siteConfig.userConfig;

  const relativePathArr = fileInfo.relativePath.split("/");

  const categories: string[] = [];
  relativePathArr.forEach((item, index) => {
    // 去除「序号.」的前缀，并获取文件名
    const filename = item.replace(/^\d+\./, "").split(".")?.[0] || "";

    // 兼容国际化功能，如果配置多语言，则不添加多语言根目录名
    if (index !== relativePathArr.length - 1 && !locales[filename] && !ignore.includes(filename))
      categories.push(filename);
  });

  // [""] 表示添加一个为空的 categories
  return { categories: categories.length ? categories : [""] };
};


```

效果如下：

```yaml
---
date: 2025-03-03 00:45:16
title: 插件测试
permalink: /pages/eb8f2f
categories:
  - guide
  - vue
---
```



> 如果 `transform` 函数返回的 `frontmatter` 已经在文件存在（只比较 Key 是否相同，不比较 Value），则忽略生成。



### 4、 使用

::: code-group
```typescript[config.ts]
import vpThemeConfig from "./theme/config/index";

const vpConfig = vpThemeConfig({
    vitePlugins: {
        autoFrontmatterOption: {
            pattern: "**/*.md",
            globOptions: { ignore: ["utils", "index.md", "login.md"] }
        },
        catalogueOption:{
            path: "docs",
            ignoreList: ["login.md"]
        },
    }
});


export default defineConfig({
    extends: vpConfig,
    ...
 )}
```
:::



