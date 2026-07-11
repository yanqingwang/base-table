#!/usr/bin/env python3
"""
Iran Analyze charts — June 1, 2026 update
Covers May 29 – June 1 developments
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
    """
    Media stance evolution across 5 phases (now includes May 29-Jun 1)
    From Iran's perspective: -2(strongly oppose) to +2(strongly support)
    """
    regions = ['Chinese', 'US', 'French', 'German', 'Spanish', 'UK', 'Arabic', 'Russian', 'Israeli']

    # Phase labels
    phase1 = [1,   0,   0,   0,   -1,  0,   -1,   1,   -1.0]  # Feb-Mar
    phase2 = [1,   0,   0,   0,   -1,  0,   -1,   1,   -1.0]  # Apr
    phase3 = [1,  -1,  -1,   0,   -1,  0,   -1,   1,   -1.5]  # May 1-14
    phase4 = [1,   0,  -1,  -0.5, -1,  0,   -1,   1,   -1.5]  # May 15-29
    phase5 = [0.5, -0.5, -1, -1,  -1, -0.5, -1,   1,   -1.5]  # May 29-Jun 1 (NEW: Chinese cool, US/German/UK slide)

    x = np.arange(len(regions))
    width = 0.15

    fig, ax = plt.subplots(figsize=(13, 5.5))
    colors = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#e31a1c']
    labels = ['Phase 1 (Feb-Mar)', 'Phase 2 (Apr)', 'Phase 3 (May 1-14)',
              'Phase 4 (May 15-29)', 'Phase 5 (May 29-Jun 1)']

    offsets = [-2*width, -1*width, 0, 1*width, 2*width]
    data = [phase1, phase2, phase3, phase4, phase5]

    for off, d, c, label in zip(offsets, data, colors, labels):
        ax.bar(x + off, d, width, label=label, color=c, alpha=0.85)

    ax.set_ylabel('Stance Code (-2 to +2)', fontsize=11)
    ax.set_title('Global Media Stance Evolution — From Iran\'s Perspective\n(Updated June 1, 2026)', fontsize=13)
    ax.set_xticks(x)
    ax.set_xticklabels(regions, fontsize=10)
    ax.set_yticks([-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2])
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax.legend(loc='lower right', fontsize=8)
    fig.tight_layout()
    return fig


def chart_public_support_trends():
    """US public support trend + global indicators"""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # Left: US net approval trajectory
    dates = ['Mar 1', 'Mar 15', 'Apr 1', 'Apr 15', 'May 1', 'May 14', 'May 29', 'Jun 1']
    net_approval = [-9, -12, -15, -16, -18, -18, -22.8, -23.0]

    axes[0].plot(dates, net_approval, marker='o', color='#e31a1c', linewidth=2, markersize=7)
    axes[0].axhline(y=0, color='black', linestyle='--', linewidth=0.5)
    axes[0].fill_between(range(len(dates)), net_approval, 0, alpha=0.2, color='#e31a1c')
    axes[0].set_ylabel('Net Approval (%)', fontsize=11)
    axes[0].set_title('US Net Approval of Iran War\n(Silver Bulletin)', fontsize=12)
    axes[0].set_ylim(-30, 5)
    axes[0].grid(True, linestyle='--', alpha=0.4)
    for i, v in enumerate(net_approval):
        axes[0].annotate(f'{v}%', (i, v), textcoords="offset points", xytext=(0, 10), ha='center', fontsize=8)

    # Right: Global key indicators
    indicators = ['Avoid\nInvolvmt', 'Blame\nUS/Israel', 'US Positive\nImage', 'China Positive\nImage', 'Costs Not\nWorth It',
                  'Ceasefire\nSkeptical']
    values = [81, 80, 39, 50, 75, 70]
    colors = ['#1f78b4', '#1f78b4', '#e31a1c', '#33a02c', '#ff7f00', '#6a3d9a']

    bars = axes[1].bar(indicators, values, color=colors, alpha=0.85)
    axes[1].set_ylim(0, 100)
    axes[1].set_ylabel('Percentage (%)', fontsize=11)
    axes[1].set_title('Global Public Opinion Key Indicators\n(Latest Surveys, June 1)', fontsize=12)
    axes[1].grid(True, linestyle='--', alpha=0.4, axis='y')
    for bar, v in zip(bars, values):
        axes[1].text(bar.get_x() + bar.get_width()/2, v + 2, f'{v}%', ha='center', fontsize=9)

    fig.tight_layout()
    return fig


def chart_oil_price_trajectory():
    """Oil price with key events"""
    dates = ['Jan', 'Feb 27', 'Mar 2', 'Mar 15', 'Apr 8', 'May 1', 'May 13', 'May 25', 'May 28', 'Jun 1']
    prices = [61, 71, 77, 120, 100, 112, 107, 105, 103, 102]
    events = ['', 'Pre-war', 'War begins', 'Panic peak', 'Ceasefire', 'Talks stall', '$107', 'US strikes', 'Tentative deal', 'New normal']

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(dates, prices, marker='o', color='#ff7f00', linewidth=2.5, markersize=8)
    ax.fill_between(range(len(dates)), prices, 60, alpha=0.15, color='#ff7f00')

    for i, (d, p, e) in enumerate(zip(dates, prices, events)):
        if e:
            ax.annotate(e, (i, p), textcoords="offset points", xytext=(0, 12), ha='center', fontsize=9,
                       bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.7))

    ax.set_ylabel('Brent Crude ($/bbl)', fontsize=12)
    ax.set_title('Oil Price Trajectory & Key Events\n(Updated June 1, 2026)', fontsize=14)
    ax.set_ylim(50, 130)
    ax.grid(True, linestyle='--', alpha=0.4)
    ax.axhline(y=61, color='green', linestyle='--', linewidth=0.8, alpha=0.7, label='Pre-war baseline ($61)')
    ax.legend(loc='upper left')
    fig.tight_layout()
    return fig


def chart_geopolitical_scenarios():
    """Updated scenario probabilities"""
    fig, ax = plt.subplots(figsize=(8, 6))
    labels = ['Extended Stalemate\n(50%)', 'Deal Signed, Weak\nImplementation (30%)',
              'Collapse &\nEscalation (20%)']
    sizes = [50, 30, 20]
    colors = ['#a6cee3', '#b2df8a', '#fb9a99']
    explode = (0.03, 0.03, 0.03)

    wedges, texts, autotexts = ax.pie(sizes, explode=explode, labels=labels, colors=colors,
                                       autopct='%1.0f%%', shadow=False, startangle=90,
                                       textprops={'fontsize': 11})
    ax.set_title('Iran Conflict Scenario Probabilities\n(June 1, 2026 Assessment)', fontsize=14)
    fig.tight_layout()
    return fig


def chart_attitude_shift_matrix():
    """Global support shift from Iran's perspective"""
    fig, ax = plt.subplots(figsize=(10, 6))

    countries = ['China', 'Russia', 'Pakistan', 'Turkey', 'Europe\n(FR/ES)', 'Europe\n(DE/UK)', 'Arab\n(Gulf)', 'US', 'Israel']
    pre_feb28 = [60, 50, 40, 30, -10, -10, -20, -60, -80]
    post_jun1 = [70, 55, 65, 30, -35, -20, -35, -30, -90]

    x = np.arange(len(countries))
    width = 0.35

    bars1 = ax.bar(x - width/2, pre_feb28, width, label='Pre-Feb 28 (Baseline)', color='#cab2d6')
    bars2 = ax.bar(x + width/2, post_jun1, width, label='Post-Jun 1 (Current)', color='#6a3d9a')

    ax.set_ylabel('Support Index (-100 to +100)', fontsize=12)
    ax.set_title('Global Attitude Shift Toward Iran\n(From Iran\'s Perspective, June 1, 2026)', fontsize=14)
    ax.set_xticks(x)
    ax.set_xticklabels(countries, fontsize=10)
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
    ax.legend(loc='lower left')
    ax.grid(True, linestyle='--', alpha=0.3, axis='y')
    fig.tight_layout()
    return fig


