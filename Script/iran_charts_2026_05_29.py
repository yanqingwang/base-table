#!/usr/bin/env python3
"""
生成 Iran Analyze 项目 2026-05-29 更新版可视化图表
数据来源：最新研究报告
输出：/home/wang/wk/AIReports/Charts/ 下的 PNG 文件，分辨率 300 DPI
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

CHART_DIR = "/home/wang/wk/AIReports/Charts/"

def ensure_directories():
    os.makedirs(CHART_DIR, exist_ok=True)

def save_chart(fig, filename):
    path = os.path.join(CHART_DIR, filename)
    fig.savefig(path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved: {path}")
    return path


def chart_media_stance_evolution():
    """Chart 1: 媒体立场演变（多阶段对比）"""
    regions = ['Chinese', 'US', 'French', 'German', 'Spanish', 'UK', 'Arabic', 'Russian', 'Israeli']
    # 立场分数: -2(强烈反对) ~ +2(强烈支持), 从伊朗视角
    phase1 = [1, 0, 0, 0, -1, 0, -1, 1, -1]        # Feb-Mar
    phase2 = [1, 0, 0, 0, -1, 0, -1, 1, -1]        # Apr
    phase3 = [1, -1, -1, 0, -1, 0, -1, 1, -1.5]    # May 1-14
    phase4 = [1, 0, -1, -0.5, -1, 0, -1, 1, -1.5]  # May 15-29 (US swings to 0 due to tentative deal)

    x = np.arange(len(regions))
    width = 0.2

    fig, ax = plt.subplots(figsize=(12, 5.5))
    ax.bar(x - 1.5*width, phase1, width, label='Phase 1 (Feb-Mar)', color='#a6cee3')
    ax.bar(x - 0.5*width, phase2, width, label='Phase 2 (Apr)', color='#1f78b4')
    ax.bar(x + 0.5*width, phase3, width, label='Phase 3 (May 1-14)', color='#b2df8a')
    ax.bar(x + 1.5*width, phase4, width, label='Phase 4 (May 15-29)', color='#33a02c')

    ax.set_ylabel('Stance Code (-2 to +2)', fontsize=12)
    ax.set_title('Global Media Stance Evolution from Iran\'s Perspective\n(Updated May 29, 2026)', fontsize=14)
    ax.set_xticks(x)
    ax.set_xticklabels(regions, fontsize=10)
    ax.set_yticks([-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2])
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax.legend(loc='lower right')
    fig.tight_layout()
    return fig


def chart_public_support_trends():
    """Chart 2: 美国公众支持率趋势 + 全球关键指标"""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # Left: US net approval over time
    dates = ['Mar 1', 'Mar 15', 'Apr 1', 'Apr 15', 'May 1', 'May 14', 'May 29']
    net_approval = [-9, -12, -15, -16, -18, -18, -22.8]

    axes[0].plot(dates, net_approval, marker='o', color='#e31a1c', linewidth=2, markersize=8)
    axes[0].axhline(y=0, color='black', linestyle='--', linewidth=0.5)
    axes[0].fill_between(range(len(dates)), net_approval, 0, alpha=0.2, color='#e31a1c')
    axes[0].set_ylabel('Net Approval (%)', fontsize=11)
    axes[0].set_title('US Public Net Approval of Iran War\n(Silver Bulletin)', fontsize=12)
    axes[0].set_ylim(-30, 5)
    axes[0].grid(True, linestyle='--', alpha=0.4)
    for i, v in enumerate(net_approval):
        axes[0].annotate(f'{v}%', (i, v), textcoords="offset points", xytext=(0, 10), ha='center', fontsize=9)

    # Right: Global key indicators
    indicators = ['Avoid\nInvolvement', 'Blame\nUS/Israel', 'US Positive\nImpact', 'China Positive\nImpact', 'Costs Not\nWorth It']
    values = [81, 80, 39, 50, 70]
    colors = ['#1f78b4', '#1f78b4', '#e31a1c', '#33a02c', '#ff7f00']

    bars = axes[1].bar(indicators, values, color=colors, alpha=0.85)
    axes[1].set_ylim(0, 100)
    axes[1].set_ylabel('Percentage (%)', fontsize=11)
    axes[1].set_title('Global Public Opinion Key Indicators\n(Latest Surveys)', fontsize=12)
    axes[1].grid(True, linestyle='--', alpha=0.4, axis='y')
    for bar, v in zip(bars, values):
        axes[1].text(bar.get_x() + bar.get_width()/2, v + 2, f'{v}%', ha='center', fontsize=10)

    fig.tight_layout()
    return fig


def chart_oil_price_trajectory():
    """Chart 3: 油价走势 + 关键事件标注"""
    dates = ['Jan', 'Feb 27', 'Mar 2', 'Mar 15', 'Apr 8', 'May 1', 'May 13', 'May 29']
    prices = [61, 71, 77, 120, 100, 112, 107, 100]
    events = ['', 'Pre-war', 'War begins', 'Panic peak', 'Ceasefire', 'Talks stall', '$107 high', 'Deal hope']

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(dates, prices, marker='o', color='#ff7f00', linewidth=2.5, markersize=8)
    ax.fill_between(range(len(dates)), prices, 60, alpha=0.15, color='#ff7f00')

    for i, (d, p, e) in enumerate(zip(dates, prices, events)):
        if e:
            ax.annotate(e, (i, p), textcoords="offset points", xytext=(0, 12), ha='center', fontsize=9)

    ax.set_ylabel('Brent Crude ($/bbl)', fontsize=12)
    ax.set_title('Oil Price Trajectory & Key Events\n(Updated May 29, 2026)', fontsize=14)
    ax.set_ylim(50, 130)
    ax.grid(True, linestyle='--', alpha=0.4)
    ax.axhline(y=61, color='green', linestyle='--', linewidth=0.8, alpha=0.7, label='Pre-war baseline ($61)')
    ax.legend(loc='upper left')
    fig.tight_layout()
    return fig


def chart_geopolitical_scenarios():
    """Chart 4: 地缘政治情景概率（饼图）"""
    fig, ax = plt.subplots(figsize=(8, 6))
    labels = ['Minimal Implementation\n(45%)', 'Negotiation Collapse\n(30%)', 'Phased Breakthrough\n(20%)', 'Black Swan\n(5%)']
    sizes = [45, 30, 20, 5]
    colors = ['#a6cee3', '#fb9a99', '#b2df8a', '#fdbf6f']
    explode = (0.03, 0.03, 0.03, 0.03)

    wedges, texts, autotexts = ax.pie(sizes, explode=explode, labels=labels, colors=colors,
                                       autopct='%1.0f%%', shadow=False, startangle=90,
                                       textprops={'fontsize': 11})
    ax.set_title('Iran Conflict Scenario Probabilities\n(May 29, 2026 Assessment)', fontsize=14)
    fig.tight_layout()
    return fig


def chart_attitude_shift_matrix():
    """Chart 5: 全球态度变化矩阵（从伊朗视角）"""
    fig, ax = plt.subplots(figsize=(10, 6))

    countries = ['China', 'Russia', 'Pakistan', 'Turkey', 'Europe\n(FR/ES)', 'Europe\n(DE/UK)', 'Arab\n(Gulf)', 'US', 'Israel']
    # 支持度变化: +100(完全支持) ~ -100(完全反对)
    pre_feb28 = [60, 50, 40, 30, -10, -10, -20, -60, -80]
    post_may29 = [75, 60, 65, 35, -30, -15, -30, -25, -90]

    x = np.arange(len(countries))
    width = 0.35

    bars1 = ax.bar(x - width/2, pre_feb28, width, label='Pre-Feb 28 (Baseline)', color='#cab2d6')
    bars2 = ax.bar(x + width/2, post_may29, width, label='Post-May 29 (Current)', color='#6a3d9a')

    ax.set_ylabel('Support Index (-100 to +100)', fontsize=12)
    ax.set_title('Global Attitude Shift Toward Iran\n(From Iran\'s Perspective)', fontsize=14)
    ax.set_xticks(x)
    ax.set_xticklabels(countries, fontsize=10)
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax.legend()
    ax.grid(True, linestyle='--', alpha=0.3, axis='y')
    fig.tight_layout()
    return fig


def chart_conflict_timeline():
    """Chart 6: 冲突时间线（水平条形图）"""
    fig, ax = plt.subplots(figsize=(10, 7))

    events = [
        ('Feb 28', 'US-Israel launch strikes\nKhamenei killed'),
        ('Mar 1', 'Iran closes Strait of Hormuz\nGlobal oil shock'),
        ('Mar 25', 'US anti-war sentiment peaks\nPew: 59% say wrong'),
        ('Apr 8', 'Ceasefire via Pakistan'),
        ('Apr 19', 'Truce extended\nChina blocks UN resolution'),
        ('May 6', 'Iran FM visits Beijing'),
        ('May 14', 'Trump-Xi Beijing summit\nMinimal Iran consensus'),
        ('May 25', 'US "self-defense" strikes\nIran accused of mining'),
        ('May 28', 'Tentative agreement reached\nBut same-day clashes'),
        ('May 29', 'Trump unsigned\nOil drops on deal hope'),
    ]

    y_pos = np.arange(len(events))
    colors = ['#e31a1c']*3 + ['#ff7f00']*2 + ['#1f78b4']*2 + ['#e31a1c'] + ['#33a02c'] + ['#ff7f00']

    ax.barh(y_pos, [1]*len(events), color=colors, alpha=0.7, height=0.6)
    for i, (date, desc) in enumerate(events):
        ax.text(0.02, i, f'{date}: {desc}', va='center', fontsize=9.5)

    ax.set_yticks([])
    ax.set_xticks([])
    ax.set_xlim(0, 1)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.set_title('Iran Conflict Timeline 2026\n(Key Events Feb 28 – May 29)', fontsize=14)
    fig.tight_layout()
    return fig


def main():
    ensure_directories()

    print("Generating Iran Analyze charts (May 29, 2026 update)...")

    fig1 = chart_media_stance_evolution()
    save_chart(fig1, 'iran_media_stance_evolution_2026_05_29.png')

    fig2 = chart_public_support_trends()
    save_chart(fig2, 'iran_public_support_trends_2026_05_29.png')

    fig3 = chart_oil_price_trajectory()
    save_chart(fig3, 'iran_oil_price_trajectory_2026_05_29.png')

    fig4 = chart_geopolitical_scenarios()
    save_chart(fig4, 'iran_geopolitical_scenarios_2026_05_29.png')

    fig5 = chart_attitude_shift_matrix()
    save_chart(fig5, 'iran_attitude_shift_matrix_2026_05_29.png')

    fig6 = chart_conflict_timeline()
    save_chart(fig6, 'iran_conflict_timeline_2026_05_29.png')

    print(f"\nAll charts saved to: {CHART_DIR}")


if __name__ == '__main__':
    main()
