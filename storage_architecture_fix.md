# 存储架构加固方案

## 当前问题：空中楼阁架构
```
     应用层
       │
   VGL-S01 (混合卷组)
    ├────┬────┐
    │    │    │
  SSD  SSD  HDD  ← 问题所在！
  2T   2T   200G
```

## 正确架构应该是：
```
     应用层
       │
┌──────┴──────┐
│             │
SSD卷组      HDD卷组
(高性能)      (大容量)
│             │
关键应用      日志/备份
```

## 紧急分离步骤

### 1. 立即评估影响
```bash
# 检查哪些数据在HDD上
lvs -o +devices
# 找到xxx-D02对应的逻辑卷

# 检查性能影响
iostat -x 1 3 | grep -E "(Device|xxx-D02)"
```

### 2. 快速分离（最小影响）
```bash
# 方案A：如果数据不多，直接迁移
# 1. 找到HDD上的数据
find / -type f -exec df -h {} \; | grep xxx-D02

# 2. 快速迁移到SSD
rsync -av /path/to/hdd_data/ /path/to/ssd_backup/

# 3. 从卷组移除HDD
vgreduce VGL-S01 /dev/xxx-D02
pvremove /dev/xxx-D02
```

### 3. 如果无法立即分离
```bash
# 临时方案：明确标识性能差异
echo "# WARNING: Mixed storage performance" >> /etc/motd
echo "# HDD: /dev/xxx-D02 - Lower performance" >> /etc/motd

# 设置监控告警
cat > /root/check_mixed_storage.sh << 'EOF'
#!/bin/bash
# 监控HDD使用情况
HDD_USAGE=$(df -h | grep xxx-D02 | awk '{print $5}' | sed 's/%//')
if [ $HDD_USAGE -gt 50 ]; then
    echo "ALERT: HDD storage usage high: ${HDD_USAGE}%" | \
    mail -s "Storage Performance Warning" admin@company.com
fi
EOF
```

## 架构重构建议

### 短期方案（1-2天）
1. **数据分类**：区分关键/非关键数据
2. **快速迁移**：关键数据移回SSD
3. **监控加强**：实时性能监控

### 中期方案（1周内）
1. **申请SSD资源**：获得纯SSD存储
2. **完整迁移**：所有应用数据迁移到SSD
3. **清理HDD**：移除混合配置

### 长期方案（1个月内）
1. **标准化流程**：制定存储类型规范
2. **自动化检查**：防止类似问题
3. **架构文档**：记录存储架构

## 风险评估

### 当前风险等级：中等
- **数据安全**：无直接影响
- **性能影响**：可能影响响应速度
- **运维复杂**：混合管理困难

### 如果不处理的风险：
- **性能恶化**：随着数据增长，HDD成为瓶颈
- **故障扩散**：HDD故障影响整个应用
- **排查困难**：性能问题难以定位

## 立即行动清单

### 今天必须做：
- [ ] 确认HDD上存储的具体数据
- [ ] 与研发确认哪些是关键服务
- [ ] 设置性能监控告警
- [ ] 申请SSD资源

### 本周内完成：
- [ ] 关键数据迁移到SSD
- [ ] 移除HDD从生产卷组
- [ ] 更新架构文档
- [ ] 制定操作规范

## 预防措施

### 1. 存储类型检查脚本
```bash
#!/bin/bash
# 添加磁盘前的强制检查
check_disk_type() {
    local disk=$1
    local expected_type=$2  # "ssd" or "hdd"
    
    local rota=$(lsblk -d -o rota $disk | tail -1)
    local actual_type=$([ "$rota" = "1" ] && echo "hdd" || echo "ssd")
    
    if [ "$actual_type" != "$expected_type" ]; then
        echo "ERROR: Disk type mismatch!"
        echo "Expected: $expected_type, Actual: $actual_type"
        exit 1
    fi
}

# 使用示例
# check_disk_type /dev/vdb ssd
```

### 2. 操作审批流程
- 存储变更需要架构师审批
- 自动化脚本检查存储类型
- 变更记录和回滚计划

**记住：现在的"空中楼阁"必须尽快加固，否则迟早会出问题！**
