# 企业级VM监控和日志收集架构

## 常见技术组合

### Graylog日志收集方案
```
VMs → Filebeat/Logstash → Graylog Cluster → Dashboard
```

**组件说明：**
- **Filebeat**: 轻量级日志收集agent（每台VM安装）
- **Logstash**: 日志处理和转发（可选）
- **Graylog**: 日志存储、分析和展示
- **Graylog Sidecar**: 管理多个collector的agent

### ITServicePlus工单系统集成
```
VMs → Monitoring Agent → Message Queue → ITServicePlus API
```

**可能的数据源：**
- Zabbix/Nagios监控数据
- 自定义健康检查脚本
- 系统性能指标
- 应用状态监控

## 典型部署架构

### 方案1：ELK Stack + Graylog
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    VM-1     │    │    VM-2     │    │    VM-N     │
│  Filebeat   │    │  Filebeat   │    │  Filebeat   │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
              ┌─────────────┐
              │  Logstash   │
              │  (Collector) │
              └─────┬───────┘
                    │
          ┌─────────────┐
          │   Graylog   │
          │   Cluster   │
          └─────┬───────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│Dashboard│ │Alerts │ │API    │
└───────┘   └───────┘   └───────┘
```

### 方案2：Agent + Message Queue
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    VM-1     │    │    VM-2     │    │    VM-N     │
│Custom Agent │    │Custom Agent │    │Custom Agent │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
              ┌─────────────┐
              │Message Queue│
              │(Kafka/RabbitMQ)│
              └─────┬───────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Graylog   │ │ITServicePlus│ │Other Systems│
│ Receiver  │ │  Receiver  │ │  Receiver  │
└───────────┘ └───────────┘ └───────────┘
```

## 数据同步方式

### 1. 推送模式（Push）
- Agent主动推送数据到中心系统
- 实时性好，网络压力可控
- 适合日志、指标数据

### 2. 拉取模式（Pull）
- 中心系统定期从VM拉取数据
- 统一管理，但实时性差
- 适合状态检查、配置信息

### 3. 流式模式（Streaming）
- 建立持久连接，实时流式传输
- 延迟最低，但资源消耗大
- 适合关键业务监控

## 企业级考虑因素

### 可扩展性
- 水平扩展Collector集群
- 分层缓存和负载均衡
- 数据分片和分区策略

### 可靠性
- 多副本部署
- 故障转移机制
- 数据重传和补偿

### 安全性
- TLS加密传输
- 身份认证和授权
- 网络隔离和防火墙

### 性能优化
- 批量处理
- 压缩传输
- 本地缓存

## 典型配置示例

### Filebeat配置
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/*.log
  fields:
    service: itserviceplus
    environment: production

output.graylog:
  hosts: ["graylog.company.com:12201"]
```

### 自定义Agent示例
```python
import requests
import json
import time

def send_to_itserviceplus(data):
    url = "https://itserviceplus.company.com/api/events"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=data, headers=headers)
    return response.status_code

# 定期收集和发送数据
while True:
    system_info = collect_system_metrics()
    send_to_itserviceplus(system_info)
    time.sleep(60)
```

## 部署建议

### 小规模（<100台VM）
- 直接在每台VM安装agent
- 单一collector节点
- 简单配置管理

### 中规模（100-1000台VM）
- 使用配置管理工具（Ansible/Puppet）
- 多collector负载均衡
- 基础监控和告警

### 大规模（>1000台VM）
- 自动化部署和管理
- 分布式collector集群
- 完整的监控、告警、自愈体系
