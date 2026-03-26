#!/usr/bin/env python3
"""
分析 /god 目录中的符号链接结构
"""

import os
import sys

def analyze_directory_structure():
    """分析目录结构并显示符号链接信息"""
    
    # 模拟的 /god 目录结构（基于您的 ls -l 输出）
    god_structure = {
        'bin': '/GODOTH/bin',
        'catTrack': '/DOCKEY',
        'CHIRP_DF': '/GODOTH/CHIRP_DF',
        'click-report': '/GODOTH/click-report',
        'converted': '/god/publisher/converted',
        'data': '/GODOTH/data',
        'dockey': '/GODOTH/dockey',
        'done': '/GODOTH/done',
        'enterprise': '/GODENT/enterprise',
        'images': '/FSIMAGE/ss/oldimages',
        'images.300dpi.a4jpg': '/FSIMAGE/jpgimage/images.300dpi.a4jpg',
        'images.300dpi.jpg': '/FSIMAGE/jpgimage/images.300dpi.jpg',
        'images.a4jpg': '/FSIMAGE/jpgimage/images.a4jpg',
        'images.adthumbnail': '/FSIMAGE/images.adthumbnail',
        'images.cover': '/FSIMAGE/images.cover',
        'images.customjpg': '/FSIMAGE/images.customjpg',
        'images.fullpage': '/FSIMAGE/images.fullpage',
        'images.jpg': '/FSIMAGE/jpgimage/images.jpg',
        'images.jpg-coors': '/images.jpg-coors',
        'images.recrop': '/FSIMAGE/images.recrop',
        'images.recrop2': '/FSIMAGE/images.recrop2',
        'images.snapshot': '/FSIMAGE/images.snapshot',
        'images.stat': '/FSIMAGE/images.stat',
        'images.thumbnail': '/FSIMAGE/images.thumbnail',
        'inf': '/god/raw/dtp/inf',
        'info': '/GODOTH/info',
        'ipoc': '/GODOTH/ipoc',
        'java-version': '/GODOTH/java-version',
        'log': '/GODOTH/log',
        'multihost': '/god/catTrack/product/wisenews.fin/program/multihost',
        'nas': '/GODOTH/nas',
        'news': '/god/publisher/news',
        'oper': '/god/publisher/converted/operator',
        'operator': '/GODOTH/operator',
        'pageEdit': '/god/ipoc/ProfileTools/cgi/publisher/pageEditor/data',
        'perl_lib': '/GODOTH/perl_lib',
        'perl_lib.sina': '/GODOTH/perl_lib.sina',
        'program': '/god/publisher/program',
        'publisher': '/GODOTH/publisher',
        'raw': '/GODOTH/raw',
        'raw-html': '/god/raw/dtp/html',
        'raw-txt': '/god/raw/dtp/txt',
        'searchlog': '/GODOTH/searchlog',
        'slave': '/SLAVE.fsslave/slave',
        'slave2': '/SLAVE.fsslave/slave2',
        'tmp': '/GODOTH/tmp',
        'tts_mp3': '/tts_mp3',
        'util': '/GODOTH/util',
        'wisecache': '/GODOTH/wisecache',
        'wisecat': '/god/catTrack/product/wisenews.fin/bin',
        'wisecat.linux': '/god/catTrack/product/wisecat.linux/bin',
        'wisecore': '/GODOTH/wisecore',
        'wisefeed': '/GODOTH/wisefeed',
        'wise_lib.perl': '/GODOTH/wise_lib.perl',
        'wisers.db': '/GODWDB/wisers.db',
        'WiseTxtProcess_backup': '/GODOTH/WiseTxtProcess_backup'
    }
    
    print("=== /god 目录符号链接分析 ===\n")
    
    # 统计不同类型的链接目标
    target_prefixes = {}
    broken_links = []
    
    for link_name, target_path in god_structure.items():
        # 提取目标路径的前缀
        if target_path.startswith('/GODOTH/'):
            prefix = '/GODOTH/'
        elif target_path.startswith('/FSIMAGE/'):
            prefix = '/FSIMAGE/'
        elif target_path.startswith('/god/'):
            prefix = '/god/'
        elif target_path.startswith('/SLAVE.fsslave/'):
            prefix = '/SLAVE.fsslave/'
        elif target_path.startswith('/GODENT/'):
            prefix = '/GODENT/'
        elif target_path.startswith('/GODWDB/'):
            prefix = '/GODWDB/'
        elif target_path.startswith('/tts_mp3'):
            prefix = '/tts_mp3'
        else:
            prefix = 'OTHER'
        
        target_prefixes[prefix] = target_prefixes.get(prefix, 0) + 1
        
        # 检查可能是损坏的链接（指向相对路径）
        if not target_path.startswith('/'):
            broken_links.append((link_name, target_path))
    
    print("符号链接目标路径统计：")
    for prefix, count in sorted(target_prefixes.items()):
        print(f"  {prefix}: {count} 个链接")
    
    print(f"\n总链接数: {len(god_structure)}")
    
    if broken_links:
        print(f"\n可能损坏的链接: {len(broken_links)}")
        for link, target in broken_links:
            print(f"  {link} -> {target}")
    
    print("\n=== 问题分析 ===")
    print("1. 大部分链接指向 /GODOTH/ 目录")
    print("2. 多个链接指向 /FSIMAGE/ 目录（图片相关）")
    print("3. 一些链接指向 /god/ 内部的其他目录")
    print("4. 链接指向的路径在新系统上可能不存在")
    
    print("\n=== 解决方案建议 ===")
    print("1. 创建对应的目录结构")
    print("2. 将符号链接转换为实际目录")
    print("3. 或者复制链接目标的内容而不是链接本身")

if __name__ == "__main__":
    analyze_directory_structure()
