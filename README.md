# 📣 koishi-plugin-echo-cave

[![npm](https://img.shields.io/npm/v/koishi-plugin-echo-cave?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-echo-cave)
[![downloads](https://img.shields.io/npm/dm/koishi-plugin-echo-cave?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-echo-cave)
[![license](https://img.shields.io/github/license/pynickle/koishi-plugin-echo-cave?style=flat-square)](LICENSE)

## 🌌 插件简介

**koishi-plugin-echo-cave** 是一个为 Koishi 机器人框架设计的群聊消息存储与回溯插件。它能够将群聊中的消息（包括普通消息和转发消息）存储到"回声洞"中，并支持随时随机或指定 ID 调取这些消息，为群聊增添更多互动乐趣和记录功能。

## ✨ 功能特性

- 📥 **消息存储**：支持存储普通消息和转发消息到数据库
- 🖼️ **图片保存**：自动保存消息中的图片资源到本地
- 🔍 **消息查询**：支持随机获取消息或通过 ID 精确查找
- 🗑️ **消息管理**：支持删除特定 ID 的消息（消息存储者、原始发送者或管理员）
- 📊 **数据持久化**：使用 Koishi 数据库系统，确保数据不会丢失
- 👤 **个人追踪**：支持查看自己投稿的消息列表
- 🔍 **发言回溯**：支持查看自己被他人投稿的消息列表
- 🎨 **精美展示**：消息展示时自带多种风格的外部包裹信息，显示消息详情

## 📋 命令列表

| 命令               | 说明              | 权限要求            |
|------------------|-----------------|-----------------|
| `cave`           | 随机获取一条回声洞消息     | 所有人             |
| `cave <id>`      | 获取特定 ID 的回声洞消息  | 所有人             |
| `cave.echo`      | 将引用的消息存入回声洞     | 所有人             |
| `cave.wipe <id>` | 删除特定 ID 的回声洞消息  | 消息存储者、原始发送者或管理员 |
| `cave.listen`    | 获取自己投稿的回声洞列表    | 所有人             |
| `cave.trace`     | 获取自己发言被投稿的回声洞列表 | 所有人             |

## 🚀 使用指南

### 1. 安装插件

```bash
npm install koishi-plugin-echo-cave
```

或在插件商城中搜索 `koishi-plugin-echo-cave` 进行安装。

### 2. 基本使用

1. **存储消息**：在群聊中引用一条消息，然后发送命令 `cave.echo`
2. **查看随机消息**：发送命令 `cave` 获取一条随机消息
3. **查看特定消息**：发送命令 `cave <id>` 查看指定 ID 的消息
4. **删除消息**：消息存储者、原始发送者或管理员发送命令 `cave.wipe <id>` 删除指定 ID 的消息
5. **查看自己的投稿**：发送命令 `cave.listen` 查看自己曾经存入的所有回声洞消息
6. **查看自己的发言**：发送命令 `cave.trace` 查看自己曾经被他人存入的回声洞消息

## 📁 文件结构

```
src/
├── index.ts              # 插件主入口，命令注册和核心功能
├── forward-helper.ts     # 转发消息处理辅助函数
├── image-helper.ts       # 图片保存辅助函数
├── msg-helper.ts         # 消息发送辅助函数，包含多种风格的外部包裹信息模板
├── cqcode-helper.ts      # CQ 码处理辅助函数
└── onebot-helper.ts      # OneBot 适配器辅助函数
```

## 🔧 技术说明

- 插件使用 Koishi 数据库系统存储消息记录
- 图片会保存在 `data/cave/images` 目录下
- 支持嵌套转发消息的处理
- 自动检测重复消息，避免存储重复内容

## 📝 注意事项

- 插件只能在群聊中使用，私聊模式下无法正常工作
- 使用 `cave.echo` 命令前必须先引用一条消息
- 删除消息需要消息存储者、原始发送者或管理员权限（权限等级 4）
- 存储的转发消息会保留原始发送者信息
- 消息展示时会自动添加精美的外部包裹信息，包括消息 ID、创建时间、原始发送者和投递者信息
- 外部包裹信息有多种随机风格，为每次消息展示带来不同的视觉体验

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request 来帮助改进这个插件！

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件