def chart_conflict_timeline():
    """Updated conflict timeline"""
    fig, ax = plt.subplots(figsize=(10, 8))

    events = [
        ('Feb 28', 'US-Israel launch "Epic Fury"\nKhamenei killed; war begins'),
        ('Mar 1', 'Iran closes Strait of Hormuz\nGlobal oil shock'),
        ('Mar 25', 'US anti-war sentiment peaks\nPew: 59% say wrong decision'),
        ('Apr 8', 'Ceasefire via Pakistan mediation'),
        ('Apr 19', 'Truce extended\nChina blocks UN resolution'),
        ('May 6', 'Iran FM Araghchi visits Beijing'),
        ('May 14', 'Trump-Xi Beijing summit\nMinimal Iran consensus'),
        ('May 25', 'US "self-defense" strikes\nIran accused of mining strait'),
        ('May 28', 'Tentative 60-day deal reached\nBUT same-day clashes resume'),
        ('May 30', 'Trump demands revisions\nin Situation Room'),
        ('May 30-31', 'US strikes radar/C2 sites\nIRGC strikes US base; Kuwait hit'),
        ('Jun 1', 'Deal still unsigned\nIran hardliners resist; oil ~$102'),
    ]

    y_pos = np.arange(len(events))
    colors = (['#e31a1c']*3 + ['#ff7f00']*2 + ['#1f78b4']*2 +
              ['#e31a1c'] + ['#33a02c'] + ['#ff7f00'] + ['#e31a1c']*2)

    ax.barh(y_pos, [1]*len(events), color=colors, alpha=0.7, height=0.6)
    for i, (date, desc) in enumerate(events):
        ax.text(0.02, i, f'{date}: {desc}', va='center', fontsize=9)

    ax.set_yticks([])
    ax.set_xticks([])
    ax.set_xlim(0, 1)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_title('Iran Conflict Timeline 2026\n(Key Events Feb 28 – Jun 1)', fontsize=14)
    fig.tight_layout()
    return fig


def main():
    ensure_directories()
    print("Generating Iran Analyze charts (June 1, 2026 update)...")

    for fn, chart_fn in [
        ('iran_media_stance_evolution_2026_06_01.png', chart_media_stance_evolution),
        ('iran_public_support_trends_2026_06_01.png', chart_public_support_trends),
        ('iran_oil_price_trajectory_2026_06_01.png', chart_oil_price_trajectory),
        ('iran_geopolitical_scenarios_2026_06_01.png', chart_geopolitical_scenarios),
        ('iran_attitude_shift_matrix_2026_06_01.png', chart_attitude_shift_matrix),
        ('iran_conflict_timeline_2026_06_01.png', chart_conflict_timeline),
    ]:
        fig = chart_fn()
        save_chart(fig, fn)

    print(f"\nAll charts saved to: {CHART_DIR}")


if __name__ == '__main__':
    main()
