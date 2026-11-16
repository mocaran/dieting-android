# Dieting

## Android 单机版 v1.2

Dieting 单机版是一款离线的个人健康与日常记账应用。可记录饮食、热量、步行和跑步、体重及收支，并查看趋势。打开即可使用，记录保存在本机。支持 JSON 备份与恢复，也可导出 CSV。

在 Android 7.0 或更新版本上安装 `Dieting-1.2-offline.apk`。单机版可与旧版同时安装。要迁移旧记录，请先导出完整 JSON 备份，再在单机版的「设置 → 备份与数据」中导入。

### 构建 Android

使用 Node.js 22.12+、JDK 21 和 Android SDK 36。在项目根目录运行：

```powershell
npm ci
npm run android:sync
Set-Location android
.\gradlew.bat assembleRelease
```

未签名 APK 位于 `android/app/build/outputs/apk/release/app-release-unsigned.apk`。分发前使用发布密钥签名，后续更新须使用同一把密钥。

## 网页版

个人健康与财务记录应用。公开网站位于 https://dieting-personal-tracker-2026.thinmerit.chatgpt.site 。正式版使用用户名和密码登录，记录按账号隔离并同步到云端；不绑定邮箱或手机号。首次打开不会写入示例记录或个人资料。

## 本地运行

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

在终端显示的本地地址打开应用。生产构建与测试：

```bash
npm test
npm run build
npm run dev -- --host
```

账号密码允许使用纯数字，注册至少 4 位。如果账号尚未注册，请先在登录页切换到“注册”创建账号。目前忘记密码无法自动找回账号。

## 计算约定

- 日期使用设备本地日历日，按 `YYYY-MM-DD` 存储。
- 金额以整数分存储；预留金额仅从可支配余额扣除。
- 饮食未标记“记录完成”时，总消耗和热量差值属于暂估，不纳入完整日累计。
- 体重取当日或之前最近一次称重，随后取用户填写的基础体重，不使用未来称重。
- 模型参数修改后，历史估算使用当前参数重新计算。参数版本和修改时间保存在本地。


## 技术栈

React + TypeScript + Vite；本地数据用 Dexie（IndexedDB，共 7 个表：`days` / `foods` / `weights` / `calc` / `transactions` / `finance` / `user`）；用 Capacitor 打包成 Android 单机版（清单里没有任何权限，包括 `INTERNET`）。

## 源码结构

| 路径 | 说明 |
| --- | --- |
| `src/` | 应用源码（React：首页 / 热量 / 财务 / 趋势 / 设置） |
| `assets/` `public/` | 静态资源与图标 |
| `android/` | Capacitor 生成的 Android 工程（`com.dieting.offline`） |
| `scripts/` | 构建脚本 |

## License

本项目以 [MIT](LICENSE) 许可发布。
