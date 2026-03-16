# VS Code Marketplace 发布完整指南

---

## 第一步：创建 Azure DevOps Organization

你现在卡在这一步，因为需要一个 Azure subscription。

1. 点页面上的 **"Get started with Azure"** 蓝色按钮
2. 注册 Azure 免费账号（Free tier，不需要付费，但可能要绑信用卡做验证）
3. 创建完成后回到 `https://dev.azure.com` 重新创建 organization：
   - Organization name: `ultrawaver`
   - Region: `Asia Pacific`
   - 验证码填对，点 Continue

> 如果绑卡麻烦，可以试试直接访问 `https://aex.dev.azure.com/signup`，有时候可以跳过 billing 创建免费 org。

---

## 第二步：创建 Personal Access Token (PAT)

Organization 创建成功后，你会进入 `dev.azure.com/ultrawaver`：

1. 点右上角 **头像图标**（不是名字，是圆形头像）
2. 下拉菜单选 **"Personal access tokens"**
3. 点 **"+ New Token"**
4. 填写：

| 字段 | 填写内容 |
|------|---------|
| **Name** | `vsce` |
| **Organization** | `All accessible organizations` |
| **Expiration** | `365 days`（或 Custom 选更长） |
| **Scopes** | 点最下面 **"Show all scopes"** → 找到 **Marketplace** → 勾选 **Manage** |

5. 点 **Create**
6. **立刻复制 token**（只显示一次！）

---

## 第三步：创建 Marketplace Publisher

打开 https://marketplace.visualstudio.com/manage/createpublisher

### Basic information
| 字段 | 填写内容 |
|------|---------|
| **Name** | `ultrawaver` |
| **ID** | `ultrawaver` |

### Verified domain
跳过不填。

### About you
| 字段 | 填写内容 |
|------|---------|
| **Description** | `Independent developer building productivity tools for VS Code. Focused on solving everyday pain points that slow down developers.` |
| **Logo** | 拖入图片（路径见下方） |
| **Company website** | `https://github.com/ultrawaver` |
| **Support** | `https://github.com/ultrawaver/json-string-viewer/issues` |
| **LinkedIn** | 留空 |
| **Source code repository** | `https://github.com/ultrawaver` |
| **Twitter** | 留空 |

点 **Create**。

### Logo 图片路径
```
/Users/birji/Documents/json-string-viewer/icon.png
```
128x128 PNG，直接拖进 Logo 上传区域。

---

## 第四步：发布扩展

打开终端执行：

```bash
cd ~/Documents/json-string-viewer
npx vsce login ultrawaver
# 提示输入 PAT 时，粘贴第二步复制的 token

npx vsce publish
# 发布成功后会显示 Marketplace URL
```

发布后几分钟内就能在 VS Code Marketplace 搜到：
https://marketplace.visualstudio.com/items?itemName=ultrawaver.json-string-viewer
