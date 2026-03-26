# SSH连接保持活跃设置

## 方法1：修改SSH客户端配置（推荐）

### Windows用户：
编辑 `C:\Users\你的用户名\.ssh\config` 文件（如果不存在则创建）

```
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### Linux/Mac用户：
编辑 `~/.ssh/config` 文件

```
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

参数说明：
- `ServerAliveInterval 60`：每60秒发送一个保持活跃的包
- `ServerAliveCountMax 3`：最多发送3次没有响应后断开连接

## 方法2：在SSH连接时添加参数

```bash
ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 user@hostname
```

## 方法3：修改服务器端SSH配置（需要root权限）

编辑服务器上的 `/etc/ssh/sshd_config` 文件：

```
ClientAliveInterval 60
ClientAliveCountMax 3
```

然后重启SSH服务：
```bash
sudo systemctl restart sshd
```

## 方法4：使用screen或tmux

连接后立即启动screen或tmux：
```bash
screen -S mysession
# 或者
tmux new -s mysession
```

即使SSH连接断开，您的会话仍然在服务器上运行，可以重新连接恢复。

## 方法5：在PuTTY中设置

1. 打开PuTTY
2. 在左侧菜单中选择 Connection
3. 设置 "Seconds between keepalives" 为 60
4. 保存会话设置

## 快速测试

设置完成后，重新连接SSH，长时间不操作也不会断开连接了。
