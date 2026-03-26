# 紧急存储问题处理方案

## 问题分析
您遇到的是**混合存储介质问题**：
- 原始VGL-S01：2T SSD（高性能）
- 新增xxx-D02：200G HDD（性能较低）
- 研发已在新空间部署应用

## 立即检查当前状态

### 1. 确认存储类型
```bash
# 查看磁盘详细信息
lsblk -d -o name,rota,type,size,model
# rota=1 表示HDD，rota=0 表示SSD

# 查看LVM物理卷
pvs
pvdisplay

# 查看逻辑卷详细信息
lvs
lvdisplay
```

### 2. 检查性能影响
```bash
# 查看当前I/O状态
iostat -x 1 5

# 查看磁盘使用情况
df -h
lvs
```

## 紧急处理方案

### 方案1：数据迁移（推荐）
```bash
# 1. 申请新的SSD空间（200G或更大）
# 2. 创建新的物理卷
pvcreate /dev/vdb

# 3. 将数据迁移到新SSD
# 先迁移数据到临时位置
mkdir /tmp/migration
cp -a /path/to/app/data/* /tmp/migration/

# 4. 从HDD移除LVM
vgreduce VGL-S01 /dev/xxx-D02
pvremove /dev/xxx-D02

# 5. 添加新SSD到卷组
vgextend VGL-S01 /dev/new-ssd

# 6. 扩展逻辑卷
lvextend -L +200G /dev/VGL-S01/data_lv
xfs_growfs /dev/VGL-S01/data_lv

# 7. 迁移数据回来
cp -a /tmp/migration/* /path/to/app/data/
```

### 方案2：分层存储（如果无法立即获得SSD）
```bash
# 1. 将关键应用移回SSD
# 2. 非关键数据保留在HDD
# 3. 监控性能指标

# 创建专用目录用于HDD存储
mkdir /data/hdd_storage
mount /dev/xxx-D02 /data/hdd_storage

# 将日志、备份等移到HDD
mv /var/log/* /data/hdd_storage/logs/
ln -s /data/hdd_storage/logs/* /var/log/
```

## 风险缓解措施

### 1. 立即备份
```bash
# 备份关键数据
tar -czf /backup/app_data_$(date +%Y%m%d).tar.gz /path/to/app/data

# 创建LVM快照
lvcreate -L 10G -s -n app_snapshot /dev/VGL-S01/data_lv
```

### 2. 性能监控
```bash
# 设置监控脚本
cat > /root/monitor_storage.sh << 'EOF'
#!/bin/bash
while true; do
    echo "$(date): Disk I/O stats"
    iostat -x 1 1 | grep -E "(Device|xxx-D02|VGL-S01)"
    sleep 300
done
EOF

chmod +x /root/monitor_storage.sh
nohup /root/monitor_storage.sh > /tmp/storage_monitor.log 2>&1 &
```

### 3. 告警设置
```bash
# 设置磁盘使用率告警
cat > /root/disk_alert.sh << 'EOF'
#!/bin/bash
USAGE=$(df /path/to/app | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is ${USAGE}%" | mail -s "Disk Alert" admin@company.com
fi
EOF
```

## 沟通建议

### 1. 立即汇报
```
主题：紧急存储问题处理报告

内容：
- 问题：误将HDD存储添加到SSD卷组
- 影响：可能影响应用性能
- 已采取措施：性能监控、数据备份
- 计划：申请SSD资源进行数据迁移
- 风险评估：当前稳定，需尽快处理
```

### 2. 与研发沟通
```
说明情况：
- 新增存储为HDD，非SSD
- 建议将关键服务移回SSD
- 非关键数据可暂留HDD
- 需要配合进行数据迁移测试
```

## 预防措施

### 1. 操作流程改进
```bash
# 创建磁盘类型检查脚本
cat > /root/check_disk_type.sh << 'EOF'
#!/bin/bash
DISK=$1
if [ -z "$DISK" ]; then
    echo "Usage: $0 <disk_device>"
    exit 1
fi

ROTATE=$(lsblk -d -o rota $DISK | tail -1)
if [ "$ROTATE" = "1" ]; then
    echo "WARNING: $DISK is HDD (rotational)"
    echo "SSD expected for performance-critical operations"
else
    echo "OK: $DISK is SSD (non-rotational)"
fi
EOF

chmod +x /root/check_disk_type.sh
```

### 2. 标准化操作流程
1. 添加磁盘前检查类型
2. 确认存储需求（性能vs容量）
3. 记录变更操作
4. 测试性能影响

## 紧急联系方式
- 存储团队：申请SSD资源
- 研发团队：协调应用迁移时间
- 运维团队：协助数据迁移
- 管理层：汇报风险和计划

**记住：立即行动，但不要慌张。当前系统稳定，关键是快速有序地解决问题。**
