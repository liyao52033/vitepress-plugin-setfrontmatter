import { normalizePath, Plugin } from "vite";
import { AutoFrontmatterOption } from "./types";
import { basename, join, relative, resolve } from "node:path";
import { glob } from "tinyglobby";
import matter from "gray-matter";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { formatDate } from "./util";
import picocolors from "picocolors";

export * from "./types";

export const log = (message: string, type = "yellow") => {
  console.log((picocolors as any)[type](message));
};

export function VitePluginVitePressAutoFrontmatter(
    option: AutoFrontmatterOption = {}
): Plugin {
  return {
    name: "vitepress-plugin-auto-frontmatter",
    async config(config: any) {
      let { pattern } = option;
      if (!pattern) return;

      const { globOptions } = option;
      const { srcDir } = config.vitepress;

      if (typeof pattern === "string") pattern = [pattern];
      // 基于文档源目录 srcDir 匹配
      pattern = pattern.map(p => normalizePath(join(srcDir, p)));

      const filePaths = await glob(pattern, {
        expandDirectories: false,
        ...globOptions,
        absolute: true,
        ignore: ["**/node_modules/**", "**/dist/**", ...(globOptions?.ignore || [])],
      });

      writeFrontmatterToFile(filePaths, option, srcDir);
    },
  };
}

/**
 * 自动生成 frontmatter 并写入到 markdown 文件
 *
 * @param filePaths 文件路径列表
 * @param option 插件配置项
 * @param srcDir vitepress 配置项的 srcDir
 */
const writeFrontmatterToFile = (filePaths: string[], option: AutoFrontmatterOption, srcDir: string) => {

  const { transform } = option;

  for (const filePath of filePaths) {
    if (!filePath.endsWith(".md")) continue;

    const fileContent = readFileSync(filePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);

    if (frontmatter.layout === "home") continue;
    if(frontmatter.article === false) continue;

    let tempFrontmatter = { ...frontmatter };
    let hasChange = false;

    const stat = statSync(filePath);

    const addInfo: Record<string, any> = {
      title: getMdFileTitle(basename(filePath)),
      date: stat.birthtime || stat.atime,
    };

    for (const [key, value] of Object.entries(addInfo)) {
      if (!(key in frontmatter)) {
        // 放到最前面
        tempFrontmatter = { [key]: value, ...tempFrontmatter };
        hasChange = true;
      }
    }

    const transformResult = transform?.(tempFrontmatter, getFileInfo(srcDir, filePath));
    // 如果 frontmatter 没有修改过，且 transform 不存在或者返回 undefined，则不需要修改文件
    if (!hasChange && !transformResult) continue;

    const finalFrontmatter = transformResult || tempFrontmatter;
    // 确保日期格式为 yyyy-MM-dd hh:mm:ss
    finalFrontmatter.date = formatDate(tempFrontmatter.date);

    // 如果源文件的 frontmatter 已经全部包含处理后的 frontmatter，则不需要修改
    if (Object.keys(finalFrontmatter).every(key => frontmatter[key])) continue;

    // 转换为 --- xxx --- 字符串
    const frontmatterStr = Object.keys(finalFrontmatter).length
        ? matter.stringify("", finalFrontmatter).replace(/'/g, "")
        : "";

    // 将修改后的内容写入文件
    writeFileSync(filePath, `${frontmatterStr}${content}`);

    log(`'${filePath}'成功写入 frontmatter`, "green");
  }
};


/**
 * 获取实际的文件名
 *
 * @param filename 文件名
 */
export const getMdFileTitle = (filename: string) => {
  let title = "";
  // 如果文件名带序号，如【1.xx.md】，则取 xx
  const fileNameArr = filename.split(".");

  if (fileNameArr.length === 2) title = fileNameArr[0];
  else {
    // 处理多个 . 如 01.guile.md 的情况
    const firstDotIndex = filename.indexOf(".");
    const lastDotIndex = filename.lastIndexOf(".");
    title = filename.substring(firstDotIndex + 1, lastDotIndex);
  }

  return title;
};

/**
 * 获取文件信息
 *
 * @param srcDir vitepress 配置项的 srcDir
 * @param filePath  文件路径
 */
export const getFileInfo = (srcDir: string, filePath: string) => {
  // 确保路径是绝对路径
  const workingDir = resolve(srcDir);
  const absoluteFilePath = resolve(filePath);
  // 计算相对路径
  const relativePath = relative(workingDir, absoluteFilePath).replace(/\\/g, "/");

  return { filePath, relativePath };
};

export default VitePluginVitePressAutoFrontmatter;