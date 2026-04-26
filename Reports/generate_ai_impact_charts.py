#!/usr/bin/env python3
# AI Work Impact Analysis Charts

import matplotlib.pyplot as plt
import matplotlib
import numpy as np

matplotlib.rcParams['font.sans-serif'] = ['DejaVu Sans', 'SimHei']
matplotlib.rcParams['axes.unicode_minus'] = False

# Chart 1: Industry AI Exposure Matrix
fig, axes = plt.subplots(2, 2, figsize=(16, 12))

# Subplot 1: Industry Exposure Levels
ax1 = axes[0, 0]
industries = ['Legal', 'Finance', 'Software', 'Consulting', 'Manufacturing', 'Healthcare', 'Education']
exposure = [85, 78, 70, 65, 60, 45, 30]
colors = plt.cm.RdYlGn_r(np.array(exposure) / 100)
bars = ax1.barh(industries, exposure, color=colors)
ax1.set_xlabel('AI Exposure Level (%)')
ax1.set_title('Industry AI Exposure Matrix (2026)')
ax1.set_xlim(0, 100)
for i, (bar, val) in enumerate(zip(bars, exposure)):
    ax1.text(val + 2, bar.get_y() + bar.get_height()/2, f'{val}%', va='center')

# Subplot 2: Entry-Level vs Senior Jobs Impact
ax2 = axes[0, 1]
categories = ['Entry-Level', 'Mid-Level', 'Senior-Level']
impact = [75, 45, 20]
colors2 = ['#d62728', '#ff7f0e', '#2ca02c']
ax2.bar(categories, impact, color=colors2, alpha=0.8)
ax2.set_ylabel('AI Impact Level (%)')
ax2.set_title('AI Impact by Career Level')
ax2.set_ylim(0, 100)
for i, (cat, val) in enumerate(zip(categories, impact)):
    ax2.text(i, val + 2, f'{val}%', ha='center', fontweight='bold')

# Subplot 3: Layoffs Timeline
ax3 = axes[1, 0]
quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026']
layoffs = [5200, 7800, 11200, 14500, 17375]
ax3.plot(quarters, layoffs, 'r-o', linewidth=2, markersize=10)
ax3.fill_between(quarters, layoffs, alpha=0.3, color='red')
ax3.set_ylabel('AI-Related Layoffs')
ax3.set_title('Entry-Level AI-Related Layoffs Trend')
ax3.grid(True, alpha=0.3)

# Subplot 4: Skills Wage Premium
ax4 = axes[1, 1]
skills = ['AI Skills', 'Traditional Skills', 'Basic Skills']
wage_growth = [16.7, 8.5, 3.2]
colors3 = ['#2ca02c', '#ff7f0e', '#d62728']
bars4 = ax4.bar(skills, wage_growth, color=colors3, alpha=0.8)
ax4.set_ylabel('Wage Growth Rate (%)')
ax4.set_title('Wage Growth by Skill Type (2025-2026)')
for bar, val in zip(bars4, wage_growth):
    ax4.text(bar.get_x() + bar.get_width()/2, val + 0.5, f'{val}%', ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('/home/xiaowu/文档/AI/ai_impact_industry_analysis.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 1: ai_impact_industry_analysis.png")

# Chart 2: Confidence Levels
fig2, ax = plt.subplots(figsize=(12, 8))

conclusions = [
    'AI Changes Labor\nMarket Structure',
    'Industry Differences\nExist',
    'Entry-Level Jobs\nMost Impacted',
    'Wage Polarization\nIntensifies',
    'No Mass\nUnemployment',
    'Augmentation\nDominates'
]

confidence = [95, 80, 75, 70, 35, 30]
colors_conf = ['#2ca02c', '#2ca02c', '#2ca02c', '#ff7f0e', '#d62728', '#d62728']

bars = ax.barh(conclusions, confidence, color=colors_conf, alpha=0.8)
ax.set_xlabel('Confidence Level (%)')
ax.set_title('Confidence Ratings for Key Conclusions')
ax.set_xlim(0, 100)
ax.axvline(x=50, color='black', linestyle='--', alpha=0.5, label='50% threshold')

for bar, val in zip(bars, confidence):
    ax.text(val + 2, bar.get_y() + bar.get_height()/2, f'{val}%', va='center', fontweight='bold')

plt.tight_layout()
plt.savefig('/home/xiaowu/文档/AI/ai_impact_confidence_ratings.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 2: ai_impact_confidence_ratings.png")

# Chart 3: Timeline Predictions
fig3, ax = plt.subplots(figsize=(14, 8))

phases = ['2026\n(Agent Era)', '2027\n(Agent Era)', '2028\n(Integration)', '2029\n(Integration)', '2030+\n(New Equilibrium)']
ai_penetration = [15, 40, 65, 80, 90]
job_displacement = [8, 18, 28, 35, 40]
new_jobs_created = [5, 12, 22, 30, 38]

x = np.arange(len(phases))
width = 0.25

ax.bar(x - width, ai_penetration, width, label='AI Adoption %', color='#1f77b4')
ax.bar(x, job_displacement, width, label='Job Displacement %', color='#d62728')
ax.bar(x + width, new_jobs_created, width, label='New Jobs Created %', color='#2ca02c')

ax.set_ylabel('Percentage (%)')
ax.set_title('AI Labor Market Evolution Timeline (2026-2030+)')
ax.set_xticks(x)
ax.set_xticklabels(phases)
ax.legend()
ax.grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('/home/xiaowu/文档/AI/ai_impact_timeline_prediction.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 3: ai_impact_timeline_prediction.png")

# Chart 4: Four Displacement Mechanisms
fig4, ax = plt.subplots(figsize=(12, 8))

mechanisms = ['Task\nAutomation', 'Augmentation', 'Net\nLayoffs', 'Wage\nPolarization']
importance_2025 = [30, 25, 35, 10]
importance_2028 = [25, 40, 20, 15]

x = np.arange(len(mechanisms))
width = 0.35

ax.bar(x - width/2, importance_2025, width, label='2025', color='#ff7f0e', alpha=0.8)
ax.bar(x + width/2, importance_2028, width, label='2028 (Predicted)', color='#1f77b4', alpha=0.8)

ax.set_ylabel('Estimated Share (%)')
ax.set_title('Four AI Labor Displacement Mechanisms Evolution')
ax.set_xticks(x)
ax.set_xticklabels(mechanisms)
ax.legend()
ax.grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('/home/xiaowu/文档/AI/ai_impact_mechanisms.png', dpi=150, bbox_inches='tight')
plt.close()
print("Chart 4: ai_impact_mechanisms.png")

print("\n=== All AI Impact Charts generated ===")
print("Location: /home/xiaowu/文档/AI/")
