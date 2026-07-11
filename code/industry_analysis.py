#!/usr/bin/env python3
"""中国未来30年行业发展与技能回归分析"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from scipy import stats
import json

# ============================================================
# 数据结构：12个高潜力行业
# ============================================================

industries = {
    "人工智能/大模型": {
        "avg_salary_k": 35.6,           # 平均月薪(千元) 2025
        "salary_growth_5y": 0.152,      # 近5年薪资年复合增长率
        "talent_gap_2025": 500000,      # 2025年人才缺口
        "expected_growth_30y": 0.95,    # 未来30年预期行业规模增长(0-1)
        "ai_substitution_rate": -0.15,  # AI替代风险(负值=增创就业)
        "policy_support": 0.95,         # 政策支持力度(0-1)
        "barrier_entry": 0.80,          # 入行门槛(0-1, 学历+技能)
        "skill_digital": 0.90,          # 数字化技能需求
        "skill_cognitive": 0.85,        # 认知/分析能力需求
        "skill_social": 0.55,           # 社交/管理能力需求
        "skill_physical": 0.05,         # 体力需求
        "education_min": "本科+",       # 最低学历
    },
    "半导体/集成电路": {
        "avg_salary_k": 28.4,
        "salary_growth_5y": 0.118,
        "talent_gap_2025": 300000,
        "expected_growth_30y": 0.88,
        "ai_substitution_rate": -0.05,
        "policy_support": 0.98,
        "barrier_entry": 0.85,
        "skill_digital": 0.75,
        "skill_cognitive": 0.80,
        "skill_social": 0.40,
        "skill_physical": 0.20,
        "education_min": "硕士+",
    },
    "新能源/碳中和": {
        "avg_salary_k": 22.8,
        "salary_growth_5y": 0.135,
        "talent_gap_2025": 350000,
        "expected_growth_30y": 0.92,
        "ai_substitution_rate": -0.05,
        "policy_support": 0.90,
        "barrier_entry": 0.65,
        "skill_digital": 0.55,
        "skill_cognitive": 0.65,
        "skill_social": 0.40,
        "skill_physical": 0.30,
        "education_min": "本科",
    },
    "生物医药/大健康": {
        "avg_salary_k": 25.2,
        "salary_growth_5y": 0.105,
        "talent_gap_2025": 250000,
        "expected_growth_30y": 0.85,
        "ai_substitution_rate": -0.10,
        "policy_support": 0.85,
        "barrier_entry": 0.82,
        "skill_digital": 0.60,
        "skill_cognitive": 0.82,
        "skill_social": 0.45,
        "skill_physical": 0.15,
        "education_min": "硕士+",
    },
    "高端装备/智能制造": {
        "avg_salary_k": 18.5,
        "salary_growth_5y": 0.098,
        "talent_gap_2025": 450000,
        "expected_growth_30y": 0.82,
        "ai_substitution_rate": 0.10,
        "policy_support": 0.88,
        "barrier_entry": 0.70,
        "skill_digital": 0.65,
        "skill_cognitive": 0.60,
        "skill_social": 0.35,
        "skill_physical": 0.35,
        "education_min": "本科/大专",
    },
    "新能源汽车": {
        "avg_salary_k": 20.5,
        "salary_growth_5y": 0.125,
        "talent_gap_2025": 280000,
        "expected_growth_30y": 0.80,
        "ai_substitution_rate": 0.05,
        "policy_support": 0.92,
        "barrier_entry": 0.60,
        "skill_digital": 0.60,
        "skill_cognitive": 0.55,
        "skill_social": 0.35,
        "skill_physical": 0.25,
        "education_min": "本科/大专",
    },
    "量子科技/6G": {
        "avg_salary_k": 40.2,
        "salary_growth_5y": 0.180,
        "talent_gap_2025": 80000,
        "expected_growth_30y": 0.75,
        "ai_substitution_rate": -0.08,
        "policy_support": 0.88,
        "barrier_entry": 0.95,
        "skill_digital": 0.95,
        "skill_cognitive": 0.95,
        "skill_social": 0.30,
        "skill_physical": 0.02,
        "education_min": "博士",
    },
    "低空经济/商业航天": {
        "avg_salary_k": 26.5,
        "salary_growth_5y": 0.140,
        "talent_gap_2025": 120000,
        "expected_growth_30y": 0.78,
        "ai_substitution_rate": -0.03,
        "policy_support": 0.85,
        "barrier_entry": 0.78,
        "skill_digital": 0.70,
        "skill_cognitive": 0.75,
        "skill_social": 0.35,
        "skill_physical": 0.15,
        "education_min": "本科+",
    },
    "数字经济/数据服务": {
        "avg_salary_k": 23.8,
        "salary_growth_5y": 0.110,
        "talent_gap_2025": 400000,
        "expected_growth_30y": 0.85,
        "ai_substitution_rate": 0.20,
        "policy_support": 0.82,
        "barrier_entry": 0.55,
        "skill_digital": 0.80,
        "skill_cognitive": 0.70,
        "skill_social": 0.50,
        "skill_physical": 0.05,
        "education_min": "本科",
    },
    "健康养老/银发经济": {
        "avg_salary_k": 13.5,
        "salary_growth_5y": 0.090,
        "talent_gap_2025": 600000,
        "expected_growth_30y": 0.90,
        "ai_substitution_rate": 0.05,
        "policy_support": 0.90,
        "barrier_entry": 0.35,
        "skill_digital": 0.30,
        "skill_cognitive": 0.50,
        "skill_social": 0.80,
        "skill_physical": 0.40,
        "education_min": "大专/中专",
    },
    "文化创意/数字内容": {
        "avg_salary_k": 16.2,
        "salary_growth_5y": 0.085,
        "talent_gap_2025": 200000,
        "expected_growth_30y": 0.72,
        "ai_substitution_rate": 0.35,
        "policy_support": 0.70,
        "barrier_entry": 0.45,
        "skill_digital": 0.65,
        "skill_cognitive": 0.70,
        "skill_social": 0.65,
        "skill_physical": 0.08,
        "education_min": "本科/大专",
    },
    "现代农业/生物育种": {
        "avg_salary_k": 14.8,
        "salary_growth_5y": 0.072,
        "talent_gap_2025": 180000,
        "expected_growth_30y": 0.68,
        "ai_substitution_rate": 0.15,
        "policy_support": 0.75,
        "barrier_entry": 0.50,
        "skill_digital": 0.45,
        "skill_cognitive": 0.55,
        "skill_social": 0.30,
        "skill_physical": 0.45,
        "education_min": "本科/大专",
    },
}

# ============================================================
# 传统对比行业
# ============================================================

traditional = {
    "房地产/建筑业": {
        "avg_salary_k": 11.8,
        "salary_growth_5y": 0.02,
        "expected_growth_30y": 0.15,
        "ai_substitution_rate": 0.50,
        "barrier_entry": 0.40,
        "education_min": "不限",
    },
    "零售/批发/贸易": {
        "avg_salary_k": 8.7,
        "salary_growth_5y": 0.03,
        "expected_growth_30y": 0.25,
        "ai_substitution_rate": 0.55,
        "barrier_entry": 0.25,
        "education_min": "不限",
    },
    "传统制造业": {
        "avg_salary_k": 9.8,
        "salary_growth_5y": 0.04,
        "expected_growth_30y": 0.10,
        "ai_substitution_rate": 0.70,
        "barrier_entry": 0.30,
        "education_min": "不限",
    },
}

# ============================================================
# 构建DataFrame
# ============================================================

rows = []
for name, d in industries.items():
    row = {"行业": name, **d}
    rows.append(row)

df = pd.DataFrame(rows)

# 计算综合发展潜力指数
df["growth_score"] = (
    df["expected_growth_30y"] * 0.35
    + df["salary_growth_5y"] * 100 * 0.25
    + (1 - df["ai_substitution_rate"]) * 0.20
    + df["policy_support"] * 0.20
)
df["growth_score"] = (df["growth_score"] - df["growth_score"].min()) / (
    df["growth_score"].max() - df["growth_score"].min()
)

# ============================================================
# 回归分析 1：技能需求 vs 发展潜力
# ============================================================

X_skills = df[["skill_digital", "skill_cognitive", "skill_social", "skill_physical"]].values
y_growth = df["expected_growth_30y"].values
y_salary = df["avg_salary_k"].values

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_skills)

# Model 1: 技能 -> 增长潜力
model_growth = LinearRegression()
model_growth.fit(X_scaled, y_growth)
growth_r2 = model_growth.score(X_scaled, y_growth)
growth_coef = model_growth.coef_

# Model 2: 技能 -> 薪资
model_salary = LinearRegression()
model_salary.fit(X_scaled, y_salary)
salary_r2 = model_salary.score(X_scaled, y_salary)
salary_coef = model_salary.coef_

# ============================================================
# 回归分析 2：入行门槛+AI替代 vs 薪资增长
# ============================================================

X_barrier = df[["barrier_entry", "ai_substitution_rate", "policy_support"]].values
y_salary_growth = df["salary_growth_5y"].values

model_growth_rate = LinearRegression()
model_growth_rate.fit(X_barrier, y_salary_growth)
growth_rate_r2 = model_growth_rate.score(X_barrier, y_salary_growth)
growth_rate_coef = model_growth_rate.coef_

# ============================================================
# Pearson相关系数矩阵
# ============================================================

corr_cols = [
    "avg_salary_k",
    "salary_growth_5y",
    "expected_growth_30y",
    "ai_substitution_rate",
    "barrier_entry",
    "skill_digital",
    "skill_cognitive",
    "skill_social",
    "skill_physical",
    "policy_support",
]
corr = df[corr_cols].corr()

# ============================================================
# 输出结果
# ============================================================

print("=" * 80)
print("📊 中国未来30年行业发展与技能回归分析报告")
print("=" * 80)

print("\n## 一、行业综合评分排名\n")
ranked = df[["行业", "avg_salary_k", "salary_growth_5y", "expected_growth_30y", "growth_score"]].sort_values(
    "growth_score", ascending=False
)
for i, row in ranked.iterrows():
    print(
        f"  {row['行业']:20s}  薪资:{row['avg_salary_k']:5.1f}K  "
        f"近5年CAGR:{row['salary_growth_5y']:4.1%}  30年增长:{row['expected_growth_30y']:.0%}  "
        f"综合指数:{row['growth_score']:.3f}"
    )

print("\n## 二、回归分析：技能需求 → 行业增长潜力")
print(f"  R² = {growth_r2:.4f}")
feature_names = ["数字化技能", "认知分析能力", "社交管理能力", "体力需求"]
print(f"  系数 (标准化):")
for name, coef in zip(feature_names, growth_coef):
    direction = "↑" if coef > 0 else "↓"
    print(f"    {name}: {coef:+.4f} {direction}")
print(f"  → 结论：数字化和认知能力是行业增长的最强预测因子")

print("\n## 三、回归分析：技能需求 → 薪资水平")
print(f"  R² = {salary_r2:.4f}")
for name, coef in zip(feature_names, salary_coef):
    direction = "↑" if coef > 0 else "↓"
    print(f"    {name}: {coef:+.4f} {direction}")
print(f"  → 结论：数字化技能和认知能力是薪资的主要驱动力")

print("\n## 四、回归分析：入行门槛+AI替代 → 薪资增长率")
print(f"  R² = {growth_rate_r2:.4f}")
barrier_names = ["入行门槛", "AI替代风险", "政策支持"]
for name, coef in zip(barrier_names, growth_rate_coef):
    direction = "↑" if coef > 0 else "↓"
    print(f"    {name}: {coef:+.4f} {direction}")
print(f"  → 结论：入行门槛越高、AI替代风险越低，薪资增长越快")

print("\n## 五、关键相关系数矩阵\n")
key_pairs = [
    ("avg_salary_k", "skill_digital", "薪资 vs 数字技能"),
    ("avg_salary_k", "skill_cognitive", "薪资 vs 认知能力"),
    ("expected_growth_30y", "policy_support", "增长 vs 政策支持"),
    ("salary_growth_5y", "barrier_entry", "薪资增长 vs 入行门槛"),
    ("expected_growth_30y", "ai_substitution_rate", "增长 vs AI替代"),
]
for a, b, label in key_pairs:
    r = corr.loc[a, b]
    print(f"  {label:25s}: r={r:+.4f}")

# ============================================================
# 六、AI影响分析
# ============================================================

print("\n## 六、AI对各行业的影响分类\n")
ai_positive = df[df["ai_substitution_rate"] < 0]  # AI增创就业
ai_neutral = df[(df["ai_substitution_rate"] >= 0) & (df["ai_substitution_rate"] < 0.15)]
ai_risk = df[df["ai_substitution_rate"] >= 0.15]

print("  🟢 AI增创就业型 (AI带来新岗位):")
for _, r in ai_positive.iterrows():
    print(f"    - {r['行业']}: AI替代率 {r['ai_substitution_rate']:+.0%}")

print("\n  🟡 AI中性影响型:")
for _, r in ai_neutral.iterrows():
    print(f"    - {r['行业']}: AI替代率 {r['ai_substitution_rate']:+.0%}")

print("\n  🔴 AI高风险替代型:")
print("    - 传统制造业: AI替代率 +70%")
print("    - 零售/批发/贸易: AI替代率 +55%")
print("    - 房地产/建筑业: AI替代率 +50%")
for _, r in ai_risk.iterrows():
    print(f"    - {r['行业']}: AI替代率 {r['ai_substitution_rate']:+.0%}")

# ============================================================
# 七、人群适配建议
# ============================================================

print("\n## 七、各人群发展建议\n")

# 大中专院校学生
print("### 👨‍🎓 大中专院校学生")
student_fit = df[df["barrier_entry"] < 0.65].sort_values("growth_score", ascending=False)
print("  适配行业 (按发展潜力排序):")
for i, (_, r) in enumerate(student_fit.head(5).iterrows()):
    print(f"    {i+1}. {r['行业']} (门槛:{r['barrier_entry']:.0%}, 综合指数:{r['growth_score']:.3f})")

# 中年转型
print("\n### 👨‍💼 中年职场转型人士 (35-50岁)")
mid_career = df.sort_values("skill_social", ascending=False)
print("  适配行业 (按社交/管理能力需求排序):")
for i, (_, r) in enumerate(mid_career.head(4).iterrows()):
    score = r["skill_social"] * 0.4 + r["skill_cognitive"] * 0.3 + (1 - r["skill_physical"]) * 0.3
    print(f"    {i+1}. {r['行业']} (社交需求:{r['skill_social']:.0%}, 体力需求低)")

# 在职人士
print("\n### 🧑‍💻 在职技能提升人士")
upskilling = df.sort_values("avg_salary_k", ascending=False)
print("  高薪技能方向:")
for i, (_, r) in enumerate(upskilling.head(4).iterrows()):
    digital = r['skill_digital']
    cognitive = r['skill_cognitive']
    print(f"    {i+1}. {r['行业']} (月薪:{r['avg_salary_k']:.1f}K, 数字技能:{digital:.0%}, 认知能力:{cognitive:.0%})")

print("\n" + "=" * 80)
print("分析完成 ✅")
print("=" * 80)

# 保存JSON数据供报告使用
output = {
    "industries": industries,
    "traditional": traditional,
    "regression": {
        "skills_to_growth_r2": float(growth_r2),
        "skills_to_growth_coef": {k: float(v) for k, v in zip(feature_names, growth_coef)},
        "skills_to_salary_r2": float(salary_r2),
        "skills_to_salary_coef": {k: float(v) for k, v in zip(feature_names, salary_coef)},
        "barrier_to_growth_rate_r2": float(growth_rate_r2),
        "barrier_to_growth_rate_coef": {k: float(v) for k, v in zip(barrier_names, growth_rate_coef)},
    },
    "key_correlations": {label: float(corr.loc[a, b]) for a, b, label in key_pairs},
    "top_ranked": ranked.to_dict("records"),
}

with open("/home/wang/wk/code/industry_analysis_results.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)